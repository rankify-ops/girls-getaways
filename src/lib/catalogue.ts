import catalogueJson from "../../docs/portal-handoff/packages.json";
import destinationsJson from "../../docs/portal-handoff/destinations.json";
import { fetchPackages, fromPrice, type PortalPackage, type PriceRow } from "./portal";

/*
 * The catalogue the website renders: all 123 packages captured from their
 * current site, replaced by the portal's copy the moment it is live.
 *
 * One shape, two sources. The captured JSON is the same shape the portal
 * serves (it is the file the portal imports from), so the site renders
 * identically either way and the switch is just two environment variables.
 *
 * Prices are never stored as a single "from" figure — each package carries a
 * table priced per group size, and a size can appear twice where a package
 * offers two kinds of accommodation.
 */

export type { PriceRow };
export type Package = PortalPackage & { gallery: string[] };

type RawItem = {
  slug: string;
  position?: number;
  data: Record<string, unknown>;
};

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

function fromCapture(item: RawItem, i: number): Package {
  const d = item.data;
  const rows = Array.isArray(d.price_table) ? (d.price_table as PriceRow[]) : [];
  const sizes = rows.map((r) => r.girls);
  return {
    slug: item.slug,
    title: str(d.title) ?? item.slug,
    venue: str(d.venue),
    destination: str(d.destination),
    area: str(d.area),
    blurb: str(d.blurb),
    description: str(d.description),
    notes: str(d.notes),
    priceTable: rows,
    guestsMin: sizes.length ? Math.min(...sizes) : num(d.guests_min),
    guestsMax: sizes.length ? Math.max(...sizes) : num(d.guests_max),
    nights: num(d.nights),
    heroImage: str(d.hero_image),
    inclusions: Array.isArray(d.inclusions) ? (d.inclusions as Package["inclusions"]) : [],
    styles: Array.isArray(d.styles) ? (d.styles as string[]) : [],
    position: item.position ?? i,
    gallery: Array.isArray(d.gallery) ? (d.gallery as string[]) : [],
  };
}

const captured: Package[] = (catalogueJson as RawItem[]).map(fromCapture);

export type Destination = { slug: string; name: string; state: string | null; blurb: string | null; image: string | null };

export const destinations: Destination[] = (destinationsJson as RawItem[]).map((d) => ({
  slug: d.slug,
  name: str(d.data.name) ?? d.slug,
  state: str(d.data.state),
  blurb: str(d.data.blurb),
  image: str(d.data.image),
}));

const destName = new Map(destinations.map((d) => [d.slug, d.name]));

/** Every published package. Portal first, captured content as the fallback. */
export async function getCatalogue(): Promise<Package[]> {
  const live = await fetchPackages();
  if (!live) return captured;
  // The portal has no gallery field yet; keep the captured one until it does.
  const galleries = new Map(captured.map((p) => [p.slug, p.gallery]));
  return live.map((p) => ({ ...p, gallery: galleries.get(p.slug) ?? [] }));
}

export async function getPackage(slug: string): Promise<Package | null> {
  return (await getCatalogue()).find((p) => p.slug === slug) ?? null;
}

/* ── presentation helpers ───────────────────────────────────────────── */

export const priceFromOf = (p: Package) => fromPrice(p.priceTable);

export function priceText(p: Package): string {
  const low = priceFromOf(p);
  return low === null ? "Price on request" : `$${low.toLocaleString("en-AU")}`;
}

export function guestsText(p: Package): string {
  if (p.guestsMin && p.guestsMax) return `${p.guestsMin}–${p.guestsMax} girls`;
  if (p.guestsMax) return `up to ${p.guestsMax} girls`;
  return "Any group size";
}

export function placeText(p: Package): string {
  const d = p.destination ? destName.get(p.destination) ?? pretty(p.destination) : null;
  const area = p.area ? pretty(p.area) : null;
  return [area, d].filter(Boolean).join(", ") || "Australia";
}

/** "nsw-south-coast" → "NSW South Coast" */
export function pretty(slug: string): string {
  const caps: Record<string, string> = { nsw: "NSW", qld: "QLD", vic: "VIC", act: "ACT", sa: "SA", wa: "WA" };
  return slug
    .split("-")
    .map((w) => caps[w] ?? w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Their existing URL, so every link and search result keeps working. */
export const packageHref = (p: Package) =>
  `/package-search/${[p.destination, p.area, p.slug].filter(Boolean).join("/")}`;

/** Styles across the catalogue, most used first — the filter list. */
export function allStyles(packages: Package[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of packages) for (const s of p.styles) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function allDestinations(packages: Package[]): { slug: string; name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of packages) if (p.destination) counts.set(p.destination, (counts.get(p.destination) ?? 0) + 1);
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, name: destName.get(slug) ?? pretty(slug), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
