/*
 * The four things an old address can ask the catalogue for.
 *
 * Her Squarespace site had a page for every state, most towns, every style and
 * every group size: 190-odd addresses that people have bookmarked and Google
 * has indexed. They land here now, on the catalogue, already narrowed to what
 * that page was about (docs/portal-handoff/redirect-rules.json).
 *
 *   ?state=NSW       one of her seven state pages
 *   ?place=berry     a town or region
 *   ?style=hens      one of the styles her packages carry
 *   ?girls=12        a group size
 *
 * Pure, and shared by the page and its tests, so the redirect map and the
 * filter cannot drift apart: a redirect to a filter that shows nothing is a
 * 404 with better manners.
 */

export type Filterable = {
  destination: string | null;
  area: string | null;
  placeTags: string[];
  state: string | null;
  styles: string[];
  guestsMin: number | null;
  guestsMax: number | null;
};

/** "Hunter Valley" / "hunter+valley" / "Hunter's Valley" → "hunter-valley" */
export function slugify(v: string): string {
  return v
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[/+\s_]+/g, "-")
    .split("-")
    .filter(Boolean)
    .join("-");
}

/*
 * A place matches a package's destination OR its area OR one of its place tags.
 *
 * All three, because the same town is filed differently from package to
 * package: Gerringong is its own destination on three and an area of NSW South
 * Coast on two. Her records are not wrong, they are two reasonable models of
 * the same coastline, so the filter bends rather than the data.
 */
export function matchesPlace(p: Filterable, place: string): boolean {
  const want = slugify(place);
  if (!want) return true;
  return (
    (!!p.destination && slugify(p.destination) === want) ||
    (!!p.area && slugify(p.area) === want) ||
    p.placeTags.some((t) => slugify(t) === want)
  );
}

export const matchesState = (p: Filterable, state: string) => !state || (p.state ?? "").toLowerCase() === state.trim().toLowerCase();

export const matchesStyle = (p: Filterable, style: string) =>
  !style || p.styles.some((s) => slugify(s) === slugify(style));

export function matchesGirls(p: Filterable, girls: number): boolean {
  if (!girls) return true;
  if (p.guestsMin && girls < p.guestsMin) return false;
  if (p.guestsMax && girls > p.guestsMax) return false;
  return true;
}

export type Preset = { place: string; state: string; style: string; girls: number };

/** What an address is asking for. Anything unreadable is simply not a filter. */
export function readPreset(search: string): Preset {
  const q = new URLSearchParams(search);
  const girls = Number.parseInt(q.get("girls") ?? "", 10);
  return {
    place: slugify(q.get("place") ?? ""),
    state: (q.get("state") ?? "").trim().slice(0, 12),
    style: (q.get("style") ?? "").trim().slice(0, 60),
    girls: Number.isFinite(girls) && girls > 0 && girls <= 60 ? girls : 0,
  };
}
