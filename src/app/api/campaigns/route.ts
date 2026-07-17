import {
  apiHandler,
  sendData,
  sendError,
  getCurrentUser,
  parseSearchParams,
  sendList,
} from '@/lib/api-utils';
import {
  CollectionName,
  PublishStatus,
  UserRole,
  CampaignSchema,
} from '@/schemas/cms';
import mongoose from 'mongoose';
import { scopeQuery } from '@/lib/db/portfolio-utils';
import { getDb } from '@/lib/db/dbConnect';

export const GET = apiHandler(async (request) => {
  const { skip, limit, page } = parseSearchParams(request);
  const db = getDb();

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

  return sendList(campaigns, { page, limit, total });
});

export const POST = apiHandler(
  async (_request, { validatedData }) => {
    const user = await getCurrentUser();
    const db = getDb();

    // Authorization check for the target portfolio
    if (
      user?.role !== UserRole.ADMIN &&
      !user?.portfolios?.includes(validatedData!.portfolio)
    ) {
      return sendError('Unauthorized portfolio access', 403);
    }

    // Remove _id if it exists in validatedData to avoid MongoDB type conflict
    const { _id, ...campaignData } = validatedData!;

    const campaign = {
      ...campaignData,
      portfolio: new mongoose.Types.ObjectId(campaignData.portfolio),
      status: PublishStatus.DRAFT,
      recipientCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .collection(CollectionName.CAMPAIGNS)
      .insertOne(campaign);

    return sendData({ ...campaign, _id: result.insertedId }, 201);
  },
  { schema: CampaignSchema }
);
