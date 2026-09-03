import mongoose from 'mongoose';
import { hashPassword } from '@/lib/password-utils';
import { mockPortfolioData } from './test-data';

export function makeReq(
  url: string,
  method = 'GET',
  body?: unknown,
  headers?: Record<string, string>
) {
  return new Request(url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function clearCollections(db: mongoose.mongo.Db) {
  const collections = db.listCollections();
  const names = (await collections.toArray()).map((c) => c.name);
  for (const name of names) {
    await db.collection(name).deleteMany({});
  }
}

export async function seedDefaultPortfolio(
  db: mongoose.mongo.Db
): Promise<string> {
  const portfolioResult = await db.collection('portfolios').insertOne({
    ...mockPortfolioData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return portfolioResult.insertedId.toString();
}

export async function seedUser(
  db: mongoose.mongo.Db,
  email: string,
  passwordPlain: string,
  role: string,
  portfolios: string[]
): Promise<string> {
  const userId = new mongoose.Types.ObjectId();
  const hashedPassword = await hashPassword(passwordPlain);
  await db.collection('users').insertOne({
    _id: userId,
    email,
    password: hashedPassword,
    role,
    portfolios,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return userId.toString();
}
