import mongoose from 'mongoose';
import {
  apiHandler,
  sendData,
  sendError,
  corsOptions,
  sendCorsResponse,
} from '@/lib/api-utils';
import { CollectionName } from '@/schemas/cms';
import { MongoQuery } from '@/types/cms';
import { getDb } from '@/lib/db/dbConnect';

export async function OPTIONS() {
  return corsOptions();
}

/**
 * PUBLIC PORTFOLIO CONFIG ENDPOINT
 * Used by external portfolio sites to fetch branding, scripts, and maintenance status.
 */
export const GET = apiHandler(
  async (request) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const domain = searchParams.get('domain');

    if (!id && !domain) {
      return sendError('Portfolio ID or Domain is required', 400);
    }

    const db = getDb();
    const query: MongoQuery = {};

    if (id) {
      try {
        query._id = new mongoose.Types.ObjectId(id);
      } catch {
        return sendError('Invalid Portfolio ID', 400);
      }
    } else if (domain) {
      // Strip http(s):// and www. if present in the requested domain just to be safe
      const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
      // Match the domain in the DB even if the DB has http://, https://, or www.
      query.domain = new RegExp(
        `^(https?:\\/\\/)?(www\\.)?${cleanDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/?$`,
        'i'
      );
    }

    const portfolio = await db
      .collection(CollectionName.PORTFOLIOS)
      .findOne(query);

    if (!portfolio) {
      return sendError('Portfolio not found', 404);
    }

    // Return ONLY public configuration (NO SMTP PASSWORDS)
    const publicConfig = {
      _id: portfolio._id,
      name: portfolio.name,
      domain: portfolio.domain,
      active: portfolio.active,
      maintenanceMode: portfolio.maintenanceMode || false,
      newsletterConfig: {
        accentColor: portfolio.newsletterConfig?.accentColor,
        logoUrl: portfolio.newsletterConfig?.logoUrl,
        senderName: portfolio.newsletterConfig?.senderName,
        footerText: portfolio.newsletterConfig?.footerText,
      },
      customScripts: portfolio.customScripts || { head: '', footer: '' },
      socialLinks: portfolio.socialLinks || {},
    };

    return sendCorsResponse(sendData(publicConfig));
  },
  { isPublic: true }
);
