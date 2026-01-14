import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { updateRegistrationIdStatus } from '@/lib/registration-id';

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      registrationId,
    } = await request.json();

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      const client = await clientPromise;
      const db = client.db('btth_registration');
      const collection = db.collection('registrations');

      const registration = await collection.findOne({ _id: new ObjectId(registrationId) });

      if (!registration) {
        return NextResponse.json(
          { success: false, error: 'Registration not found' },
          { status: 404 }
        );
      }

      if (registration.paymentStatus === 'paid') {
        return NextResponse.json({
          success: true,
          message: 'Payment already verified',
        });
      }

      const updatedRegId = registration.registrationId
        ? updateRegistrationIdStatus(registration.registrationId, 'completed')
        : undefined;

      await collection.updateOne(
        { _id: new ObjectId(registrationId) },
        {
          $set: {
            status: 'completed',
            paymentStatus: 'paid',
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            razorpaySignature: razorpay_signature,
            ...(updatedRegId && { registrationId: updatedRegId }),
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
