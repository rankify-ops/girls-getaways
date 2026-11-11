import type { Metadata } from "next";
import { getCatalogue, allStyles, allDestinations } from "@/lib/catalogue";
import { CatalogueBrowser } from "@/components/catalogue/CatalogueBrowser";

export const metadata: Metadata = {
  title: "All getaways",
  description:
    "Every Girls Getaways package across Australia — hens weekends, birthdays, wine weekends, beach breaks and spa retreats, priced per group size.",
  alternates: { canonical: "/package-search" },
};

// The portal's cache window; a published edit shows within the minute.
export const revalidate = 60;

export default async function PackageSearch() {
  const packages = await getCatalogue();

  return (
    <>
      <section className="bg-blush pb-10 pt-28 md:pt-36">
        <div className="ctr">
          <p className="eyebrow">All getaways</p>
          <h1 className="h2 mt-3 max-w-[14ch]">
            Every escape we <em className="italic text-clay-deep">design</em>
          </h1>
          <p className="lede mt-4 max-w-[56ch]">
            {packages.length} packages across Australia and Bali. Prices are per person and change with the
            size of your group — pick a package and we price it for your girls.
          </p>
        </div>
      </section>

      <CatalogueBrowser
        packages={packages.map((p) => ({
          slug: p.slug,
          title: p.title,
          venue: p.venue,
          destination: p.destination,
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
    </>
  );
}
