import mongoose from 'mongoose';
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
import { getDb } from '@/lib/db/dbConnect';
import {
  CollectionName,
  MongoQuery,
  MongoPipeline,
  UserRole,
} from '@/types/cms';
import { LeadSchema, LeadStatus } from '@/schemas/cms';

export const GET = apiHandler(async (request) => {
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

  const validStatus = parseEnumParam(status, Object.values(LeadStatus));
  if (validStatus) {
    query.status = validStatus;
  }

  const total = await getDb()
    .collection(CollectionName.LEADS)
    .countDocuments(query);

  const pipeline: MongoPipeline = [
    { $match: query },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    ...portfolioPopulate(),
  ];

  const leads = await getDb()
    .collection(CollectionName.LEADS)
    .aggregate(pipeline)
    .toArray();

  return sendList(leads, { page, limit, total });
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

    // Ensure portfolio is stored as ObjectId
    const processedBody = {
      ...validatedData,
      portfolio: new mongoose.Types.ObjectId(validatedData!.portfolio),
    };

    const result = await DbUtils.createDoc(CollectionName.LEADS, processedBody);
    const created = await DbUtils.findDoc(
      CollectionName.LEADS,
      result.insertedId.toString()
    );

    return sendData(created, 201);
  },
  { schema: LeadSchema }
);
