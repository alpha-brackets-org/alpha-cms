import mongoose from 'mongoose';
import {
  apiHandler,
  getCurrentUser,
  sendError,
  sendData,
} from '@/lib/api-utils';
import { hashPassword, comparePassword } from '@/lib/password-utils';
import { getDb } from '@/lib/db/dbConnect';
import { ChangePasswordSchema } from '@/schemas/cms';

export const POST = apiHandler(
  async (_req, { validatedData }) => {
    const { currentPassword, newPassword } = validatedData!;
    const user = await getCurrentUser();

    if (!user || !user.password) {
      return sendError('UNAUTHORIZED', 401);
    }

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      return sendError('INCORRECT CURRENT PASSWORD', 400);
    }

    const hashedPassword = await hashPassword(newPassword);

    await getDb()
      .collection('users')
      .updateOne(
        { _id: new mongoose.Types.ObjectId(user._id as string) },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      );

    return sendData({ message: 'PASSWORD UPDATED' });
  },
  { schema: ChangePasswordSchema }
);
