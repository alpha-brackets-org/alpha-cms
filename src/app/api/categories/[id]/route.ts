import mongoose from 'mongoose';
import {
  apiHandler,
  DbUtils,
  sendSuccess,
  sendNotFound,
  sendError,
} from '@/lib/api-utils';
import { scopeQuery } from '@/lib/db/portfolio-utils';
import { CollectionName } from '@/schemas/cms';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// UPDATE CATEGORY
export const PATCH = apiHandler(async (request, context: RouteContext) => {
  const { id } = await context.params;
  const body = await request.json();

  if (id === 'default-uncategorized') {
    return sendError('System categories cannot be modified.', 403);
  }

  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

  // Access Control: Only Admins can modify categories unless we want to allow Editors?
  // Usually categories are managed by Admins or senior Editors.
  // scopeQuery already ensures portfolio isolation.

  if (body.portfolio) {
    body.portfolio = new mongoose.Types.ObjectId(String(body.portfolio));
  }

  const result = await DbUtils.updateDoc(
    CollectionName.CATEGORIES,
    id,
    body,
    query
  );

  if (result.matchedCount === 0) {
    return sendNotFound('Category');
  }

  return sendSuccess({ success: true });
});

// DELETE CATEGORY
export const DELETE = apiHandler(async (_request, context: RouteContext) => {
  const { id } = await context.params;
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

  if (id === 'default-uncategorized') {
    return sendError('System categories cannot be deleted.', 403);
  }

  const categoryId = new mongoose.Types.ObjectId(id);
  const categoryIdStr = id;

  // 1. Unlink Blogs
  await mongoose.connection.db
    .collection(CollectionName.BLOGS)
    .updateMany(
      { $or: [{ category: categoryId }, { category: categoryIdStr }] },
      { $set: { category: null } }
    );

  // 2. Unlink Case Studies
  await mongoose.connection.db
    .collection(CollectionName.CASE_STUDIES)
    .updateMany(
      { $or: [{ category: categoryId }, { category: categoryIdStr }] },
      { $set: { category: null } }
    );

  // 3. Delete Category
  const result = await DbUtils.deleteDoc(CollectionName.CATEGORIES, id, query);

  if (result.deletedCount === 0) {
    return sendNotFound('Category');
  }

  return sendSuccess({ success: true });
});
