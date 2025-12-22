import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db('btth_registration');
    const collection = db.collection('registrations');

    const registration = await collection.findOne({
      _id: new ObjectId(id),
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(registration);
  } catch (error) {
    console.error('Fetch registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch registration' },
      { status: 500 }
    );
  }
}
