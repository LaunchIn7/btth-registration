import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const CACHE_TTL_MS = 60 * 1000;
const MAX_RESULTS = 6;

type CacheEntry = {
  data: string[];
  expiry: number;
};

const suggestionCache = new Map<string, CacheEntry>();

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryParam = searchParams.get('q')?.trim() ?? '';

  // Require at least 2 characters to reduce noise and load
  if (queryParam.length < 2) {
    return NextResponse.json({ success: true, results: [] });
  }

  const cacheKey = queryParam.toLowerCase();
  const cached = suggestionCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiry > now) {
    return NextResponse.json({ success: true, results: cached.data });
  }

  try {
    const client = await clientPromise;
    const db = client.db('btth_registration');
    const collection = db.collection('registrations');

    const regex = new RegExp(escapeRegex(queryParam), 'i');

    const pipeline = [
      { $match: { schoolName: { $regex: regex } } },
      {
        $group: {
          _id: {
            normalized: { $toUpper: '$schoolName' },
            original: '$schoolName',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.normalized',
          name: { $first: '$_id.original' },
          count: { $sum: '$count' },
        },
      },
      { $sort: { count: -1, name: 1 } },
      { $limit: MAX_RESULTS },
      {
        $project: {
          _id: 0,
          name: '$name',
        },
      },
    ];

    const results = await collection.aggregate<{ name: string }>(pipeline).toArray();
    const names = results.map((entry) => entry.name);

    suggestionCache.set(cacheKey, {
      data: names,
      expiry: now + CACHE_TTL_MS,
    });

    return NextResponse.json({ success: true, results: names });
  } catch (error) {
    console.error('School search error:', error);
    return NextResponse.json({ success: false, results: [] }, { status: 500 });
  }
}
