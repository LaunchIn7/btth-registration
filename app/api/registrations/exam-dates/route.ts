import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { auth } from '@clerk/nextjs/server';

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('btth_registration');
    const collection = db.collection('registrations');

    const dates = (await collection.distinct('examDate'))
      .filter((value) => typeof value === 'string' && value)
      .sort((a: string, b: string) => a.localeCompare(b));

    return NextResponse.json({ success: true, data: dates });
  } catch (error) {
    console.error('Distinct exam dates error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exam dates' },
      { status: 500 }
    );
  }
}
