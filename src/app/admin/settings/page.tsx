import { Shell } from "@/components/admin/Shell";
import { ICheckless } from "@/components/admin/StatusDot";

export const metadata = { title: "Settings" };
export const revalidate = 0;

export default function SettingsPage() {
  // Read on the server: presence only, never the values themselves.
  const checks = [
    {
      label: "Database (Supabase)",
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      detail: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? "Connected — packages save to the client's own project."
        : "Not connected yet. The portal is showing preview data from the current website.",
    },
    {
      label: "Admin write access",
      ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      detail: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? "Service key present — the portal can publish changes."
        : "Service key missing, so saving is disabled.",
    },
    {
      label: "Enquiry notifications",
      ok: Boolean(process.env.NEXT_PUBLIC_WEB3FORMS_KEY),
      detail: process.env.NEXT_PUBLIC_WEB3FORMS_KEY
        ? "Booking requests are emailed through."
        : "No email key yet — the website tells visitors to call instead.",
    },
  ];

  return (
    <Shell title="Settings" subtitle="Connections and site configuration">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <section className="adm-card adm-card-pad">
          <h2 className="adm-display text-[21px]">Connections</h2>
          <p className="adm-hint mb-4">What the portal is wired into right now.</p>
          {checks.map((c) => (
            <div key={c.label} className="adm-row items-start">
              <ICheckless ok={c.ok} />
              <span className="min-w-0">
                <span className="block text-[14.5px] text-[var(--a-ink-900)]">{c.label}</span>
                <span className="block text-[13px] leading-relaxed text-[var(--a-ink-400)]">{c.detail}</span>
              </span>
            </div>
          ))}
        </section>

        <section className="adm-card adm-card-pad">
          <h2 className="adm-display text-[21px]">Team</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--a-ink-500)]">
            Logins are added once the database is connected. Each person gets their own email and password, and
            you can remove access at any time.
          </p>
        </section>
      </div>
    </Shell>
  );
}
