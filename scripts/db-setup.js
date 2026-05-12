/**
 * ALPHA CMS - MASTER DATABASE SETUP
 * Consolidates indexing, cleanup, and seeding into a single utility.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const { promisify } = require('util');
const path = require('path');
const scryptAsync = promisify(crypto.scrypt);

// Load environment variables from .env.local
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const UserRole = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${salt}:${buf.toString('hex')}`;
}

async function runSetup() {
  const dbUri =
    process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/alpha-cms';
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  console.log('\n🚀 [DB-SETUP] Initializing Alpha CMS Database...');

  try {
    await mongoose.connect(dbUri);
    const db = mongoose.connection.db;
    console.log(`✅ Connected to MongoDB: ${dbUri}\n`);

    // --- 1. INDEXING ENGINE ---
    const collectionsToProcess = [
      { name: 'blogs', uniqueSlug: true },
      { name: 'case-studies', uniqueSlug: true },
      { name: 'projects', uniqueSlug: true },
      { name: 'categories', uniqueSlug: true },
    ];

    for (const colDef of collectionsToProcess) {
      console.log(`📦 Setting up indexes for [${colDef.name}]...`);
      const col = db.collection(colDef.name);

      // Clear old legacy indexes if they exist
      const collections = await db
        .listCollections({ name: colDef.name })
        .toArray();
      if (collections.length > 0) {
        const existingIndexes = await col.indexes();
        if (existingIndexes.find((i) => i.name === 'slug_1')) {
          await col.dropIndex('slug_1');
          console.log(`   - Dropped legacy global slug index`);
        }
      }

      // Portfolio Scoping Index (Crucial for performance)
      await col.createIndex({ portfolio: 1 });

      // Unique Slug per Portfolio
      if (colDef.uniqueSlug) {
        await col.createIndex({ portfolio: 1, slug: 1 }, { unique: true });
        console.log(`   - Created unique index: { portfolio: 1, slug: 1 }`);
      }
    }

    // Special Handling: Subscribers
    console.log(`📦 Setting up indexes for [subscribers]...`);
    const subCol = db.collection('subscribers');
    await subCol.createIndex({ portfolio: 1 });
    await subCol.createIndex({ email: 1, portfolio: 1 }, { unique: true });
    await subCol.createIndex({ status: 1 });
    console.log(`   - Created unique index: { email: 1, portfolio: 1 }`);

    // Special Handling: Leads
    console.log(`📦 Setting up indexes for [leads]...`);
    const leadCol = db.collection('leads');
    await leadCol.createIndex({ portfolio: 1 });
    await leadCol.createIndex({ status: 1 });
    await leadCol.createIndex({ email: 1 });
    console.log(`   - Created performance indexes for leads`);

    console.log('\n✨ Indexing Migration Complete.\n');

    // --- 2. DATABASE HYGIENE ---
    console.log('🧹 Running Database Hygiene (Cleanup)...');
    const orphanedCats = await db.collection('categories').deleteMany({
      portfolio: null,
      isDefault: { $ne: true },
    });
    if (orphanedCats.deletedCount > 0) {
      console.log(
        `   - Deleted ${orphanedCats.deletedCount} orphaned categories.`
      );
    } else {
      console.log('   - No orphaned data found.');
    }

    // --- 3. ADMIN SEEDING ---
    if (adminEmail && adminPassword) {
      console.log('\n👤 Seeding Admin User...');
      const hash = await hashPassword(adminPassword);

      await db.collection('users').updateOne(
        { email: adminEmail },
        {
          $set: {
            password: hash,
            role: UserRole.ADMIN,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
      console.log(`   - Admin [${adminEmail}] is active and authorized.`);
    } else {
      console.log(
        '\n⚠️ Skip Seeding: ADMIN_EMAIL or ADMIN_PASSWORD missing in .env.local'
      );
    }

    console.log('\n🏁 [DB-SETUP] All tasks completed successfully.\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ [DB-SETUP] FATAL ERROR:', err);
    process.exit(1);
  }
}

runSetup();
