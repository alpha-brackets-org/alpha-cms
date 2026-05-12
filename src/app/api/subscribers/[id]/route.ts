import {
  apiHandler,
  DbUtils,
  sendSuccess,
  sendNotFound,
} from '@/lib/api-utils';
import { CollectionName } from '@/types/cms';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// UPDATE SUBSCRIBER (e.g. Change status)
export const PATCH = apiHandler(async (request, context: RouteContext) => {
  const { id } = await context.params;
  const body = await request.json();

  const result = await DbUtils.updateDoc(CollectionName.SUBSCRIBERS, id, body);

  if (result.matchedCount === 0) {
    return sendNotFound('Subscriber');
  }

  return sendSuccess({ success: true });
});

// DELETE SUBSCRIBER
export const DELETE = apiHandler(async (_request, context: RouteContext) => {
  const { id } = await context.params;

  const result = await DbUtils.deleteDoc(CollectionName.SUBSCRIBERS, id);

  if (result.deletedCount === 0) {
    return sendNotFound('Subscriber');
  }

  return sendSuccess({
    success: true,
    message: 'Subscriber deleted permanently.',
  });
});
