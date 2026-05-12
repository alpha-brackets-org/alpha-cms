import { NextResponse } from 'next/server';
import {
  apiHandler,
  sendError,
  getCurrentUser,
  parseSearchParams,
} from '@/lib/api-utils';
import { CollectionName } from '@/schemas/cms';
import mongoose from 'mongoose';
import { scopeQuery } from '@/lib/db/portfolio-utils';

export const GET = apiHandler(async (request) => {
  const user = await getCurrentUser();
  if (!user) return sendError('Unauthorized', 401);

  const db = mongoose.connection.db;
  const { portfolio } = parseSearchParams(request);

  // Apply multi-tenant scoping
  const query = await scopeQuery({}, portfolio);

  const leads = await db
    .collection(CollectionName.LEADS)
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  if (leads.length === 0) {
    return sendError('No leads found to export', 404);
  }

  // Generate CSV
  const headers = [
    'Date',
    'First Name',
    'Last Name',
    'Email',
    'Company',
    'Job Title',
    'Phone',
    'Source',
    'Status',
    'Downloaded Items',
  ];

  const rows = leads.map((lead) => [
    lead.createdAt,
    lead.firstName,
    lead.lastName,
    lead.email,
    lead.company,
    lead.jobTitle,
    lead.phone,
    lead.source,
    lead.status,
    (lead.downloadedItems || []).join('; '),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=leads-export-${new Date().toISOString().split('T')[0]}.csv`,
    },
  });
});
