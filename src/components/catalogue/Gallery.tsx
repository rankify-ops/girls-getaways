"use client";

import { useEffect, useState } from "react";
import { IconClose, IconNext, IconPrev } from "@/components/ui/Icons";
import { imageAt } from "@/lib/portal";

/**
 * A package's photography.
 *
 * Six on screen, the rest behind a button — several packages carry thirty-odd
 * images and nobody scrolls that far before deciding. Clicking opens a
 * lightbox with keyboard navigation.
 */
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const shown = expanded ? images : images.slice(0, 6);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, images.length]);

  return (
    <>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {shown.map((src, i) => (
          <li key={src}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="plate plate-zoom group block aspect-[4/3] w-full rounded-[var(--rs)]"
              aria-label={`${title} — photo ${i + 1} of ${images.length}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageAt(src, 750)!} alt="" loading="lazy" decoding="async" />
            </button>
          </li>
        ))}
      </ul>

      {!expanded && images.length > 6 && (
        <button type="button" onClick={() => setExpanded(true)} className="btn btn-line mt-5">
          Show all {images.length} photos
        </button>
      )}

      {open !== null && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/92 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photos`}
          onClick={() => setOpen(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageAt(images[open], 2500)!}
            alt={`${title} — photo ${open + 1}`}
            className="max-h-[88svh] max-w-full rounded-[var(--rs)] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button type="button" onClick={() => setOpen(null)} className="absolute right-5 top-5 grid size-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur" aria-label="Close">
            <IconClose size={20} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((open - 1 + images.length) % images.length);
            }}
            className="absolute left-4 grid size-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur md:left-8"
            aria-label="Previous photo"
          >
            <IconPrev size={20} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((open + 1) % images.length);
            }}
            className="absolute right-4 grid size-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur md:right-8"
            aria-label="Next photo"
          >
            <IconNext size={20} />
          </button>
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[12.5px] tabular-nums text-white/70">
            {open + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}
