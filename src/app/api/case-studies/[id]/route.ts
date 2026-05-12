import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { apiHandler, sendNotFound, DbUtils } from '@/lib/api-utils';
import {
  scopeQuery,
  portfolioPopulate,
  categoryPopulate,
} from '@/lib/db/portfolio-utils';
import { CollectionName, PublishStatus } from '@/schemas/cms';
import { queueNewsletterSend } from '@/lib/queues/newsletter-queue';

// GET SINGLE CASE STUDY
export const GET = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendNotFound('Case Study');
  }
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

  // Use aggregation to get populated details
  const projects = await mongoose.connection.db
    .collection(CollectionName.CASE_STUDIES)
    .aggregate([
      { $match: query },
      ...categoryPopulate(),
      ...portfolioPopulate(),
    ])
    .toArray();

  const project = projects[0];
  if (!project) return sendNotFound('Case Study');
  return NextResponse.json(project);
});

// UPDATE CASE STUDY
export const PATCH = apiHandler(async (request, { params }) => {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendNotFound('Case Study');
  }
  const body = await request.json();
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });

  // 1. Fetch current status to detect change
  const currentDoc = await mongoose.connection.db
    .collection(CollectionName.CASE_STUDIES)
    .findOne(query);

  if (!currentDoc) return sendNotFound('Case Study');

  // 2. Perform the update
  const result = await DbUtils.updateDoc(
    CollectionName.CASE_STUDIES,
    id,
    body,
    query
  );
  if (result.matchedCount === 0) return sendNotFound('Case Study');

  // 3. Trigger Newsletter if status changed to PUBLISHED
  const wasPublished = currentDoc.status === PublishStatus.PUBLISHED;
  const isPublished = body.status === PublishStatus.PUBLISHED;

  // Trigger Newsletter disabled for now since we are deploying on Vercel Free Tier without workers
  /*
  if (!wasPublished && isPublished) {
    try {
      await queueNewsletterSend({
        portfolioId: currentDoc.portfolio.toString(),
        contentId: id,
        contentType: 'case-study',
      });
      console.log(`[NEWSLETTER] Job queued for case study: ${id}`);
    } catch (err) {
      console.error('[NEWSLETTER] Failed to queue job:', err);
    }
  }
  */

  return NextResponse.json({ success: true });
});

// DELETE CASE STUDY
export const DELETE = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendNotFound('Case Study');
  }
  const query = await scopeQuery({ _id: new mongoose.Types.ObjectId(id) });
  const result = await DbUtils.deleteDoc(
    CollectionName.CASE_STUDIES,
    id,
    query
  );

  if (result.deletedCount === 0) return sendNotFound('Case Study');
  return NextResponse.json({ success: true });
});
