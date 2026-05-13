import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { apiHandler, sendNotFound, DbUtils } from '@/lib/api-utils';
import { scopeQuery, portfolioPopulate } from '@/lib/db/portfolio-utils';
import { CollectionName, LeadSchema } from '@/schemas/cms';

export const GET = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

  const items = await mongoose.connection.db
    .collection(CollectionName.LEADS)
    .aggregate([{ $match: query }, ...portfolioPopulate()])
    .toArray();

  const item = items[0];
  if (!item) return sendNotFound('Lead');
  return NextResponse.json(item);
});

export const PATCH = apiHandler(
  async (_request, { params, validatedData }) => {
    const { id } = await params;
    const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

    const result = await DbUtils.updateDoc(
      CollectionName.LEADS,
      id,
      validatedData,
      query
    );
    if (result.matchedCount === 0) return sendNotFound('Lead');

    return NextResponse.json({ success: true });
  },
  { schema: LeadSchema.partial() }
);

export const DELETE = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });
  const result = await DbUtils.deleteDoc(CollectionName.LEADS, id, query);

  if (result.deletedCount === 0) return sendNotFound('Lead');
  return NextResponse.json({ success: true });
});
