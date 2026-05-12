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

export const GET = apiHandler(async (request) => {
  const { search, status, portfolio, page, limit, skip } =
    parseSearchParams(request);
  const url = new URL(request.url);
  const category = url.searchParams.get('category');

  const baseQuery = await scopeQuery({}, portfolio);
  const query: MongoQuery = { ...baseQuery };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { techStack: { $elemMatch: { $regex: search, $options: 'i' } } },
    ];
  }

  if (status && status !== 'all') {
    query.status = status;
  }

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

  const total = await mongoose.connection.db
    .collection(CollectionName.PROJECTS)
    .countDocuments(query);

  const pipeline: MongoPipeline = [
    { $match: query },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    ...categoryPopulate(),
    ...portfolioPopulate(),
  ];

  const projects = await mongoose.connection.db
    .collection(CollectionName.PROJECTS)
    .aggregate(pipeline)
    .toArray();

  return sendPaginatedResponse(projects, { page, limit, total });
});

export const POST = apiHandler(async (request) => {
  const user = await getCurrentUser();
  const body = await request.json();

  if (!body.portfolio) {
    return sendError('Portfolio assignment is required', 400);
  }

  // Access Control
  if (
    user?.role !== UserRole.ADMIN &&
    !user?.portfolios?.includes(body.portfolio)
  ) {
    return sendForbidden('You do not have access to this portfolio');
  }

  body.portfolio = new mongoose.Types.ObjectId(body.portfolio as string);

  const result = await DbUtils.createDoc(CollectionName.PROJECTS, body);

  return sendSuccess({ id: result.insertedId }, 201);
});
