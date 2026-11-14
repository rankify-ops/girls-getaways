import pagesJson from "@/content/pages.json";
import diariesJson from "../../docs/portal-handoff/diaries.json";
import { plainText, renderMarkdown } from "@/lib/markdown";
import { fetchCollection, https } from "@/lib/portal";

/*
 * Her standing pages and her blog.
 *
 * The standing pages are captured from the old site by a script
 * (scripts/capture_pages.py) and are part of this site.
 *
 * The blog is hers to run. Every post is an item in her portal, written in a
 * plain text box and turned into a page here (lib/markdown.ts), so a post she
 * adds or corrects is on the site within the minute and nobody deploys
 * anything. The copy in docs/portal-handoff/diaries.json is what the posts
 * looked like on the day they were brought across; it is only what the site
 * falls back to if the portal cannot be reached, because her blog going blank
 * is never the right answer to our outage.
 */
export type CapturedPage = { slug: string; title: string; intro: string; description: string; words: number; body: string };
export type Diary = {
  slug: string;
  title: string;
  /** YYYY-MM-DD */
  published: string;
  image: string | null;
  excerpt: string;
  tags: string[];
  words: number;
  /** The post as markup, made from her writing by lib/markdown.ts. */
  html: string;
};

type Row = { slug: string; position?: number; data: Record<string, unknown> };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function toDiary(row: Row): Diary {
  const d = row.data ?? {};
  const body = str(d.body);
  const text = plainText(body);
  const given = str(d.excerpt);
  const cut = text.slice(0, 177);
  return {
    slug: row.slug,
    title: str(d.title) || row.slug,
    published: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(str(d.published)) ? str(d.published) : "",
    image: https(d.image),
    // Hers when she wrote one; otherwise the opening of the post.
    excerpt: given || (text.length > 180 ? `${cut.slice(0, cut.lastIndexOf(" "))}…` : text),
    tags: Array.isArray(d.tags) ? (d.tags as unknown[]).map(String) : [],
    words: text ? text.split(" ").length : 0,
    html: renderMarkdown(body),
  };
}

/** Newest first. A post with no date sorts last rather than first. */
const newestFirst = (a: Diary, b: Diary) => (b.published || "0").localeCompare(a.published || "0");

const captured: Diary[] = (diariesJson as Row[]).map(toDiary).sort(newestFirst);

/** Every published post. The portal first, the captured copy as the fallback. */
export async function getDiaries(): Promise<Diary[]> {
  const live = await fetchCollection("diaries");
  return live ? live.map(toDiary).sort(newestFirst) : captured;
}

export async function getDiary(slug: string): Promise<Diary | null> {
  return (await getDiaries()).find((d) => d.slug === slug) ?? null;
}

const pages = pagesJson as CapturedPage[];
export const capturedPage = (slug: string) => pages.find((p) => p.slug === slug) ?? null;

/** "2026-09-29" → "29 September 2026" */
export function longDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return !iso || Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** A rough reading time, for the line under a post's title. */
export const minutes = (words: number) => Math.max(1, Math.round(words / 220));
