'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';

type AnalyticsResponse = {
  success: boolean;
  range: {
    start: string | null;
    end: string | null;
  };
  summary: {
    totalRegistrations: number;
    completedCount: number;
    draftCount: number;
    uniqueSchools: number;
    avgCompletionMinutes: number;
  };
  insights?: {
    peakWeekday?: { weekday: string; count: number } | null;
    peakHour?: { hour: number; count: number } | null;
    hourlyDistribution?: Array<{ hour: number; count: number }>;
    conversion?: {
      byExamType?: Array<{ examType: string; registrations: number; completions: number; conversionRate: number }>;
      byClass?: Array<{ currentClass: string; registrations: number; completions: number; conversionRate: number }>;
      byReferralSource?: Array<{ referralSource: string; registrations: number; completions: number; conversionRate: number }>;
      byExamDate?: Array<{ examDate: string; registrations: number; completions: number; conversionRate: number }>;
    };
  };
  breakdown: {
    byStatus: Array<{ status: string; count: number }>;
    byExamType: Array<{ examType: string; count: number }>;
    byExamDate: Array<{ examDate: string; count: number }>;
    byClass: Array<{ currentClass: string; count: number }>;
    startedPaidByClass?: Array<{ currentClass: string; started: number; paid: number }>;
    startedPaidByExamType?: Array<{ examType: string; started: number; paid: number }>;
    byReferralSource: Array<{ referralSource: string; count: number }>;
    topSchools: Array<{ schoolName: string; count: number }>;
  };
  timeseries: {
    dailyRegistrations: Array<{ date: string; registrations: number; completions: number; conversionRate: number }>;
  };
};

function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateValue(value?: string | null) {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00`);
}

function formatDisplayDate(value?: string | null) {
  const parsed = parseDateValue(value || undefined);
  return parsed ? format(parsed, 'dd MMM yyyy') : '';
}

const pieColors = ['#2563EB', '#7C3AED', '#16A34A', '#F59E0B', '#EF4444'];

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
}

function toTitleCase(value: string) {
  return (value || '')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatHourLabel(hour: number) {
  const h = Number.isFinite(hour) ? hour : 0;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr12 = ((h + 11) % 12) + 1;
  return `${hr12}${suffix}`;
}

export default function AdminAnalyticsPage() {
  const { isLoaded, isSignedIn } = useUser();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  const defaultEnd = useMemo(() => new Date(), []);
  const defaultStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);

  const [startDate, setStartDate] = useState(() => toDateInputValue(defaultStart));
  const [endDate, setEndDate] = useState(() => toDateInputValue(defaultEnd));

  const rangeDays = useMemo(() => {
    const rangeStart = data?.range?.start ?? startDate;
    const rangeEnd = data?.range?.end ?? endDate;
    const start = rangeStart ? new Date(rangeStart) : null;
    const end = rangeEnd ? new Date(rangeEnd) : null;
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return Math.max(1, data?.timeseries?.dailyRegistrations?.length ?? 1);
    }
    const ms = end.getTime() - start.getTime();
    const days = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, days);
  }, [startDate, endDate, data]);

  const quickRanges = useMemo(
    () => [
      { label: '1D', days: 1 },
      { label: '3D', days: 3 },
      { label: '5D', days: 5 },
      { label: '7D', days: 7 },
      { label: '14D', days: 14 },
      { label: '1M', days: 30 },
      { label: '2M', days: 60 },
      { label: '3M', days: 90 },
    ],
    []
  );
  const [activeQuickRange, setActiveQuickRange] = useState<string | null>('1M');

  const applyQuickRange = async (label: string, days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    const startValue = toDateInputValue(start);
    const endValue = toDateInputValue(end);
    setStartDate(startValue);
    setEndDate(endValue);
    setActiveQuickRange(label);
    await fetchAnalytics({ start: startValue, end: endValue });
  };

  const fetchAnalytics = async (override?: { start?: string; end?: string }) => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const params = new URLSearchParams();
      const queryStart = override?.start ?? startDate;
      const queryEnd = override?.end ?? endDate;
      if (queryStart) params.set('start', queryStart);
      if (queryEnd) params.set('end', queryEnd);

      const response = await axiosInstance.get(`/admin/analytics?${params.toString()}`);
      setData(response.data as AnalyticsResponse);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) return;
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  const kpis = useMemo(() => {
    const s = data?.summary;
    const total = s?.totalRegistrations ?? 0;
    const paid = s?.completedCount ?? 0;
    const uniqueSchools = s?.uniqueSchools ?? 0;
    const conversionRate = total > 0 ? Math.round((paid / total) * 100) : 0;
    const dropoffs = Math.max(0, total - paid);
    const avgRegistrationsPerDay = paid > 0 ? Math.round(paid / rangeDays) : 0;

    const peakWeekday = data?.insights?.peakWeekday?.weekday;
    const peakHour = typeof data?.insights?.peakHour?.hour === 'number' ? formatHourLabel(data.insights.peakHour.hour) : undefined;

    return {
      total,
      paid,
      conversionRate,
      dropoffs,
      uniqueSchools,
      avgRegistrationsPerDay,
      peakWeekday,
      peakHour,
    };
  }, [data, rangeDays]);

  const topReferral = useMemo(() => {
    const list = data?.breakdown.byReferralSource ?? [];
    return list.length > 0 ? list[0] : undefined;
  }, [data]);

  const topExamDate = useMemo(() => {
    const list = data?.breakdown.byExamDate ?? [];
    return list.length > 0 ? list[0] : undefined;
  }, [data]);

  const topSchool = useMemo(() => {
    const list = data?.breakdown.topSchools ?? [];
    return list.length > 0 ? list[0] : undefined;
  }, [data]);

  const examTypeForLabel = (examType: string) => {
    if (examType === 'foundation') return 'Foundation';
    if (examType === 'regular') return 'Comp28';
    return examType || 'N/A';
  };

  const startedPaidByExamType = useMemo(() => {
    return (data?.breakdown?.startedPaidByExamType ?? []).map((d) => ({
      ...d,
      examType: examTypeForLabel(d.examType),
    }));
  }, [data]);

  const startedPaidByClass = useMemo(() => data?.breakdown?.startedPaidByClass ?? [], [data]);

  const dropoffsVsPaidDaily = useMemo(() => {
    return (data?.timeseries?.dailyRegistrations ?? []).map((d) => ({
      ...d,
      dropoffs: Math.max(0, (d.registrations ?? 0) - (d.completions ?? 0)),
    }));
  }, [data]);

  const dropoffsVsPaidByClass = useMemo(() => {
    return (startedPaidByClass ?? []).map((d) => ({
      ...d,
      dropoffs: Math.max(0, (d.started ?? 0) - (d.paid ?? 0)),
    }));
  }, [startedPaidByClass]);

  const dropoffsVsPaidByExamType = useMemo(() => {
    return (startedPaidByExamType ?? []).map((d: any) => ({
      ...d,
      dropoffs: Math.max(0, (d.started ?? 0) - (d.paid ?? 0)),
    }));
  }, [startedPaidByExamType]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-linear-to-b from-white to-blue-50">
      <div className="shrink-0 px-6 pt-4 pb-3">
        <h1 className="text-xl sm:text-2xl font-bold mb-1 leading-tight" style={{ color: '#212529' }}>
          Analytics
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600">Registration insights and performance</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-xs font-medium text-zinc-500 mb-2">Quick ranges (auto-apply)</div>
                <div className="flex flex-wrap items-center gap-2">
                  {quickRanges.map((r) => (
                    <Button
                      key={r.label}
                      type="button"
                      variant={activeQuickRange === r.label ? 'default' : 'outline'}
                      size="sm"
                      className="h-8"
                      onClick={() => applyQuickRange(r.label, r.days)}
                      disabled={loading}
                    >
                      {r.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                <div>
                  <div className="text-xs font-medium text-zinc-500 mb-1">Start date</div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-9"
                        disabled={loading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-zinc-500" />
                        {startDate ? formatDisplayDate(startDate) : 'Pick a start date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={parseDateValue(startDate)}
                        onSelect={(value) => {
                          if (!value) return;
                          setStartDate(toDateInputValue(value));
                          setActiveQuickRange(null);
                        }}
                        disabled={loading}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <div className="text-xs font-medium text-zinc-500 mb-1">End date</div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-9"
                        disabled={loading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-zinc-500" />
                        {endDate ? formatDisplayDate(endDate) : 'Pick an end date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={parseDateValue(endDate)}
                        onSelect={(value) => {
                          if (!value) return;
                          setEndDate(toDateInputValue(value));
                          setActiveQuickRange(null);
                        }}
                        disabled={loading}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button onClick={() => fetchAnalytics()} disabled={loading} className="h-9">
                  {loading ? 'Loading...' : 'Apply'}
                </Button>
              </div>
              <p className="text-xs text-zinc-500">
                Pick a custom range and click apply to refresh the analytics.
              </p>
            </div>
            {errorMessage && <p className="text-sm text-red-600 mt-3">{errorMessage}</p>}
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 items-start">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-lg border bg-white px-4 py-3">
                      <div className="text-xs text-zinc-500">Drop-offs</div>
                      <div className="text-2xl font-bold mt-1" style={{ color: '#212529' }}>
                        {formatCompactNumber(kpis.dropoffs)}
                      </div>
                    </div>
                    <div className="rounded-lg border bg-white px-4 py-3">
                      <div className="text-xs text-zinc-500">Paid registrations</div>
                      <div className="text-2xl font-bold mt-1" style={{ color: '#212529' }}>
                        {formatCompactNumber(kpis.paid)}
                      </div>
                    </div>
                    <div className="rounded-lg border bg-white px-4 py-3">
                      <div className="text-xs text-zinc-500">Conversion rate</div>
                      <div className="text-2xl font-bold mt-1" style={{ color: '#212529' }}>
                        {kpis.conversionRate}%
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">From {formatCompactNumber(kpis.total)} attempts</div>
                    </div>
                    <div className="rounded-lg border bg-white px-4 py-3">
                      <div className="text-xs text-zinc-500">Avg registrations / day</div>
                      <div className="text-2xl font-bold mt-1" style={{ color: '#212529' }}>
                        {formatCompactNumber(kpis.avgRegistrationsPerDay)}
                      </div>
                    </div>
                    <div className="rounded-lg border bg-white px-4 py-3 sm:col-span-2">
                      <div className="text-xs text-zinc-500">Peak time</div>
                      <div className="text-lg font-semibold mt-1" style={{ color: '#212529' }}>
                        {kpis.peakWeekday || kpis.peakHour
                          ? [kpis.peakWeekday, kpis.peakHour].filter(Boolean).join(', ')
                          : '—'}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">Most registrations</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Highlights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border bg-white px-4 py-3">
                    <div className="text-xs text-zinc-500">Top school</div>
                    <div className="text-sm font-semibold mt-1" style={{ color: '#212529' }}>
                      {topSchool?.schoolName ? toTitleCase(topSchool.schoolName) : 'N/A'}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {topSchool ? `${formatCompactNumber(topSchool.count)} registrations` : ''}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-white px-4 py-3">
                    <div className="text-xs text-zinc-500">Top referral source</div>
                    <div className="text-sm font-semibold mt-1" style={{ color: '#212529' }}>
                      {topReferral?.referralSource || 'N/A'}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {topReferral ? `${formatCompactNumber(topReferral.count)} registrations` : ''}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-white px-4 py-3">
                    <div className="text-xs text-zinc-500">Most selected exam date</div>
                    <div className="text-sm font-semibold mt-1" style={{ color: '#212529' }}>
                      {topExamDate?.examDate || 'N/A'}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {topExamDate ? `${formatCompactNumber(topExamDate.count)} registrations` : ''}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Drop-offs vs paid registrations (daily)</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dropoffsVsPaidDaily} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />

                      <Line type="monotone" dataKey="dropoffs" name="Drop-offs" stroke="#EF4444" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="completions" name="Paid registrations" stroke="#16A34A" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Drop-offs vs paid registrations by class</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dropoffsVsPaidByClass} margin={{ top: 10, right: 20, left: 0, bottom: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="currentClass"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `Class ${value}`}
                          label={{ value: 'Class', position: 'insideBottom', offset: -4, fontSize: 12 }}
                        />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="dropoffs" name="Drop-offs" fill="#EF4444" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="paid" name="Paid registrations" fill="#16A34A" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Referral sources (top)</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.breakdown.byReferralSource ?? []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="referralSource" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Registrations" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Exam type distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip />
                      <Legend />
                      <Pie
                        data={(data?.breakdown.byExamType ?? []).map((d) => ({
                          ...d,
                          examType: examTypeForLabel(d.examType),
                        }))}
                        dataKey="count"
                        nameKey="examType"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={2}
                      >
                        {(data?.breakdown.byExamType ?? []).map((entry, index) => (
                          <Cell key={`${entry.examType}-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4 items-start">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Drop-offs vs paid registrations by exam type</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dropoffsVsPaidByExamType} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="examType" tick={{ fontSize: 12 }} width={120} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="dropoffs" name="Drop-offs" fill="#EF4444" radius={[0, 6, 6, 0]} />
                      <Bar dataKey="paid" name="Paid registrations" fill="#16A34A" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4 items-start">
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Top schools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden bg-white max-h-[340px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>School</TableHead>
                          <TableHead className="text-right">Registrations</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(data?.breakdown.topSchools ?? []).length ? (
                          (data?.breakdown.topSchools ?? []).map((row) => (
                            <TableRow key={row.schoolName}>
                              <TableCell className="text-sm">{toTitleCase(row.schoolName)}</TableCell>
                              <TableCell className="text-right text-sm font-semibold">{formatCompactNumber(row.count)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-sm text-zinc-500">
                              No data
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Exam dates (top)</CardTitle>
                </CardHeader>
                <CardContent className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(data?.breakdown.byExamDate ?? []).slice(0, 10)} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="examDate" tick={{ fontSize: 12 }} width={110} />
                      <Tooltip />
                      <Bar dataKey="count" name="Registrations" fill="#2563EB" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
