import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import { CollectionName, UserRole } from '@/schemas/cms';
import { getCurrentUser } from '@/lib/api-utils';

export async function getActivePortfolioId() {
  const cookieStore = await cookies();
  const portfolioCookie = cookieStore.get('alpha_active_portfolio');
  return portfolioCookie?.value || null;
}

export async function scopeQuery(
  baseQuery: Record<string, unknown> = {},
  explicitPortfolioId?: string | null
) {
  const user = await getCurrentUser();
  const portfolioId = explicitPortfolioId || (await getActivePortfolioId());

  // ADMINS can see everything unless they explicitly choose a portfolio
  if (user?.role === UserRole.ADMIN) {
    if (portfolioId) {
      try {
        return {
          ...baseQuery,
          portfolio: new mongoose.Types.ObjectId(portfolioId as string),
        };
      } catch (_) {
        return baseQuery;
      }
    }
    return baseQuery;
  }

  // Non-admins (Editors/Viewers) are restricted to their assigned portfolios
  const assignedPortfolios = user?.portfolios || [];

  if (portfolioId) {
    // If they picked a portfolio, verify they are assigned to it
    if (assignedPortfolios.includes(portfolioId)) {
      return {
        ...baseQuery,
        portfolio: new mongoose.Types.ObjectId(portfolioId as string),
      };
    }
    // Access Denied to this specific portfolio, fallback to any of their assigned ones
    return {
      ...baseQuery,
      portfolio: {
        $in: assignedPortfolios.map(
          (id) => new mongoose.Types.ObjectId(id as string)
        ),
      },
    };
  }

  // No specific portfolio chosen, show all assigned ones
  return {
    ...baseQuery,
    portfolio: {
      $in: assignedPortfolios.map(
        (id) => new mongoose.Types.ObjectId(id as string)
      ),
    },
  };
}

/**
 * Returns aggregation stages to populate portfolio details
 */
export const portfolioPopulate = () => [
  {
    $lookup: {
      from: CollectionName.PORTFOLIOS,
      localField: 'portfolio',
      foreignField: '_id',
      as: 'portfolioDetails',
    },
  },
  {
    $addFields: {
      portfolio: { $arrayElemAt: ['$portfolioDetails', 0] },
    },
  },
  { $project: { portfolioDetails: 0 } },
];

/**
 * Returns aggregation stages to populate category details
 */
export const categoryPopulate = () => [
  {
    $lookup: {
      from: CollectionName.CATEGORIES,
      let: { catId: '$category' },
      pipeline: [
        {
          $match: {
            $expr: {
              $or: [
                { $eq: ['$_id', '$$catId'] },
                { $eq: [{ $toString: '$_id' }, '$$catId'] },
              ],
            },
          },
        },
      ],
      as: 'categoryDetails',
    },
  },
  {
    $addFields: {
      category: {
        $ifNull: [
          { $arrayElemAt: ['$categoryDetails', 0] },
          {
            _id: 'default-uncategorized',
            name: 'Uncategorized',
            slug: 'uncategorized',
            isDefault: true,
          },
        ],
      },
    },
  },
  { $project: { categoryDetails: 0 } },
];
