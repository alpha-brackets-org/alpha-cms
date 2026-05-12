import { Queue } from 'bullmq';
import { redisConnection } from '../redis';

// Define the name of our queue
export const NEWSLETTER_QUEUE_NAME = 'newsletter-queue';

// Create a singleton instance of the queue
let newsletterQueue: Queue | undefined;

export function getNewsletterQueue() {
  if (!newsletterQueue) {
    newsletterQueue = new Queue(NEWSLETTER_QUEUE_NAME, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000 * 60, // Start with 1 minute delay
        },
        removeOnComplete: true, // Keep it clean
        removeOnFail: false, // Keep failed jobs for debugging
      },
    });
  }
  return newsletterQueue;
}

/**
 * Add a newsletter job to the queue
 */
export async function queueNewsletterSend(data: {
  portfolioId: string;
  contentId: string;
  contentType: 'blog' | 'case-study';
}) {
  const queue = getNewsletterQueue();
  return await queue.add('send-newsletter', data);
}
