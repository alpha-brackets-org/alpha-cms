import { apiHandler, sendError, sendData } from '@/lib/api-utils';
import { hashPassword } from '@/lib/password-utils';
import { getDb } from '@/lib/db/dbConnect';

export const POST = apiHandler(
  async (req) => {
    const { token, password } = await req.json();

    if (!token || !password) {
      return sendError('TOKEN AND PASSWORD REQUIRED', 400);
    }

    const user = await getDb()
      .collection('users')
      .findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: new Date() },
      });

    if (!user) {
      return sendError('INVALID OR EXPIRED TOKEN', 400);
    }

    const hashedPassword = await hashPassword(password);

    await getDb()
      .collection('users')
      .updateOne(
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

    return sendData({ message: 'PASSWORD RESTORED' });
  },
  { isPublic: true }
);
