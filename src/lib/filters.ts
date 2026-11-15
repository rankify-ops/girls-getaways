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

/*
 * What a search is asking for.
 *
 * The first four narrow the catalogue. The dates do not: availability is with
 * her suppliers, not in this site, so a date cannot rule a package in or out.
 * They are carried so the results page can say them back and the enquiry form
 * can arrive already filled in, which is what a visitor who chose dates
 * expects to have happened to them.
 */
export type Sort = "featured" | "low" | "high";
export type Preset = {
  place: string;
  state: string;
  style: string;
  girls: number;
  /** YYYY-MM-DD, or "" */
  from: string;
  to: string;
  q: string;
  sort: Sort;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const day = (v: string | null): string => (v && DAY.test(v) && !Number.isNaN(Date.parse(v)) ? v : "");

/** What an address is asking for. Anything unreadable is simply not a filter. */
export function readPreset(search: string | URLSearchParams): Preset {
  const q = typeof search === "string" ? new URLSearchParams(search) : search;
  const girls = Number.parseInt(q.get("girls") ?? "", 10);
  const sort = q.get("sort");
  const from = day(q.get("from"));
  const to = day(q.get("to"));
  return {
    place: slugify(q.get("place") ?? ""),
    state: (q.get("state") ?? "").trim().slice(0, 12),
    style: (q.get("style") ?? "").trim().slice(0, 60),
    girls: Number.isFinite(girls) && girls > 0 && girls <= 60 ? girls : 0,
    from,
    // An end with no start, or before it, is not a range.
    to: from && to && to >= from ? to : "",
    q: (q.get("q") ?? "").trim().slice(0, 80),
    sort: sort === "low" || sort === "high" ? sort : "featured",
  };
}

/** The same search, as the query string that asks for it. "" for no search at all. */
export function presetQuery(p: Partial<Preset>): string {
  const q: string[] = [];
  const add = (k: string, v: string | number | undefined) => {
    if (v) q.push(`${k}=${encodeURIComponent(String(v))}`);
  };
  add("state", p.state);
  add("place", p.place);
  add("style", p.style);
  add("girls", p.girls);
  add("from", p.from);
  add("to", p.from ? p.to : "");
  add("q", p.q);
  add("sort", p.sort && p.sort !== "featured" ? p.sort : "");
  return q.length ? `?${q.join("&")}` : "";
}

/** A local calendar day as YYYY-MM-DD. Not toISOString: that is UTC, and Saturday in Sydney is Friday there. */
export function dayOf(d: Date | null | undefined): string {
  if (!d) return "";
  const two = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "12–14 Dec", "30 Dec – 2 Jan", "12 Dec". Read from the digits, so no timezone can move the day. */
export function datesLabel(from: string, to = ""): string {
  if (!DAY.test(from)) return "";
  const [, fm, fd] = from.split("-").map(Number);
  if (!DAY.test(to) || to === from) return `${fd} ${MON[fm - 1]}`;
  const [, tm, td] = to.split("-").map(Number);
  return fm === tm ? `${fd}–${td} ${MON[tm - 1]}` : `${fd} ${MON[fm - 1]} – ${td} ${MON[tm - 1]}`;
}

/*
 * What one girl pays in a group of this size.
 *
 * Her tables can list a size twice, where a package offers two kinds of room;
 * the lower is the "from". `exact` says whether the table prices this size at
 * all: when it does not, the card says "from" the lowest in the table instead
 * of inventing a price for a group she has not priced.
 */
export function priceFor(
  rows: { girls: number; price: number }[] | null | undefined,
  girls: number,
): { price: number; exact: boolean; options: number } | null {
  const ok = (rows ?? []).filter((r) => Number.isFinite(r.price) && r.price > 0);
  if (!ok.length) return null;
  const mine = girls ? ok.filter((r) => r.girls === girls) : [];
  if (mine.length) return { price: Math.min(...mine.map((r) => r.price)), exact: true, options: mine.length };
  return { price: Math.min(...ok.map((r) => r.price)), exact: false, options: 0 };
}

const STATE_NAMES: Record<string, string> = {
  nsw: "New South Wales",
  qld: "Queensland",
  vic: "Victoria",
  act: "Canberra & ACT",
  sa: "South Australia",
  wa: "Western Australia",
  tas: "Tasmania",
  nt: "the Northern Territory",
  bali: "Bali",
};
export const stateName = (code: string) => STATE_NAMES[code.trim().toLowerCase()] ?? code.toUpperCase();

const title = (slug: string) =>
  slugify(slug)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/*
 * The search, said back as a heading: "Hens getaways in Queensland for 7 girls".
 *
 * The results page used to be headed "Every escape we design" whatever had
 * been searched, over a count of the whole catalogue. A visitor who has just
 * chosen Queensland and seven girls needs the page to say it understood.
 * "" when nothing narrows the catalogue; the page keeps its own heading then.
 */
export function searchTitle(p: Partial<Preset>, placeName?: string): string {
  const where = p.state ? stateName(p.state) : p.place ? (placeName ?? title(p.place)) : "";
  if (!p.style && !where && !p.girls && !p.q) return "";
  return [
    p.style ? `${title(p.style)} getaways` : "Getaways",
    where ? `in ${where}` : "",
    p.girls ? `for ${p.girls} girl${p.girls === 1 ? "" : "s"}` : "",
    p.q ? `matching “${p.q}”` : "",
  ]
    .filter(Boolean)
    .join(" ");
}
