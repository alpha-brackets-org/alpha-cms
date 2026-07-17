import { apiHandler, sendData, sendError } from '@/lib/api-utils';
import mongoose from 'mongoose';
import { scopeQuery } from '@/lib/db/portfolio-utils';
import { getDb } from '@/lib/db/dbConnect';

export const GET = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  const db = getDb();

  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });
  const campaign = await db.collection('campaigns').findOne(query);

  if (!campaign) return sendError('Campaign not found', 404);

  return sendData(campaign);
});

export const DELETE = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  const db = getDb();

  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });
  const result = await db.collection('campaigns').deleteOne(query);

  if (result.deletedCount === 0) return sendError('Campaign not found', 404);

  return sendData({ id });
});
