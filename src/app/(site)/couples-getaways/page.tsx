import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Couples Getaways",
  description:
    "Our sister business, Couples Getaways, designs boutique trips across Australia for couples and groups.",
  alternates: { canonical: "/couples-getaways" },
};

const SISTER = "https://www.couplesgetaways.com.au";

// The four packages her page features, linking to the sister site exactly as hers do.
const featured = [
  { place: "Jervis Bay", name: "Bayside Bathing", href: `${SISTER}/package-search/south-coast/jervis-bay/bayside-bathing`, img: "/img/pages/couples-jervis-bay.webp" },
  { place: "Yamba", name: "Surfs Up at Yamba", href: `${SISTER}/package-search/yamba/surfs-up-at-yamba`, img: "/img/pages/couples-yamba.webp" },
  { place: "Mudgee", name: "Gone Glamping", href: `${SISTER}/package-search/mudgee/gone-glamping`, img: "/img/pages/couples-mudgee.webp" },
  { place: "Noosa", name: "Flavours of Noosa", href: `${SISTER}/package-search/sunshine-coast/noosa/flavours-of-noosa`, img: "/img/pages/couples-noosa.webp" },
];

export default function Couples() {
  return (
    <>
      <PageHero
        eyebrow="Couples Getaways"
        title={<>Bring your <em className="italic text-clay-deep">plus-one</em> this time</>}
        lede="Our sister business Couples Getaways design boutique trips across Australia that give couples & groups the chance to escape, unwind and love."
        image="/img/pages/couples-hero.webp"
      >
        <a href={SISTER} target="_blank" rel="noopener" className="btn btn-ink">Visit Couples Getaways</a>
      </PageHero>

      <section className="sec bg-paper">
        <div className="ctr">
          <p className="eyebrow">Featured packages</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((f) => (
              <a key={f.name} href={f.href} target="_blank" rel="noopener" className="group block overflow-hidden rounded-[26px] bg-white shadow-[var(--shadow-s)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.img} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                <div className="p-6">
                  <p className="eyebrow">{f.place}</p>
                  <h2 className="serif mt-2 text-[24px] leading-tight text-ink">{f.name}</h2>
                  <span className="link-u mt-4 inline-block text-[13px] text-ink">View package</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
