import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { apiHandler } from '@/lib/api-utils';
import { hashPassword, comparePassword } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export const POST = apiHandler(async (req) => {
  const { currentPassword, newPassword } = await req.json();
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const user = await mongoose.connection.db.collection('users').findOne({
    _id: new mongoose.Types.ObjectId(token),
  });

  if (!user) {
    return NextResponse.json({ error: 'USER NOT FOUND' }, { status: 404 });
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
      { _id: user._id },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

  return NextResponse.json({ success: true, message: 'PASSWORD UPDATED' });
});
