import mongoose from 'mongoose';
import { getDb } from '@/lib/db/dbConnect';
import { scopeQuery, portfolioPopulate } from '@/lib/db/portfolio-utils';
import {
  sendList,
  sendData,
  apiHandler,
  DbUtils,
  parseSearchParams,
  getCurrentUser,
  sendForbidden,
} from '@/lib/api-utils';
import { Category, MongoQuery, CollectionName, UserRole } from '@/types/cms';
import { CategorySchema } from '@/schemas/cms';

export const GET = apiHandler(async (request) => {
  const { search, portfolio, page, limit, skip } = parseSearchParams(request);

  const baseQuery = await scopeQuery({}, portfolio);
  const query: MongoQuery = { ...baseQuery };

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const total = await getDb()
    .collection(CollectionName.CATEGORIES)
    .countDocuments(query);

  const pipeline = [
    { $match: query },
    { $sort: { name: 1 } },
    { $skip: skip },
    { $limit: limit },
    ...portfolioPopulate(),
  ];

  const categories = (await getDb()
    .collection(CollectionName.CATEGORIES)
    .aggregate(pipeline)
    .toArray()) as unknown as Category[];

  // Add default Uncategorized if it doesn't exist in DB and we are on page 1
  if (page === 1 && !categories.find((c) => c.slug === 'uncategorized')) {
    categories.unshift({
      _id: 'default-uncategorized',
      name: 'Uncategorized',
      slug: 'uncategorized',
      isDefault: true,
    } as unknown as Category);
  }

  return sendList(categories, { total, page, limit });
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

    const result = await DbUtils.createDoc(CollectionName.CATEGORIES, {
      ...validatedData,
      portfolio: new mongoose.Types.ObjectId(validatedData!.portfolio),
    });
    const created = await DbUtils.findDoc(
      CollectionName.CATEGORIES,
      result.insertedId.toString()
    );

    return sendData(created, 201);
  },
  { schema: CategorySchema }
);
