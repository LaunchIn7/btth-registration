'use client';

import Link from "next/link";
import { Award, BookOpen, CalendarDays, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";
import ExamSlots from "@/components/registration/exam-slots";
import WhyBtth from "@/components/landing/why-btth";
import { useExamConfig } from "@/lib/hooks/use-exam-config";

const brandPrimary = '#333b62';
const brandDark = '#272d4e';
const brandLight = '#f5f6fb';
const accent = '#f2a900';

export default function Home() {
  const { config } = useExamConfig();
  return (
    <div className="min-h-screen bg-linear-to-b from-[#f5f6fb] via-[#edf0fb] to-[#dfe3fb] text-[#1d243c]">
      <section id="overview" className="container mx-auto px-4 py-8 sm:py-12 md:py-16 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight" style={{ color: brandPrimary }}>
                BTTH 2.0
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-[#6c7394] font-medium">
                Talent Hunt & Scholarship Exam for Future JEE Toppers
              </p>
            </div>
            <p className="text-base sm:text-lg md:text-xl text-[#4b5575] leading-relaxed">
              A merit-based talent exam by Bakliwal Tutorials Navi Mumbai to identify serious students from Classes 8-12 and support them with scholarships, guidance and a focused study plan.
            </p>
            <ExamSlots />
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 min-h-[48px] bg-[#333b62] hover:bg-[#272d4e] text-white shadow-lg shadow-[#333b62]/20"
                >
                  Register for BTTH 2.0
                </Button>
              </Link>
              <Link href="#testimonials" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 min-h-[48px] border-[#d2d7f1] text-[#333b62] hover:bg-[#f5f6fb]"
              >
                Watch Topper Stories
              </Button>
              </Link>
            </div>
            <p className="text-sm text-[#6c7394]">
              Limited seats per exam date.
            </p>
          </div>

          {/* student-focused */}
          <div className="relative h-[300px] sm:h-[350px] md:h-[400px] lg:h-[500px] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
            <Image src="/student-focused.png" alt="Student studying for competitive exams" width={500} height={500} className="w-full h-full object-cover" />
            {/* <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <div className="text-center p-8">
                <BookOpen className="w-24 h-24 mx-auto mb-4 text-blue-600" />
                <p className="text-xl font-semibold text-zinc-700">Student studying for competitive exams</p>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      <section id="about" className="bg-linear-to-r from-[#333b62] via-[#2b3152] to-[#1f253f] py-12 sm:py-16 md:py-20 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            What is Bakliwal Tutorials Talent Hunt (BTTH 2.0)?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div className="space-y-3 sm:space-y-4">
              <p className="text-base sm:text-lg leading-relaxed">
                BTTH 2.0 is a <strong>merit-based Talent Hunt & Scholarship Exam</strong> conducted by Bakliwal Tutorials Navi Mumbai for students of Classes 8-12 (JEE/NEET/Foundation stream).
              </p>
              <p className="text-base sm:text-lg leading-relaxed">
                Unlike random "offers" or discount ads, BTTH 2.0 evaluates students on <strong>concepts, thinking skills and exam temperament</strong> through a structured test designed by experienced BT faculty. Scholarships are awarded purely on performance, making it a fair and transparent opportunity for every student.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/25">
              <Image
                src="/students-giving-exam.png"
                alt="Students giving exam"
                width={500}
                height={500}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <WhyBtth brandPrimary={brandPrimary} />

      <section id="eligibility" className="bg-linear-to-r from-[#272d4e] via-[#202645] to-[#181d37] py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-8 sm:mb-10 md:mb-12 leading-tight">
            Eligibility – Who Should Register for BTTH 2.0?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4 border border-[#dfe3fb] shadow-sm">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-[#333b62]" />
              <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: '#1d243c' }}>Class 8, 9, 10</h3>
              <p className="text-sm sm:text-base text-[#4b5575]">
                Foundation for JEE/NEET and school excellence. Build strong fundamentals early with competitive exam orientation.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4 border border-[#dfe3fb] shadow-sm">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-[#333b62]" />
              <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: '#1d243c' }}>Class 11 & 12</h3>
              <p className="text-sm sm:text-base text-[#4b5575]">
                JEE (Main + Advanced), NEET and related entrance exams. Intensive preparation for your target competitive exam.
              </p>
            </div>
          </div>

          <div className="text-center mt-8 sm:mt-10 md:mt-12">
            <Link href="/register" className="inline-block w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-white text-[#333b62] hover:bg-[#f5f6fb] text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 min-h-[48px] border border-white/40 shadow-lg shadow-black/10">
                Check Eligibility & Register Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="exam-details" className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10 md:mb-12 leading-tight" style={{ color: '#1d243c' }}>
          BTTH 2.0 Exam Details
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 sm:p-8 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4 border border-[#e1e4f3] shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: '#1d243c' }}>Exam Dates</h3>
            {config && config.examDates.length > 0 ? (
              <>
                <p className="text-sm sm:text-base text-[#4b5575]">
                  {config.examDates.map((date, index) => (
                    <span key={date.id}>
                      <strong>{date.displayDate}</strong>
                      {index < config.examDates.length - 1 && (index === config.examDates.length - 2 ? ' and ' : ', ')}
                    </span>
                  ))}
                </p>
                <p className="text-sm text-[#6c7394]">
                  {config.examDates[0]?.reportingTime && `Reporting ${config.examDates[0].reportingTime} · `}
                  Test starts {config.examDates[0]?.time || '12:00 PM'}. Choose the slot that suits you - pattern and difficulty stay identical.
                </p>
              </>
            ) : (
              <p className="text-sm sm:text-base text-[#4b5575]">
                <strong>Exam dates will be announced soon</strong>
              </p>
            )}
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4 border border-[#e1e4f3] shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: '#1d243c' }}>Mode</h3>
            <p className="text-sm sm:text-base text-[#4b5575]">
              <strong>Offline, at Bakliwal Tutorials Navi Mumbai centre</strong>
            </p>
            <p className="text-sm text-[#6c7394]">
              Ideal for real exam feel and discipline. Experience the atmosphere of a competitive exam environment.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4 border border-[#e1e4f3] shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: '#1d243c' }}>Duration & Pattern</h3>
            <p className="text-sm sm:text-base text-[#4b5575]">
              Objective-type test covering <strong>Maths & Science aptitude</strong>
            </p>
            <p className="text-sm text-[#6c7394]">
              Difficulty aligned to class level with questions designed to test conceptual understanding and problem-solving skills.
            </p>
          </div>
        </div>
      </section>

      <TestimonialsCarousel />

      <section id="register" className="bg-[#11162a] py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 sm:mb-8 leading-tight">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-[#d5dbff] mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
            Register now for BTTH 2.0 and take the first step towards your JEE/NEET success with merit-based scholarships and expert guidance.
          </p>
          <Link href="/register" className="inline-block w-full sm:w-auto max-w-sm sm:max-w-none mx-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 min-h-[48px] bg-[#f2a900] text-[#1d243c] hover:bg-[#d89200]"
            >
              Register for BTTH 2.0
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
