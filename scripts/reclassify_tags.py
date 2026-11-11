"""
Move place names out of the getaway styles.

Their tag list mixes both, and the first pass only caught places that matched
the URL. The rest are visible in each package's own venue line — "LUXURY
RESORT, POKOLBIN" tagged `pokolbin` — or are a destination with a suffix,
like `sydney cbd`.

A tag is a place when any of these hold:
  * it matches a destination slug or name
  * it appears inside that package's venue line
  * it starts with a destination name ("sydney cbd")

Everything else stays a style, including the low-count marketing ones like
`fan faves` and `relaxing`, which are genuinely how they label packages.

    python scripts/reclassify_tags.py
"""

import json, os, re
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "portal-handoff")

packages = json.load(open(os.path.join(OUT, "packages.json"), encoding="utf-8"))
destinations = json.load(open(os.path.join(OUT, "destinations.json"), encoding="utf-8"))

places = {d["slug"].replace("-", " ") for d in destinations}
places |= {str(d["data"]["name"]).lower() for d in destinations}
places |= {p["data"]["destination"].replace("-", " ") for p in packages if p["data"]["destination"]}
places |= {p["data"]["area"].replace("-", " ") for p in packages if p["data"]["area"]}

moved: Counter = Counter()

# Places their tagging spells differently or that no package sits under.
# Listed explicitly so the judgement is visible and arguable, not buried.
EXTRA_PLACES = {
    "polkobin", "victoria", "southern highlands", "fremantle/rottnest island",
    "adelaide hills", "manyana", "ettalong", "margaret river",
}

for p in packages:
    d = p["data"]
    # Only the locality, never the whole venue line: "LUXURY RESORT, POKOLBIN"
    # would otherwise file the style `luxury` as a place.
    venue_full = (d.get("venue") or "").lower()
    venue = venue_full.rsplit(",", 1)[-1].strip() if "," in venue_full else ""
    keep, place_tags = [], list(d.get("place_tags") or [])
    for tag in d.get("styles", []):
        t = tag.lower().strip()
        is_place = (
            t in places
            or t in EXTRA_PLACES
            # Whole words only: `hens` is inside "port stephens", and matching
            # on substrings filed six hens packages as a place.
            or (len(t) > 3 and venue and re.search(rf"\b{re.escape(t)}\b", venue) is not None)
            or any(t.startswith(pl + " ") or t.endswith(" " + pl) for pl in places if len(pl) > 3)
        )
        if is_place:
            place_tags.append(tag)
            moved[tag] += 1
        else:
            keep.append(tag)
    d["styles"] = keep
    d["place_tags"] = sorted(set(place_tags))

json.dump(packages, open(os.path.join(OUT, "packages.json"), "w", encoding="utf-8"), indent=2, ensure_ascii=False)

styles = Counter(t for p in packages for t in p["data"]["styles"])
print(f"moved {sum(moved.values())} tag uses ({len(moved)} distinct) out of styles:")
for t, n in moved.most_common(12):
    print(f"   {t:28} {n}")
print(f"\n{len(styles)} styles remain:")
for t, n in styles.most_common():
    print(f"   {t:28} {n}")
no_style = [p["slug"] for p in packages if not p["data"]["styles"]]
if no_style:
    print(f"\npackages left with no style ({len(no_style)}): {no_style[:6]}")
