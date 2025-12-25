import Link from "next/link"
import { CalendarDays } from "lucide-react"

type Props = {}

const ExamSlots = (props: Props) => {
  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#8d93b8]">
        <CalendarDays className="h-4 w-4 text-[#f2a900]" />
        <span>Upcoming Exam Slots</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {[
          { label: "Slot 1", date: "11 January 2026", time: "12:00 PM", value: "2026-01-11" },
          { label: "Slot 2", date: "18 January 2026", time: "12:00 PM", value: "2026-01-18" },
        ].map((slot) => (
          <Link
            key={slot.label}
            href={`/register?examDate=${slot.value}`}
            className="flex flex-col gap-2 rounded-2xl border border-[#dfe3fb] bg-white/90 px-4 py-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-[#c5caed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2a900]/40 sm:inline-flex sm:flex-row sm:items-center sm:gap-3"
            prefetch={false}
            aria-label={`Register for ${slot.label} on ${slot.date} at ${slot.time}`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#8d93b8]">
              {slot.label}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[#1d243c]">
              <span className="font-semibold">{slot.date}</span>
              <span className="text-[#b0b5d4]">•</span>
              <span className="text-[#4b5575]">{slot.time}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default ExamSlots