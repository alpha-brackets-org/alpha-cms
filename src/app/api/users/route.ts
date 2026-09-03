import { NextResponse } from 'next/server';
import {
  apiHandler,
  DbUtils,
  getCurrentUser,
  sendForbidden,
  sendData,
} from '@/lib/api-utils';
import { getDb } from '@/lib/db/dbConnect';
import { hashPassword, generateRandomPassword } from '@/lib/password-utils';
import { sendOperatorInvite } from '@/lib/email';
import { UserRole, UserSchema } from '@/schemas/cms';

export const GET = apiHandler(async () => {
  const user = await getCurrentUser();
  if (user?.role !== UserRole.ADMIN) {
    return sendForbidden('Only administrators can view the operator directory');
  }

  const users = await getDb().collection('users').find({}).toArray();

  // Sanitize sensitive fields
  const sanitized = users.map(
    ({
      salt,
      hash,
      sessions,
      loginAttempts,
      password,
      resetToken,
      resetTokenExpiry,
      ...u
    }) => u
  );

  return sendData(sanitized);
});

export const POST = apiHandler(
  async (_req, { validatedData }) => {
    const user = await getCurrentUser();
    if (user?.role !== UserRole.ADMIN) {
      return sendForbidden('Only administrators can authorize new operators');
    }

    // Security Protocol: Check for existing operator to prevent duplicates
    const existingUser = await getDb()
      .collection('users')
      .findOne({ email: validatedData!.email });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Operator already registered with this email identity' },
        { status: 409 }
      );
    }

    // Security Protocol: Generate random temporary password
    const tempPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(tempPassword);

    let res;
    try {
      res = await DbUtils.createDoc('users', {
        ...validatedData,
        password: hashedPassword,
      });
    } catch (err) {
      if (err instanceof Error && 'code' in err && err.code === 11000) {
        return NextResponse.json(
          { error: 'Operator already registered with this email identity' },
          { status: 409 }
        );
      }
      throw err;
    }

    // Security Protocol: Transmit credentials to operator
    await sendOperatorInvite(
      validatedData!.email,
      validatedData!.role,
      tempPassword
    );

    const created = await DbUtils.findDoc('users', res.insertedId.toString());
    const {
      salt,
      hash,
      sessions,
      loginAttempts,
      password,
      resetToken,
      resetTokenExpiry,
      ...sanitizedCreated
    } = (created as Record<string, unknown>) || {};

    return sendData(sanitizedCreated, 201);
  },
  { schema: UserSchema }
);
