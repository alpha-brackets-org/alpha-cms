import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { apiHandler, sendNotFound, DbUtils } from '@/lib/api-utils';
import {
  scopeQuery,
  portfolioPopulate,
  categoryPopulate,
} from '@/lib/db/portfolio-utils';
import { CollectionName } from '@/types/cms';
import { BlogSchema } from '@/schemas/cms';

// GET SINGLE BLOG
export const GET = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendNotFound('Blog');
  }
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

  // Use aggregation with utilities to get populated details
  const blogs = await mongoose.connection.db
    .collection(CollectionName.BLOGS)
    .aggregate([
      { $match: query },
      ...categoryPopulate(),
      ...portfolioPopulate(),
    ])
    .toArray();

  const blog = blogs[0];
  if (!blog) return sendNotFound('Blog');
  return NextResponse.json(blog);
});

// UPDATE BLOG
export const PATCH = apiHandler(
  async (_request, { params, validatedData }) => {
    const { id } = await params;
    const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

    // 1. Fetch current status to detect change
    const currentDoc = await mongoose.connection.db
      .collection(CollectionName.BLOGS)
      .findOne(query);

    if (!currentDoc) return sendNotFound('Blog');

    // 2. Perform the update
    const result = await DbUtils.updateDoc(
      CollectionName.BLOGS,
      id,
      validatedData,
      query
    );
    if (result.matchedCount === 0) return sendNotFound('Blog');

    // 3. Trigger Newsletter if status changed to PUBLISHED
    // const wasPublished = currentDoc.status === PublishStatus.PUBLISHED;
    // const isPublished = validatedData?.status === PublishStatus.PUBLISHED;

    // Trigger Newsletter disabled for now since we are deploying on Vercel Free Tier without workers
    /*
  if (!wasPublished && isPublished) {
    try {
      await queueNewsletterSend({
        portfolioId: currentDoc.portfolio.toString(),
        contentId: id,
        contentType: 'blog',
      });
      console.log(`[NEWSLETTER] Job queued for blog: ${id}`);
    } catch (err) {
      console.error('[NEWSLETTER] Failed to queue job:', err);
      // We don't fail the request if the newsletter queue fails
    }
  }
  */

    return NextResponse.json({ success: true });
  },
  { schema: BlogSchema.partial() }
);

// DELETE BLOG
export const DELETE = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendNotFound('Blog');
  }
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });
  const result = await DbUtils.deleteDoc(CollectionName.BLOGS, id, query);

  if (result.deletedCount === 0) return sendNotFound('Blog');
  return NextResponse.json({ success: true });
});
