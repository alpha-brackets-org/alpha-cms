const express = require('express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * STANDALONE QUEUE MONITOR
 * Runs on a separate port to avoid Next.js bundling issues.
 */
async function startMonitor() {
  const app = express();
  const port = process.env.MONITOR_PORT || 3002;
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  console.log('🔍 [MONITOR] Initializing Bull Board...');

  const redisConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  // Define the queues to monitor
  const newsletterQueue = new Queue('newsletter-queue', {
    connection: redisConnection,
  });

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(newsletterQueue)],
    serverAdapter: serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  app.listen(port, () => {
    console.log(
      `✅ [MONITOR] Dashboard running at http://localhost:${port}/admin/queues`
    );
  });
}

startMonitor().catch((err) => {
  console.error('💀 [MONITOR] Fatal error:', err);
  process.exit(1);
});
