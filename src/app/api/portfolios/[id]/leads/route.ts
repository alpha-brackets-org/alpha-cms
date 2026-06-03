import mongoose from 'mongoose';
import {
  apiHandler,
  DbUtils,
  sendSuccess,
  sendBadRequest,
  sendNotFound,
} from '@/lib/api-utils';
import {
  CollectionName,
  SubscriberStatus,
  SubscriberSource,
  Portfolio,
  CaseStudy,
  LeadSource,
  LeadStatus,
} from '@/schemas/cms';
import { sendLeadMagnetEmail } from '@/lib/newsletter-engine';
import { getSignedUrl } from '@/lib/imagekit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PUBLIC LEAD GENERATION ENDPOINT
 * Captures leads for specific case study downloads.
 */
export const POST = apiHandler(
  async (request, context: RouteContext) => {
    const { id: portfolioId } = await context.params;
    const body = await request.json();

    const { email, caseStudyId, intent, metadata, firstName, lastName, phone, company, jobTitle, source, message } = body;

    if (!email) {
      return sendBadRequest('Email is required.');
    }

    const db = mongoose.connection.db;
    const portfolioObjId = new mongoose.Types.ObjectId(portfolioId);

    // 1. Fetch Portfolio
    const portfolio = (await db
      .collection(CollectionName.PORTFOLIOS)
      .findOne({ _id: portfolioObjId })) as unknown as Portfolio;
    if (!portfolio) return sendNotFound('Portfolio');

    // --- PATH A: GENERAL CONTACT FORM LEAD ---
    if (source === LeadSource.CONTACT_FORM || !caseStudyId) {
      if (!firstName || !lastName) {
        return sendBadRequest('First and Last name are required for contact forms.');
      }

      const notes = message ? [{ content: message, createdAt: new Date().toISOString() }] : [];

      await DbUtils.createDoc(CollectionName.LEADS, {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        company,
        jobTitle,
        source: LeadSource.CONTACT_FORM,
        status: LeadStatus.NEW,
        notes,
        portfolio: portfolioObjId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return sendSuccess(
        {
          message: 'Thank you! Your message has been sent successfully.',
        },
        201
      );
    }

    // --- PATH B: CASE STUDY DOWNLOAD LEAD MAGNET ---
    const contentObjId = new mongoose.Types.ObjectId(caseStudyId as string);

    const caseStudy = (await db
      .collection(CollectionName.CASE_STUDIES)
      .findOne({ _id: contentObjId })) as unknown as CaseStudy;
    if (!caseStudy) return sendNotFound('Case Study');

    // 2. Find or Create Subscriber
    const existing = await db.collection(CollectionName.SUBSCRIBERS).findOne({
      email: email.toLowerCase(),
      portfolio: portfolioObjId,
    });

    if (existing) {
      // Update existing subscriber
      await db.collection(CollectionName.SUBSCRIBERS).updateOne(
        { _id: existing._id },
        {
          $addToSet: { downloadHistory: caseStudyId },
          $set: {
            status: SubscriberStatus.ACTIVE,
            intent: intent || existing.intent,
            metadata: { ...existing.metadata, ...metadata },
            lastLeadAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );
    } else {
      // Create new Subscriber
      await DbUtils.createDoc(CollectionName.SUBSCRIBERS, {
        email: email.toLowerCase(),
        portfolio: portfolioObjId,
        status: SubscriberStatus.ACTIVE,
        source: SubscriberSource.CASE_STUDY_DOWNLOAD,
        downloadHistory: [caseStudyId],
        intent: intent || '',
        metadata: metadata || {},
        lastLeadAt: new Date(),
        subscribedAt: new Date(),
      });
    }

    // 3. Trigger Immediate Email (Transactional)
    try {
      await sendLeadMagnetEmail({
        to: email,
        portfolio,
        content: caseStudy,
        intent: intent,
      });
      console.log(
        `[LEAD GEN] Content delivered to ${email} for case study: ${caseStudyId}`
      );
    } catch (err) {
      console.error('[LEAD GEN] Email delivery failed:', err);
    }

    // 4. Construct response with direct link for immediate access
    if (!portfolio.domain) {
      return sendBadRequest('Portfolio has no domain configured.');
    }

    const downloadUrl = caseStudy.pdfUrl
      ? getSignedUrl(caseStudy.pdfUrl, 900)
      : `https://${portfolio.domain}/case-study/${caseStudy.slug}`;

    return sendSuccess(
      {
        message: caseStudy.pdfUrl
          ? 'Access granted. Your PDF download is ready.'
          : 'Access granted. Please check your email for the link.',
        downloadUrl,
      },
      201
    );
  },
  { isPublic: true }
);
