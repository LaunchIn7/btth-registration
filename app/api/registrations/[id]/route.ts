import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { auth } from '@clerk/nextjs/server';

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const client = await clientPromise;
    const db = client.db('btth_registration');
    const collection = db.collection('registrations');

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Only draft registrations can be deleted' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Draft registration deleted' });
  } catch (error) {
    console.error('Delete registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete registration' },
      { status: 500 }
    );
  }
}
