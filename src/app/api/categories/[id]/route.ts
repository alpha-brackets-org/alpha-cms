import mongoose from 'mongoose';
import {
  apiHandler,
  DbUtils,
  sendData,
  sendNotFound,
  sendError,
} from '@/lib/api-utils';
import { scopeQuery } from '@/lib/db/portfolio-utils';
import { runCascade } from '@/lib/db/cascade';
import { CollectionName, CategorySchema } from '@/schemas/cms';
import { getDb } from '@/lib/db/dbConnect';

// UPDATE CATEGORY
export const PATCH = apiHandler(
  async (_request, { params, validatedData }) => {
    const { id } = await params;

    if (id === 'default-uncategorized') {
      return sendError('System categories cannot be modified.', 403);
    }

    const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

    // Access Control: Only Admins can modify categories unless we want to allow Editors?
    // Usually categories are managed by Admins or senior Editors.
    // scopeQuery already ensures portfolio isolation.

    if (validatedData!.portfolio) {
      validatedData!.portfolio = new mongoose.Types.ObjectId(
        String(validatedData!.portfolio)
      ) as unknown as string;
    }

    const result = await DbUtils.updateDoc(
      CollectionName.CATEGORIES,
      id,
      validatedData!,
      query
    );

    if (result.matchedCount === 0) {
      return sendNotFound('Category');
    }

    const updated = await DbUtils.findDoc(CollectionName.CATEGORIES, id, query);
    return sendData(updated);
  },
  { schema: CategorySchema.partial() }
);

// DELETE CATEGORY
export const DELETE = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

  if (id === 'default-uncategorized') {
    return sendError('System categories cannot be deleted.', 403);
  }

  const categoryId = new mongoose.Types.ObjectId(id);
  const categoryIdStr = id;

  const result = await runCascade(async (session) => {
    // 1. Unlink Blogs
    await getDb()
      .collection(CollectionName.BLOGS)
      .updateMany(
        { $or: [{ category: categoryId }, { category: categoryIdStr }] },
        { $set: { category: null } },
        { session }
      );

    // 2. Unlink Case Studies
    await getDb()
      .collection(CollectionName.CASE_STUDIES)
      .updateMany(
        { $or: [{ category: categoryId }, { category: categoryIdStr }] },
        { $set: { category: null } },
        { session }
      );

    // 3. Unlink Projects
    await getDb()
      .collection(CollectionName.PROJECTS)
      .updateMany(
        { $or: [{ category: categoryId }, { category: categoryIdStr }] },
        { $set: { category: null } },
        { session }
      );

    // 4. Delete Category
    return getDb()
      .collection(CollectionName.CATEGORIES)
      .deleteOne(query, { session });
  }, `category ${id} cascade delete`);

  if (result.deletedCount === 0) {
    return sendNotFound('Category');
  }

  return sendData({ id });
});
