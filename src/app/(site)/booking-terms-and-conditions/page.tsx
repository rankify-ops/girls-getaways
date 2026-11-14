import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { Prose } from "@/components/ui/Prose";
import { capturedPage } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Booking terms & conditions",
  description: "The terms and conditions that apply to every Girls Getaways booking, including payments, changes and cancellations.",
  alternates: { canonical: "/booking-terms-and-conditions" },
};

// Her contract with her customers. Brought across word for word by
// scripts/capture_pages.py and never edited here: if a term changes, it changes at the
// source and the script is run again.
export default function Terms() {
  const page = capturedPage("booking-terms-and-conditions");
  if (!page) notFound();
  return (
    <>
      <PageHero eyebrow="The fine print" title="Booking terms & conditions" />
      <section className="sec bg-paper">
        <div className="ctr">
          <Prose html={page.body} />
        </div>
      </section>
    </>
  );
}
