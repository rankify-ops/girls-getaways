import { IconCheck, IconPin, IconSparkle, IconWallet } from "@/components/ui/Icons";
import { proof, ratedLine } from "@/content/reviews";

// The first three are claims her live site already makes. The fourth is her
// Google rating (content/reviews.ts), in place of "Made for girl time", which
// said nothing a visitor could check.
const items = [
  { icon: IconPin, t: "100+ packages", d: "Boutique getaways Australia-wide" },
  { icon: IconCheck, t: "We book it all", d: "Every inclusion organised for you" },
  { icon: IconWallet, t: "Individual payments", d: "No chasing the group for money" },
  { icon: IconSparkle, t: ratedLine, d: `From ${proof.count} reviews` },
];

export function Trust() {
  return (
    <section className="border-b border-rule bg-paper">
      <div className="ctr grid grid-cols-2 gap-x-6 gap-y-7 py-9 lg:grid-cols-4 lg:py-11">
        {items.map(({ icon: I, t, d }) => (
          <div key={t} className="flex items-start gap-3.5">
            <span className="grid size-11 flex-none place-items-center rounded-full bg-blush text-clay-ink">
              <I size={19} />
            </span>
            <div>
              <p className="text-[14.5px] font-medium text-ink">{t}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-ink-3">{d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
