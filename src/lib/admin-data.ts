import { publicClient, isConfigured } from "@/lib/supabase";
import { packages as seedPackages, destinations, states, STYLES, type Package as SeedPackage } from "@/content/site";

/*
 * One data layer for the portal and the public site.
 *
 * Until the client's Supabase project exists, everything reads from
 * src/content/site.ts — the 16 packages captured from the live site — so the
 * portal is browsable and reviewable before the database is wired in. Once
 * NEXT_PUBLIC_SUPABASE_URL is set, the same functions read real rows and the
 * seed is never touched again.
 *
 * `source` tells the UI which of the two it got, so the portal can say so
 * plainly instead of pretending draft seed data is live.
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
  priceFrom: number | null;
  guestsMin: number | null;
  guestsMax: number | null;
  nights: number | null;
  heroImage: string | null;
  tag: string | null;
  popular: boolean;
  slotsLeft: number | null;
  status: "draft" | "published" | "archived";
  styles: string[];
  updatedAt: string | null;
};

export type DataResult<T> = { data: T; source: "database" | "seed" };

const destName = (slug: string) => destinations.find((d) => d.slug === slug)?.name ?? null;
const stateShort = (slug: string) => {
  const d = destinations.find((x) => x.slug === slug);
  return d ? states.find((s) => s.code === d.state)?.short ?? null : null;
};

/** Seed packages shaped like database rows, so the UI has one shape to render. */
function fromSeed(p: SeedPackage): PackageRow {
  return {
    id: p.slug,
    slug: p.slug,
    title: p.title,
    venue: p.venue ?? null,
    destination: destName(p.dest),
    state: stateShort(p.dest),
    area: p.area ?? null,
    blurb: p.blurb ?? null,
    priceFrom: p.priceFrom ?? null,
    guestsMin: p.guests?.[0] ?? null,
    guestsMax: p.guests?.[1] ?? null,
    nights: p.nights ?? null,
    heroImage: null, // the seed uses local /img/<name>-1600.webp, resolved by <Photo>
    tag: p.tag ?? null,
    popular: p.tag === "Featured",
    slotsLeft: null,
    status: "published",
    styles: p.styles,
    updatedAt: null,
  };
}

/** The local image basename for a seed package, so cards still show photography. */
export function seedImageName(slug: string): string | null {
  return seedPackages.find((p) => p.slug === slug)?.img ?? null;
}

export async function getPackages(): Promise<DataResult<PackageRow[]>> {
  const sb = publicClient();
  if (!sb || !isConfigured) {
    return { data: seedPackages.map(fromSeed), source: "seed" };
  }

  const { data, error } = await sb
    .from("packages")
    .select(
      `id, slug, title, venue, area, blurb, price_from, guests_min, guests_max, nights,
       hero_image_url, tag, popular, slots_left, status, updated_at,
       destinations ( name, states ( short ) ),
       package_styles ( styles ( name ) )`
    )
    .neq("status", "archived")
    .order("position", { ascending: true });

  // A database that exists but errors is worth surfacing, not silently
  // papering over with seed data that the client might then edit.
  if (error) throw new Error(`Could not load packages: ${error.message}`);

  type Joined = {
    destinations: { name: string; states: { short: string } | null } | null;
    package_styles: { styles: { name: string } | null }[] | null;
  };

  const rows: PackageRow[] = (data ?? []).map((r) => {
    const j = r as unknown as Joined;
    return {
      id: r.id as string,
      slug: r.slug as string,
      title: r.title as string,
      venue: (r.venue as string) ?? null,
      destination: j.destinations?.name ?? null,
      state: j.destinations?.states?.short ?? null,
      area: (r.area as string) ?? null,
      blurb: (r.blurb as string) ?? null,
      priceFrom: r.price_from === null ? null : Number(r.price_from),
      guestsMin: (r.guests_min as number) ?? null,
      guestsMax: (r.guests_max as number) ?? null,
      nights: (r.nights as number) ?? null,
      heroImage: (r.hero_image_url as string) ?? null,
      tag: (r.tag as string) ?? null,
      popular: Boolean(r.popular),
      slotsLeft: (r.slots_left as number) ?? null,
      status: r.status as PackageRow["status"],
      styles: (j.package_styles ?? []).map((s) => s.styles?.name).filter(Boolean) as string[],
      updatedAt: (r.updated_at as string) ?? null,
    };
  });

  return { data: rows, source: "database" };
}

export type PortalStats = {
  published: number;
  drafts: number;
  destinations: number;
  styles: number;
  source: "database" | "seed";
};

export async function getStats(): Promise<PortalStats> {
  const { data, source } = await getPackages();
  return {
    published: data.filter((p) => p.status === "published").length,
    drafts: data.filter((p) => p.status === "draft").length,
    destinations: new Set(data.map((p) => p.destination).filter(Boolean)).size,
    styles: STYLES.length,
    source,
  };
}

export const priceLabel = (p: PackageRow) =>
  p.priceFrom ? `$${p.priceFrom.toLocaleString("en-AU")}` : "On request";

export const placeLabel = (p: PackageRow) =>
  [p.area ?? p.destination, p.state].filter(Boolean).join(" · ") || "Destination not set";
