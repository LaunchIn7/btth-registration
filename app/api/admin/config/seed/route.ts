import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import clientPromise from '@/lib/mongodb';
import { DEFAULT_EXAM_CONFIG } from '@/lib/types/exam-config';

export const dynamic = 'force-dynamic';

export async function POST() {
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
    const collection = db.collection('exam_config');

    // Check if config already exists
    const existingConfig = await collection.findOne({ isActive: true });

    if (existingConfig) {
      return NextResponse.json({
        success: false,
        message: 'Active configuration already exists',
        data: existingConfig,
      });
    }

    // Insert default configuration
    const configToInsert = {
      ...DEFAULT_EXAM_CONFIG,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(configToInsert);

    return NextResponse.json({
      success: true,
      message: 'Default configuration seeded successfully',
      data: { ...configToInsert, _id: result.insertedId },
    });

  } catch (error) {
    console.error('Failed to seed configuration:', error);
    return NextResponse.json(
      { error: 'Failed to seed configuration' },
      { status: 500 }
    );
  }
}
