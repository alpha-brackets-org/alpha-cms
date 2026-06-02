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
 * Protected by HTTP Basic Auth — set MONITOR_USER and MONITOR_PASS in .env
 */

const MONITOR_USER = process.env.MONITOR_USER;
const MONITOR_PASS = process.env.MONITOR_PASS;

if (!MONITOR_USER || !MONITOR_PASS) {
  console.error(
    '❌ [MONITOR] MONITOR_USER and MONITOR_PASS must be set. ' +
    'Refusing to start an unprotected dashboard.'
  );
  process.exit(1);
}

function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const base64 = authHeader.startsWith('Basic ')
    ? Buffer.from(authHeader.slice(6), 'base64').toString()
    : '';
  const [user, pass] = base64.split(':');

  if (user === MONITOR_USER && pass === MONITOR_PASS) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="Queue Monitor"');
  res.status(401).send('Authentication required');
}

async function startMonitor() {
  const app = express();
  const port = process.env.MONITOR_PORT || 3002;
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  console.log('🔍 [MONITOR] Initializing Bull Board...');

  const redisConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  redisConnection.on('error', (err) => {
    console.error('[MONITOR] Redis error:', err.message);
  });

  const newsletterQueue = new Queue('newsletter-queue', {
    connection: redisConnection,
  });

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(newsletterQueue)],
    serverAdapter: serverAdapter,
  });

  // Apply basic auth before mounting the dashboard
  app.use('/admin/queues', basicAuth, serverAdapter.getRouter());

  app.listen(port, '127.0.0.1', () => {
    console.log(
      `✅ [MONITOR] Dashboard running at http://127.0.0.1:${port}/admin/queues`
    );
    console.log(`🔒 [MONITOR] Protected by HTTP Basic Auth (user: ${MONITOR_USER})`);
  });
}

startMonitor().catch((err) => {
  console.error('💀 [MONITOR] Fatal error:', err);
  process.exit(1);
});
