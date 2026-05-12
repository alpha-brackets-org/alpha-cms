import 'dotenv/config';
import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import dbConnect from '../lib/db/dbConnect';
import { redisConnection } from '../lib/redis';
import { NEWSLETTER_QUEUE_NAME } from '../lib/queues/newsletter-queue';
import {
  CollectionName,
  SubscriberStatus,
  Portfolio,
  Blog,
  CaseStudy,
} from '../types/cms';
import { sendNewsletterEmail } from '../lib/newsletter-engine';
import { ContentType } from '@/schemas/cms';

/**
 * STANDALONE NEWSLETTER WORKER
 * Processes background jobs for sending branded emails.
 */
async function startWorker() {
  console.log('🚀 [NEWSLETTER WORKER] Initializing...');

  try {
    await dbConnect();
    console.log('✅ [NEWSLETTER WORKER] Connected to MongoDB');
  } catch (err) {
    console.error('❌ [NEWSLETTER WORKER] MongoDB connection failed:', err);
    process.exit(1);
  }

  const worker = new Worker(
    NEWSLETTER_QUEUE_NAME,
    async (job) => {
      const { portfolioId, contentId, contentType } = job.data;

      console.log(
        `📦 [NEWSLETTER WORKER] Processing job: ${job.id} | ${contentType.toUpperCase()}: ${contentId}`
      );

      const db = mongoose.connection.db;

      // 1. Fetch Portfolio
      const portfolio = await db.collection(CollectionName.PORTFOLIOS).findOne({
        _id: new mongoose.Types.ObjectId(portfolioId as string),
      });
      if (!portfolio) throw new Error(`Portfolio not found: ${portfolioId}`);

      // 2. Fetch Content
      const contentCollection =
        contentType === ContentType.BLOG
          ? CollectionName.BLOGS
          : CollectionName.CASE_STUDIES;
      const content = await db.collection(contentCollection).findOne({
        _id: new mongoose.Types.ObjectId(contentId as string),
      });
      if (!content) throw new Error(`${contentType} not found: ${contentId}`);

      // 3. Fetch Active Subscribers
      const subscribers = await db
        .collection(CollectionName.SUBSCRIBERS)
        .find({
          portfolio: new mongoose.Types.ObjectId(portfolioId as string),
          status: SubscriberStatus.ACTIVE,
        })
        .toArray();

      console.log(
        `📧 [NEWSLETTER WORKER] Broadcasting to ${subscribers.length} subscribers for "${portfolio.name}"`
      );

      let successCount = 0;
      let failCount = 0;

      // 4. Broadcast Loop
      for (const sub of subscribers) {
        try {
          await sendNewsletterEmail({
            to: sub.email,
            portfolio: portfolio as unknown as Portfolio,
            content: content as unknown as Blog | CaseStudy,
            contentType,
          });
          successCount++;
        } catch (err) {
          console.error(
            `❌ [NEWSLETTER WORKER] Delivery failed to ${sub.email}:`,
            err
          );
          failCount++;
        }
      }

      console.log(
        `✨ [NEWSLETTER WORKER] Job ${job.id} completed. [Success: ${successCount} | Failed: ${failCount}]`
      );
      return { successCount, failCount };
    },
    {
      connection: redisConnection,
      concurrency: 1, // Stay safe with SMTP limits
    }
  );

  worker.on('failed', (job, err) => {
    console.error(
      `⚠️ [NEWSLETTER WORKER] Job ${job?.id} failed after all attempts:`,
      err.message
    );
  });

  worker.on('error', (err) => {
    console.error('🚨 [NEWSLETTER WORKER] Connection error:', err);
  });

  console.log('✅ [NEWSLETTER WORKER] Listening for jobs...');
}

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startWorker().catch((err) => {
  console.error('💀 [NEWSLETTER WORKER] Fatal error during startup:', err);
  process.exit(1);
});
