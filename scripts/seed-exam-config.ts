import { MongoClient } from 'mongodb';
import { DEFAULT_EXAM_CONFIG } from '../lib/types/exam-config';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'btth_registration';

async function seedExamConfig() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DB_NAME);
    const collection = db.collection('exam_config');

    // Check if config already exists
    const existingConfig = await collection.findOne({ isActive: true });

    if (existingConfig) {
      console.log('Active configuration already exists. Skipping seed.');
      console.log('Existing config:', JSON.stringify(existingConfig, null, 2));
      return;
    }

    // Insert default configuration
    const configToInsert = {
      ...DEFAULT_EXAM_CONFIG,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(configToInsert);
    console.log('✅ Default exam configuration seeded successfully!');
    console.log('Inserted ID:', result.insertedId);
    console.log('Configuration:', JSON.stringify(configToInsert, null, 2));

  } catch (error) {
    console.error('❌ Error seeding exam configuration:', error);
    throw error;
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seeder
seedExamConfig()
  .then(() => {
    console.log('Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
