import mongoose from 'mongoose';
import { scopeQuery } from '@/lib/db/portfolio-utils';
import {
  sendList,
  sendData,
  apiHandler,
  DbUtils,
  sendBadRequest,
  parseSearchParams,
  getCurrentUser,
  sendForbidden,
} from '@/lib/api-utils';
import { CollectionName, UserRole, MongoQuery } from '@/types/cms';
import { MediaSchema } from '@/schemas/cms';
import imagekit from '@/lib/imagekit';
import { getDb } from '@/lib/db/dbConnect';

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

  const total = await getDb()
    .collection(CollectionName.MEDIA)
    .countDocuments(query);

  const media = await getDb()
    .collection(CollectionName.MEDIA)
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return sendList(media, { total, page, limit });
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

    const result = await DbUtils.createDoc(CollectionName.MEDIA, processedBody);
    const created = await DbUtils.findDoc(
      CollectionName.MEDIA,
      result.insertedId.toString()
    );

    return sendData(created, 201);
  },
  { schema: MediaSchema }
);

export const DELETE = apiHandler(async (request) => {
  const { ids } = await request.json();

  if (!ids || !Array.isArray(ids)) {
    return sendBadRequest('Invalid or missing IDs array');
  }

  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
  const query = await scopeQuery({ _id: { $in: objectIds } });

  // 1. Get file IDs for ImageKit cleanup
  const mediaItems = await getDb()
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
  const result = await getDb()
    .collection(CollectionName.MEDIA)
    .deleteMany(query);

  return sendData({ ids, deletedCount: result.deletedCount });
});
