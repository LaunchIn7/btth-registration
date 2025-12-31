import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { ExamConfiguration, DEFAULT_EXAM_CONFIG } from '@/lib/types/exam-config';
import { enrichExamDate } from '@/lib/utils/date-formatter';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('btth_registration');

    let config = await db
      .collection<ExamConfiguration>('exam_config')
      .findOne({ isActive: true });

    if (!config) {
      const defaultConfig = {
        ...DEFAULT_EXAM_CONFIG,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection('exam_config').insertOne(defaultConfig);
      config = await db.collection<ExamConfiguration>('exam_config').findOne({ _id: result.insertedId });
    }

    // Enrich exam dates with computed fields for admin UI
    const enrichedConfig = config ? {
      ...config,
      examDates: config.examDates.map(date => enrichExamDate(date)),
    } : null;

    return NextResponse.json({
      success: true,
      data: enrichedConfig,
    });
  } catch (error) {
    console.error('Failed to fetch exam configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { examDates, pricing } = body;

    if (!examDates || !Array.isArray(examDates)) {
      return NextResponse.json(
        { error: 'Invalid examDates format' },
        { status: 400 }
      );
    }

    if (!pricing || typeof pricing.foundation !== 'number' || typeof pricing.regular !== 'number') {
      return NextResponse.json(
        { error: 'Invalid pricing format' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('btth_registration');

    const existingConfig = await db
      .collection<ExamConfiguration>('exam_config')
      .findOne({ isActive: true });

    const updatedConfig = {
      examDates,
      pricing,
      isActive: true,
      updatedAt: new Date(),
    };

    if (existingConfig) {
      await db.collection('exam_config').updateOne(
        { _id: new ObjectId(existingConfig._id) },
        { $set: updatedConfig }
      );
    } else {
      await db.collection('exam_config').insertOne({
        ...updatedConfig,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      data: updatedConfig,
    });
  } catch (error) {
    console.error('Failed to update exam configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
