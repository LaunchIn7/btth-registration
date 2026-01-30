import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { auth } from '@clerk/nextjs/server';

function parseDateParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

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
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const startDate = parseDateParam(startParam);
    const endDate = parseDateParam(endParam);

    const match: Record<string, any> = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) {
        const endExclusive = new Date(endDate);
        endExclusive.setDate(endExclusive.getDate() + 1);
        match.createdAt.$lt = endExclusive;
      }
    }

    const client = await clientPromise;
    const db = client.db('btth_registration');
    const registrations = db.collection('registrations');

    const [result] = await registrations
      .aggregate([
        { $match: match },
        {
          $project: {
            createdAt: 1,
            updatedAt: 1,
            status: 1,
            paymentStatus: 1,
            examType: 1,
            examDate: 1,
            currentClass: 1,
            schoolName: 1,
            referralSource: 1,
          },
        },
        {
          $addFields: {
            createdDate: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
                timezone: 'Asia/Kolkata',
              },
            },
            isPaid: {
              $or: [
                { $eq: ['$paymentStatus', 'paid'] },
                { $eq: ['$status', 'completed'] },
              ],
            },
            schoolNameTrim: {
              $trim: {
                input: { $ifNull: ['$schoolName', ''] },
              },
            },
            schoolNameNorm: {
              $let: {
                vars: {
                  trimmedLower: {
                    $toLower: {
                      $trim: {
                        input: { $ifNull: ['$schoolName', ''] },
                      },
                    },
                  },
                },
                in: {
                  $let: {
                    vars: {
                      tokens: {
                        $filter: {
                          input: { $split: ['$$trimmedLower', ' '] },
                          as: 't',
                          cond: { $ne: ['$$t', ''] },
                        },
                      },
                    },
                    in: {
                      $reduce: {
                        input: '$$tokens',
                        initialValue: '',
                        in: {
                          $cond: [
                            { $eq: ['$$value', ''] },
                            '$$this',
                            { $concat: ['$$value', ' ', '$$this'] },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
            createdWeekday: {
              $let: {
                vars: {
                  weekday: {
                    $dateToParts: {
                      date: '$createdAt',
                      timezone: 'Asia/Kolkata',
                    },
                  },
                },
                in: {
                  $arrayElemAt: [
                    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    { $subtract: ['$$weekday.dayOfWeek', 1] },
                  ],
                },
              },
            },
            createdHour: {
              $toInt: {
                $dateToString: {
                  format: '%H',
                  date: '$createdAt',
                  timezone: 'Asia/Kolkata',
                },
              },
            },
            completionMinutes: {
              $cond: [
                {
                  $and: [
                    '$isPaid',
                    { $ne: ['$updatedAt', null] },
                  ],
                },
                {
                  $divide: [
                    { $subtract: ['$updatedAt', '$createdAt'] },
                    60000,
                  ],
                },
                null,
              ],
            },
          },
        },
        {
          $facet: {
            summary: [
              {
                $group: {
                  _id: null,
                  totalRegistrations: { $sum: 1 },
                  completedCount: {
                    $sum: {
                      $cond: ['$isPaid', 1, 0],
                    },
                  },
                  draftCount: {
                    $sum: {
                      $cond: ['$isPaid', 0, 1],
                    },
                  },
                  avgCompletionMinutes: { $avg: '$completionMinutes' },
                  uniqueSchools: {
                    $addToSet: {
                      $cond: [
                        {
                          $and: [
                            { $ne: ['$schoolNameNorm', null] },
                            { $ne: ['$schoolNameNorm', ''] },
                          ],
                        },
                        '$schoolNameNorm',
                        '$$REMOVE',
                      ],
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  totalRegistrations: 1,
                  completedCount: 1,
                  draftCount: 1,
                  avgCompletionMinutes: { $ifNull: ['$avgCompletionMinutes', 0] },
                  uniqueSchools: { $size: '$uniqueSchools' },
                },
              },
            ],
            byStatus: [
              { $group: { _id: '$status', count: { $sum: 1 } } },
              { $project: { _id: 0, status: '$_id', count: 1 } },
              { $sort: { count: -1 } },
            ],
            byExamType: [
              { $group: { _id: '$examType', count: { $sum: 1 } } },
              { $project: { _id: 0, examType: '$_id', count: 1 } },
              { $sort: { count: -1 } },
            ],
            byExamDate: [
              { $group: { _id: '$examDate', count: { $sum: 1 } } },
              { $project: { _id: 0, examDate: '$_id', count: 1 } },
              { $sort: { count: -1 } },
            ],
            peakWeekday: [
              { $match: { isPaid: true, createdWeekday: { $ne: null } } },
              { $group: { _id: '$createdWeekday', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 1 },
              { $project: { _id: 0, weekday: '$_id', count: 1 } },
            ],
            peakHour: [
              { $match: { isPaid: true, createdHour: { $ne: null } } },
              { $group: { _id: '$createdHour', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 1 },
              { $project: { _id: 0, hour: '$_id', count: 1 } },
            ],
            hourlyDistribution: [
              { $match: { isPaid: true, createdHour: { $ne: null } } },
              { $group: { _id: '$createdHour', count: { $sum: 1 } } },
              { $project: { _id: 0, hour: '$_id', count: 1 } },
              { $sort: { hour: 1 } },
            ],
            byClass: [
              { $group: { _id: '$currentClass', count: { $sum: 1 } } },
              { $project: { _id: 0, currentClass: '$_id', count: 1 } },
              {
                $addFields: {
                  classSort: {
                    $cond: [
                      { $regexMatch: { input: '$currentClass', regex: /^[0-9]+$/ } },
                      { $toInt: '$currentClass' },
                      999,
                    ],
                  },
                },
              },
              { $sort: { classSort: 1 } },
              { $project: { classSort: 0 } },
            ],
            conversionByExamType: [
              {
                $group: {
                  _id: '$examType',
                  registrations: { $sum: 1 },
                  completions: {
                    $sum: {
                      $cond: ['$isPaid', 1, 0],
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  examType: '$_id',
                  registrations: 1,
                  completions: 1,
                  conversionRate: {
                    $cond: [
                      { $gt: ['$registrations', 0] },
                      { $round: [{ $multiply: [{ $divide: ['$completions', '$registrations'] }, 100] }, 0] },
                      0,
                    ],
                  },
                },
              },
              { $sort: { registrations: -1 } },
            ],
            conversionByClass: [
              {
                $group: {
                  _id: '$currentClass',
                  registrations: { $sum: 1 },
                  completions: {
                    $sum: {
                      $cond: ['$isPaid', 1, 0],
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  currentClass: '$_id',
                  registrations: 1,
                  completions: 1,
                  conversionRate: {
                    $cond: [
                      { $gt: ['$registrations', 0] },
                      { $round: [{ $multiply: [{ $divide: ['$completions', '$registrations'] }, 100] }, 0] },
                      0,
                    ],
                  },
                },
              },
              {
                $addFields: {
                  classSort: {
                    $cond: [
                      { $regexMatch: { input: '$currentClass', regex: /^[0-9]+$/ } },
                      { $toInt: '$currentClass' },
                      999,
                    ],
                  },
                },
              },
              { $sort: { classSort: 1 } },
              { $project: { classSort: 0 } },
            ],
            conversionByReferralSource: [
              {
                $group: {
                  _id: '$referralSource',
                  registrations: { $sum: 1 },
                  completions: {
                    $sum: {
                      $cond: ['$isPaid', 1, 0],
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  referralSource: '$_id',
                  registrations: 1,
                  completions: 1,
                  conversionRate: {
                    $cond: [
                      { $gt: ['$registrations', 0] },
                      { $round: [{ $multiply: [{ $divide: ['$completions', '$registrations'] }, 100] }, 0] },
                      0,
                    ],
                  },
                },
              },
              { $sort: { registrations: -1 } },
              { $limit: 10 },
            ],
            conversionByExamDate: [
              {
                $group: {
                  _id: '$examDate',
                  registrations: { $sum: 1 },
                  completions: {
                    $sum: {
                      $cond: ['$isPaid', 1, 0],
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  examDate: '$_id',
                  registrations: 1,
                  completions: 1,
                  conversionRate: {
                    $cond: [
                      { $gt: ['$registrations', 0] },
                      { $round: [{ $multiply: [{ $divide: ['$completions', '$registrations'] }, 100] }, 0] },
                      0,
                    ],
                  },
                },
              },
              { $sort: { registrations: -1 } },
              { $limit: 10 },
            ],
            startedPaidByClass: [
              {
                $group: {
                  _id: '$currentClass',
                  started: { $sum: 1 },
                  paid: {
                    $sum: {
                      $cond: ['$isPaid', 1, 0],
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  currentClass: '$_id',
                  started: 1,
                  paid: 1,
                },
              },
              {
                $addFields: {
                  classSort: {
                    $cond: [
                      { $regexMatch: { input: '$currentClass', regex: /^[0-9]+$/ } },
                      { $toInt: '$currentClass' },
                      999,
                    ],
                  },
                },
              },
              { $sort: { classSort: 1 } },
              { $project: { classSort: 0 } },
            ],
            startedPaidByExamType: [
              {
                $group: {
                  _id: '$examType',
                  started: { $sum: 1 },
                  paid: {
                    $sum: {
                      $cond: ['$isPaid', 1, 0],
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  examType: '$_id',
                  started: 1,
                  paid: 1,
                },
              },
              { $sort: { started: -1 } },
            ],
            byReferralSource: [
              { $group: { _id: '$referralSource', count: { $sum: 1 } } },
              { $project: { _id: 0, referralSource: '$_id', count: 1 } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
            topSchools: [
              {
                $match: {
                  isPaid: true,
                  schoolNameNorm: { $exists: true, $type: 'string', $ne: '' },
                },
              },
              {
                $group: {
                  _id: '$schoolNameNorm',
                  count: { $sum: 1 },
                  schoolName: { $first: '$schoolNameTrim' },
                },
              },
              { $sort: { count: -1 } },
              { $limit: 12 },
              { $project: { _id: 0, schoolName: 1, count: 1 } },
            ],
            dailyRegistrations: [
              {
                $group: {
                  _id: '$createdDate',
                  registrations: { $sum: 1 },
                  completions: {
                    $sum: {
                      $cond: ['$isPaid', 1, 0],
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  date: '$_id',
                  registrations: 1,
                  completions: 1,
                  conversionRate: {
                    $cond: [
                      { $gt: ['$registrations', 0] },
                      { $round: [{ $multiply: [{ $divide: ['$completions', '$registrations'] }, 100] }, 0] },
                      0,
                    ],
                  },
                },
              },
              { $sort: { date: 1 } },
            ],
          },
        },
      ])
      .toArray();

    const summary = Array.isArray(result?.summary) && result.summary[0]
      ? result.summary[0]
      : {
        totalRegistrations: 0,
        completedCount: 0,
        draftCount: 0,
        avgCompletionMinutes: 0,
        uniqueSchools: 0,
      };

    const peakWeekday = Array.isArray(result?.peakWeekday) && result.peakWeekday[0] ? result.peakWeekday[0] : null;
    const peakHour = Array.isArray(result?.peakHour) && result.peakHour[0] ? result.peakHour[0] : null;

    return NextResponse.json({
      success: true,
      range: {
        start: startDate ? startDate.toISOString() : null,
        end: endDate ? endDate.toISOString() : null,
      },
      summary,
      insights: {
        peakWeekday,
        peakHour,
        hourlyDistribution: result?.hourlyDistribution ?? [],
        conversion: {
          byExamType: result?.conversionByExamType ?? [],
          byClass: result?.conversionByClass ?? [],
          byReferralSource: result?.conversionByReferralSource ?? [],
          byExamDate: result?.conversionByExamDate ?? [],
        },
      },
      breakdown: {
        byStatus: result?.byStatus ?? [],
        byExamType: result?.byExamType ?? [],
        byExamDate: result?.byExamDate ?? [],
        byClass: result?.byClass ?? [],
        startedPaidByClass: result?.startedPaidByClass ?? [],
        startedPaidByExamType: result?.startedPaidByExamType ?? [],
        byReferralSource: result?.byReferralSource ?? [],
        topSchools: result?.topSchools ?? [],
      },
      timeseries: {
        dailyRegistrations: result?.dailyRegistrations ?? [],
      },
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load analytics' },
      { status: 500 }
    );
  }
}
