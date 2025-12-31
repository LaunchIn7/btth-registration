'use client';

import { useState } from "react"
import Link from "next/link"
import { CalendarDays, Plus } from "lucide-react"
import { useExamConfig } from "@/lib/hooks/use-exam-config"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Props = {}

const ExamSlots = (props: Props) => {
  const { config, loading } = useExamConfig();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#8d93b8]">
          <CalendarDays className="h-4 w-4 text-[#f2a900]" />
          <span>Upcoming Exam Slots</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#8d93b8]">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8d93b8]" />
          <span>Loading exam slots...</span>
        </div>
      </div>
    );
  }

  if (!config || config.examDates.length === 0) {
    return null;
  }

  const visibleSlots = config.examDates.slice(0, 2);
  const remainingSlots = config.examDates.slice(2);
  const hasMoreSlots = remainingSlots.length > 0;

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#8d93b8]">
        <CalendarDays className="h-4 w-4 text-[#f2a900]" />
        <span>Upcoming Exam Slots</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {visibleSlots.map((slot) => (
          <Link
            key={slot.id}
            href={`/register?examDate=${slot.value}`}
            className="flex flex-col gap-2 rounded-2xl border border-[#dfe3fb] bg-white/90 px-4 py-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-[#c5caed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2a900]/40 sm:inline-flex sm:flex-row sm:items-center sm:gap-3"
            prefetch={false}
            aria-label={`Register for ${slot.label} on ${slot.displayDate} at ${slot.time}`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#8d93b8]">
              {slot.label}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[#1d243c]">
              <span className="font-semibold">{slot.displayDate}</span>
              <span className="text-[#b0b5d4]">•</span>
              <span className="text-[#4b5575]">{slot.time}</span>
            </div>
          </Link>
        ))}

        {hasMoreSlots && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                className="flex flex-col gap-2 rounded-2xl border border-[#dfe3fb] bg-white/90 px-4 py-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-[#c5caed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2a900]/40 sm:inline-flex sm:flex-row sm:items-center sm:gap-3 cursor-pointer"
                aria-label={`View ${remainingSlots.length} more exam slots`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#8d93b8]">
                  More Slots
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[#1d243c]">
                  <Plus className="h-4 w-4" />
                  <span className="font-semibold">{remainingSlots.length} Slot{remainingSlots.length > 1 ? 's' : ''}</span>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>All Available Exam Slots</DialogTitle>
                <DialogDescription>
                  Choose your preferred exam date and time
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4 max-h-[60vh] overflow-y-auto">
                {config.examDates.map((slot) => (
                  <Link
                    key={slot.id}
                    href={`/register?examDate=${slot.value}`}
                    onClick={() => setOpen(false)}
                    className="flex flex-col gap-2 rounded-xl border border-[#dfe3fb] bg-white px-4 py-3 text-sm shadow-sm transition hover:bg-blue-50 hover:border-[#c5caed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2a900]/40"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#8d93b8]">
                        {slot.label}
                      </div>
                      <div className="text-xs text-[#8d93b8]">{slot.dayOfWeek}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[#1d243c]">
                      <span className="font-semibold">{slot.displayDate}</span>
                      <span className="text-[#b0b5d4]">•</span>
                      <span className="text-[#4b5575]">{slot.time}</span>
                      {slot.reportingTime && (
                        <>
                          <span className="text-[#b0b5d4]">•</span>
                          <span className="text-xs text-[#6b7280]">Report by {slot.reportingTime}</span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}

export default ExamSlots