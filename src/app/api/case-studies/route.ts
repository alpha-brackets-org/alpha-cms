import mongoose from 'mongoose';
import {
  scopeQuery,
  portfolioPopulate,
  categoryPopulate,
} from '@/lib/db/portfolio-utils';
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
import { CaseStudySchema } from '@/schemas/cms';

// GET ALL CASE STUDIES
export const GET = apiHandler(async (request) => {
  const { search, status, category, portfolio, page, limit, skip } =
    parseSearchParams(request);

  const baseQuery = await scopeQuery({}, portfolio);
  const query: MongoQuery = { ...baseQuery };

  // Search filter (Title, Client, Industry)
  if (search) {
    query.$or = [
      { projectTitle: { $regex: search, $options: 'i' } },
      { client: { $regex: search, $options: 'i' } },
      { industry: { $regex: search, $options: 'i' } },
    ];
  }

  // Status filter
  if (status && status !== 'all') {
    query.status = status;
  }

  // Category filter
  if (category && category !== 'all') {
    if (category === 'default-uncategorized') {
      query.category = { $in: [null, ''] };
    } else {
      try {
        query.category = new mongoose.Types.ObjectId(category as string);
      } catch (_) {
        query.category = category;
      }
    }
  }

  // Total count for pagination
  const total = await mongoose.connection.db
    .collection(CollectionName.CASE_STUDIES)
    .countDocuments(query);

  // Use Aggregation for details
  const pipeline: MongoPipeline = [
    { $match: query },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    ...categoryPopulate(),
    ...portfolioPopulate(),
  ];

  const projects = await mongoose.connection.db
    .collection(CollectionName.CASE_STUDIES)
    .aggregate(pipeline)
    .toArray();

  return sendPaginatedResponse(projects, { page, limit, total });
});

// CREATE CASE STUDY
export const POST = apiHandler(async (request) => {
  const user = await getCurrentUser();
  const body = await request.json();

  const validatedData = CaseStudySchema.parse(body);

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
    category:
      validatedData.category &&
      mongoose.Types.ObjectId.isValid(validatedData.category)
        ? new mongoose.Types.ObjectId(validatedData.category)
        : validatedData.category,
  };

  const result = await DbUtils.createDoc(
    CollectionName.CASE_STUDIES,
    processedBody
  );

  return sendSuccess({ id: result.insertedId }, 201);
});
