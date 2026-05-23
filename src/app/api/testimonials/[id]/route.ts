import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { apiHandler, sendNotFound, DbUtils } from '@/lib/api-utils';
import { scopeQuery, portfolioPopulate } from '@/lib/db/portfolio-utils';
import { CollectionName } from '@/types/cms';
import { TestimonialSchema } from '@/schemas/cms';

// ─── GET SINGLE TESTIMONIAL ───────────────────────────────────────────────────
export const GET = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendNotFound('Testimonial');
  }
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

  const results = await mongoose.connection.db
    .collection(CollectionName.TESTIMONIALS)
    .aggregate([{ $match: query }, ...portfolioPopulate()])
    .toArray();

  const testimonial = results[0];
  if (!testimonial) return sendNotFound('Testimonial');
  return NextResponse.json(testimonial);
});

// ─── UPDATE TESTIMONIAL ───────────────────────────────────────────────────────
export const PATCH = apiHandler(
  async (_request, { params, validatedData }) => {
    const { id } = await params;
    const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

    // DbUtils.updateDoc automatically sets updatedAt — no need to pass it manually
    const result = await DbUtils.updateDoc(
      CollectionName.TESTIMONIALS,
      id,
      validatedData,
      query
    );
    if (result.matchedCount === 0) return sendNotFound('Testimonial');

    return NextResponse.json({ success: true });
  },
  { schema: TestimonialSchema.partial() }
);

// ─── DELETE TESTIMONIAL ───────────────────────────────────────────────────────
export const DELETE = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendNotFound('Testimonial');
  }
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });
  const result = await DbUtils.deleteDoc(CollectionName.TESTIMONIALS, id, query);

  if (result.deletedCount === 0) return sendNotFound('Testimonial');
  return NextResponse.json({ success: true });
});
