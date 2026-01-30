import { Collection, Db, ReturnDocument } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { parseRegistrationId } from '@/lib/registration-id';

let db: Db;
let registrationsCollection: Collection;
let countersCollection: Collection;

const initCollections = async () => {
  if (!db) {
    const client = await clientPromise;
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

  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await countersCollection.findOneAndUpdate(
      { _id: 'receiptNumber' as any },
      {
        $setOnInsert: { sequence: 0 },
        $inc: { sequence: 1 },
      },
      {
        upsert: true,
        returnDocument: ReturnDocument.AFTER,
      }
    );

    const sequence = (result && result.value && typeof (result.value as any).sequence === 'number')
      ? (result.value as any).sequence
      : undefined;

    if (typeof sequence === 'number') {
      const paddedNumber = sequence.toString().padStart(4, '0');
      return `btnmrzp${paddedNumber}`;
    }
  }

  throw new Error('Failed to generate receipt number');
}

export function receiptNumberFromRegistrationId(registrationId: string): string {
  const { sequence } = parseRegistrationId(registrationId);
  const paddedNumber = sequence.toString().padStart(5, '0');
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
