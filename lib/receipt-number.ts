import { Collection, Db, ObjectId } from 'mongodb';

let client: any;
let db: Db;
let registrationsCollection: Collection;
let countersCollection: Collection;

const initCollections = async () => {
  if (!db) {
    const { MongoClient } = await import('mongodb');
    const clientPromise = new MongoClient(process.env.MONGODB_URI!).connect();
    client = await clientPromise;
    db = client.db('btth_registration');
    registrationsCollection = db.collection('registrations');
    countersCollection = db.collection('counters');
  }
  return { registrationsCollection, countersCollection };
};

/**
 * Generate a new receipt number with auto-increment
 * Format: btnmrzpXXXX where XXXX is a 4-digit zero-padded number
 */
export async function generateReceiptNumber(): Promise<string> {
  const { countersCollection } = await initCollections();

  const result = await countersCollection.findOneAndUpdate(
    { _id: 'receiptNumber' as any },
    { $inc: { sequence: 1 } },
    { upsert: true, returnDocument: 'after' }
  );

  const sequence = result?.value?.sequence || 1;
  const paddedNumber = sequence.toString().padStart(4, '0');

  return `btnmrzp${paddedNumber}`;
}

/**
 * Get the current receipt number sequence without incrementing
 */
export async function getCurrentReceiptSequence(): Promise<number> {
  const { countersCollection } = await initCollections();

  const counter = await countersCollection.findOne({ _id: 'receiptNumber' as any });
  return counter?.sequence || 0;
}

/**
 * Initialize receipt number counter if it doesn't exist
 */
export async function initializeReceiptCounter(startSequence: number = 0): Promise<void> {
  const { countersCollection } = await initCollections();

  await countersCollection.updateOne(
    { _id: 'receiptNumber' as any },
    { $setOnInsert: { sequence: startSequence } },
    { upsert: true }
  );
}
