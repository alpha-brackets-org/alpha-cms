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
} from '@/lib/api-utils';
import {
  CollectionName,
  MongoQuery,
  MongoPipeline,
  UserRole,
} from '@/types/cms';
import { BlogSchema } from '@/schemas/cms';

// GET ALL BLOGS
export const GET = apiHandler(async (request) => {
  const { search, status, category, portfolio, page, limit, skip } =
    parseSearchParams(request);

  const baseQuery = await scopeQuery({}, portfolio);
  const query: MongoQuery = { ...baseQuery };

  // Apply search filter (Title, Slug, Excerpt)
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } },
      { excerpt: { $regex: search, $options: 'i' } },
    ];
  }

  // Apply status filter
  if (status && status !== 'all') {
    query.status = status;
  }

  // Apply category filter
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
    .collection(CollectionName.BLOGS)
    .countDocuments(query);

  // Use Aggregation to populate details
  const pipeline: MongoPipeline = [
    { $match: query },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    ...categoryPopulate(),
    ...portfolioPopulate(),
  ];

  const blogs = await mongoose.connection.db
    .collection(CollectionName.BLOGS)
    .aggregate(pipeline)
    .toArray();

  return sendPaginatedResponse(blogs, { page, limit, total });
});

// CREATE NEW BLOG
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

    const result = await DbUtils.createDoc(CollectionName.BLOGS, processedBody);

    return sendSuccess({ id: result.insertedId }, 201);
  },
  { schema: BlogSchema }
);
