import pagesJson from "@/content/pages.json";
import diariesJson from "@/content/diaries.json";

/*
 * Her standing pages and her blog, as captured from the old site.
 *
 * Both files are written by scripts (capture_pages.py, capture_diaries.py) and
 * never by hand, so re-running a script before cutover picks up anything she
 * has changed since.
 */
export type CapturedPage = { slug: string; title: string; intro: string; description: string; words: number; body: string };
export type Diary = {
  slug: string;
  title: string;
  published: string;
  image: string | null;
  excerpt: string;
  tags: string[];
  categories: string[];
  words: number;
  body: string;
};

const pages = pagesJson as CapturedPage[];
export const diaries = diariesJson as Diary[];

export const capturedPage = (slug: string) => pages.find((p) => p.slug === slug) ?? null;
export const diary = (slug: string) => diaries.find((d) => d.slug === slug) ?? null;

/** "2026-09-29" → "29 September 2026" */
export function longDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** A rough reading time, for the line under a post's title. */
export const minutes = (words: number) => Math.max(1, Math.round(words / 220));
