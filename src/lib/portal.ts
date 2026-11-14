/*
 * Reading the catalogue from the client's portal (app.rankify.com.au).
 *
 * The client edits packages in the portal; this fetches what they published.
 * Set PORTAL_API_BASE and PORTAL_SITE_ID to switch the site over — until both
 * exist, callers fall back to the captured content in src/content/site.ts, so
 * the site is never dark while the portal is being built.
 *
 * Prices: the portal stores ONLY the per-group-size table, deliberately. There
 * is no "from" price in the payload because a stored minimum goes stale the
 * moment someone edits a row. "From $509pp" is computed here, at render.
 *
 * A group size may legitimately appear twice with different prices — several
 * packages offer two accommodation types. Never dedupe these rows; the
 * package's own `notes` explains the pairing to the reader.
 */

const BASE = process.env.PORTAL_API_BASE;
const SITE_ID = process.env.PORTAL_SITE_ID;

export const portalConfigured = Boolean(BASE && SITE_ID);

export type PriceRow = { girls: number; price: number };

export type PortalPackage = {
  slug: string;
  title: string;
  venue: string | null;
  destination: string | null;
  area: string | null;
  blurb: string | null;
  description: string | null;
  notes: string | null;
  priceTable: PriceRow[];
  guestsMin: number | null;
  guestsMax: number | null;
  nights: number | null;
  heroImage: string | null;
  gallery: string[];
  inclusions: { text: string; included: boolean }[];
  styles: string[];
  /** Towns and regions she tagged it with, beyond its one destination. */
  placeTags: string[];
  position: number;
};

type ApiItem = {
  slug: string;
  position?: number;
  updated_at?: string;
  data: Record<string, unknown>;
};

/** The lowest per-person price across the table, or null when there is none. */
export function fromPrice(rows: PriceRow[] | undefined | null): number | null {
  if (!rows?.length) return null;
  const prices = rows.map((r) => r.price).filter((p) => Number.isFinite(p) && p > 0);
  return prices.length ? Math.min(...prices) : null;
}

/** "From $509pp", or "Price on request" when the package carries no table. */
export function priceLabel(rows: PriceRow[] | undefined | null): string {
  const low = fromPrice(rows);
  return low === null ? "Price on request" : `From $${low.toLocaleString("en-AU")}pp`;
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/**
 * Image URLs, always over https.
 *
 * Their photography was captured out of Squarespace as http://static1… and
 * this site is served over https, which makes every one of those mixed
 * content: some browsers upgrade it silently, others block it and the hero
 * simply does not appear. Coerced here rather than trusted, because the
 * fallback JSON and any future re-scrape can reintroduce the http form.
 */
export const https = (v: unknown): string | null => {
  const u = str(v);
  return u ? u.replace(/^http:\/\//i, "https://") : null;
};
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** One API item → the shape the site renders. Exported so it can be tested offline. */
export function mapItem(item: ApiItem, index = 0): PortalPackage {
  const d = item.data ?? {};
  const rawRows = Array.isArray(d.price_table) ? (d.price_table as Record<string, unknown>[]) : [];
  const priceTable: PriceRow[] = rawRows
    .map((r) => ({ girls: Number(r.girls), price: Number(r.price) }))
    .filter((r) => Number.isFinite(r.girls) && Number.isFinite(r.price));

  const rawInclusions = Array.isArray(d.inclusions) ? (d.inclusions as Record<string, unknown>[]) : [];

  return {
    slug: item.slug,
    title: str(d.title) ?? item.slug,
    venue: str(d.venue),
    destination: str(d.destination),
    area: str(d.area),
    blurb: str(d.blurb),
    description: str(d.description),
    notes: str(d.notes),
    priceTable,
    // Trust the table over any stored guest range: it is the thing the client edits.
    guestsMin: priceTable.length ? Math.min(...priceTable.map((r) => r.girls)) : num(d.guests_min),
    guestsMax: priceTable.length ? Math.max(...priceTable.map((r) => r.girls)) : num(d.guests_max),
    nights: num(d.nights),
    heroImage: https(d.hero_image),
    gallery: Array.isArray(d.gallery) ? (d.gallery as unknown[]).map((g) => https(g)).filter((g): g is string => !!g) : [],
    inclusions: rawInclusions
      .map((r) => ({ text: String(r.text ?? "").trim(), included: r.included !== false }))
      .filter((r) => r.text),
    styles: Array.isArray(d.styles) ? (d.styles as unknown[]).map(String) : [],
    placeTags: Array.isArray(d.place_tags) ? (d.place_tags as unknown[]).map(String) : [],
    position: item.position ?? index,
  };
}

/**
 * Published packages from the portal.
 *
 * Returns null when the portal isn't configured or is unreachable, so the
 * caller can fall back rather than render an empty site. A portal outage must
 * never take the client's website down with it.
 */
export async function fetchPackages(): Promise<PortalPackage[] | null> {
  if (!portalConfigured) return null;
  try {
    const res = await fetch(`${BASE}/sites/${SITE_ID}/collections/packages`, {
      // The portal edge-caches for a minute; match it rather than hammering.
      next: { revalidate: 60 },
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    // A login page comes back as 200 HTML — treat anything non-JSON as a miss.
    if (!res.headers.get("content-type")?.includes("application/json")) return null;

    const body = (await res.json()) as { items?: ApiItem[] };
    if (!Array.isArray(body.items)) return null;

    // An empty collection is a miss, not an answer. The collection can exist
    // before its import has run, and `200 {"items": []}` is valid JSON — so
    // trusting it would blank the catalogue and look like a site with no
    // content rather than one waiting on an import. An empty catalogue is
    // never the right answer for this client.
    if (body.items.length === 0) return null;

    return body.items.map(mapItem).sort((a, b) => a.position - b.position);
  } catch {
    return null;
  }
}

/**
 * An image URL asking for roughly `width` pixels.
 *
 * Squarespace serves renditions off a `?format=NNNw` query; the portal's media
 * store serves one fixed rendition per id and ignores the query, so adding one
 * there is noise — and a cache-buster the day it stops being ignored. Galleries
 * are still on Squarespace while the heroes have moved, so this has to handle
 * both, and it stays in one place so the next host only changes it here.
 */
export function imageAt(url: string | null | undefined, width: number): string | null {
  if (!url) return null;
  return /(\/\/|\.)squarespace(-cdn)?\.com\//.test(url) ? `${url}?format=${width}w` : url;
}
