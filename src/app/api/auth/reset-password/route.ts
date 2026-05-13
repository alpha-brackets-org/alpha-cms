import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { apiHandler } from '@/lib/api-utils';
import { hashPassword } from '@/lib/auth-utils';

export const POST = apiHandler(
  async (req) => {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'TOKEN AND PASSWORD REQUIRED' },
        { status: 400 }
      );
    }

    const user = await mongoose.connection.db.collection('users').findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'INVALID OR EXPIRED TOKEN' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await mongoose.connection.db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
        $unset: {
          resetToken: '',
          resetTokenExpiry: '',
        },
      }
    );

    return NextResponse.json({ success: true, message: 'PASSWORD RESTORED' });
  },
  { isPublic: true }
);
