import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prose } from "@/components/ui/Prose";
import { diaries, diary, longDate, minutes } from "@/lib/pages";
import { site } from "@/content/site";

// Every post she has published, and nothing else: an address that is not one of them is a
// real 404, not a page generated on request.
export const dynamicParams = false;
export const generateStaticParams = () => diaries.map((d) => ({ slug: d.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = diary((await params).slug);
  if (!d) return {};
  return {
    title: d.title,
    description: d.excerpt,
    alternates: { canonical: `/the-gg-diaries/${d.slug}` },
    openGraph: { type: "article", title: d.title, description: d.excerpt, publishedTime: d.published, ...(d.image ? { images: [d.image] } : {}) },
  };
}

export default async function DiaryPost({ params }: { params: Promise<{ slug: string }> }) {
  const d = diary((await params).slug);
  if (!d) notFound();
  const more = diaries.filter((x) => x.slug !== d.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: d.title,
    datePublished: d.published,
    ...(d.image ? { image: d.image } : {}),
    author: { "@type": "Organization", name: "Girls Getaways" },
    publisher: { "@type": "Organization", name: "Girls Getaways" },
    mainEntityOfPage: `${site.live}/the-gg-diaries/${d.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }} />
      <article>
        <header className="bg-blush pb-10 pt-28 md:pt-36">
          <div className="ctr max-w-[860px]">
            <Link href="/the-gg-diaries" className="eyebrow hover:text-ink">← The GG Diaries</Link>
            <h1 className="h2 mt-4">{d.title}</h1>
            <p className="mt-4 text-[13.5px] text-ink-2">{longDate(d.published)} · {minutes(d.words)} min read</p>
          </div>
        </header>
        <div className="sec bg-paper pt-10">
          <div className="ctr max-w-[860px]">
            <Prose html={d.body} />
            <div className="mt-12 rounded-[26px] bg-blush p-8">
              <p className="serif text-[26px] leading-tight text-ink">Ready to plan yours?</p>
              <p className="lede mt-2">Pick a package and we&apos;ll price it for your girls.</p>
              <Link href="/package-search" className="btn btn-ink mt-5">Browse getaways</Link>
            </div>
          </div>
        </div>
      </article>

      <section className="sec bg-sand">
        <div className="ctr">
          <p className="eyebrow">Keep reading</p>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {more.map((m) => (
              <Link key={m.slug} href={`/the-gg-diaries/${m.slug}`} className="group block">
                {m.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${m.image}?format=750w`} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-[22px] object-cover" />
                )}
                <h3 className="serif mt-4 text-[22px] leading-tight text-ink group-hover:underline group-hover:decoration-clay group-hover:underline-offset-4">{m.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
