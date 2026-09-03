import mongoose from 'mongoose';
import {
  apiHandler,
  DbUtils,
  sendData,
  sendBadRequest,
  sendNotFound,
  sendError,
  verifyPortfolioApiKey,
} from '@/lib/api-utils';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
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

    // If an Authorization header is present, it must match this portfolio —
    // mirrors the same optional API-key check in /api/leads/capture.
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const apiKeyAuth = await verifyPortfolioApiKey(request);
      if (!apiKeyAuth || apiKeyAuth.portfolioId !== portfolioId) {
        return sendError('Invalid API key for this portfolio', 401);
      }
    }

    const ip = getClientIp(request);
    const { allowed } = await checkRateLimit('portfolio-leads', ip, 20, 60);
    if (!allowed) {
      return sendError('Too many requests. Please try again later.', 429);
    }

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

    // 2. Find or Create Subscriber — a single atomic upsert closes the race
    // window where two concurrent requests could both pass a findOne check
    // and collide on the unique { email, portfolio } index.
    const existingSubscriber = await db
      .collection(CollectionName.SUBSCRIBERS)
      .findOne({ email: email.toLowerCase(), portfolio: portfolioObjId });

    await db.collection(CollectionName.SUBSCRIBERS).updateOne(
      { email: email.toLowerCase(), portfolio: portfolioObjId },
      {
        $addToSet: { downloadHistory: caseStudyId },
        $set: {
          status: SubscriberStatus.ACTIVE,
          intent: intent || existingSubscriber?.intent || '',
          metadata: { ...existingSubscriber?.metadata, ...metadata },
          lastLeadAt: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          source: SubscriberSource.CASE_STUDY_DOWNLOAD,
          subscribedAt: new Date(),
        },
      },
      { upsert: true }
    );

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
