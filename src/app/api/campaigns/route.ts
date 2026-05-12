import {
  apiHandler,
  sendSuccess,
  sendError,
  getCurrentUser,
  parseSearchParams,
  sendPaginatedResponse,
} from '@/lib/api-utils';
import {
  CollectionName,
  PublishStatus,
  UserRole,
  CampaignSchema,
} from '@/schemas/cms';
import mongoose from 'mongoose';
import { scopeQuery } from '@/lib/db/portfolio-utils';

export const GET = apiHandler(async (request) => {
  const user = await getCurrentUser();
  if (!user) return sendError('Unauthorized', 401);

  const { skip, limit, page } = parseSearchParams(request);
  const db = mongoose.connection.db;

  const query = await scopeQuery({});

  const campaigns = await db
    .collection(CollectionName.CAMPAIGNS)
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const total = await db
    .collection(CollectionName.CAMPAIGNS)
    .countDocuments(query);

  return sendPaginatedResponse(campaigns, { page, limit, total });
});

export const POST = apiHandler(async (request) => {
  const user = await getCurrentUser();
  if (!user) return sendError('Unauthorized', 401);

  const body = await request.json();
  const db = mongoose.connection.db;

  const validatedData = CampaignSchema.parse(body);

  // Authorization check for the target portfolio
  if (
    user.role !== UserRole.ADMIN &&
    !user.portfolios?.includes(validatedData.portfolio)
  ) {
    return sendError('Unauthorized portfolio access', 403);
  }

  // Remove _id if it exists in validatedData to avoid MongoDB type conflict
  const { _id, ...campaignData } = validatedData;

  const campaign = {
    ...campaignData,
    status: PublishStatus.DRAFT,
    recipientCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db
    .collection(CollectionName.CAMPAIGNS)
    .insertOne(campaign);

  return sendSuccess({ ...campaign, _id: result.insertedId }, 201);
});
