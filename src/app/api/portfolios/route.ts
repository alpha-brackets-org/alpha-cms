import {
  apiHandler,
  DbUtils,
  sendData,
  getCurrentUser,
  sendForbidden,
} from '@/lib/api-utils';
import { getDb } from '@/lib/db/dbConnect';
import { getAssignedPortfolioObjectIds } from '@/lib/db/portfolio-utils';
import { encrypt } from '@/lib/encryption';
import { CollectionName, UserRole, PortfolioSchema } from '@/schemas/cms';
import { MongoQuery } from '@/types/cms';

export const GET = apiHandler(async () => {
  const user = await getCurrentUser();
  const query: MongoQuery = {};

  // If not admin, only show assigned portfolios — one tenant-isolation
  // code path shared with scopeQuery(), keyed on `_id` since this IS the
  // Portfolios collection (scopeQuery itself filters other collections on `portfolio`).
  if (user?.role !== UserRole.ADMIN) {
    query._id = { $in: getAssignedPortfolioObjectIds(user) };
  }

  const portfolios = await getDb()
    .collection(CollectionName.PORTFOLIOS)
    .find(query)
    .sort({ name: 1 })
    .toArray();

  return sendData(portfolios);
});

export const POST = apiHandler(
  async (_request, { validatedData }) => {
    const user = await getCurrentUser();

    // Access Control: ONLY ADMINS can create portfolios
    if (user?.role !== UserRole.ADMIN) {
      return sendForbidden('Only system administrators can create portfolios');
    }

    // Encrypt SMTP Password if present
    if (validatedData!.smtpConfig?.pass) {
      validatedData!.smtpConfig.pass = encrypt(validatedData!.smtpConfig.pass);
    }

    const result = await DbUtils.createDoc(
      CollectionName.PORTFOLIOS,
      validatedData!
    );
    const created = await DbUtils.findDoc(
      CollectionName.PORTFOLIOS,
      result.insertedId.toString()
    );

    return sendData(created, 201);
  },
  { schema: PortfolioSchema }
);
