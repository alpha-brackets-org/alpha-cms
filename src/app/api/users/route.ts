import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { apiHandler, getCurrentUser, sendForbidden } from '@/lib/api-utils';
import { hashPassword, generateRandomPassword } from '@/lib/auth-utils';
import { sendOperatorInvite } from '@/lib/email';
import { UserRole } from '@/schemas/cms';

export const GET = apiHandler(async () => {
  const user = await getCurrentUser();
  if (user?.role !== UserRole.ADMIN) {
    return sendForbidden('Only administrators can view the operator directory');
  }

  const users = await mongoose.connection.db
    .collection('users')
    .find({})
    .toArray();

  // Sanitize sensitive fields
  const sanitized = users.map(
    ({ salt, hash, sessions, loginAttempts, password, ...u }) => u
  );

  return NextResponse.json(sanitized);
});

export const POST = apiHandler(async (req) => {
  const user = await getCurrentUser();
  if (user?.role !== UserRole.ADMIN) {
    return sendForbidden('Only administrators can authorize new operators');
  }

  const body = await req.json();

  // Security Protocol: Check for existing operator to prevent duplicates
  const existingUser = await mongoose.connection.db
    .collection('users')
    .findOne({ email: body.email });

  if (existingUser) {
    return NextResponse.json(
      { error: 'Operator already registered with this email identity' },
      { status: 409 }
    );
  }

  // Security Protocol: Generate random temporary password
  const tempPassword = generateRandomPassword();
  const hashedPassword = await hashPassword(tempPassword);

  const res = await mongoose.connection.db.collection('users').insertOne({
    ...body,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Security Protocol: Transmit credentials to operator
  await sendOperatorInvite(body.email, body.role, tempPassword);

  return NextResponse.json({ id: res.insertedId }, { status: 201 });
});
