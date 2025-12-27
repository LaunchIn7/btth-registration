import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const client = await clientPromise;
    const db = client.db('btth_registration');
    const collection = db.collection('registrations');

    const registration = {
      ...body,
      status: 'draft',
      paymentStatus: 'pending',
      examType: body.examType || 'comp28',
      registrationAmount: body.registrationAmount || 500,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(registration);

    return NextResponse.json({
      success: true,
      registrationId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error('Draft registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create draft registration' },
      { status: 500 }
    );
  }
}
