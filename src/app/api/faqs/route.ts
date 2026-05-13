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
} from '@/lib/api-utils';
import {
  CollectionName,
  MongoQuery,
  MongoPipeline,
  UserRole,
} from '@/types/cms';
import { FaqSchema } from '@/schemas/cms';

// GET ALL FAQS
export const GET = apiHandler(async (request) => {
  const { search, status, portfolio, page, limit, skip } =
    parseSearchParams(request);

  const baseQuery = await scopeQuery({}, portfolio);
  const query: MongoQuery = { ...baseQuery };

  // Apply search filter (Question, Answer)
  if (search) {
    query.$or = [
      { question: { $regex: search, $options: 'i' } },
      { answer: { $regex: search, $options: 'i' } },
    ];
  }

  // Apply status filter
  if (status && status !== 'all') {
    query.status = status;
  }

  // Total count for pagination
  const total = await mongoose.connection.db
    .collection(CollectionName.FAQS)
    .countDocuments(query);

  // Use Aggregation to populate details
  const pipeline: MongoPipeline = [
    { $match: query },
    { $sort: { order: 1, createdAt: -1 } }, // Sort by order first, then createdAt
    { $skip: skip },
    { $limit: limit },
    ...portfolioPopulate(),
  ];

  const faqs = await mongoose.connection.db
    .collection(CollectionName.FAQS)
    .aggregate(pipeline)
    .toArray();

  return sendPaginatedResponse(faqs, { page, limit, total });
});

// CREATE NEW FAQ
export const POST = apiHandler(
  async (_request, { validatedData }) => {
    const user = await getCurrentUser();

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

    const result = await DbUtils.createDoc(CollectionName.FAQS, processedBody);

    return sendSuccess({ id: result.insertedId }, 201);
  },
  { schema: FaqSchema }
);
