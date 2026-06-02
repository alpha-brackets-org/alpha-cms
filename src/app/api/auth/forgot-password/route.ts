import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { apiHandler, sendError } from '@/lib/api-utils';
import { randomBytes } from 'crypto';
import { sendPasswordReset } from '@/lib/email';
import { getRedisInstance } from '@/lib/redis';

// Rate limit: 3 attempts per IP per 15 minutes
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW = 15 * 60;

async function checkRateLimit(ip: string): Promise<boolean> {
  try {
    const redis = getRedisInstance();
    const key = `rate:forgot-password:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, RATE_LIMIT_WINDOW);
    return count > RATE_LIMIT_MAX;
  } catch {
    return false;
  }
}

export const POST = apiHandler(
  async (req) => {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';

    if (await checkRateLimit(ip)) {
      return sendError('TOO MANY ATTEMPTS — try again in 15 minutes', 429);
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'EMAIL REQUIRED' }, { status: 400 });
    }

    const user = await mongoose.connection.db
      .collection('users')
      .findOne({ email: email.toLowerCase().trim() });

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
      { $set: { resetToken, resetTokenExpiry: expiry, updatedAt: new Date() } }
    );

    await sendPasswordReset(email, resetToken);

    return NextResponse.json({
      success: true,
      message: 'If the email exists, a reset link will be sent.',
    });
  },
  { isPublic: true }
);
