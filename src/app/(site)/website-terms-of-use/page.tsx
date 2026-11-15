import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { Prose } from "@/components/ui/Prose";
import { capturedPage } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Website terms of use",
  description: "The terms that apply to using the Girls Getaways website.",
  alternates: { canonical: "/website-terms-of-use" },
};

// Hers, word for word, brought across by scripts/capture_pages.py and never edited here:
// if it changes, it changes at the source and the script is run again.
export default function Page() {
  const page = capturedPage("website-terms-of-use");
  if (!page) notFound();
  return (
    <>
      <PageHero eyebrow="The fine print" title="Website terms of use" />
      <section className="sec bg-paper">
        <div className="ctr">
          <Prose html={page.body} />
        </div>
      </section>
    </>
  );
}
