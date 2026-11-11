import { getCatalogue, destinations, placeText, pretty, type Package } from "@/lib/catalogue";
import { fromPrice } from "@/lib/portal";

/*
 * The data behind /admin.
 *
 * This is the interim backend: it reads the same catalogue the public site
 * renders, so the client can see and judge the editing experience against
 * their real 123 packages. Saving belongs to the portal at
 * app.rankify.com.au, which owns the database, the logins and the audit trail
 * — so the forms here are deliberately read-only rather than pretending.
 */

export type PackageRow = {
  id: string;
  slug: string;
  title: string;
  venue: string | null;
  destination: string | null;
  state: string | null;
  area: string | null;
  blurb: string | null;
  description: string | null;
  notes: string | null;
  priceFrom: number | null;
  priceTable: { girls: number; price: number }[];
  guestsMin: number | null;
  guestsMax: number | null;
  nights: number | null;
  heroImage: string | null;
  gallery: string[];
  inclusions: { text: string; included: boolean }[];
  tag: string | null;
  popular: boolean;
  slotsLeft: number | null;
  status: "draft" | "published" | "archived";
  styles: string[];
  updatedAt: string | null;
};

export type DataResult<T> = { data: T; source: "database" | "portal" | "captured" };

const stateOf = new Map(destinations.map((d) => [d.slug, d.state]));

function toRow(p: Package): PackageRow {
  return {
    id: p.slug,
    slug: p.slug,
    title: p.title,
    venue: p.venue,
    destination: p.destination ? pretty(p.destination) : null,
    state: p.destination ? stateOf.get(p.destination) ?? null : null,
    area: p.area,
    blurb: p.blurb,
    description: p.description,
    notes: p.notes,
    priceFrom: fromPrice(p.priceTable),
    priceTable: p.priceTable,
    guestsMin: p.guestsMin,
    guestsMax: p.guestsMax,
    nights: p.nights,
    heroImage: p.heroImage,
    gallery: p.gallery,
    inclusions: p.inclusions,
    tag: null,
    popular: false,
    slotsLeft: null,
    status: "published",
    styles: p.styles,
    updatedAt: null,
  };
}

export async function getPackages(): Promise<DataResult<PackageRow[]>> {
  const packages = await getCatalogue();
  return {
    data: packages.map(toRow),
    // getCatalogue() reads the portal when it is configured, the captured
    // catalogue otherwise.
    source: process.env.PORTAL_API_BASE ? "portal" : "captured",
  };
}

export type PortalStats = {
  published: number;
  drafts: number;
  destinations: number;
  styles: number;
  source: DataResult<unknown>["source"];
};

export async function getStats(): Promise<PortalStats> {
  const { data, source } = await getPackages();
  return {
    published: data.filter((p) => p.status === "published").length,
    drafts: data.filter((p) => p.status === "draft").length,
    destinations: new Set(data.map((p) => p.destination).filter(Boolean)).size,
    styles: new Set(data.flatMap((p) => p.styles)).size,
    source,
  };
}

export const priceLabel = (p: PackageRow) =>
  p.priceFrom ? `$${p.priceFrom.toLocaleString("en-AU")}` : "On request";

export const placeLabel = (p: PackageRow) =>
  [p.area ? pretty(p.area) : null, p.destination].filter(Boolean).join(" · ") || "Destination not set";

/** Kept for callers that still ask; the captured catalogue has no local files. */
export const seedImageName = (): string | null => null;

export { placeText };
