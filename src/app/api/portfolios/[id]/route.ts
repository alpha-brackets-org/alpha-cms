import mongoose from 'mongoose';
import {
  apiHandler,
  DbUtils,
  sendSuccess,
  sendNotFound,
  getCurrentUser,
  sendForbidden,
} from '@/lib/api-utils';
import { encrypt } from '@/lib/encryption';
import { CollectionName, UserRole, PortfolioSchema } from '@/schemas/cms';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET SINGLE PORTFOLIO
export const GET = apiHandler(async (_request, context: RouteContext) => {
  const { id } = await context.params;
  const user = await getCurrentUser();

  // Access Control: Admins see everything, others see only assigned
  if (user?.role !== UserRole.ADMIN && !user?.portfolios?.includes(id)) {
    return sendForbidden('You do not have access to this portfolio');
  }

  const portfolio = await mongoose.connection.db
    .collection(CollectionName.PORTFOLIOS)
    .findOne({ _id: new mongoose.Types.ObjectId(id as string) });

  if (!portfolio) {
    return sendNotFound('Portfolio');
  }

  return sendSuccess(portfolio);
});

// UPDATE PORTFOLIO
export const PATCH = apiHandler(async (request, context: RouteContext) => {
  const { id } = await context.params;
  const body = await request.json();
  const user = await getCurrentUser();

  // Access Control
  if (user?.role !== UserRole.ADMIN && !user?.portfolios?.includes(id)) {
    return sendForbidden('You do not have access to this portfolio');
  }

  const validatedData = PortfolioSchema.partial().parse(body);

  // Encrypt SMTP Password if present
  if (validatedData.smtpConfig?.pass) {
    validatedData.smtpConfig.pass = encrypt(validatedData.smtpConfig.pass);
  }

  const result = await DbUtils.updateDoc(
    CollectionName.PORTFOLIOS,
    id,
    validatedData
  );

  if (result.matchedCount === 0) {
    return sendNotFound('Portfolio');
  }

  return sendSuccess({ success: true });
});

// DELETE PORTFOLIO (CASCADE DELETE)
export const DELETE = apiHandler(async (_request, context: RouteContext) => {
  const { id } = await context.params;
  const user = await getCurrentUser();

  // Access Control: ONLY ADMINS can delete portfolios
  if (user?.role !== UserRole.ADMIN) {
    return sendForbidden('Only system administrators can delete portfolios');
  }

  const portfolioId = new mongoose.Types.ObjectId(id as string);

  // 1. Delete all Blogs for this portfolio
  await mongoose.connection.db
    .collection(CollectionName.BLOGS)
    .deleteMany({ portfolio: portfolioId });

  // 2. Delete all Case Studies for this portfolio
  await mongoose.connection.db
    .collection(CollectionName.CASE_STUDIES)
    .deleteMany({ portfolio: portfolioId });

  // 3. Delete all Media records for this portfolio
  await mongoose.connection.db
    .collection(CollectionName.MEDIA)
    .deleteMany({ portfolio: portfolioId });

  // 4. Delete all Categories for this portfolio
  await mongoose.connection.db
    .collection(CollectionName.CATEGORIES)
    .deleteMany({ portfolio: portfolioId });

  // 5. Delete all Projects for this portfolio
  await mongoose.connection.db
    .collection(CollectionName.PROJECTS)
    .deleteMany({ portfolio: portfolioId });

  // 6. Delete all FAQs for this portfolio
  await mongoose.connection.db
    .collection(CollectionName.FAQS)
    .deleteMany({ portfolio: portfolioId });

  // 7. Delete all Leads for this portfolio
  await mongoose.connection.db
    .collection(CollectionName.LEADS)
    .deleteMany({ portfolio: portfolioId });

  // 8. Delete all Subscribers for this portfolio
  await mongoose.connection.db
    .collection(CollectionName.SUBSCRIBERS)
    .deleteMany({ portfolio: portfolioId });

  // 9. Delete all Campaigns for this portfolio
  await mongoose.connection.db
    .collection(CollectionName.CAMPAIGNS)
    .deleteMany({ portfolio: portfolioId });

  // 10. Delete the Portfolio itself
  const result = await DbUtils.deleteDoc(CollectionName.PORTFOLIOS, id);

  if (result.deletedCount === 0) {
    return sendNotFound('Portfolio');
  }

  return sendSuccess({
    success: true,
    message: 'Portfolio and all associated data deleted permanently.',
  });
});
