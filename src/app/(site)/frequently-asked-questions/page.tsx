import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { Prose } from "@/components/ui/Prose";
import { capturedPage } from "@/lib/pages";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Know before you go: booking, prices, changing inclusions, group numbers, payments and cancellations for a Girls Getaway.",
  alternates: { canonical: "/frequently-asked-questions" },
};

// Her FAQs, word for word (scripts/capture_pages.py).
export default function Faqs() {
  const page = capturedPage("frequently-asked-questions");
  if (!page) notFound();
  return (
    <>
      <PageHero eyebrow="FAQs" title={<>Know before <em className="italic text-clay-deep">you go</em></>}>
        <Link href="/how-it-works" className="btn btn-line">How booking works</Link>
        <Link href="/contact-us" className="btn btn-ink">Ask the team</Link>
      </PageHero>
      <section className="sec bg-paper">
        <div className="ctr">
          {/* The first section's own heading, which the capture reads as the page's title. */}
          {page.title && <h2 className="eyebrow mb-6">{page.title}</h2>}
          <Prose html={page.body} />
        </div>
      </section>
    </>
  );
}
