export type TestimonialType = 'student' | 'parent';

export type TestimonialAccent = 'blue' | 'gold' | 'neutral';

/** Shorts are filmed vertically; regular uploads are 16:9. Drives the player size. */
export type TestimonialOrientation = 'landscape' | 'portrait';

export interface Testimonial {
  id: string;
  type: TestimonialType;
  name: string;
  subtitle: string;        // "Navi Mumbai Center" / "Parent of Arman Agarwal"
  quote: string;           // Short pull-quote shown in the highlighted box
  videoUrl: string;        // YouTube watch / shorts link
  thumbnail?: string;      // Optional - derived from videoUrl when omitted
  badge: string;           // "99.7948 %ile" / "AIR 1444"
  examLabel: string;       // "JEE Mains 2026 – Session 1"
  duration?: string;       // "04:12" - optional pill on the thumbnail
  accent?: TestimonialAccent;
  orientation?: TestimonialOrientation; // Optional - derived from videoUrl when omitted
  enabled?: boolean;
}

export const TESTIMONIAL_ACCENTS: Record<TestimonialAccent, { bg: string; border: string }> = {
  blue: { bg: '#eef4ff', border: '#c4daff' },
  gold: { bg: '#fff8e6', border: '#ffebb3' },
  neutral: { bg: '#fafaf5', border: '#e5e7eb' },
};

/** Pulls the 11-character video id out of a watch / shorts / youtu.be / embed URL. */
export function youTubeIdFromUrl(videoUrl: string): string | null {
  const match = videoUrl.match(
    /(?:youtube\.com\/(?:shorts\/|watch\?v=|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Derives a YouTube thumbnail from a video link so admins only have to paste the
 * URL. Returns null when the id can't be parsed.
 */
export function thumbnailFromVideoUrl(videoUrl: string): string | null {
  const id = youTubeIdFromUrl(videoUrl);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/** Shorts links are vertical; everything else is treated as 16:9. */
export function orientationFromVideoUrl(videoUrl: string): TestimonialOrientation {
  return /youtube\.com\/shorts\//.test(videoUrl) ? 'portrait' : 'landscape';
}

/**
 * Privacy-preserving embed URL that autoplays once the dialog opens.
 *
 * The player chrome is hidden (`controls`/`fs`/`iv_load_policy`) so the video
 * reads as part of the page rather than as an embedded YouTube player.
 * Click-to-play/pause still works with the control bar hidden.
 */
export function youTubeEmbedUrl(videoUrl: string): string | null {
  const id = youTubeIdFromUrl(videoUrl);
  if (!id) return null;
  const params = new URLSearchParams({
    autoplay: '1',
    controls: '0',      // no progress bar, volume, settings or fullscreen button
    fs: '0',            // belt and braces: no fullscreen control
    iv_load_policy: '3', // no annotation overlays
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}
