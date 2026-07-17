import mongoose from 'mongoose';
import { getDb } from '@/lib/db/dbConnect';
import { scopeQuery, portfolioPopulate } from '@/lib/db/portfolio-utils';
import {
  sendList,
  sendData,
  apiHandler,
  DbUtils,
  parseSearchParams,
  parseEnumParam,
  getCurrentUser,
  sendForbidden,
} from '@/lib/api-utils';
import {
  CollectionName,
  MongoQuery,
  MongoPipeline,
  UserRole,
} from '@/types/cms';
import { FaqSchema, PublishStatus } from '@/schemas/cms';

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
  const validStatus = parseEnumParam(status, Object.values(PublishStatus));
  if (validStatus) {
    query.status = validStatus;
  }

  // Total count for pagination
  const total = await getDb()
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

  const faqs = await getDb()
    .collection(CollectionName.FAQS)
    .aggregate(pipeline)
    .toArray();

  return sendList(faqs, { page, limit, total });
});

// CREATE NEW FAQ
export const POST = apiHandler(
  async (_request, { validatedData }) => {
    const user = await getCurrentUser();

    // Access Control
    if (
      user?.role !== UserRole.ADMIN &&
      !user?.portfolios?.includes(validatedData!.portfolio)
    ) {
      return sendForbidden('You do not have access to this portfolio');
    }

    // Ensure portfolio is stored as ObjectId
    const processedBody = {
      ...validatedData,
      portfolio: new mongoose.Types.ObjectId(validatedData!.portfolio),
    };

    const result = await DbUtils.createDoc(CollectionName.FAQS, processedBody);
    const created = await DbUtils.findDoc(
      CollectionName.FAQS,
      result.insertedId.toString()
    );

    return sendData(created, 201);
  },
  { schema: FaqSchema }
);
