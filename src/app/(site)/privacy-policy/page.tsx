import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { Prose } from "@/components/ui/Prose";
import { capturedPage } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Girls Getaways collects, uses and looks after your personal information.",
  alternates: { canonical: "/privacy-policy" },
};

// Hers, word for word, brought across by scripts/capture_pages.py and never edited here:
// if it changes, it changes at the source and the script is run again.
export default function Page() {
  const page = capturedPage("privacy-policy");
  if (!page) notFound();
  return (
    <>
      <PageHero eyebrow="The fine print" title="Privacy policy" />
      <section className="sec bg-paper">
        <div className="ctr">
          <Prose html={page.body} />
        </div>
      </section>
    </>
  );
}
