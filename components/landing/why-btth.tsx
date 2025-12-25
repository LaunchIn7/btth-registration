import { Award, TrendingUp } from "lucide-react";
import { memo } from "react";

interface WhyBtthProps {
  brandPrimary: string;
}

export const WhyBtth = ({ brandPrimary }: WhyBtthProps) => {
  return <section id="why-btth" className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10 md:mb-12 leading-tight" style={{ color: brandPrimary }}>
      Why Your Child Should Take BTTH 2.0
    </h2>
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
      <div className="bg-white p-6 sm:p-8 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4 border border-[#dfe3fb] shadow-sm">
        <Award className="w-10 h-10 sm:w-12 sm:h-12 text-[#f2a900]" />
        <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: '#1d243c' }}>Win Up to 50% Scholarship</h3>
        <p className="text-sm sm:text-base text-[#4b5575]">
          On BT Navi Mumbai JEE/NEET/Foundation courses based on your performance
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4 border border-[#dfe3fb] shadow-sm">
        <Award className="w-10 h-10 sm:w-12 sm:h-12 text-[#f2a900]" />
        <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: '#1d243c' }}>Stand a Chance to Win an iPad</h3>
        <p className="text-sm sm:text-base text-[#4b5575]">
          Top BTTH 2.0 performer walks away with a brand-new iPad
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4 border border-[#dfe3fb] shadow-sm">
        <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-[#f2a900]" />
        <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: '#1d243c' }}>Get a Clear Academic Roadmap</h3>
        <p className="text-sm sm:text-base text-[#4b5575]">
          From BT's experienced faculty team with personalized guidance
        </p>
      </div>
    </div>
  </section>
};

export default memo(WhyBtth);