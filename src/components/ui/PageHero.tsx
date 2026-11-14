import type { ReactNode } from "react";

/*
 * The top of a standing page: where you are, what it is, one line about it.
 *
 * The same blush band the catalogue opens with, so a page reached from the
 * menu feels like the same site as the one they were just on. An image is
 * optional and sits beside the words rather than behind them, because these
 * are pages people read.
 */
export function PageHero({ eyebrow, title, lede, image, alt = "", children }: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  image?: string;
  alt?: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-blush pb-12 pt-28 md:pb-16 md:pt-36">
      <div className={`ctr ${image ? "grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-16" : ""}`}>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="h2 mt-3 max-w-[18ch]">{title}</h1>
          {lede && <p className="lede mt-4 max-w-[58ch]">{lede}</p>}
          {children && <div className="mt-7 flex flex-wrap gap-3">{children}</div>}
        </div>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element -- one fixed, already-compressed file from public/img/pages
          <img src={image} alt={alt} className="aspect-[4/3] w-full rounded-[28px] object-cover shadow-[var(--shadow)]" />
        )}
      </div>
    </section>
  );
}
