import type { Media } from "@/content/site";

/* Where the 2880 copy of a full-width recording is worth it: a retina screen past phone width, or any very wide one. */
export const RETINA_WIDE = "(min-width: 768px) and (min-resolution: 1.5dppx), (min-width: 1600px)";

/* A recording starts on the frame its poster shows (a #t media fragment), so the poster hands off without a jump. */
export const fromPoster = (src: string, media: Media) =>
  media.kind === "video" && media.posterAt ? `${src}#t=${media.posterAt}` : src;

/* The visitor's browser asks to save data: nothing loads before it is needed. */
export const saveData = () => (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
