import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db('btth_registration');
    const registrationsCollection = db.collection('registrations');
    const countersCollection = db.collection('counters');

    // First, clear all receipt numbers that were assigned
    await registrationsCollection.updateMany(
      { receiptNo: { $exists: true } },
      { $unset: { receiptNo: "" } }
    );

    // Reset the counter to 0
    await countersCollection.updateOne(
      { _id: 'receiptNumber' as any },
      { $set: { sequence: 0 } },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Successfully reset all receipt numbers. Only paid registrations will receive new receipt numbers after migration.',
    });
  } catch (error) {
    console.error('Failed to reset receipt numbers:', error);
    return NextResponse.json(
      { error: 'Failed to reset receipt numbers' },
      { status: 500 }
    );
  }
}
