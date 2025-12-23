"use client";

import Image from "next/image";
import { Star } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import testimonials from "@/public/testimonials.json";

type Testimonial = (typeof testimonials)[number];

const brandPrimary = "#1d243c";
const brandMuted = "#4b5575";
const accent = "#f2a900";

function RatingStars({ rating }: { rating: Testimonial["rating"] }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const isActive = index < rating;
        return (
          <Star
            key={index}
            className="h-4 w-4"
            strokeWidth={1.5}
            color={isActive ? accent : "#c7cbe8"}
            fill={isActive ? accent : "none"}
          />
        );
      })}
    </div>
  );
}

function RankBadge({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;

  return (
    <span className="rounded-full bg-[#f5f6fb] px-3 py-1 text-xs font-medium text-[#333b62]">
      {label}: {value}
    </span>
  );
}

export function TestimonialsCarousel() {
  return (
    <section className="bg-linear-to-b from-[#f5f6fb] via-[#eff1fb] to-white py-12 sm:py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-3 text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#6c7394]">
            student love
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight text-[#1d243c]">
            Testimonials from recent BT toppers
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-[#4b5575] md:max-w-3xl">
            Hear how focused mentoring, sharp test series, and personalised
            guidance at Bakliwal Tutorials Navi Mumbai helped students secure
            standout AIRs across JEE Main & Advanced.
          </p>
        </div>

        <div className="mt-8 md:mt-12">
          <Carousel
            opts={{ align: "start", loop: true, skipSnaps: false }}
            className="relative"
          >
            <CarouselContent className="-ml-3 sm:-ml-4">
              {testimonials.map((review) => {
                const imagePath = review.image?.startsWith("http")
                  ? review.image
                  : `https://btnavimumbai.com/${review.image?.replace(/^\/+/, "")}`;
                return (
                  <CarouselItem
                    key={review.id}
                    className="basis-full pl-3 sm:basis-1/2 sm:pl-4 xl:basis-1/3"
                  >
                    <article className="flex h-full flex-col rounded-2xl border border-[#e3e6f5] bg-white/95 p-6 shadow-lg shadow-[#1d243c]/5 backdrop-blur">
                      <div className="flex items-center gap-4">
                        <div className="relative size-14 overflow-hidden rounded-full border border-[#e3e6f5] bg-[#f8f9ff]">
                          <Image
                            src={imagePath}
                            alt={review.imageAlt || review.studentName}
                            width={56}
                            height={56}
                            className="size-14 object-cover"
                          />
                        </div>
                        <div className="text-left">
                          <p
                            className="text-base font-semibold"
                            style={{ color: brandPrimary }}
                          >
                            {review.studentName}
                          </p>
                          <p className="text-xs font-medium uppercase tracking-wide text-[#6c7394]">
                            {review.examType}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        <RatingStars rating={review.rating} />
                        <p className="text-sm font-semibold text-[#333b62]">
                          {review.displayRanks || review.rank?.rawText}
                        </p>
                      </div>

                      <p
                        className="mt-4 flex-1 text-sm sm:text-base leading-relaxed"
                        style={{ color: brandMuted }}
                      >
                        &ldquo;{review.testimonial}&rdquo;
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <RankBadge label="JEE Adv" value={review.rank?.jeeAdvanced} />
                        <RankBadge label="JEE Main" value={review.rank?.jeeMains} />
                      </div>
                    </article>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-2 md:-left-6 border-none bg-white text-[#1d243c] shadow-lg shadow-[#1d243c]/10 hover:bg-[#f5f6fb]" />
            <CarouselNext className="hidden sm:flex -right-2 md:-right-6 border-none bg-white text-[#1d243c] shadow-lg shadow-[#1d243c]/10 hover:bg-[#f5f6fb]" />
          </Carousel>
        </div>
      </div>
    </section>
  );
}

export default TestimonialsCarousel;
