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
import { CollectionName, MongoQuery, MongoPipeline } from '@/types/cms';
import { TestimonialSchema, TestimonialStatus, UserRole } from '@/schemas/cms';

// ─── GET ALL TESTIMONIALS ─────────────────────────────────────────────────────
export const GET = apiHandler(async (request) => {
  const { search, status, portfolio, page, limit, skip } =
    parseSearchParams(request);

  const baseQuery = await scopeQuery({}, portfolio);
  const query: MongoQuery = { ...baseQuery };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
  }

  const validStatus = parseEnumParam(status, Object.values(TestimonialStatus));
  if (validStatus) {
    query.status = validStatus;
  }

  const total = await getDb()
    .collection(CollectionName.TESTIMONIALS)
    .countDocuments(query);

  const pipeline: MongoPipeline = [
    { $match: query },
    { $sort: { order: 1, createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    ...portfolioPopulate(),
  ];

  const testimonials = await getDb()
    .collection(CollectionName.TESTIMONIALS)
    .aggregate(pipeline)
    .toArray();

  return sendList(testimonials, { page, limit, total });
});

// ─── CREATE TESTIMONIAL ───────────────────────────────────────────────────────
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

    const result = await DbUtils.createDoc(
      CollectionName.TESTIMONIALS,
      processedBody
    );
    const created = await DbUtils.findDoc(
      CollectionName.TESTIMONIALS,
      result.insertedId.toString()
    );

    return sendData(created, 201);
  },
  { schema: TestimonialSchema }
);
