import mongoose from 'mongoose';
import { getDb } from '@/lib/db/dbConnect';
import {
  apiHandler,
  sendData,
  sendError,
  corsOptions,
  sendCorsResponse,
  verifyPortfolioApiKey,
} from '@/lib/api-utils';
import {
  CollectionName,
  LeadStatus,
  LeadSource,
  LeadCaptureSchema,
} from '@/schemas/cms';
import { Portfolio, CaseStudy } from '@/types/cms';
import { sendLeadMagnetEmail } from '@/lib/newsletter-engine';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Handle CORS for public endpoint
export async function OPTIONS() {
  return corsOptions();
}

export const POST = apiHandler(
  async (_request, { validatedData }) => {
    const {
      firstName,
      lastName,
      email,
      company,
      jobTitle,
      phone,
      portfolio,
      caseStudyId,
      intent,
    } = validatedData!;

    // If an Authorization header is present, it must match the portfolio
    // being submitted for — an invalid/mismatched key is rejected outright.
    // Sites that don't send a key yet fall back to the existing trust model.
    const authHeader = _request.headers.get('authorization');
    if (authHeader) {
      const apiKeyAuth = await verifyPortfolioApiKey(_request);
      if (!apiKeyAuth || apiKeyAuth.portfolioId !== portfolio) {
        return sendError('Invalid API key for this portfolio', 401);
      }
    }

    // 0a. IP-based rate limit (real backstop — works across serverless
    // invocations via Redis, unlike an in-memory counter).
    const ip = getClientIp(_request);
    const { allowed } = await checkRateLimit('leads-capture', ip, 20, 60);
    if (!allowed) {
      return sendError('Too many requests. Please try again later.', 429);
    }

    // 0b. Secondary per-email guard (kept as defense in depth)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentSubmissions = await getDb()
      .collection(CollectionName.LEADS)
      .countDocuments({
        email,
        updatedAt: { $gte: fifteenMinutesAgo },
        portfolio: new mongoose.Types.ObjectId(portfolio as string),
      });

    if (recentSubmissions >= 5) {
      return sendError('Too many requests. Please try again later.', 429);
    }

    // 1. Fetch Portfolio
    const portfolioDoc = await getDb()
      .collection(CollectionName.PORTFOLIOS)
      .findOne({ _id: new mongoose.Types.ObjectId(portfolio as string) });

    if (!portfolioDoc) {
      return sendError('Portfolio not found', 404);
    }

    // 2. Fetch Case Study
    const caseStudyDoc = await getDb()
      .collection(CollectionName.CASE_STUDIES)
      .findOne({ _id: new mongoose.Types.ObjectId(caseStudyId as string) });

    if (!caseStudyDoc) {
      return sendError('Case study not found', 404);
    }

    // 3. Upsert Lead — a single atomic upsert (rather than findOne-then-write)
    // closes the race window where two concurrent submissions for the same
    // email+portfolio could both pass the findOne check and insert duplicates.
    const downloadedItemName = caseStudyDoc.projectTitle || caseStudyDoc.slug;
    const portfolioObjId = new mongoose.Types.ObjectId(portfolio as string);

    const setFields: Record<string, unknown> = {
      firstName,
      lastName,
      updatedAt: new Date(),
    };
    if (company) setFields.company = company;
    if (jobTitle) setFields.jobTitle = jobTitle;
    if (phone) setFields.phone = phone;

    await getDb()
      .collection(CollectionName.LEADS)
      .updateOne(
        { email, portfolio: portfolioObjId },
        {
          $set: setFields,
          $addToSet: { downloadedItems: downloadedItemName },
          $setOnInsert: {
            source: LeadSource.CASE_STUDY,
            status: LeadStatus.NEW,
            portfolio: portfolioObjId,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

    // 4. Send Email Automation
    try {
      await sendLeadMagnetEmail({
        to: email,
        portfolio: portfolioDoc as unknown as Portfolio,
        content: caseStudyDoc as unknown as CaseStudy,
        intent: intent ?? undefined,
      });
    } catch (error) {
      console.error('Failed to send lead magnet email:', error);
      // We log the error but still return success to the frontend
      // so the user experience isn't interrupted by intermittent SMTP failures.
    }

    return sendCorsResponse(
      sendData({ message: 'Lead captured and email sent' }, 201)
    );
  },
  { isPublic: true, schema: LeadCaptureSchema }
);
