import mongoose from 'mongoose';
import {
  apiHandler,
  DbUtils,
  sendData,
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
  ContactFormLeadSchema,
  LeadCaptureSchema,
} from '@/schemas/cms';
import { sendLeadMagnetEmail } from '@/lib/newsletter-engine';
import { getSignedUrl } from '@/lib/imagekit';
import { getDb } from '@/lib/db/dbConnect';

// The case-study lead magnet path doesn't take `portfolio` from the body — it's the URL param.
const CaseStudyLeadSchema = LeadCaptureSchema.omit({ portfolio: true });

/**
 * PUBLIC LEAD GENERATION ENDPOINT
 * Captures leads for specific case study downloads, or a general contact-form message.
 */
export const POST = apiHandler(
  async (request, { params }) => {
    const { id: portfolioId } = await params;
    const body = await request.json();
    const { source, caseStudyId } = body;

    const db = getDb();
    const portfolioObjId = new mongoose.Types.ObjectId(portfolioId);

    // 1. Fetch Portfolio
    const portfolio = (await db
      .collection(CollectionName.PORTFOLIOS)
      .findOne({ _id: portfolioObjId })) as unknown as Portfolio;
    if (!portfolio) return sendNotFound('Portfolio');

    // --- PATH A: GENERAL CONTACT FORM LEAD ---
    if (source === LeadSource.CONTACT_FORM || !caseStudyId) {
      const validation = ContactFormLeadSchema.safeParse(body);
      if (!validation.success) {
        return sendBadRequest(validation.error.issues[0].message);
      }
      const { firstName, lastName, email, phone, company, jobTitle, message } =
        validation.data;

      const notes = message
        ? [{ content: message, createdAt: new Date().toISOString() }]
        : [];

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

      return sendData(
        {
          message: 'Thank you! Your message has been sent successfully.',
        },
        201
      );
    }

    // --- PATH B: CASE STUDY DOWNLOAD LEAD MAGNET ---
    const caseStudyValidation = CaseStudyLeadSchema.safeParse(body);
    if (!caseStudyValidation.success) {
      return sendBadRequest(caseStudyValidation.error.issues[0].message);
    }
    const { email, intent, metadata } = caseStudyValidation.data;

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
        intent: intent || undefined,
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

    return sendData(
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
