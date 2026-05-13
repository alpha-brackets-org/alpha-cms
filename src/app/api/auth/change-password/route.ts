import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { apiHandler, getCurrentUser } from '@/lib/api-utils';
import { hashPassword, comparePassword } from '@/lib/auth-utils';

export const POST = apiHandler(async (req) => {
  const { currentPassword, newPassword } = await req.json();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) {
    return NextResponse.json(
      { error: 'INCORRECT CURRENT PASSWORD' },
      { status: 400 }
    );
  }

  const hashedPassword = await hashPassword(newPassword);

  await mongoose.connection.db
    .collection('users')
    .updateOne(
      { _id: new mongoose.Types.ObjectId(user._id as string) },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

  return NextResponse.json({ success: true, message: 'PASSWORD UPDATED' });
});
