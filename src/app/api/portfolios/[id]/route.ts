import mongoose from 'mongoose';
import {
  apiHandler,
  DbUtils,
  sendData,
  sendNotFound,
  getCurrentUser,
  sendForbidden,
} from '@/lib/api-utils';
import { encrypt } from '@/lib/encryption';
import { runCascade } from '@/lib/db/cascade';
import { getDb } from '@/lib/db/dbConnect';
import { CollectionName, UserRole, PortfolioSchema } from '@/schemas/cms';

// GET SINGLE PORTFOLIO
export const GET = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  const user = await getCurrentUser();

  // Access Control: Admins see everything, others see only assigned
  if (user?.role !== UserRole.ADMIN && !user?.portfolios?.includes(id)) {
    return sendForbidden('You do not have access to this portfolio');
  }

  const portfolio = await getDb()
    .collection(CollectionName.PORTFOLIOS)
    .findOne({ _id: new mongoose.Types.ObjectId(id as string) });

  if (!portfolio) {
    return sendNotFound('Portfolio');
  }

  return sendData(portfolio);
});

// UPDATE PORTFOLIO
export const PATCH = apiHandler(
  async (_request, { params, validatedData }) => {
    const { id } = await params;
    const user = await getCurrentUser();

    // Access Control
    if (user?.role !== UserRole.ADMIN && !user?.portfolios?.includes(id)) {
      return sendForbidden('You do not have access to this portfolio');
    }

    // Encrypt SMTP Password if present
    if (validatedData!.smtpConfig?.pass) {
      validatedData!.smtpConfig.pass = encrypt(validatedData!.smtpConfig.pass);
    }

    const result = await DbUtils.updateDoc(
      CollectionName.PORTFOLIOS,
      id,
      validatedData!
    );

    if (result.matchedCount === 0) {
      return sendNotFound('Portfolio');
    }

    const updated = await DbUtils.findDoc(CollectionName.PORTFOLIOS, id);
    return sendData(updated);
  },
  { schema: PortfolioSchema.partial() }
);

// DELETE PORTFOLIO (CASCADE DELETE)
export const DELETE = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  const user = await getCurrentUser();

  // Access Control: ONLY ADMINS can delete portfolios
  if (user?.role !== UserRole.ADMIN) {
    return sendForbidden('Only system administrators can delete portfolios');
  }

  const portfolioId = new mongoose.Types.ObjectId(id as string);

  const cascadeCollections = [
    CollectionName.BLOGS,
    CollectionName.CASE_STUDIES,
    CollectionName.MEDIA,
    CollectionName.CATEGORIES,
    CollectionName.PROJECTS,
    CollectionName.FAQS,
    CollectionName.LEADS,
    CollectionName.SUBSCRIBERS,
    CollectionName.CAMPAIGNS,
    CollectionName.TESTIMONIALS,
  ];

  const result = await runCascade(async (session) => {
    for (const collection of cascadeCollections) {
      await getDb()
        .collection(collection)
        .deleteMany({ portfolio: portfolioId }, { session });
    }
    return getDb()
      .collection(CollectionName.PORTFOLIOS)
      .deleteOne({ _id: portfolioId }, { session });
  }, `portfolio ${id} cascade delete`);

  if (result.deletedCount === 0) {
    return sendNotFound('Portfolio');
  }

  return sendData({ id });
});
