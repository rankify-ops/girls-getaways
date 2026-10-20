"use client";

import { useState } from "react";
import type { PackageRow } from "@/lib/admin-data";
import { ISparkle } from "./AdminIcons";

/*
 * The package editor.
 *
 * Fields mirror the `packages` table in supabase/schema.sql. Until the
 * client's database exists the form renders in read-only mode: the client can
 * see exactly what they'll be able to edit, but nothing pretends to save.
 */

type Props = {
  pkg: PackageRow;
  image: string | null;
  readOnly: boolean;
  destinations: { slug: string; name: string }[];
  styles: string[];
};

export function PackageEditor({ pkg, image, readOnly, destinations, styles }: Props) {
  const [form, setForm] = useState({
    title: pkg.title,
    venue: pkg.venue ?? "",
    blurb: pkg.blurb ?? "",
    priceFrom: pkg.priceFrom?.toString() ?? "",
    guestsMin: pkg.guestsMin?.toString() ?? "",
    guestsMax: pkg.guestsMax?.toString() ?? "",
    nights: pkg.nights?.toString() ?? "",
    slotsLeft: pkg.slotsLeft?.toString() ?? "",
    popular: pkg.popular,
    status: pkg.status,
    styles: pkg.styles,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm({ ...form, [k]: v });
  const toggleStyle = (s: string) =>
    set("styles", form.styles.includes(s) ? form.styles.filter((x) => x !== s) : [...form.styles, s]);

  return (
    <form
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="grid gap-4">
        {readOnly && (
          <div className="adm-banner">
            <ISparkle size={18} />
            <span>
              <b>Preview only.</b> Connect the database and this form saves straight to the website.
            </span>
          </div>
        )}

        <section className="adm-card adm-card-pad grid gap-4">
          <h2 className="adm-display text-[21px]">The basics</h2>
          <div>
            <label className="adm-label" htmlFor="pk-title">Package name</label>
            <input id="pk-title" className="adm-field" value={form.title} disabled={readOnly}
              onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="adm-label" htmlFor="pk-venue">Venue</label>
              <input id="pk-venue" className="adm-field" value={form.venue} disabled={readOnly}
                placeholder="The Calile Hotel" onChange={(e) => set("venue", e.target.value)} />
            </div>
            <div>
              <label className="adm-label" htmlFor="pk-dest">Destination</label>
              <select id="pk-dest" className="adm-field" defaultValue={pkg.destination ?? ""} disabled={readOnly}>
                <option value="">Not set</option>
                {destinations.map((d) => (
                  <option key={d.slug} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="adm-label" htmlFor="pk-blurb">Short description</label>
            <textarea id="pk-blurb" className="adm-field" rows={4} value={form.blurb} disabled={readOnly}
              placeholder="Shown on the package card and at the top of the package page."
              onChange={(e) => set("blurb", e.target.value)} />
            <p className="adm-hint">{form.blurb.length} characters · around 160 reads best on a card.</p>
          </div>
        </section>

        <section className="adm-card adm-card-pad grid gap-4">
          <h2 className="adm-display text-[21px]">Pricing &amp; group size</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="adm-label" htmlFor="pk-price">From (per person)</label>
              <input id="pk-price" className="adm-field" inputMode="decimal" value={form.priceFrom} disabled={readOnly}
                placeholder="Leave blank for “on request”" onChange={(e) => set("priceFrom", e.target.value)} />
            </div>
            <div>
              <label className="adm-label" htmlFor="pk-gmin">Min girls</label>
              <input id="pk-gmin" className="adm-field" inputMode="numeric" value={form.guestsMin} disabled={readOnly}
                onChange={(e) => set("guestsMin", e.target.value)} />
            </div>
            <div>
              <label className="adm-label" htmlFor="pk-gmax">Max girls</label>
              <input id="pk-gmax" className="adm-field" inputMode="numeric" value={form.guestsMax} disabled={readOnly}
                onChange={(e) => set("guestsMax", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="adm-label" htmlFor="pk-nights">Nights</label>
              <input id="pk-nights" className="adm-field" inputMode="numeric" value={form.nights} disabled={readOnly}
                onChange={(e) => set("nights", e.target.value)} />
            </div>
            <div>
              <label className="adm-label" htmlFor="pk-slots">Slots left</label>
              <input id="pk-slots" className="adm-field" inputMode="numeric" value={form.slotsLeft} disabled={readOnly}
                placeholder="Blank hides the badge" onChange={(e) => set("slotsLeft", e.target.value)} />
            </div>
          </div>
        </section>

        <section className="adm-card adm-card-pad">
          <h2 className="adm-display text-[21px]">Getaway styles</h2>
          <p className="adm-hint mb-3">Controls which filters this package appears under on the website.</p>
          <div className="flex flex-wrap gap-2">
            {styles.map((s) => {
              const on = form.styles.includes(s);
              return (
                <button key={s} type="button" disabled={readOnly} onClick={() => toggleStyle(s)}
                  aria-pressed={on}
                  className={`adm-tab ${on ? "" : "border border-[var(--a-line)]"}`}
                  style={on ? { background: "var(--a-ink-900)", color: "#fff" } : undefined}>
                  {s}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <aside className="grid gap-4 lg:sticky lg:top-[88px]">
        <section className="adm-card overflow-hidden">
          <div className="adm-pkg-photo" style={{ aspectRatio: "16 / 11" }}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" />
            ) : null}
          </div>
          <div className="p-4">
            <button type="button" className="adm-btn adm-btn-ghost w-full" disabled={readOnly}>
              Replace photo
            </button>
            <p className="adm-hint mt-2">Landscape, at least 1600px wide.</p>
          </div>
        </section>

        <section className="adm-card adm-card-pad grid gap-3">
          <h2 className="adm-display text-[19px]">Visibility</h2>
          <div className="grid gap-2">
            {([
              ["published", "Live on the website"],
              ["draft", "Draft — hidden from visitors"],
            ] as const).map(([v, label]) => (
              <label key={v} className="flex items-center gap-3 text-[14px]">
                <input type="radio" name="status" value={v} checked={form.status === v} disabled={readOnly}
                  onChange={() => set("status", v)} />
                {label}
              </label>
            ))}
          </div>
          <label className="mt-1 flex items-center gap-3 text-[14px]">
            <input type="checkbox" checked={form.popular} disabled={readOnly}
              onChange={(e) => set("popular", e.target.checked)} />
            Show the “Popular” badge
          </label>
        </section>

        <div className="flex gap-2">
          <button type="submit" className="adm-btn adm-btn-rose flex-1" disabled={readOnly}>
            Save changes
          </button>
        </div>
      </aside>
    </form>
  );
}
