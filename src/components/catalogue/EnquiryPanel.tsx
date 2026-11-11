"use client";

import { useState } from "react";
import { IconArrow } from "@/components/ui/Icons";
import type { PriceRow } from "@/lib/portal";

/*
 * Price by group size, and the enquiry call to action.
 *
 * Their pricing drops as the group grows, which is the thing that makes a
 * visitor message the organiser — so it's shown as the real table, not hidden
 * behind a single "from" figure.
 *
 * A size can appear twice where a package offers two kinds of accommodation;
 * those rows are shown as they are and the package's notes explain them.
 */
export function EnquiryPanel({
  title,
  priceTable,
  notes,
  guests,
  nights,
}: {
  title: string;
  priceTable: PriceRow[];
  notes: string | null;
  guests: string;
  nights: number | null;
}) {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? priceTable : priceTable.slice(0, 8);
  const low = priceTable.length ? Math.min(...priceTable.map((r) => r.price)) : null;
  const dupes = new Set(
    priceTable.filter((r, i, all) => all.findIndex((x) => x.girls === r.girls) !== i).map((r) => r.girls),
  );

  return (
    <aside className="lg:sticky lg:top-28">
      <div className="rounded-[28px] border border-rule bg-white p-6 shadow-[var(--shadow)] md:p-7">
        <p className="eyebrow">Pricing</p>
        {low !== null ? (
          <p className="mt-2 text-ink">
            <span className="serif text-[40px] leading-none">${low.toLocaleString("en-AU")}</span>
            <span className="text-[14px] text-ink-3"> per person</span>
          </p>
        ) : (
          <p className="serif mt-2 text-[30px] leading-tight text-ink">Price on request</p>
        )}
        <p className="mt-1.5 text-[13px] text-ink-3">
          {guests}
          {nights ? ` · ${nights} nights` : ""}
        </p>

        {priceTable.length > 0 && (
          <>
            <table className="mt-6 w-full text-[14px]">
              <caption className="sr-only">Price per person by group size for {title}</caption>
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-ink-3">
                  <th scope="col" className="pb-2 font-semibold">No. of girls</th>
                  <th scope="col" className="pb-2 text-right font-semibold">Per person</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.girls}-${r.price}-${i}`} className="border-t border-rule">
                    <td className="py-2 text-ink-2">
                      {r.girls}
                      {dupes.has(r.girls) && (
                        <span className="ml-2 text-[11.5px] text-ink-3">option {rows.filter((x, j) => x.girls === r.girls && j <= i).length}</span>
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums text-ink">${r.price.toLocaleString("en-AU")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {priceTable.length > 8 && !showAll && (
              <button type="button" onClick={() => setShowAll(true)} className="link-u mt-3 text-[13px] text-ink">
                Show all {priceTable.length} group sizes
              </button>
            )}
          </>
        )}

        <a href="#enquire" className="btn btn-ink mt-6 w-full">
          Enquire about this getaway <IconArrow size={16} />
        </a>
        <p className="mt-3 text-center text-[12.5px] text-ink-3">
          We price it for your group and book every inclusion.
        </p>
      </div>

      {notes && (
        <div className="mt-4 rounded-[22px] bg-blush p-6">
          <p className="eyebrow">Good to know</p>
          <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink-2">{notes}</p>
        </div>
      )}
    </aside>
  );
}
