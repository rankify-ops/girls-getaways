import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { getDiaries, longDate, minutes } from "@/lib/pages";

export const metadata: Metadata = {
  title: "The GG Diaries",
  description: "Guides, stories and getaway inspiration from the Girls Getaways team.",
  alternates: { canonical: "/the-gg-diaries" },
};

// The portal's cache window: a post she publishes is here within the minute.
export const revalidate = 60;

// Her blog, read from her portal, every post on the address it has always had.
export default async function Diaries() {
  const [lead, ...rest] = await getDiaries();
  return (
    <>
      <PageHero
        eyebrow="The GG Diaries"
        title={<>Guides, stories &amp; <em className="italic text-clay-deep">getaway inspo</em></>}
        lede="Where to go, what to do when you get there, and why a weekend away with the girls is always a good idea."
      />

      <section className="sec bg-paper">
        <div className="ctr">
          {lead && (
            <Link href={`/the-gg-diaries/${lead.slug}`} className="group grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
              {lead.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lead.image} alt="" className="aspect-[16/10] w-full rounded-[28px] object-cover" />
              )}
              <div>
                <p className="eyebrow">{["Latest", longDate(lead.published)].filter(Boolean).join(" · ")}</p>
                <h2 className="h2 mt-3 group-hover:underline group-hover:decoration-clay group-hover:underline-offset-8">{lead.title}</h2>
                <p className="lede mt-4 max-w-[52ch]">{lead.excerpt}</p>
                <span className="btn btn-ink btn-sm mt-6">Read it</span>
              </div>
            </Link>
          )}

          <div className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((d) => (
              <Link key={d.slug} href={`/the-gg-diaries/${d.slug}`} className="group block">
                {d.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.image} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-[22px] object-cover" />
                )}
                <p className="mt-4 text-[12px] text-ink-3">{[longDate(d.published), `${minutes(d.words)} min read`].filter(Boolean).join(" · ")}</p>
                <h3 className="serif mt-2 text-[24px] leading-tight text-ink group-hover:underline group-hover:decoration-clay group-hover:underline-offset-4">{d.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{d.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
