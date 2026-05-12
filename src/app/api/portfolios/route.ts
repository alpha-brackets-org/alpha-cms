import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import {
  apiHandler,
  DbUtils,
  sendSuccess,
  getCurrentUser,
  sendForbidden,
  sendBadRequest,
} from '@/lib/api-utils';
import { encrypt } from '@/lib/encryption';
import { CollectionName, UserRole, PortfolioSchema } from '@/schemas/cms';
import { z } from 'zod';
import { MongoQuery } from '@/types/cms';

export const GET = apiHandler(async () => {
  const user = await getCurrentUser();
  const query: MongoQuery = {};

  // If not admin, only show assigned portfolios
  if (user?.role !== UserRole.ADMIN) {
    const assignedPortfolios = user?.portfolios || [];
    query._id = {
      $in: assignedPortfolios.map(
        (id) => new mongoose.Types.ObjectId(id as string)
      ),
    };
  }

  const portfolios = await mongoose.connection.db
    .collection(CollectionName.PORTFOLIOS)
    .find(query)
    .sort({ name: 1 })
    .toArray();

  return NextResponse.json(portfolios);
});

export const POST = apiHandler(async (request) => {
  const user = await getCurrentUser();
  const body = await request.json();

  // Access Control: ONLY ADMINS can create portfolios
  if (user?.role !== UserRole.ADMIN) {
    return sendForbidden('Only system administrators can create portfolios');
  }

  const validatedData = PortfolioSchema.parse(body);

  // Encrypt SMTP Password if present
  if (validatedData.smtpConfig?.pass) {
    validatedData.smtpConfig.pass = encrypt(validatedData.smtpConfig.pass);
  }

  const result = await DbUtils.createDoc(
    CollectionName.PORTFOLIOS,
    validatedData
  );

  return sendSuccess({ id: result.insertedId }, 201);
});
