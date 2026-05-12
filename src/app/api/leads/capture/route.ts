import mongoose from 'mongoose';
import {
  apiHandler,
  sendSuccess,
  sendError,
  corsOptions,
  sendCorsResponse,
} from '@/lib/api-utils';
import { CollectionName, LeadStatus, LeadSource } from '@/schemas/cms';
import { Portfolio, CaseStudy } from '@/types/cms';
import { sendLeadMagnetEmail } from '@/lib/newsletter-engine';

// Handle CORS for public endpoint
export async function OPTIONS() {
  return corsOptions();
}

export const POST = apiHandler(async (request) => {
  const body = await request.json();
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
  } = body;

  if (!email || !firstName || !lastName || !portfolio || !caseStudyId) {
    return sendError('Missing required fields', 400);
  }

  // 0. Simple Rate Limiting (Prevent abuse)
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const recentSubmissions = await mongoose.connection.db
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
  const portfolioDoc = await mongoose.connection.db
    .collection(CollectionName.PORTFOLIOS)
    .findOne({ _id: new mongoose.Types.ObjectId(portfolio as string) });

  if (!portfolioDoc) {
    return sendError('Portfolio not found', 404);
  }

  // 2. Fetch Case Study
  const caseStudyDoc = await mongoose.connection.db
    .collection(CollectionName.CASE_STUDIES)
    .findOne({ _id: new mongoose.Types.ObjectId(caseStudyId as string) });

  if (!caseStudyDoc) {
    return sendError('Case study not found', 404);
  }

  // 3. Upsert Lead
  const existingLead = await mongoose.connection.db
    .collection(CollectionName.LEADS)
    .findOne({
      email,
      portfolio: new mongoose.Types.ObjectId(portfolio as string),
    });

  const downloadedItemName = caseStudyDoc.projectTitle || caseStudyDoc.slug;

  if (existingLead) {
    // Append to downloadedItems if not already there
    const items = existingLead.downloadedItems || [];
    if (!items.includes(downloadedItemName)) {
      items.push(downloadedItemName);
    }

    await mongoose.connection.db.collection(CollectionName.LEADS).updateOne(
      { _id: existingLead._id },
      {
        $set: {
          firstName,
          lastName,
          company: company || existingLead.company,
          jobTitle: jobTitle || existingLead.jobTitle,
          phone: phone || existingLead.phone,
          downloadedItems: items,
          updatedAt: new Date(),
        },
      }
    );
  } else {
    // Create new lead
    await mongoose.connection.db.collection(CollectionName.LEADS).insertOne({
      firstName,
      lastName,
      email,
      company,
      jobTitle,
      phone,
      source: LeadSource.CASE_STUDY,
      downloadedItems: [downloadedItemName],
      status: LeadStatus.NEW,
      portfolio: new mongoose.Types.ObjectId(portfolio as string),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 4. Send Email Automation
  try {
    await sendLeadMagnetEmail({
      to: email,
      portfolio: portfolioDoc as unknown as Portfolio,
      content: caseStudyDoc as unknown as CaseStudy,
      intent,
    });
  } catch (error) {
    console.error('Failed to send lead magnet email:', error);
    // We log the error but still return success to the frontend
    // so the user experience isn't interrupted by intermittent SMTP failures.
  }

  return sendCorsResponse(
    sendSuccess({ message: 'Lead captured and email sent' }, 201)
  );
});
