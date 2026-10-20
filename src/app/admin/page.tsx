import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { IBox, IExternal, IPin, IPlus, ISparkle } from "@/components/admin/AdminIcons";
import { getPackages, placeLabel, priceLabel } from "@/lib/admin-data";
import { STYLES } from "@/content/site";

export const metadata = { title: "Dashboard" };
export const revalidate = 0;

export default async function AdminDashboard() {
  const { data: packages, source } = await getPackages();
  const published = packages.filter((p) => p.status === "published");
  const drafts = packages.filter((p) => p.status === "draft");
  const destinations = new Set(packages.map((p) => p.destination).filter(Boolean));
  const recent = packages.slice(0, 6);

  const tiles = [
    { label: "Published packages", value: published.length, href: "/admin/packages" },
    { label: "Drafts", value: drafts.length, href: "/admin/packages?status=draft" },
    { label: "Destinations", value: destinations.size, href: "/admin/destinations" },
    { label: "Getaway styles", value: STYLES.length, href: "/admin/content" },
  ];

  return (
    <Shell
      title="Dashboard"
      subtitle="Everything on the Girls Getaways website, in one place"
      actions={
        <Link href="/admin/packages/new" className="adm-btn adm-btn-rose">
          <IPlus size={16} /> New package
        </Link>
      }
    >
      {source === "seed" && (
        <div className="adm-banner mb-5">
          <ISparkle size={18} />
          <span className="min-w-0">
            <b>Preview mode.</b> The database isn&apos;t connected yet, so this is showing the{" "}
            {packages.length} packages captured from the current website. Nothing saves until Supabase is wired in.
          </span>
        </div>
      )}

      <div className="adm-grid adm-grid-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="adm-card adm-card-pad transition-shadow hover:shadow-md">
            <p className="adm-tile-label">{t.label}</p>
            <p className="adm-tile-value adm-display mt-2">{t.value}</p>
          </Link>
        ))}
      </div>

      <div className="adm-grid adm-grid-2 mt-4 items-start">
        <section className="adm-card adm-card-pad">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="adm-display text-[21px]">Recently updated</h2>
            <Link href="/admin/packages" className="text-[13px] text-[var(--a-rose-700)] hover:underline">
              All packages →
            </Link>
          </div>
          <div className="mt-3">
            {recent.map((p) => (
              <Link key={p.id} href={`/admin/packages/${p.slug}`} className="adm-row group">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] text-[var(--a-ink-900)] group-hover:text-[var(--a-rose-700)]">
                    {p.title}
                  </span>
                  <span className="block truncate text-[12.5px] text-[var(--a-ink-400)]">{placeLabel(p)}</span>
                </span>
                <span className="text-[13px] tabular-nums text-[var(--a-ink-500)]">{priceLabel(p)}</span>
                <span className={`adm-pill ${p.status === "published" ? "adm-pill-ok" : "adm-pill-draft"}`}>
                  {p.status === "published" ? "Live" : "Draft"}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="adm-card adm-card-pad">
          <h2 className="adm-display text-[21px]">Quick actions</h2>
          <div className="mt-4 grid gap-2">
            {[
              { href: "/admin/packages/new", icon: IPlus, t: "Add a package", d: "Photos, pricing, inclusions" },
              { href: "/admin/packages", icon: IBox, t: "Edit packages", d: "Update prices or availability" },
              { href: "/admin/destinations", icon: IPin, t: "Manage destinations", d: "Regions shown on the site" },
              { href: "/", icon: IExternal, t: "View the website", d: "See what visitors see" },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.t}
                  href={a.href}
                  className="flex items-center gap-3 rounded-[var(--a-r-lg)] border border-[var(--a-line)] p-3 transition-colors hover:border-[var(--a-line-strong)] hover:bg-[var(--a-subtle)]"
                >
                  <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-[var(--a-rose-100)] text-[var(--a-rose-700)]">
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] text-[var(--a-ink-900)]">{a.t}</span>
                    <span className="block truncate text-[12.5px] text-[var(--a-ink-400)]">{a.d}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </Shell>
  );
}
