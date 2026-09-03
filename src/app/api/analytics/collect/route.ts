import mongoose from 'mongoose';
import {
  apiHandler,
  sendData,
  sendCorsResponse,
  sendError,
} from '@/lib/api-utils';
import { getDb } from '@/lib/db/dbConnect';
import { CollectionName, AnalyticsSchema } from '@/schemas/cms';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * ANALYTICS INGESTION ENDPOINT
 * High-performance endpoint for collecting visitor events from portfolios.
 */
export const POST = apiHandler(
  async (_request, { validatedData }) => {
    const ip = getClientIp(_request);
    const { allowed } = await checkRateLimit('analytics-collect', ip, 120, 60);
    if (!allowed) {
      return sendError('Too many requests.', 429);
    }

    const { portfolio, event, path, visitorId, metadata, duration } =
      validatedData!;
    const db = getDb();

    // Insert the event record
    await db.collection(CollectionName.ANALYTICS).insertOne({
      portfolio: new mongoose.Types.ObjectId(portfolio),
      event,
      path,
      visitorId,
      duration,
      metadata: metadata || {},
      timestamp: new Date(),
    });

    return sendCorsResponse(sendData({ tracked: true }, 201));
  },
  { isPublic: true, schema: AnalyticsSchema }
);

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
