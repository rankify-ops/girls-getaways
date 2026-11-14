import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Couples Getaways",
  description:
    "Our sister business, Couples Getaways, designs boutique trips across Australia for couples and groups.",
  alternates: { canonical: "/couples-getaways" },
};

const CDN = "https://images.squarespace-cdn.com/content/v1/60e11aa53e6d353c238d7259";
const SISTER = "https://www.couplesgetaways.com.au";

// The four packages her page features, linking to the sister site exactly as hers do.
const featured = [
  { place: "Jervis Bay", name: "Bayside Bathing", href: `${SISTER}/package-search/south-coast/jervis-bay/bayside-bathing`, img: `${CDN}/7a5b10c9-8e50-4b27-9a2e-1bea23036c1a/Luna-Jervis-Bay-Accommodation-Pet-Friendly-17.jpg` },
  { place: "Yamba", name: "Surfs Up at Yamba", href: `${SISTER}/package-search/yamba/surfs-up-at-yamba`, img: `${CDN}/d86325b5-28fb-4dfa-b46d-57d4cb2d6081/EliseHassey_YambaSurf_3021.jpg` },
  { place: "Mudgee", name: "Gone Glamping", href: `${SISTER}/package-search/mudgee/gone-glamping`, img: `${CDN}/ba829309-4785-4a5f-8ff3-118cd13de655/luxury-eco-glamping-hut-tub-experience-romantic.jpg` },
  { place: "Noosa", name: "Flavours of Noosa", href: `${SISTER}/package-search/sunshine-coast/noosa/flavours-of-noosa`, img: `${CDN}/7a3a79b7-93bd-4a02-a6d5-c4ddbab46dfc/Noosa_Peppers-Resort%2811%29.jpg` },
];

export default function Couples() {
  return (
    <>
      <PageHero
        eyebrow="Couples Getaways"
        title={<>Bring your <em className="italic text-clay-deep">plus-one</em> this time</>}
        lede="Our sister business Couples Getaways design boutique trips across Australia that give couples & groups the chance to escape, unwind and love."
        image={`${CDN}/0b2a4755-17f6-414a-8c73-902ca15946ec/DSC_7358+%283%29+%282%29.jpg`}
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
                <img src={`${f.img}?format=750w`} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
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
