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
const never = () => () => {};

export function useSearchContext(): Preset {
  const search = useSyncExternalStore(
    never,
    () => window.location.search,
    () => "",
  );
  return useMemo(() => readPreset(search), [search]);
}
