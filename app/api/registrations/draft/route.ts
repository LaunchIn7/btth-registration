import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { generateRegistrationId } from '@/lib/registration-id';
import { generateReceiptNumber } from '@/lib/receipt-number';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const client = await clientPromise;
    const db = client.db('btth_registration');
    const collection = db.collection('registrations');

    const examType = body.examType || 'regular';
    const registrationId = await generateRegistrationId(examType, 'draft');
    const receiptNo = await generateReceiptNumber();

    const registration = {
      ...body,
      registrationId,
      receiptNo,
      status: 'draft',
      paymentStatus: 'pending',
      examType,
      registrationAmount: body.registrationAmount || 500,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(registration);

    return NextResponse.json({
      success: true,
      registrationId: result.insertedId.toString(),
      regId: registrationId,
      receiptNo,
    });
  } catch (error) {
    console.error('Draft registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create draft registration' },
      { status: 500 }
    );
  }
}
