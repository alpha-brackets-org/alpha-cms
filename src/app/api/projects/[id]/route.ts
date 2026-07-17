import mongoose from 'mongoose';
import { apiHandler, sendNotFound, sendData, DbUtils } from '@/lib/api-utils';
import { getDb } from '@/lib/db/dbConnect';
import {
  scopeQuery,
  portfolioPopulate,
  categoryPopulate,
} from '@/lib/db/portfolio-utils';
import { CollectionName, ProjectSchema } from '@/schemas/cms';

export const GET = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendNotFound('Project');
  }
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

  const items = await getDb()
    .collection(CollectionName.PROJECTS)
    .aggregate([
      { $match: query },
      ...categoryPopulate(),
      ...portfolioPopulate(),
    ])
    .toArray();

  const item = items[0];
  if (!item) return sendNotFound('Project');
  return sendData(item);
});

export const PATCH = apiHandler(
  async (_request, { params, validatedData }) => {
    const { id } = await params;
    const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

    const result = await DbUtils.updateDoc(
      CollectionName.PROJECTS,
      id,
      validatedData!,
      query
    );
    if (result.matchedCount === 0) return sendNotFound('Project');

    const updated = await DbUtils.findDoc(CollectionName.PROJECTS, id, query);
    return sendData(updated);
  },
  { schema: ProjectSchema.partial() }
);

export const DELETE = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendNotFound('Project');
  }
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });
  const result = await DbUtils.deleteDoc(CollectionName.PROJECTS, id, query);

  if (result.deletedCount === 0) return sendNotFound('Project');
  return sendData({ id });
});
