import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { apiHandler, sendNotFound, DbUtils } from '@/lib/api-utils';
import { scopeQuery, portfolioPopulate } from '@/lib/db/portfolio-utils';
import { CollectionName } from '@/types/cms';

// GET SINGLE FAQ
export const GET = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendNotFound('FAQ');
  }
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

  const faqs = await mongoose.connection.db
    .collection(CollectionName.FAQS)
    .aggregate([{ $match: query }, ...portfolioPopulate()])
    .toArray();

  const faq = faqs[0];
  if (!faq) return sendNotFound('FAQ');
  return NextResponse.json(faq);
});

// UPDATE FAQ
export const PATCH = apiHandler(async (request, { params }) => {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendNotFound('FAQ');
  }
  const body = await request.json();
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

  const result = await DbUtils.updateDoc(CollectionName.FAQS, id, body, query);
  if (result.matchedCount === 0) return sendNotFound('FAQ');

  return NextResponse.json({ success: true });
});

// DELETE FAQ
export const DELETE = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendNotFound('FAQ');
  }
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });
  const result = await DbUtils.deleteDoc(CollectionName.FAQS, id, query);

  if (result.deletedCount === 0) return sendNotFound('FAQ');
  return NextResponse.json({ success: true });
});
