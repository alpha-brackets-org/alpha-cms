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
export const POST = apiHandler(async (request, context: RouteContext) => {
  const { id: portfolioId } = await context.params;
  const body = await request.json();

  const { email, caseStudyId, intent, metadata } = body;

  if (!email || !caseStudyId) {
    return sendBadRequest('Email and Case Study ID are required.');
  }

  const db = mongoose.connection.db;
  const portfolioObjId = new mongoose.Types.ObjectId(portfolioId);
  const contentObjId = new mongoose.Types.ObjectId(caseStudyId as string);

  // 1. Fetch Portfolio & Case Study to ensure they exist and for email context
  const portfolio = (await db
    .collection(CollectionName.PORTFOLIOS)
    .findOne({ _id: portfolioObjId })) as unknown as Portfolio;
  if (!portfolio) return sendNotFound('Portfolio');

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
          status: SubscriberStatus.ACTIVE, // Force literal 'active' to ensure re-activation
          intent: intent || existing.intent,
          metadata: { ...existing.metadata, ...metadata }, // Merge metadata
          lastLeadAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );
  } else {
    // Create new Lead
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
    // We don't fail the request if the email fails, but we should probably log it
  }

  // 4. Construct response with direct link for immediate access
  // Prioritize physical PDF if available, otherwise link to case study page
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
});
