import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getDb } from '@/lib/db/dbConnect';
import {
  apiHandler,
  DbUtils,
  getCurrentUser,
  sendForbidden,
  sendData,
  sendNotFound,
} from '@/lib/api-utils';
import { UserRole, UserSchema } from '@/schemas/cms';

export const PATCH = apiHandler(
  async (_req, { params, validatedData }) => {
    const user = await getCurrentUser();
    if (user?.role !== UserRole.ADMIN) {
      return sendForbidden(
        'Only administrators can update operator credentials'
      );
    }

    const { id } = await params;

    // Security Protocol: Check for email collision if email is being updated
    if (validatedData?.email) {
      const collision = await getDb()
        .collection('users')
        .findOne({
          email: validatedData.email,
          _id: { $ne: new mongoose.Types.ObjectId(id as string) },
        });

      if (collision) {
        return NextResponse.json(
          {
            error:
              'Collision detected: Email identity belongs to another operator',
          },
          { status: 409 }
        );
      }
    }

    await DbUtils.updateDoc('users', id, validatedData!);

    const updated = await DbUtils.findDoc('users', id);
    const {
      salt,
      hash,
      sessions,
      loginAttempts,
      password,
      ...sanitizedUpdated
    } = (updated as Record<string, unknown>) || {};

    return sendData(sanitizedUpdated);
  },
  { schema: UserSchema.partial() }
);

export const DELETE = apiHandler(async (req, { params }) => {
  const user = await getCurrentUser();
  if (user?.role !== UserRole.ADMIN) {
    return sendForbidden('Only administrators can remove operators');
  }

  const { id } = await params;

  const result = await DbUtils.deleteDoc('users', id);

  if (result.deletedCount === 0) {
    return sendNotFound('User');
  }

  return sendData({ id });
});
