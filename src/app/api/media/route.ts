import mongoose from 'mongoose';
import { scopeQuery } from '@/lib/db/portfolio-utils';
import {
  sendPaginatedResponse,
  apiHandler,
  DbUtils,
  sendSuccess,
  sendBadRequest,
  parseSearchParams,
  getCurrentUser,
  sendForbidden,
  sendError,
} from '@/lib/api-utils';
import { CollectionName, UserRole, MongoQuery } from '@/types/cms';
import imagekit from '@/lib/imagekit';

export const GET = apiHandler(async (request) => {
  const { portfolio, page, limit, skip, folder, tag, search } =
    parseSearchParams(request);
  const baseQuery = await scopeQuery({}, portfolio);

  const query: MongoQuery = { ...baseQuery };
  if (folder && folder !== 'all') query.folder = folder;
  if (tag && tag !== 'all') query.tags = tag;
  if (search) {
    query.$or = [
      { filename: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  const total = await mongoose.connection.db
    .collection(CollectionName.MEDIA)
    .countDocuments(query);

  const media = await mongoose.connection.db
    .collection(CollectionName.MEDIA)
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return sendPaginatedResponse(media, { total, page, limit });
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

  // Ensure portfolio is stored as ObjectId
  const processedBody = {
    ...body,
    portfolio: new mongoose.Types.ObjectId(body.portfolio as string),
  };

  const result = await DbUtils.createDoc(CollectionName.MEDIA, processedBody);

  return sendSuccess({ id: result.insertedId }, 201);
});

export const DELETE = apiHandler(async (request) => {
  const { ids } = await request.json();

  if (!ids || !Array.isArray(ids)) {
    return sendBadRequest('Invalid or missing IDs array');
  }

  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
  const query = await scopeQuery({ _id: { $in: objectIds } });

  // 1. Get file IDs for ImageKit cleanup
  const mediaItems = await mongoose.connection.db
    .collection(CollectionName.MEDIA)
    .find(query)
    .toArray();

  const fileIds = mediaItems.map((m) => m.imageKitFileId).filter(Boolean);

  // 2. Delete from ImageKit
  if (fileIds.length > 0) {
    try {
      await imagekit.files.bulk.delete({ fileIds });
    } catch (error) {
      console.error('IMAGEKIT_BATCH_DELETE_ERROR:', error);
    }
  }

  // 3. Delete from Database
  const result = await mongoose.connection.db
    .collection(CollectionName.MEDIA)
    .deleteMany(query);

  return sendSuccess({
    success: true,
    deletedCount: result.deletedCount,
    message: `${result.deletedCount} assets deleted permanently.`,
  });
});
