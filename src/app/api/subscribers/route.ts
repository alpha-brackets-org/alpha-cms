import mongoose from 'mongoose';
import { scopeQuery, portfolioPopulate } from '@/lib/db/portfolio-utils';
import {
  sendPaginatedResponse,
  apiHandler,
  parseSearchParams,
  getCurrentUser,
  sendError,
} from '@/lib/api-utils';
import { CollectionName, MongoQuery, MongoPipeline } from '@/types/cms';

// GET ALL SUBSCRIBERS
export const GET = apiHandler(async (request) => {
  const user = await getCurrentUser();
  if (!user) {
    return sendError('AUTHENTICATION REQUIRED', 401);
  }

  const { search, status, source, portfolio, page, limit, skip } =
    parseSearchParams(request);

  const baseQuery = await scopeQuery({}, portfolio);
  const query: MongoQuery = { ...baseQuery };

  // Apply search filter (Email)
  if (search) {
    query.email = { $regex: search, $options: 'i' };
  }

  // Apply status filter
  if (status && status !== 'all') {
    query.status = status;
  }

  // Apply source filter
  if (source && source !== 'all') {
    query.source = source;
  }

  // Total count for pagination
  const total = await mongoose.connection.db
    .collection(CollectionName.SUBSCRIBERS)
    .countDocuments(query);

  // Use Aggregation to populate details
  const pipeline: MongoPipeline = [
    { $match: query },
    { $sort: { subscribedAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    ...portfolioPopulate(),
  ];

  const subscribers = await mongoose.connection.db
    .collection(CollectionName.SUBSCRIBERS)
    .aggregate(pipeline)
    .toArray();

  return sendPaginatedResponse(subscribers, { page, limit, total });
});
