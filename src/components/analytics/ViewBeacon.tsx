"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/*
 * Counts a page view in the client's own portal.
 *
 * A counter per path per day — no visitor id, no address, no session, nothing
 * to consent to. It exists so her Reports screen can answer the one question
 * worth answering: which packages get looked at and never enquired about.
 * That needs views, enquiries and bookings in the same place, which a third
 * party cannot do.
 *
 * It posts to /api/view here rather than straight to the portal for the same
 * reason enquiries do: the portal URL carries the site id, which is the key to
 * the whole collection API, and a NEXT_PUBLIC_ one would ship in the bundle.
 *
 * Deliberately unawaited and deliberately silent. A counter must never be the
 * reason a visitor sees something go wrong, so a failure here does nothing.
 */

/** The package slug, on a package page only. */
function itemOf(path: string): string | undefined {
  const parts = path.replace(/^\/|\/$/g, "").split("/");
  // /package-search/<destination>[/<area>]/<slug> — the listing itself is not an item.
  return parts[0] === "package-search" && parts.length > 1 ? parts[parts.length - 1] : undefined;
}

/*
 * Module scope on purpose, not a ref.
 *
 * A ref is per component instance, so a remount — which React does in
 * development, and which a layout change can do in production — resets it and
 * the same page counts twice. These numbers are meant to be acted on, so a
 * path is counted once per page session however many times this mounts.
 */
const seen = new Set<string>();

export function ViewBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || seen.has(pathname)) return;
    seen.add(pathname);

    const path = pathname.replace(/\/+$/, "") || "/";
    void fetch("/api/view/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path, item: itemOf(pathname) }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
