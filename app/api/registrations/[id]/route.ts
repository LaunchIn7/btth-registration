import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { auth } from '@clerk/nextjs/server';
import { updateRegistrationIdStatus } from '@/lib/registration-id';

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

export async function PATCH(
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
    const body = await request.json();

    const allowedKeys = new Set([
      'studentName',
      'currentClass',
      'schoolName',
      'parentMobile',
      'email',
      'examDate',
      'referralSource',
      'referralOther',
      'status',
      'paymentStatus',
      'paymentId',
      'orderId',
      'razorpaySignature',
      'examType',
      'registrationAmount',
    ]);

    const update: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body ?? {})) {
      if (!allowedKeys.has(key)) continue;
      if (typeof value === 'undefined') continue;
      update[key] = value;
    }

    const client = await clientPromise;
    const db = client.db('btth_registration');
    const collection = db.collection('registrations');

    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }

    const nextPaymentStatus = (update.paymentStatus ?? existing.paymentStatus) as string | undefined;
    const nextStatus = (update.status ?? existing.status) as string | undefined;

    const shouldMarkCompleted = nextPaymentStatus === 'paid' || nextStatus === 'completed';
    if (shouldMarkCompleted) {
      update.status = 'completed';
      update.paymentStatus = nextPaymentStatus === 'paid' ? 'paid' : (existing.paymentStatus ?? 'paid');

      if (typeof existing.registrationId === 'string' && existing.registrationId) {
        try {
          update.registrationId = updateRegistrationIdStatus(existing.registrationId, 'completed');
        } catch (_err) {
          // ignore
        }
      }
    }

    update.updatedAt = new Date();

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update registration' },
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
