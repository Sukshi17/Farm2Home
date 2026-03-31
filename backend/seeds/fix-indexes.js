/**
 * Fix stale indexes in the users collection.
 * Drops any old indexes that reference fields no longer in the schema
 * (e.g., "phone_1" from a previous schema version).
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farm2home';

async function fixIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // List all current indexes
    const indexes = await usersCollection.indexes();
    console.log('\nCurrent indexes on users collection:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(UNIQUE)' : ''}`);
    });

    // Drop stale indexes (phone_1 is from old schema)
    const staleIndexes = ['phone_1'];
    for (const indexName of staleIndexes) {
      const exists = indexes.some(idx => idx.name === indexName);
      if (exists) {
        await usersCollection.dropIndex(indexName);
        console.log(`\nDropped stale index: ${indexName}`);
      } else {
        console.log(`\nIndex ${indexName} does not exist — skipping`);
      }
    }

    // Verify final state
    const finalIndexes = await usersCollection.indexes();
    console.log('\nFinal indexes:');
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(UNIQUE)' : ''}`);
    });

    console.log('\nDone!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixIndexes();
