import Link from "next/link";
import { Award, BookOpen, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <section className="container mx-auto px-4 py-8 sm:py-12 md:py-16 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
          <div className="space-y-6 sm:space-y-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight" style={{ color: '#212529' }}>
              BTTH 2.0 – Talent Hunt & Scholarship Exam for Future JEE Toppers
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-zinc-600 leading-relaxed">
              A merit-based talent exam by Bakliwal Tutorials Navi Mumbai to identify serious students from Classes 8-12 and support them with scholarships, guidance and a focused study plan.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 min-h-[48px]" style={{ backgroundColor: '#4F46E5' }}>
                  Register for BTTH 2.0
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 min-h-[48px]">
                Watch Topper Stories
              </Button>
            </div>
            <p className="text-sm text-zinc-500">
              Limited seats per exam date. No obligation to take admission after the exam – your performance report is yours to keep.
            </p>
          </div>

          <div className="relative h-[300px] sm:h-[350px] md:h-[400px] lg:h-[500px] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <div className="text-center p-8">
                <BookOpen className="w-24 h-24 mx-auto mb-4 text-blue-600" />
                <p className="text-xl font-semibold text-zinc-700">Student studying for competitive exams</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-pink-500 to-pink-600 py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            What is Bakliwal Tutorials Talent Hunt (BTTH 2.0)?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div className="text-white space-y-3 sm:space-y-4">
              <p className="text-base sm:text-lg leading-relaxed">
                BTTH 2.0 is a <strong>merit-based Talent Hunt & Scholarship Exam</strong> conducted by Bakliwal Tutorials Navi Mumbai for students of Classes 8-12 (JEE/NEET/Foundation stream).
              </p>
              <p className="text-base sm:text-lg leading-relaxed">
                Unlike random "offers" or discount ads, BTTH 2.0 evaluates students on <strong>concepts, thinking skills and exam temperament</strong> through a structured test designed by experienced BT faculty. Scholarships are awarded purely on performance, making it a fair and transparent opportunity for every student.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="aspect-video bg-gradient-to-br from-blue-400 to-cyan-300 rounded-lg flex items-center justify-center">
                <Users className="w-20 h-20 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10 md:mb-12 leading-tight" style={{ color: '#4F46E5' }}>
          Why Your Child Should Take BTTH 2.0
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-purple-50 p-6 sm:p-8 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4">
            <Award className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600" />
            <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: '#212529' }}>Win Up to 50% Scholarship</h3>
            <p className="text-sm sm:text-base text-zinc-600">
              On BT Navi Mumbai JEE/NEET/Foundation courses based on your performance
            </p>
          </div>

          <div className="bg-purple-50 p-6 sm:p-8 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4">
            <Award className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600" />
            <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: '#212529' }}>Stand a Chance to Win an iPad</h3>
            <p className="text-sm sm:text-base text-zinc-600">
              Top BTTH 2.0 performer walks away with a brand-new iPad
            </p>
          </div>

          <div className="bg-purple-50 p-6 sm:p-8 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4">
            <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600" />
            <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: '#212529' }}>Get a Clear Academic Roadmap</h3>
            <p className="text-sm sm:text-base text-zinc-600">
              From BT's experienced faculty team with personalized guidance
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-500 to-blue-600 py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-8 sm:mb-10 md:mb-12 leading-tight">
            Eligibility – Who Should Register for BTTH 2.0?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4 border shadow-sm">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
              <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: '#212529' }}>Class 8, 9, 10</h3>
              <p className="text-sm sm:text-base text-zinc-600">
                Foundation for JEE/NEET and school excellence. Build strong fundamentals early with competitive exam orientation.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4 border shadow-sm">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
              <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: '#212529' }}>Class 11 & 12</h3>
              <p className="text-sm sm:text-base text-zinc-600">
                JEE (Main + Advanced), NEET and related entrance exams. Intensive preparation for your target competitive exam.
              </p>
            </div>
          </div>

          <div className="text-center mt-8 sm:mt-10 md:mt-12">
            <Link href="/register" className="inline-block w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100 text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 min-h-[48px]">
                Check Eligibility & Register Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10 md:mb-12 leading-tight" style={{ color: '#212529' }}>
          BTTH 2.0 Exam Details
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          <div className="bg-purple-50 p-6 sm:p-8 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4">
            <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: '#212529' }}>Exam Dates</h3>
            <p className="text-sm sm:text-base text-zinc-600">
              <strong>11th January</strong> and <strong>18th January</strong>
            </p>
            <p className="text-sm text-zinc-500">
              Choose any one date as per your convenience. Both dates follow the same exam pattern and difficulty level.
            </p>
          </div>

          <div className="bg-purple-50 p-6 sm:p-8 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4">
            <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: '#212529' }}>Mode</h3>
            <p className="text-sm sm:text-base text-zinc-600">
              <strong>Offline, at Bakliwal Tutorials Navi Mumbai centre</strong>
            </p>
            <p className="text-sm text-zinc-500">
              Ideal for real exam feel and discipline. Experience the atmosphere of a competitive exam environment.
            </p>
          </div>

          <div className="bg-purple-50 p-6 sm:p-8 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4">
            <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: '#212529' }}>Duration & Pattern</h3>
            <p className="text-sm sm:text-base text-zinc-600">
              Objective-type test covering <strong>Maths & Science aptitude</strong>
            </p>
            <p className="text-sm text-zinc-500">
              Difficulty aligned to class level with questions designed to test conceptual understanding and problem-solving skills.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-zinc-900 py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 sm:mb-8 leading-tight">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-zinc-300 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
            Register now for BTTH 2.0 and take the first step towards your JEE/NEET success with merit-based scholarships and expert guidance.
          </p>
          <Link href="/register" className="inline-block w-full sm:w-auto max-w-sm sm:max-w-none mx-auto">
            <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 min-h-[48px]" style={{ backgroundColor: '#4F46E5' }}>
              Register for BTTH 2.0
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
