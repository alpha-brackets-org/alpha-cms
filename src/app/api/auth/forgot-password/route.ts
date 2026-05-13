import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { apiHandler } from '@/lib/api-utils';
import { randomBytes } from 'crypto';
import { sendPasswordReset } from '@/lib/email';

export const POST = apiHandler(
  async (req) => {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'EMAIL REQUIRED' }, { status: 400 });
    }

    const user = await mongoose.connection.db
      .collection('users')
      .findOne({ email });

    // Security: Do not reveal if user exists or not
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If the email exists, a reset link will be sent.',
      });
    }

    const resetToken = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await mongoose.connection.db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          resetToken,
          resetTokenExpiry: expiry,
          updatedAt: new Date(),
        },
      }
    );

    await sendPasswordReset(email, resetToken);

    return NextResponse.json({
      success: true,
      message: 'If the email exists, a reset link will be sent.',
    });
  },
  { isPublic: true }
);
