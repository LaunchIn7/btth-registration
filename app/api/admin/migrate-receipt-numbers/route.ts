import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getCurrentReceiptSequence } from '@/lib/receipt-number';

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db('btth_registration');
    const registrationsCollection = db.collection('registrations');
    const countersCollection = db.collection('counters');

    // Get all registrations without receiptNo, sorted by creation date
    const registrations = await registrationsCollection
      .find({ receiptNo: { $exists: false } })
      .sort({ createdAt: 1 })
      .toArray();

    if (registrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No registrations need receipt numbers',
        updated: 0,
      });
    }

    // Get current sequence or start from 1
    const currentSequence = await getCurrentReceiptSequence();
    let startSequence = currentSequence + 1;

    // Generate receipt numbers for each registration
    const updatedRegistrations = [];
    for (const registration of registrations) {
      const paddedNumber = startSequence.toString().padStart(4, '0');
      const receiptNo = `btnmrzp${paddedNumber}`;

      await registrationsCollection.updateOne(
        { _id: registration._id },
        { $set: { receiptNo } }
      );

      updatedRegistrations.push({
        _id: registration._id,
        registrationId: registration.registrationId || 'N/A',
        receiptNo,
      });

      startSequence++;
    }

    // Update the counter to the final sequence number
    await countersCollection.updateOne(
      { _id: 'receiptNumber' as any },
      { $set: { sequence: startSequence - 1 } },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully assigned receipt numbers to ${updatedRegistrations.length} registrations`,
      updated: updatedRegistrations.length,
      registrations: updatedRegistrations,
    });
  } catch (error) {
    console.error('Failed to migrate receipt numbers:', error);
    return NextResponse.json(
      { error: 'Failed to migrate receipt numbers' },
      { status: 500 }
    );
  }
}
