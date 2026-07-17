import { getDb } from '@/lib/db/dbConnect';
import { scopeQuery, portfolioPopulate } from '@/lib/db/portfolio-utils';
import {
  sendList,
  apiHandler,
  parseSearchParams,
  parseEnumParam,
} from '@/lib/api-utils';
import { CollectionName, MongoQuery, MongoPipeline } from '@/types/cms';
import { SubscriberStatus, SubscriberSource } from '@/schemas/cms';

// GET ALL SUBSCRIBERS
export const GET = apiHandler(async (request) => {
  const { search, status, source, portfolio, page, limit, skip } =
    parseSearchParams(request);

  const baseQuery = await scopeQuery({}, portfolio);
  const query: MongoQuery = { ...baseQuery };

  // Apply search filter (Email)
  if (search) {
    query.email = { $regex: search, $options: 'i' };
  }

  // Apply status filter
  const validStatus = parseEnumParam(status, Object.values(SubscriberStatus));
  if (validStatus) {
    query.status = validStatus;
  }

  const validSource = parseEnumParam(source, Object.values(SubscriberSource));
  if (validSource) {
    query.source = validSource;
  }

  // Total count for pagination
  const total = await getDb()
    .collection(CollectionName.SUBSCRIBERS)
    .countDocuments(query);

  // Use Aggregation to populate details
  const pipeline: MongoPipeline = [
    { $match: query },
    { $sort: { subscribedAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    ...portfolioPopulate(),
  ];

  const subscribers = await getDb()
    .collection(CollectionName.SUBSCRIBERS)
    .aggregate(pipeline)
    .toArray();

  return sendList(subscribers, { page, limit, total });
});
