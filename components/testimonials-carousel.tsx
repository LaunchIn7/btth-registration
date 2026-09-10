"use client";

import * as React from "react";
import Image from "next/image";
import { Play, Quote, Sparkles, X } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import defaultTestimonials from "@/public/testimonials.json";
import {
  TESTIMONIAL_ACCENTS,
  orientationFromVideoUrl,
  thumbnailFromVideoUrl,
  youTubeEmbedUrl,
  type Testimonial,
  type TestimonialAccent,
} from "@/lib/types/testimonial";
import Autoplay from "embla-carousel-autoplay";

function TestimonialCard({
  item,
  onPlay,
}: {
  item: Testimonial;
  onPlay: (item: Testimonial) => void;
}) {
  const accent =
    TESTIMONIAL_ACCENTS[(item.accent as TestimonialAccent) ?? "blue"] ??
    TESTIMONIAL_ACCENTS.blue;
  // Admins only have to paste the video link - the thumbnail is derived from it.
  const thumbnail = item.thumbnail || thumbnailFromVideoUrl(item.videoUrl);

  if (!thumbnail) return null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#e3e6f5] bg-white shadow-lg shadow-[#1d243c]/5 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl">
      <div className="p-5 sm:p-6">
        <div
          className="relative rounded-2xl border p-5 sm:p-6 shadow-sm"
          style={{ backgroundColor: accent.bg, borderColor: accent.border }}
        >
          <Quote
            className="absolute left-3 top-3 h-7 w-7 text-[#1d243c] opacity-20"
            fill="currentColor"
            strokeWidth={0}
          />
          <Sparkles
            className="absolute right-3 top-3 h-4 w-4 text-[#f2a900]"
            fill="#f2a900"
            strokeWidth={1}
          />
          <h4 className="relative z-10 pt-2 text-center text-base sm:text-lg font-bold leading-snug text-[#1d243c]">
            &ldquo;{item.quote}&rdquo;
          </h4>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onPlay(item)}
        aria-label={`Play the video testimonial from ${item.name}`}
        className="relative block h-56 w-full cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-[#f2a900]/70 sm:h-64"
      >
        <Image
          src={thumbnail}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
          <span className="flex size-16 items-center justify-center rounded-full bg-white text-[#1d243c] shadow-2xl transition-transform group-hover:scale-110">
            <Play className="size-7 translate-x-0.5" fill="currentColor" strokeWidth={0} />
          </span>
        </div>
        {item.duration ? (
          <span className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            {item.duration}
          </span>
        ) : null}
      </button>

      <div className="mt-auto p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base sm:text-lg font-bold text-[#1d243c]">
              {item.name}
            </p>
            <p className="truncate text-xs text-[#6c7394]">{item.subtitle}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#1d243c] px-4 py-1.5 text-sm font-bold text-white shadow-md">
            {item.badge}
          </span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#f2a900]">
          {item.examLabel}
        </p>
      </div>
    </article>
  );
}

function VideoDialog({
  item,
  onOpenChange,
}: {
  item: Testimonial | null;
  onOpenChange: (open: boolean) => void;
}) {
  const embedUrl = item ? youTubeEmbedUrl(item.videoUrl) : null;
  const isPortrait = item
    ? (item.orientation ?? orientationFromVideoUrl(item.videoUrl)) === "portrait"
    : false;

  return (
    <Dialog open={Boolean(item && embedUrl)} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden border-white/10 bg-[#11162a] p-0 sm:max-w-none"
        style={{
          // Inline rather than arbitrary Tailwind classes: a comma inside
          // `w-[min(...,...)]` stops the class from being generated at all.
          display: "flex",
          flexDirection: "column",
          width: isPortrait
            ? "min(92vw, calc(78svh * 9 / 16))"
            : "min(94vw, 896px)",
          maxWidth: "94vw",
          maxHeight: "92svh",
        }}
      >
        {item ? (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 text-left">
              <div className="min-w-0">
                <DialogTitle className="truncate text-base font-bold text-white">
                  {item.name}
                </DialogTitle>
                <DialogDescription className="truncate text-xs text-white/60">
                  {item.subtitle} &middot; {item.badge} &middot; {item.examLabel}
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close video"
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-90"
              >
                <X className="size-5" />
              </button>
            </div>
            {/*
              The iframe only exists while the dialog is open, so closing it tears
              the player down and stops the audio.
            */}
            <div
              className="w-full bg-black"
              style={{ aspectRatio: isPortrait ? "9 / 16" : "16 / 9" }}
            >
              <iframe
                key={item.id}
                src={embedUrl ?? ""}
                title={`${item.name} - video testimonial`}
                className="h-full w-full border-none"
                allow="autoplay; encrypted-media"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type TestimonialsCarouselProps = {
  sectionId?: string;
  /** Optional override - lets the section be driven by admin-managed content. */
  items?: Testimonial[];
};

export function TestimonialsCarousel({
  sectionId = "testimonials",
  items,
}: TestimonialsCarouselProps) {
  const testimonials = (items ?? (defaultTestimonials as Testimonial[])).filter(
    (item) => item.enabled !== false
  );

  const [active, setActive] = React.useState<Testimonial | null>(null);
  const autoplay = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false })
  );

  // Don't slide the cards around behind an open video.
  const handlePlay = React.useCallback((item: Testimonial) => {
    autoplay.current.stop();
    setActive(item);
  }, []);

  const handleOpenChange = React.useCallback((open: boolean) => {
    if (!open) {
      setActive(null);
      autoplay.current.play();
    }
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <section
      id={sectionId}
      className="bg-linear-to-b from-[#f5f6fb] via-[#eff1fb] to-white py-12 sm:py-16 md:py-20"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-3 text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#6c7394]">
            success stories
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight text-[#1d243c]">
            Student &amp; Parent Testimonials
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-[#4b5575] md:max-w-3xl">
            Hear directly from students and parents about how focused mentoring,
            sharp test series, and personalised guidance at Bakliwal Tutorials
            Navi Mumbai shaped their JEE journey.
          </p>
        </div>

        <div className="mt-8 md:mt-12">
          <Carousel
            opts={{ align: "start", loop: true, skipSnaps: false }}
            plugins={[autoplay.current]}
            className="relative"
          >
            <CarouselContent className="-ml-3 sm:-ml-4">
              {testimonials.map((item) => (
                <CarouselItem
                  key={item.id}
                  className="basis-full pl-3 sm:basis-1/2 sm:pl-4 xl:basis-1/3"
                >
                  <TestimonialCard item={item} onPlay={handlePlay} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex left-0 md:left-2 border-none bg-[#ffffffbc] text-[#1d243c] shadow-lg shadow-[#1d243c]/10 hover:bg-[#f5f6fb]" />
            <CarouselNext className="hidden sm:flex right-0 md:right-2 border-none bg-[#ffffffbc] text-[#1d243c] shadow-lg shadow-[#1d243c]/10 hover:bg-[#f5f6fb]" />
          </Carousel>
        </div>

        <div className="mt-10 text-center">
          <a
            href="https://www.youtube.com/@btnavimumbai/videos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-[#1d243c] px-8 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-xl transition-all hover:bg-[#f2a900] hover:text-[#1d243c] active:scale-95"
          >
            Watch More Success Stories
          </a>
        </div>
      </div>

      <VideoDialog item={active} onOpenChange={handleOpenChange} />
    </section>
  );
}

export default TestimonialsCarousel;
