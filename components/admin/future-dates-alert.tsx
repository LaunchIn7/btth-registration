'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { AlertTriangle, X } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { ExamConfiguration } from '@/lib/types/exam-config';

const MIN_FUTURE_DATES = 3;

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function FutureDatesAlert() {
  const { isLoaded, isSignedIn } = useUser();
  const [upcomingDates, setUpcomingDates] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fetchConfig = async () => {
      try {
        const response = await axiosInstance.get('/admin/config');
        const config = response.data?.data as ExamConfiguration | undefined;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureDates = (config?.examDates ?? [])
          .filter((date) => date.enabled && date.value)
          .map((date) => toDateOnly(date.value))
          .filter((date) => !Number.isNaN(date.getTime()) && date > today)
          .sort((a, b) => a.getTime() - b.getTime())
          .map((date) => date.toISOString().slice(0, 10));

        setUpcomingDates(futureDates);
        setHasLoaded(true);
      } catch (error) {
        console.error('Failed to load exam dates for alert:', error);
        setHasLoaded(true);
      }
    };

    fetchConfig();
  }, [isLoaded, isSignedIn]);

  const shouldShow = useMemo(() => {
    return hasLoaded && upcomingDates.length < MIN_FUTURE_DATES;
  }, [hasLoaded, upcomingDates]);

  if (!shouldShow || dismissed) return null;

  return (
    <div className="mx-6 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-600">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Only {upcomingDates.length} upcoming exam date{upcomingDates.length === 1 ? '' : 's'} left.
            </p>
            <p className="text-xs text-amber-800">
              Add more future slots so registrations stay open for students.
              <Link href="/admin/config" className="ml-1 underline underline-offset-2 font-medium">
                Open configuration
              </Link>
              .
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="self-end rounded-md p-1 text-amber-700 hover:bg-amber-100 hover:text-amber-900"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
