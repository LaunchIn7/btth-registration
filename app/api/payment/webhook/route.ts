import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { updateRegistrationIdStatus } from '@/lib/registration-id';
import { generateReceiptNumber, receiptNumberFromRegistrationId } from '@/lib/receipt-number';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not set');
      return NextResponse.json(
        { success: false, error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const rawBody = await request.text();

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (!signature || signature !== expectedSignature) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const payload = JSON.parse(rawBody);
    const eventType: string | undefined = payload?.event;

    if (eventType !== 'payment.captured' && eventType !== 'order.paid') {
      return NextResponse.json({ success: true });
    }

    const paymentEntity = payload?.payload?.payment?.entity;
    const orderEntity = payload?.payload?.order?.entity;

    const orderId: string | undefined = paymentEntity?.order_id || orderEntity?.id;
    const paymentId: string | undefined = paymentEntity?.id;

    let registrationId: string | undefined =
      paymentEntity?.notes?.registrationId || orderEntity?.notes?.registrationId;

    const receipt = orderEntity?.receipt as string | undefined;
    if (!registrationId && typeof receipt === 'string' && receipt.startsWith('receipt_')) {
      registrationId = receipt.slice('receipt_'.length);
    }

    const client = await clientPromise;
    const db = client.db('btth_registration');
    const collection = db.collection('registrations');

    const registration = registrationId && ObjectId.isValid(registrationId)
      ? await collection.findOne({ _id: new ObjectId(registrationId) })
      : orderId
        ? await collection.findOne({ orderId })
        : null;

    if (!registration) {
      console.error('Webhook: registration not found', {
        registrationId,
        orderId,
        eventType,
      });
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 500 }
      );
    }

    if (registration.paymentStatus === 'paid') {
      return NextResponse.json({ success: true });
    }

    const updatedRegId = registration.registrationId
      ? updateRegistrationIdStatus(registration.registrationId, 'completed')
      : undefined;

    let receiptNo = registration.receiptNo as string | undefined;
    if (!receiptNo) {
      const regIdForReceipt = (updatedRegId || registration.registrationId) as string | undefined;
      if (regIdForReceipt) {
        try {
          receiptNo = receiptNumberFromRegistrationId(regIdForReceipt);
        } catch (_err) {
          // ignore
        }
      }
    }
    if (!receiptNo) {
      receiptNo = await generateReceiptNumber();
    }

    await collection.updateOne(
      { _id: registration._id, paymentStatus: { $ne: 'paid' } },
      {
        $set: {
          status: 'completed',
          paymentStatus: 'paid',
          ...(!registration.receiptNo && { receiptNo }),
          ...(paymentId && { paymentId }),
          ...(orderId && { orderId }),
          ...(updatedRegId && { registrationId: updatedRegId }),
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
