import { Shell } from "./Shell";
import { ISparkle } from "./AdminIcons";

/**
 * A section that exists in the nav but isn't built yet. Says plainly what it
 * will do rather than showing an empty table that looks broken.
 */
export function Placeholder({
  title,
  subtitle,
  blurb,
  bullets,
}: {
  title: string;
  subtitle?: string;
  blurb: string;
  bullets: string[];
}) {
  return (
    <Shell title={title} subtitle={subtitle}>
      <div className="adm-card adm-card-pad max-w-[720px]">
        <span className="grid size-11 place-items-center rounded-[12px] bg-[var(--a-rose-100)] text-[var(--a-rose-700)]">
          <ISparkle size={20} />
        </span>
        <h2 className="adm-display mt-4 text-[26px]">Coming in the next build stage</h2>
        <p className="mt-2 max-w-[56ch] text-[14.5px] leading-relaxed text-[var(--a-ink-500)]">{blurb}</p>
        <ul className="mt-5 grid gap-2">
          {bullets.map((b) => (
            <li key={b} className="flex gap-3 text-[14px] text-[var(--a-ink-700)]">
              <span className="mt-[7px] size-1.5 flex-none rounded-full bg-[var(--a-rose-500)]" />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}
