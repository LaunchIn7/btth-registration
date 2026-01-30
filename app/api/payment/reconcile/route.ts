import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { ObjectId } from 'mongodb';
import { auth } from '@clerk/nextjs/server';
import clientPromise from '@/lib/mongodb';
import { updateRegistrationIdStatus } from '@/lib/registration-id';
import { generateReceiptNumber, receiptNumberFromRegistrationId } from '@/lib/receipt-number';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const registrationId = body?.registrationId as string | undefined;
    const orderIdFromBody = body?.orderId as string | undefined;

    if (!registrationId && !orderIdFromBody) {
      return NextResponse.json(
        { success: false, error: 'registrationId or orderId is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('btth_registration');
    const collection = db.collection('registrations');

    const registration = registrationId && ObjectId.isValid(registrationId)
      ? await collection.findOne({ _id: new ObjectId(registrationId) })
      : orderIdFromBody
        ? await collection.findOne({ orderId: orderIdFromBody })
        : null;

    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }

    if (registration.paymentStatus === 'paid') {
      return NextResponse.json({ success: true, status: 'paid', message: 'Already paid' });
    }

    const orderId = (orderIdFromBody || registration.orderId) as string | undefined;
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'No orderId found for registration' },
        { status: 400 }
      );
    }

    const paymentsResponse: any = await razorpay.orders.fetchPayments(orderId);
    const payments: any[] = Array.isArray(paymentsResponse?.items) ? paymentsResponse.items : [];

    const capturedPayment = payments.find((p) => p?.status === 'captured');
    if (!capturedPayment) {
      return NextResponse.json({ success: true, status: 'pending', message: 'No captured payment found' });
    }

    const updatedRegId = registration.registrationId
      ? updateRegistrationIdStatus(registration.registrationId, 'completed')
      : undefined;

    const paymentId = capturedPayment?.id as string | undefined;

    let persistedReceiptNo: string | undefined;
    for (let attempt = 0; attempt < 10; attempt++) {
      const latest = await collection.findOne({ _id: registration._id });
      if (!latest) {
        return NextResponse.json(
          { success: false, error: 'Registration not found' },
          { status: 404 }
        );
      }

      if (latest.paymentStatus === 'paid' && typeof latest.receiptNo === 'string' && latest.receiptNo) {
        persistedReceiptNo = latest.receiptNo;
        break;
      }

      if (latest.paymentStatus === 'paid' && (!latest.receiptNo || typeof latest.receiptNo !== 'string')) {
        let derived: string | undefined;
        const regIdForReceipt = (latest.registrationId as string | undefined) || (updatedRegId as string | undefined);
        if (regIdForReceipt) {
          try {
            derived = receiptNumberFromRegistrationId(regIdForReceipt);
          } catch (_err) {
            // ignore
          }
        }

        if (!derived) {
          derived = await generateReceiptNumber();
        }

        try {
          await collection.updateOne(
            { _id: registration._id, receiptNo: { $exists: false } },
            { $set: { receiptNo: derived, updatedAt: new Date() } }
          );
        } catch (error: any) {
          if (error?.code === 11000) {
            continue;
          }
          throw error;
        }

        const latestAfter = await collection.findOne({ _id: registration._id });
        persistedReceiptNo = typeof latestAfter?.receiptNo === 'string' ? latestAfter.receiptNo : undefined;
        break;
      }

      let receiptNo = latest.receiptNo as string | undefined;
      if (!receiptNo) {
        const regIdForReceipt = (updatedRegId || latest.registrationId) as string | undefined;
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

      try {
        await collection.updateOne(
          {
            _id: registration._id,
            paymentStatus: { $ne: 'paid' },
            ...(latest.receiptNo ? {} : { receiptNo: { $exists: false } }),
          },
          {
            $set: {
              status: 'completed',
              paymentStatus: 'paid',
              ...(paymentId && { paymentId }),
              ...(orderId && { orderId }),
              ...(!latest.receiptNo && { receiptNo }),
              ...(updatedRegId && { registrationId: updatedRegId }),
              updatedAt: new Date(),
            },
          }
        );
      } catch (error: any) {
        if (error?.code === 11000) {
          continue;
        }
        throw error;
      }
    }

    if (!persistedReceiptNo) {
      const latest = await collection.findOne({ _id: registration._id });
      persistedReceiptNo = typeof latest?.receiptNo === 'string' ? latest.receiptNo : undefined;
    }

    if (!persistedReceiptNo) {
      return NextResponse.json(
        { success: false, error: 'Failed to persist receipt number during reconciliation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: 'paid',
      message: 'Payment reconciled successfully',
      paymentId,
      orderId,
      receiptNo: persistedReceiptNo,
    });
  } catch (error) {
    console.error('Payment reconciliation error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment reconciliation failed' },
      { status: 500 }
    );
  }
}
