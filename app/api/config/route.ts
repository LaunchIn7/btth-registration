import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ExamConfiguration } from '@/lib/types/exam-config';
import { enrichExamDate } from '@/lib/utils/date-formatter';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('btth_registration');

    const config = await db
      .collection<ExamConfiguration>('exam_config')
      .findOne({ isActive: true });

    if (!config) {
      return NextResponse.json(
        { error: 'No active configuration found' },
        { status: 404 }
      );
    }

    // Filter enabled dates and enrich with computed fields
    const filteredConfig = {
      ...config,
      examDates: config.examDates
        .filter(date => date.enabled)
        .map(date => enrichExamDate(date)),
      pricing: config.pricing,
    };

    return NextResponse.json(filteredConfig);
  } catch (error) {
    console.error('Failed to fetch exam configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}
