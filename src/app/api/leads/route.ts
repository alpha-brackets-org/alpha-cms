import mongoose from 'mongoose';
import { scopeQuery, portfolioPopulate } from '@/lib/db/portfolio-utils';
import {
  sendPaginatedResponse,
  sendSuccess,
  apiHandler,
  DbUtils,
  parseSearchParams,
  getCurrentUser,
  sendForbidden,
  sendError,
} from '@/lib/api-utils';
import {
  CollectionName,
  MongoQuery,
  MongoPipeline,
  UserRole,
} from '@/types/cms';
import { LeadSchema } from '@/schemas/cms';

export const GET = apiHandler(async (request) => {
  const user = await getCurrentUser();
  if (!user) {
    return sendError('AUTHENTICATION REQUIRED', 401);
  }

  const { search, status, portfolio, page, limit, skip } =
    parseSearchParams(request);

  const baseQuery = await scopeQuery({}, portfolio);
  const query: MongoQuery = { ...baseQuery };

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }

  if (status && status !== 'all') {
    query.status = status;
  }

  const total = await mongoose.connection.db
    .collection(CollectionName.LEADS)
    .countDocuments(query);

  const pipeline: MongoPipeline = [
    { $match: query },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    ...portfolioPopulate(),
  ];

  const leads = await mongoose.connection.db
    .collection(CollectionName.LEADS)
    .aggregate(pipeline)
    .toArray();

  return sendPaginatedResponse(leads, { page, limit, total });
});

export const POST = apiHandler(async (request) => {
  const user = await getCurrentUser();
  const body = await request.json();

  const validatedData = LeadSchema.parse(body);

  // Access Control
  if (
    user?.role !== UserRole.ADMIN &&
    !user?.portfolios?.includes(validatedData.portfolio)
  ) {
    return sendForbidden('You do not have access to this portfolio');
  }

  // Ensure portfolio is stored as ObjectId
  const processedBody = {
    ...validatedData,
    portfolio: new mongoose.Types.ObjectId(validatedData.portfolio),
  };

  const result = await DbUtils.createDoc(CollectionName.LEADS, processedBody);

  return sendSuccess({ id: result.insertedId }, 201);
});
