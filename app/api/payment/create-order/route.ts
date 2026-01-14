import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const { registrationId, amount } = await request.json();

    const options = {
      amount: amount,
      currency: 'INR',
      receipt: `receipt_${registrationId}`,
      notes: {
        registrationId,
      },
    };

    const order = await razorpay.orders.create(options);

    try {
      const client = await clientPromise;
      const db = client.db('btth_registration');
      const collection = db.collection('registrations');

      await collection.updateOne(
        { _id: new ObjectId(registrationId) },
        {
          $set: {
            orderId: order.id,
            paymentStatus: 'pending',
            updatedAt: new Date(),
          },
        }
      );
    } catch (error) {
      console.error('Failed to persist orderId for registration:', error);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
