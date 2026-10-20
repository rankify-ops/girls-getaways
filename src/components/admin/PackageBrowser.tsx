"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ISearch } from "./AdminIcons";

type Card = {
  id: string;
  slug: string;
  title: string;
  venue: string | null;
  place: string;
  price: string;
  image: string | null;
  styles: string[];
  status: "draft" | "published" | "archived";
  popular: boolean;
  slotsLeft: number | null;
};

/** Search + status tabs over the package grid, filtered in the browser. */
export function PackageBrowser({ packages }: { packages: Card[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");

  const counts = useMemo(
    () => ({
      all: packages.length,
      published: packages.filter((p) => p.status === "published").length,
      draft: packages.filter((p) => p.status === "draft").length,
    }),
    [packages]
  );

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return packages.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (!needle) return true;
      return [p.title, p.venue, p.place, ...p.styles].filter(Boolean).join(" ").toLowerCase().includes(needle);
    });
  }, [packages, q, status]);

  return (
    <>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="adm-searchbar flex-1">
          <ISearch size={17} />
          <span className="sr-only">Search packages</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search packages, destinations, styles…"
          />
        </label>
        <div className="adm-tabs" role="tablist" aria-label="Filter by status">
          {([
            ["all", "All"],
            ["published", "Live"],
            ["draft", "Drafts"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={status === key}
              className="adm-tab"
              onClick={() => setStatus(key)}
            >
              {label}
              <span className="adm-tab-n">{counts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="adm-empty mt-5">
          <p className="adm-display text-[22px]">Nothing matches</p>
          <p className="text-[13.5px] text-[var(--a-ink-400)]">
            {q ? `No packages match “${q}”.` : "No packages with this status yet."}
          </p>
        </div>
      ) : (
        <div className="adm-pkg-grid mt-5">
          {shown.map((p) => (
            <Link key={p.id} href={`/admin/packages/${p.slug}`} className="adm-pkg">
              <span className="adm-pkg-photo">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" loading="lazy" decoding="async" />
                ) : null}
                <span className="adm-pkg-badges">
                  {p.popular && <span className="adm-pkg-badge adm-pkg-badge-gold">★ Popular</span>}
                  {p.slotsLeft !== null && <span className="adm-pkg-badge">{p.slotsLeft} slots left</span>}
                  {p.status === "draft" && <span className="adm-pkg-badge">Draft</span>}
                </span>
                <span className="adm-pkg-titles">
                  <span className="adm-pkg-title block">{p.title}</span>
                  <span className="adm-pkg-place block">{p.place}</span>
                </span>
              </span>

              <span className="adm-pkg-body">
                <span className="adm-pkg-styles">
                  {p.styles.slice(0, 3).map((s) => (
                    <span key={s} className="adm-pill">
                      {s}
                    </span>
                  ))}
                </span>
                <span className="adm-pkg-foot">
                  <span>
                    <span className="block text-[11.5px] text-[var(--a-ink-400)]">From</span>
                    <span className="adm-pkg-price">
                      {p.price} <span>pp</span>
                    </span>
                  </span>
                  {p.venue && (
                    <span className="max-w-[48%] truncate text-right text-[12px] text-[var(--a-ink-400)]">
                      {p.venue}
                    </span>
                  )}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
