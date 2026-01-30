import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { generateReceiptNumber, receiptNumberFromRegistrationId } from '@/lib/receipt-number';

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db('btth_registration');
    const registrationsCollection = db.collection('registrations');
    const countersCollection = db.collection('counters');

    const duplicateReceiptGroups = await registrationsCollection
      .aggregate([
        { $match: { receiptNo: { $exists: true, $type: 'string', $ne: '' } } },
        {
          $group: {
            _id: '$receiptNo',
            count: { $sum: 1 },
            docs: { $push: { _id: '$_id', createdAt: '$createdAt' } },
          },
        },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();

    let clearedDuplicates = 0;
    for (const group of duplicateReceiptGroups) {
      const docs = Array.isArray(group?.docs) ? group.docs : [];
      docs.sort((a: any, b: any) => {
        const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      });

      const toClear = docs.slice(1).map((d: any) => d._id).filter(Boolean);
      if (toClear.length > 0) {
        const result = await registrationsCollection.updateMany(
          { _id: { $in: toClear } },
          { $unset: { receiptNo: '' } }
        );
        clearedDuplicates += result.modifiedCount;
      }
    }

    let maxSequence = 0;
    const cursor = registrationsCollection
      .find({ receiptNo: { $exists: true, $type: 'string', $ne: '' } }, { projection: { receiptNo: 1 } });
    for await (const doc of cursor as any) {
      const receiptNo = doc?.receiptNo;
      if (typeof receiptNo !== 'string') continue;
      const match = /^btnmrzp(\d+)$/.exec(receiptNo);
      if (!match) continue;
      const seq = Number.parseInt(match[1], 10);
      if (Number.isFinite(seq) && seq > maxSequence) maxSequence = seq;
    }

    await countersCollection.updateOne(
      { _id: 'receiptNumber' as any },
      { $set: { sequence: maxSequence } },
      { upsert: true }
    );

    const registrations = await registrationsCollection
      .find({
        receiptNo: { $exists: false },
        paymentStatus: 'paid',
      })
      .sort({ createdAt: 1 })
      .toArray();

    if (registrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No registrations need receipt numbers',
        updated: 0,
      });
    }

    const updatedRegistrations = [];
    for (const registration of registrations) {
      let receiptNo: string;
      if (typeof registration?.registrationId === 'string' && registration.registrationId) {
        try {
          receiptNo = receiptNumberFromRegistrationId(registration.registrationId);
        } catch (_err) {
          receiptNo = await generateReceiptNumber();
        }
      } else {
        receiptNo = await generateReceiptNumber();
      }

      const updateResult = await registrationsCollection.updateOne(
        { _id: registration._id, receiptNo: { $exists: false } },
        { $set: { receiptNo } }
      );

      if (updateResult.modifiedCount > 0) {
        updatedRegistrations.push({
          _id: registration._id,
          registrationId: registration.registrationId || 'N/A',
          receiptNo,
        });
      }
    }

    try {
      await registrationsCollection.createIndex(
        { receiptNo: 1 },
        { unique: true, sparse: true, name: 'receiptNo_unique' }
      );
    } catch (error) {
      console.error('Failed to create receiptNo unique index:', error);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned receipt numbers to ${updatedRegistrations.length} registrations`,
      updated: updatedRegistrations.length,
      clearedDuplicates,
      registrations: updatedRegistrations,
    });
  } catch (error) {
    console.error('Failed to migrate receipt numbers:', error);
    return NextResponse.json(
      { error: 'Failed to migrate receipt numbers' },
      { status: 500 }
    );
  }
}
