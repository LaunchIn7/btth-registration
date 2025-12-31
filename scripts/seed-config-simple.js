const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rishabh-mongo:rishabh-mongo@cluster0.v9a14sg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'btth_registration';

const DEFAULT_EXAM_CONFIG = {
  examDates: [
    {
      id: 'slot-1',
      value: '2026-01-11',
      label: 'Slot 1',
      time: '12:00 PM',
      reportingTime: '11:30 AM',
      enabled: true,
    },
    {
      id: 'slot-2',
      value: '2026-01-18',
      label: 'Slot 2',
      time: '12:00 PM',
      reportingTime: '11:30 AM',
      enabled: true,
    },
  ],
  pricing: {
    foundation: 200,
    regular: 500,
  },
  isActive: true,
};

async function seedExamConfig() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const collection = db.collection('exam_config');

    // Check if config already exists
    const existingConfig = await collection.findOne({ isActive: true });

    if (existingConfig) {
      console.log('⚠️  Active configuration already exists. Skipping seed.');
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
    console.log('📝 Inserted ID:', result.insertedId);
    console.log('📋 Configuration:', JSON.stringify(configToInsert, null, 2));

  } catch (error) {
    console.error('❌ Error seeding exam configuration:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the seeder
seedExamConfig()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
