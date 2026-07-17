import { apiHandler, DbUtils, sendData, sendNotFound } from '@/lib/api-utils';
import { CollectionName } from '@/types/cms';
import { SubscriberSchema } from '@/schemas/cms';

// UPDATE SUBSCRIBER (e.g. Change status)
export const PATCH = apiHandler(
  async (_request, { params, validatedData }) => {
    const { id } = await params;

    const result = await DbUtils.updateDoc(
      CollectionName.SUBSCRIBERS,
      id,
      validatedData!
    );

    if (result.matchedCount === 0) {
      return sendNotFound('Subscriber');
    }

    const updated = await DbUtils.findDoc(CollectionName.SUBSCRIBERS, id);
    return sendData(updated);
  },
  { schema: SubscriberSchema.partial() }
);

// DELETE SUBSCRIBER
export const DELETE = apiHandler(async (_request, { params }) => {
  const { id } = await params;

  const result = await DbUtils.deleteDoc(CollectionName.SUBSCRIBERS, id);

  if (result.deletedCount === 0) {
    return sendNotFound('Subscriber');
  }

  return sendData({ id });
});
