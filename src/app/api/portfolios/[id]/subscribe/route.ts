import mongoose from 'mongoose';
import {
  apiHandler,
  sendData,
  sendBadRequest,
  sendError,
} from '@/lib/api-utils';
import { CollectionName, SubscriberStatus } from '@/types/cms';
import { SubscriberSchema } from '@/schemas/cms';
import { getDb } from '@/lib/db/dbConnect';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * PUBLIC SUBSCRIBE ENDPOINT
 * Allows visitors to subscribe to a portfolio's newsletter.
 */
export const POST = apiHandler(
  async (request, { params }) => {
    const ip = getClientIp(request);
    const { allowed } = await checkRateLimit('subscribe', ip, 20, 60);
    if (!allowed) {
      return sendError('Too many requests. Please try again later.', 429);
    }

    const { id } = await params;
    const body = await request.json();

    // Validate the request body
    const validation = SubscriberSchema.safeParse({
      ...body,
      portfolio: id,
      status: SubscriberStatus.ACTIVE,
    });

    if (!validation.success) {
      return sendBadRequest(validation.error.issues[0].message);
    }

    const { email } = validation.data;
    const portfolioId = new mongoose.Types.ObjectId(id);
    const normalizedEmail = email.toLowerCase();

    // Check if already subscribed (still useful to give a distinct 409 for
    // an already-active subscriber before attempting the write)
    const existing = await getDb()
      .collection(CollectionName.SUBSCRIBERS)
      .findOne({ email: normalizedEmail, portfolio: portfolioId });

    if (existing?.status === SubscriberStatus.ACTIVE) {
      return sendError(
        'This email is already subscribed to this portfolio.',
        409
      );
    }

    // Atomic upsert (re-activate or create) — closes the race window where
    // two concurrent requests could both pass the findOne check above.
    await getDb()
      .collection(CollectionName.SUBSCRIBERS)
      .updateOne(
        { email: normalizedEmail, portfolio: portfolioId },
        {
          $set: { status: SubscriberStatus.ACTIVE, updatedAt: new Date() },
          $setOnInsert: { subscribedAt: new Date() },
        },
        { upsert: true }
      );

    return sendData(
      {
        message: existing
          ? 'Subscription re-activated.'
          : 'Successfully subscribed to the newsletter.',
      },
      existing ? 200 : 201
    );
  },
  { isPublic: true }
);
