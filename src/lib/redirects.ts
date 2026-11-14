import redirectsJson from "@/content/redirects.json";
import { slugify } from "@/lib/filters";

/*
 * Where an old tag or category archive goes.
 *
 * Her Squarespace site had an archive page for every tag and category, 135 of
 * them, at addresses like /package-search/tag/12%2B+girls. They are matched
 * here rather than as patterns in next.config: the address arrives half
 * encoded, and tidying it to a key ("12-girls") is a job for a function.
 *
 * The map is written by scripts/build_redirect_map.py and the key is made by
 * the same slugify the catalogue's filters use, on both sides.
 */
const archives = redirectsJson.archives as Record<string, Record<string, string>>;

export type ArchiveKind = keyof typeof redirectsJson.archives;

/** The address to send somebody to, or null when this was never one of hers. */
export function archiveTarget(kind: ArchiveKind, tail: string): string | null {
  let decoded = tail;
  try {
    decoded = decodeURIComponent(tail);
  } catch {
    // A stray % that is not an escape. Use it as it came.
  }
  return archives[kind]?.[slugify(decoded)] ?? null;
}
