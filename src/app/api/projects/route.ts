import mongoose from 'mongoose';
import { getDb } from '@/lib/db/dbConnect';
import {
  scopeQuery,
  portfolioPopulate,
  categoryPopulate,
} from '@/lib/db/portfolio-utils';
import {
  sendList,
  sendData,
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
import { ProjectSchema } from '@/schemas/cms';

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

  const total = await getDb()
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

  const projects = await getDb()
    .collection(CollectionName.PROJECTS)
    .aggregate(pipeline)
    .toArray();

  return sendList(projects, { page, limit, total });
});

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

    const processedBody = {
      ...validatedData,
      portfolio: new mongoose.Types.ObjectId(validatedData!.portfolio),
    };

    const result = await DbUtils.createDoc(
      CollectionName.PROJECTS,
      processedBody
    );
    const created = await DbUtils.findDoc(
      CollectionName.PROJECTS,
      result.insertedId.toString()
    );

    return sendData(created, 201);
  },
  { schema: ProjectSchema }
);
