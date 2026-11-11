import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCatalogue, getPackage, guestsText, packageHref, placeText, pretty, priceFromOf,
} from "@/lib/catalogue";
import { IconArrow, IconCheck, IconMoon, IconUsers } from "@/components/ui/Icons";
import { Gallery } from "@/components/catalogue/Gallery";
import { EnquiryPanel } from "@/components/catalogue/EnquiryPanel";
import { EnquiryForm } from "@/components/catalogue/EnquiryForm";

export const revalidate = 60;

/** Their URLs are /package-search/<destination>[/<area>]/<slug> — keep every one. */
export async function generateStaticParams() {
  const packages = await getCatalogue();
  return packages.map((p) => ({
    slug: [p.destination, p.area, p.slug].filter(Boolean) as string[],
  }));
}

async function find(slugParts: string[]) {
  return getPackage(slugParts[slugParts.length - 1]);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await find(slug);
  if (!p) return { title: "Getaway not found" };
  return {
    title: `${p.title}${p.destination ? ` — ${pretty(p.destination)}` : ""}`,
    description: p.blurb ?? undefined,
    alternates: { canonical: packageHref(p) },
    openGraph: {
      title: p.title,
      description: p.blurb ?? undefined,
      images: p.heroImage ? [{ url: `${p.heroImage}?format=1200w` }] : undefined,
    },
  };
}

export default async function PackagePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const p = await find(slug);
  if (!p) notFound();

  const low = priceFromOf(p);
  const others = (await getCatalogue())
    .filter((x) => x.slug !== p.slug && x.destination === p.destination)
    .slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate flex min-h-[62svh] flex-col justify-end pb-10 pt-32 md:min-h-[70svh]">
        <div className="absolute inset-0 -z-10 overflow-hidden bg-ink">
          {p.heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${p.heroImage}?format=2500w`} alt="" className="size-full object-cover" fetchPriority="high" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(35,31,32,.5)_0%,rgba(35,31,32,.15)_38%,rgba(35,31,32,.72)_100%)]" />
        </div>

        <div className="ctr relative">
          <Link href="/package-search" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 hover:text-white">
            ← All getaways
          </Link>
          <h1 className="display mt-4 max-w-[16ch] text-white" style={{ fontSize: "clamp(34px, 5.6vw, 64px)" }}>
            {p.title}
          </h1>
          <p className="mt-3 text-[15px] text-white/85">
            {placeText(p)}
            {p.venue ? ` · ${p.venue}` : ""}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="glass-dark rounded-full px-4 py-2 text-[12.5px] text-white">
              <IconUsers size={14} className="mr-1.5 inline" />
              {guestsText(p)}
            </span>
            {p.nights && (
              <span className="glass-dark rounded-full px-4 py-2 text-[12.5px] text-white">
                <IconMoon size={14} className="mr-1.5 inline" />
                {p.nights} nights
              </span>
            )}
            {low !== null && (
              <span className="glass-dark rounded-full px-4 py-2 text-[12.5px] text-white">
                from ${low.toLocaleString("en-AU")} pp
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="sec bg-paper">
        <div className="ctr grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div>
            {p.description && (
              <>
                <p className="eyebrow">The getaway</p>
                <p className="lede mt-4 whitespace-pre-line text-[16.5px]">{p.description}</p>
              </>
            )}

            {p.inclusions.length > 0 && (
              <div className="mt-12">
                <p className="eyebrow">What&apos;s included</p>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {p.inclusions.map((inc, i) => (
                    <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink-2">
                      <IconCheck size={18} className="mt-0.5 flex-none text-clay-deep" />
                      {inc.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {p.styles.length > 0 && (
              <div className="mt-12">
                <p className="eyebrow">Getaway style</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.styles.map((s) => (
                    <span key={s} className="chip">
                      {pretty(s.replace(/\s+/g, "-"))}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {p.gallery.length > 0 && (
              <div className="mt-14">
                <p className="eyebrow">The photos</p>
                <Gallery images={p.gallery} title={p.title} />
              </div>
            )}
          </div>

          <EnquiryPanel
            title={p.title}
            priceTable={p.priceTable}
            notes={p.notes}
            guests={guestsText(p)}
            nights={p.nights}
          />
        </div>
      </section>

      {/* The enquiry panel's button points here, so this section has to exist
          on every one of the 123 package pages. It posts to her portal inbox. */}
      <section id="enquire" className="sec bg-blush">
        <div className="ctr grid gap-10 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
          <div>
            <p className="eyebrow">Enquire</p>
            <h2 className="h2 mt-4 max-w-[18ch]">
              Let&apos;s get your girls <em className="italic text-clay-deep">away</em>
            </h2>
            <p className="lede mt-4 max-w-[36ch]">
              Tell us the dates and how many of you there are. We&apos;ll check availability for{" "}
              {p.title} and send a quote priced for your group.
            </p>
          </div>
          <EnquiryForm slug={p.slug} title={p.title} guestsMin={p.guestsMin} guestsMax={p.guestsMax} />
        </div>
      </section>

      {others.length > 0 && (
        <section className="sec bg-blush pt-0">
          <div className="ctr">
            <h2 className="h2 max-w-[18ch]">
              More in <em className="italic text-clay-deep">{p.destination ? pretty(p.destination) : "this region"}</em>
            </h2>
            <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link href={packageHref(o)} className="group block">
                    <span className="plate plate-zoom block aspect-[10/11] rounded-[var(--r)]">
                      {o.heroImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`${o.heroImage}?format=1000w`} alt="" loading="lazy" decoding="async" />
                      )}
                    </span>
                    <span className="serif mt-4 block text-[23px] leading-tight text-ink group-hover:text-clay-deep">
                      {o.title}
                    </span>
                    <span className="mt-1 block text-[13px] text-ink-3">
                      {priceFromOf(o) ? `From $${priceFromOf(o)!.toLocaleString("en-AU")} pp` : "Price on request"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Link href="/package-search" className="btn btn-ink">
                See all getaways <IconArrow size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
