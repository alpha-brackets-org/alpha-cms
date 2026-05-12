import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { apiHandler } from '@/lib/api-utils';
import { comparePassword, signToken } from '@/lib/auth-utils';

export const POST = apiHandler(async (req) => {
  const { email, password } = await req.json();

  const user = await mongoose.connection.db
    .collection('users')
    .findOne({ email: { $regex: new RegExp('^' + email + '$', 'i') } });

  if (!user || !user.password) {
    return NextResponse.json({ error: 'IDENTITY NOT FOUND' }, { status: 401 });
  }

  const isValid = await comparePassword(password, user.password);

  if (!isValid) {
    return NextResponse.json({ error: 'INVALID ACCESS KEY' }, { status: 401 });
  }

  const token = await signToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  const response = NextResponse.json({
    success: true,
    user: {
      _id: user._id,
      email: user.email,
      role: user.role,
    },
  });

  response.cookies.set('alpha_auth_token', token, {
    path: '/',
    maxAge: 86400, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return response;
});
