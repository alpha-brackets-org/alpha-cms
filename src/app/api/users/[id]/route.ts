import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import {
  apiHandler,
  DbUtils,
  getCurrentUser,
  sendForbidden,
} from '@/lib/api-utils';
import { UserRole } from '@/schemas/cms';

export const PATCH = apiHandler(async (req, { params }) => {
  const user = await getCurrentUser();
  if (user?.role !== UserRole.ADMIN) {
    return sendForbidden('Only administrators can update operator credentials');
  }

  const { id } = await params;

  const body = await req.json();

  // Security Protocol: Check for email collision if email is being updated
  if (body.email) {
    const collision = await mongoose.connection.db.collection('users').findOne({
      email: body.email,
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

  await DbUtils.updateDoc('users', id, body);

  return NextResponse.json({ success: true });
});

export const DELETE = apiHandler(async (req, { params }) => {
  const user = await getCurrentUser();
  if (user?.role !== UserRole.ADMIN) {
    return sendForbidden('Only administrators can remove operators');
  }

  const { id } = await params;

  await mongoose.connection.db
    .collection('users')
    .deleteOne({ _id: new mongoose.Types.ObjectId(id as string) });

  return NextResponse.json({ success: true });
});
