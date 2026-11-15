"use client";

import { useMemo, useSyncExternalStore } from "react";
import { readPreset, type Preset } from "@/lib/filters";

/*
 * What the visitor searched for, on a page that was not built for that search.
 *
 * A package page is made once and served to everyone, so it cannot know that
 * this visitor arrived from "Queensland, 7 girls, 11–13 December". The results
 * page puts that in the link (?girls=7&from=…&to=…) and this reads it in the
 * browser, so the price panel can show the price for seven and the enquiry
 * form can open with the group and the dates already in it.
 *
 * Read from the address rather than useSearchParams: that hook makes a
 * ready-made page wait on the request, to learn something only two small
 * parts of it use. Empty on the server and until the browser answers.
 */
const listeners = new Set<() => void>();
const subscribe = (f: () => void) => {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
};

export function useSearchContext(): Preset {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
  return useMemo(() => readPreset(search), [search]);
}

/*
 * Change the group size from the page itself.
 *
 * The price panel has a "how many girls" picker. Choosing there writes the
 * size to the address and tells every reader of the search, so the headline
 * price and the enquiry form follow in the same moment, and a link copied
 * afterwards carries the size the organiser was looking at.
 */
export function setSearchGirls(girls: number) {
  const q = new URLSearchParams(window.location.search);
  if (girls > 0) q.set("girls", String(girls));
  else q.delete("girls");
  const s = q.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${s ? `?${s}` : ""}`);
  listeners.forEach((f) => f());
}
