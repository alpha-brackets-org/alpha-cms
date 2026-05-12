import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { apiHandler, sendNotFound, DbUtils } from '@/lib/api-utils';
import {
  scopeQuery,
  portfolioPopulate,
  categoryPopulate,
} from '@/lib/db/portfolio-utils';
import { CollectionName } from '@/schemas/cms';

export const GET = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendNotFound('Project');
  }
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

  const items = await mongoose.connection.db
    .collection(CollectionName.PROJECTS)
    .aggregate([
      { $match: query },
      ...categoryPopulate(),
      ...portfolioPopulate(),
    ])
    .toArray();

  const item = items[0];
  if (!item) return sendNotFound('Project');
  return NextResponse.json(item);
});

export const PATCH = apiHandler(async (request, { params }) => {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendNotFound('Project');
  }
  const body = await request.json();
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

  const result = await DbUtils.updateDoc(
    CollectionName.PROJECTS,
    id,
    body,
    query
  );
  if (result.matchedCount === 0) return sendNotFound('Project');

  return NextResponse.json({ success: true });
});

export const DELETE = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendNotFound('Project');
  }
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });
  const result = await DbUtils.deleteDoc(CollectionName.PROJECTS, id, query);

  if (result.deletedCount === 0) return sendNotFound('Project');
  return NextResponse.json({ success: true });
});
