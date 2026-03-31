/**
 * Clean up farmer profiles with null userId and fix indexes.
 * Run this after schema changes to ensure data integrity.
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farm2home';

async function cleanupFarmerProfiles() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const farmerProfilesCollection = db.collection('farmerprofiles');

    // List current indexes
    const indexes = await farmerProfilesCollection.indexes();
    console.log('\nCurrent indexes on farmerprofiles collection:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(UNIQUE)' : ''}`);
    });

    // Remove documents with null userId or user
    const deleteResult1 = await farmerProfilesCollection.deleteMany({ userId: null });
    const deleteResult2 = await farmerProfilesCollection.deleteMany({ user: null });
    console.log(`\nDeleted ${deleteResult1.deletedCount} documents with userId: null`);
    console.log(`Deleted ${deleteResult2.deletedCount} documents with user: null`);

    // Drop old indexes if they exist
    const oldIndexes = ['user_1'];
    for (const indexName of oldIndexes) {
      const exists = indexes.some(idx => idx.name === indexName);
      if (exists) {
        await farmerProfilesCollection.dropIndex(indexName);
        console.log(`Dropped old index: ${indexName}`);
      } else {
        console.log(`Index ${indexName} does not exist — skipping`);
      }
    }

    // Verify final state
    const finalIndexes = await farmerProfilesCollection.indexes();
    console.log('\nFinal indexes on farmerprofiles:');
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(UNIQUE)' : ''}`);
    });

    const totalDocs = await farmerProfilesCollection.countDocuments();
    console.log(`\nTotal farmer profile documents: ${totalDocs}`);

    console.log('\nCleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error.message);
    process.exit(1);
  }
}

cleanupFarmerProfiles();