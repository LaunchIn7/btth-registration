import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const filterClass = searchParams.get('class');
    const filterDate = searchParams.get('examDate');
    const filterStatus = searchParams.get('status');
    const search = searchParams.get('search');

    const client = await clientPromise;
    const db = client.db('btth_registration');
    const collection = db.collection('registrations');

    const filter: any = {};
    
    if (filterClass) {
      filter.currentClass = filterClass;
    }
    
    if (filterDate) {
      filter.examDate = filterDate;
    }
    
    if (filterStatus) {
      filter.status = filterStatus;
    }
    
    if (search) {
      filter.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { parentMobile: { $regex: search, $options: 'i' } },
        { schoolName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    
    const [registrations, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: registrations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List registrations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}
