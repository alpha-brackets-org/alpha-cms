import { apiHandler, sendError, sendData } from '@/lib/api-utils';
import { comparePassword, signToken } from '@/lib/auth-utils';
import { getDb } from '@/lib/db/dbConnect';

export const POST = apiHandler(
  async (req) => {
    const { email, password } = await req.json();

    if (typeof email !== 'string' || typeof password !== 'string') {
      return sendError('IDENTITY NOT FOUND', 401);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await getDb().collection('users').findOne({
      $expr: { $eq: [{ $toLower: '$email' }, normalizedEmail] },
    });

    if (!user || !user.password) {
      return sendError('IDENTITY NOT FOUND', 401);
    }

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      return sendError('INVALID ACCESS KEY', 401);
    }

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const response = sendData({
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
  },
  { isPublic: true }
);
