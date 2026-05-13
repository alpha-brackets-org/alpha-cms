import mongoose from 'mongoose';
import {
  apiHandler,
  DbUtils,
  sendSuccess,
  sendNotFound,
} from '@/lib/api-utils';
import { scopeQuery } from '@/lib/db/portfolio-utils';
import { CollectionName } from '@/types/cms';
import { MediaSchema } from '@/schemas/cms';
import imagekit from '@/lib/imagekit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// UPDATE MEDIA
export const PATCH = apiHandler(
  async (_request, { params, validatedData }) => {
    const { id } = await params;
    const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

    const result = await DbUtils.updateDoc(
      CollectionName.MEDIA,
      id,
      validatedData,
      query
    );

    if (result.matchedCount === 0) {
      return sendNotFound('Media Asset');
    }

    return sendSuccess({ success: true });
  },
  { schema: MediaSchema.partial() }
);

// DELETE MEDIA
export const DELETE = apiHandler(async (_request, context: RouteContext) => {
  const { id } = await context.params;
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

  // 1. Get the media doc to find the ImageKit file ID
  const media = await mongoose.connection.db
    .collection(CollectionName.MEDIA)
    .findOne(query);

  if (!media) {
    return sendNotFound('Media Asset');
  }

  // 2. Delete from ImageKit if fileId exists
  if (media.imageKitFileId) {
    try {
      await imagekit.files.delete(media.imageKitFileId);
    } catch (error) {
      console.error('IMAGEKIT_DELETE_ERROR:', error);
      // Continue even if IK delete fails, to keep DB in sync
    }
  }

  // 3. Delete from Database
  const result = await DbUtils.deleteDoc(CollectionName.MEDIA, id, query);

  if (result.deletedCount === 0) {
    return sendNotFound('Media Asset');
  }

  return sendSuccess({ success: true, message: 'Asset deleted permanently.' });
});
