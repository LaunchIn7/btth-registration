import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { auth } from '@clerk/nextjs/server';

/**
 * Migration script to add registration IDs to existing registrations
 * This will assign sequential IDs based on creation date
 */
export async function POST(request: NextRequest) {
  try {
    // const { userId } = await auth();

    // if (!userId) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const client = await clientPromise;
    const db = client.db('btth_registration');
    const registrationsCollection = db.collection('registrations');
    const countersCollection = db.collection<{ _id: string; sequence: number }>('counters');

    // Get all registrations without registrationId, sorted by creation date
    const registrationsWithoutId = await registrationsCollection
      .find({ registrationId: { $exists: false } })
      .sort({ createdAt: 1 })
      .toArray();

    if (registrationsWithoutId.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No registrations need migration',
        updated: 0,
      });
    }

    // Initialize counter if it doesn't exist
    const counter = await countersCollection.findOne({ _id: 'registrationId' });
    let currentSequence = counter?.sequence || 0;

    const updates = [];

    for (const registration of registrationsWithoutId) {
      currentSequence++;

      const examType = registration.examType || 'regular';
      const status = registration.status || 'draft';

      const examTypeCode = examType === 'foundation' ? 'F' : 'C';
      const statusCode = status === 'completed' ? 'C' : 'D';
      const paddedNumber = currentSequence.toString().padStart(5, '0');

      const registrationId = `BTNM-${examTypeCode}-${statusCode}-${paddedNumber}`;

      updates.push({
        _id: registration._id,
        registrationId,
      });

      await registrationsCollection.updateOne(
        { _id: registration._id },
        { $set: { registrationId } }
      );
    }

    // Update the counter to the current sequence
    await countersCollection.updateOne(
      { _id: 'registrationId' },
      { $set: { sequence: currentSequence } },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${updates.length} registrations`,
      updated: updates.length,
      registrations: updates,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: 'Migration failed' },
      { status: 500 }
    );
  }
}
