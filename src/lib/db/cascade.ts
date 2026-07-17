import mongoose, { ClientSession } from 'mongoose';

/**
 * Runs a multi-collection cascade delete inside a transaction when the
 * connection supports it (replica set / Atlas — used in production).
 *
 * Standalone MongoDB (the typical local-dev setup) doesn't support
 * transactions, so we fall back to running the same steps sequentially
 * without a session. In that fallback, a failure partway through can leave
 * orphaned data — this is a known limitation, documented in
 * DEVELOPMENT_GUIDE.md §7, so we log clearly which step failed rather than
 * failing silently.
 */
export async function runCascade<T>(
  fn: (session?: ClientSession) => Promise<T>,
  label: string
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result!;
  } catch (error) {
    const isTransactionsUnsupported =
      error instanceof Error &&
      /Transaction numbers are only allowed on a replica set member or mongos/i.test(
        error.message
      );

    if (!isTransactionsUnsupported) {
      console.error(`CASCADE_FAILED (transactional): ${label}`, error);
      throw error;
    }

    console.warn(
      `CASCADE_NON_TRANSACTIONAL: "${label}" — this MongoDB connection doesn't support transactions ` +
        '(standalone instance, not a replica set). Running sequentially without atomicity.'
    );

    try {
      return await fn();
    } catch (fallbackError) {
      console.error(
        `CASCADE_FAILED (non-transactional): ${label}`,
        fallbackError
      );
      throw fallbackError;
    }
  } finally {
    await session.endSession();
  }
}
