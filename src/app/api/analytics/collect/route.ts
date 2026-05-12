import mongoose from 'mongoose';
import { apiHandler, sendSuccess } from '@/lib/api-utils';
import { CollectionName } from '@/types/cms';

/**
 * ANALYTICS INGESTION ENDPOINT
 * High-performance endpoint for collecting visitor events from portfolios.
 */
export const POST = apiHandler(async (request) => {
  const body = await request.json();
  const db = mongoose.connection.db;

  const { portfolio, event, path, visitorId, metadata, duration } = body;

  if (!portfolio) {
    throw new Error('Portfolio ID is required for data attribution');
  }

  // Insert the event record
  await db.collection(CollectionName.ANALYTICS).insertOne({
    portfolio: new mongoose.Types.ObjectId(portfolio as string),
    event,
    path,
    visitorId,
    duration: duration || 0,
    metadata: metadata || {},
    timestamp: new Date(),
  });

  return sendSuccess({ tracked: true }, 201);
});

// Handle Preflight for CORS
export const OPTIONS = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-portfolio-id',
    },
  });
};
