import mongoose from 'mongoose';
import {
  apiHandler,
  parseSearchParams,
  sendSuccess,
  getCurrentUser,
  sendError,
} from '@/lib/api-utils';
import { scopeQuery } from '@/lib/db/portfolio-utils';
import { CollectionName } from '@/schemas/cms';

export const GET = apiHandler(async (request) => {
  const user = await getCurrentUser();
  if (!user) {
    return sendError('AUTHENTICATION REQUIRED', 401);
  }

  const { portfolio } = parseSearchParams(request);
  const query = await scopeQuery({}, portfolio);
  const db = mongoose.connection.db;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    blogsTotal,
    blogsNew,
    projectsTotal,
    mediaTotal,
    mediaStorage,
    portfoliosTotal,
    categoriesTotal,
    usersTotal,
    analyticsTotal,
    campaignsTotal,
  ] = await Promise.all([
    db.collection(CollectionName.BLOGS).countDocuments(query),
    db.collection(CollectionName.BLOGS).countDocuments({
      ...query,
      createdAt: { $gte: sevenDaysAgo.toISOString() },
    }),
    db.collection(CollectionName.CASE_STUDIES).countDocuments(query),
    db.collection(CollectionName.MEDIA).countDocuments(query),
    db
      .collection(CollectionName.MEDIA)
      .aggregate([
        { $match: query },
        { $group: { _id: null, totalSize: { $sum: '$filesize' } } },
      ])
      .toArray(),
    db
      .collection(CollectionName.PORTFOLIOS)
      .countDocuments(
        query.portfolio ? { _id: query.portfolio } : query._id ? query._id : {}
      ),
    db.collection(CollectionName.CATEGORIES).countDocuments(query),
    db.collection(CollectionName.USERS).countDocuments(), // System users are global
    db.collection(CollectionName.ANALYTICS).countDocuments(query),
    db.collection(CollectionName.CAMPAIGNS).countDocuments(query),
  ]);

  const totalSizeInBytes = mediaStorage[0]?.totalSize || 0;
  const totalSizeInMB = (totalSizeInBytes / (1024 * 1024)).toFixed(1);

  // Traffic Aggregation
  const trafficStats = await db
    .collection(CollectionName.ANALYTICS)
    .aggregate([
      { $match: query },
      {
        $group: {
          _id: '$visitorId',
          eventCount: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
        },
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          avgDuration: { $avg: '$totalDuration' },
          bouncedSessions: {
            $sum: { $cond: [{ $eq: ['$eventCount', 1] }, 1, 0] },
          },
        },
      },
    ])
    .toArray();

  const traffic = trafficStats[0] || {
    totalSessions: 0,
    avgDuration: 0,
    bouncedSessions: 0,
  };
  const bounceRate = traffic.totalSessions
    ? ((traffic.bouncedSessions / traffic.totalSessions) * 100).toFixed(1)
    : 0;

  // Fetch breakdown per portfolio including visitors
  const portfolioBreakdown = await db
    .collection(CollectionName.PORTFOLIOS)
    .aggregate([
      {
        $match: query.portfolio
          ? { _id: query.portfolio }
          : query._id
            ? query._id
            : {},
      },
      {
        $lookup: {
          from: CollectionName.BLOGS,
          localField: '_id',
          foreignField: 'portfolio',
          as: 'blogs',
        },
      },
      {
        $lookup: {
          from: CollectionName.CASE_STUDIES,
          localField: '_id',
          foreignField: 'portfolio',
          as: 'projects',
        },
      },
      {
        $lookup: {
          from: CollectionName.ANALYTICS,
          localField: '_id',
          foreignField: 'portfolio',
          as: 'visitors',
        },
      },
      {
        $project: {
          name: 1,
          blogCount: { $size: '$blogs' },
          projectCount: { $size: '$projects' },
          visitorCount: { $size: { $setUnion: ['$visitors.visitorId'] } }, // Unique visitors
        },
      },
    ])
    .toArray();

  // Lead Growth (Dynamic Timeframe)
  const url = new URL(request.url);
  const monthsParam = url.searchParams.get('months');
  const monthsNum = parseInt(monthsParam, 10);

  const timeLimit = new Date();
  timeLimit.setMonth(timeLimit.getMonth() - monthsNum);

  const leadsMonthly = await db
    .collection(CollectionName.LEADS)
    .aggregate([
      { $match: { ...query, createdAt: { $gte: timeLimit.toISOString() } } },
      {
        $group: {
          _id: { $substr: ['$createdAt', 0, 7] }, // YYYY-MM
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  const totalVisitors = portfolioBreakdown.reduce(
    (acc, curr) => acc + (curr.visitorCount || 0),
    0
  );
  const totalLeadsCount = await db
    .collection(CollectionName.LEADS)
    .countDocuments(query);
  const conversionRate =
    totalVisitors > 0
      ? ((totalLeadsCount / totalVisitors) * 100).toFixed(2)
      : 0;

  return sendSuccess({
    blogs: blogsTotal,
    blogsTrend: `+${blogsNew} this week`,
    projects: projectsTotal,
    projectsTrend: 'Live Archive',
    media: mediaTotal,
    mediaTrend: `${totalSizeInMB} MB Used`,
    portfolios: portfoliosTotal,
    portfoliosTrend: 'Active Clusters',
    categories: categoriesTotal,
    users: usersTotal,
    campaigns: campaignsTotal,
    analytics: analyticsTotal,
    breakdown: portfolioBreakdown,
    totalVisitors,
    totalLeads: totalLeadsCount,
    conversionRate,
    traffic: {
      totalSessions: traffic.totalSessions,
      averageDuration: Math.round(traffic.avgDuration || 0),
      bounceRate: Number(bounceRate),
    },
    leadsMonthly: leadsMonthly.map((l) => ({
      month: l._id,
      count: l.count,
    })),
  });
});
