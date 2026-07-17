import mongoose from 'mongoose';
import { getDb } from '@/lib/db/dbConnect';
import { CollectionName, SubscriberStatus } from '@/schemas/cms';

/**
 * Shared update path for the public unsubscribe link, which only has an
 * email + portfolioId (not a Mongo _id) — resolves the doc, then applies
 * the same status update as PATCH /subscribers/[id].
 */
export async function unsubscribeSubscriber(
  email: string,
  portfolioId: string
) {
  return getDb()
    .collection(CollectionName.SUBSCRIBERS)
    .updateOne(
      {
        email: email.toLowerCase(),
        portfolio: new mongoose.Types.ObjectId(portfolioId),
      },
      { $set: { status: SubscriberStatus.UNSUBSCRIBED, updatedAt: new Date() } }
    );
}
