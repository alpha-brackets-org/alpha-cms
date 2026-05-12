import {
  apiHandler,
  sendSuccess,
  sendError,
  getCurrentUser,
} from '@/lib/api-utils';
import mongoose from 'mongoose';
import { scopeQuery } from '@/lib/db/portfolio-utils';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = apiHandler(async (request, context: RouteContext) => {
  const user = await getCurrentUser();
  if (!user) return sendError('Unauthorized', 401);

  const { id } = await context.params;
  const db = mongoose.connection.db;

  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });
  const campaign = await db.collection('campaigns').findOne(query);

  if (!campaign) return sendError('Campaign not found', 404);

  return sendSuccess(campaign);
});

export const DELETE = apiHandler(async (_request, context: RouteContext) => {
  const user = await getCurrentUser();
  if (!user) return sendError('Unauthorized', 401);

  const { id } = await context.params;
  const db = mongoose.connection.db;

  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });
  const result = await db.collection('campaigns').deleteOne(query);

  if (result.deletedCount === 0) return sendError('Campaign not found', 404);

  return sendSuccess({ message: 'Campaign deleted' });
});
