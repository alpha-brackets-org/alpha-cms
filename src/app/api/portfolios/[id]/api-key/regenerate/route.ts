import {
  apiHandler,
  DbUtils,
  sendData,
  sendForbidden,
  sendNotFound,
  getCurrentUser,
} from '@/lib/api-utils';
import { generateApiKey, hashApiKey } from '@/lib/encryption';
import { CollectionName, UserRole } from '@/schemas/cms';

// REGENERATE PORTFOLIO API KEY
// Returns the plaintext key exactly once — only the hash is persisted.
export const POST = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  const user = await getCurrentUser();

  if (user?.role !== UserRole.ADMIN) {
    return sendForbidden('Only system administrators can manage API keys');
  }

  const apiKey = generateApiKey();

  const result = await DbUtils.updateDoc(CollectionName.PORTFOLIOS, id, {
    apiKeyHash: hashApiKey(apiKey),
  });

  if (result.matchedCount === 0) {
    return sendNotFound('Portfolio');
  }

  return sendData({ apiKey });
});
