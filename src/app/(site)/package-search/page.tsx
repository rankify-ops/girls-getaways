import type { Metadata } from "next";
import { getCatalogue, allStyles, allDestinations, stateOf, pretty } from "@/lib/catalogue";
import { CatalogueBrowser } from "@/components/catalogue/CatalogueBrowser";
import { Concierge } from "@/components/catalogue/Concierge";
import { presetQuery, readPreset, searchTitle, slugify } from "@/lib/filters";

type Search = Promise<{ [key: string]: string | string[] | undefined }>;

/** The address's search, whichever way a value was repeated. */
async function presetOf(searchParams: Search) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams)) {
    const one = Array.isArray(v) ? v[0] : v;
    if (one) q.set(k, one);
  }
  return readPreset(q);
}

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const preset = await presetOf(searchParams);
  const title = searchTitle({ ...preset, q: "", style: preset.style ? pretty(slugify(preset.style)) : "" });
  return {
    title: title || "All getaways",
    description:
      "Every Girls Getaways package across Australia — hens weekends, birthdays, wine weekends, beach breaks and spa retreats, priced per group size.",
    // One page, however it is narrowed. A search is not a page of its own to index.
    alternates: { canonical: "/package-search" },
  };
}

/*
 * The results page.
 *
 * It reads the search from the address here, on the server, so what is sent is
 * already the answer: the heading names the search and the first cards are the
 * matches. It used to be sent as the whole catalogue under "Every escape we
 * design" and narrow itself after it had drawn, with the concierge sitting
 * between the heading and the results, so somebody who had just searched saw a
 * different question before they saw their answer.
 *
 * The concierge is still here, under the results, for the visitor who has
 * looked and not found it. Its place at the top of a visit is the home page.
 */
export default async function PackageSearch({ searchParams }: { searchParams: Search }) {
  const [packages, preset] = await Promise.all([getCatalogue(), presetOf(searchParams)]);

  return (
    <>
      <CatalogueBrowser
        // A new search from the header or the phone sheet lands on this same page: start again from it.
        key={presetQuery(preset)}
        initial={preset}
        packages={packages.map((p) => ({
          slug: p.slug,
          title: p.title,
          venue: p.venue,
          destination: p.destination,
          area: p.area,
          placeTags: p.placeTags,
          state: stateOf(p),
          styles: p.styles,
          heroImage: p.heroImage,
          guestsMin: p.guestsMin,
          guestsMax: p.guestsMax,
          nights: p.nights,
          priceTable: p.priceTable,
        }))}
        styles={allStyles(packages)}
        destinations={allDestinations(packages)}
      />

      <Concierge heading="Not seeing it? Describe it" />
    </>
  );
}
