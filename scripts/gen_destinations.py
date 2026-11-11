"""
docs/portal-handoff/destinations.json, built from the captured packages.

Names are derived from the URL slug and title-cased, with the handful of
Australian capitalisations a title-case rule gets wrong. They are a starting
point for the import, not gospel — the client can rename any of them in the
portal, and that is cheaper than guessing harder here.

    python scripts/gen_destinations.py
"""

import json, os
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "portal-handoff")

packages = json.load(open(os.path.join(OUT, "packages.json"), encoding="utf-8"))

# Which state each destination sits in, from their own site's navigation.
STATE = {
    "sydney": "NSW", "sydney-surrounds": "NSW", "blue-mountains": "NSW", "hunter-valley": "NSW",
    "central-coast": "NSW", "newcastle": "NSW", "port-stephens": "NSW", "byron-bay": "NSW",
    "north-coast": "NSW", "nsw-north-coast": "NSW", "mudgee": "NSW", "orange": "NSW",
    "southern-highlands": "NSW", "south-coast": "NSW", "nsw-south-coast": "NSW",
    "snowy-mountains": "NSW", "jervis-bay": "NSW", "kangaroo-valley": "NSW", "gerringong": "NSW",
    "shellharbour": "NSW", "culburra": "NSW", "wollombi": "NSW", "pokolbin": "NSW",
    "cooma": "NSW", "shoalhaven": "NSW", "vincentia": "NSW", "huskisson": "NSW",
    "brisbane": "QLD", "gold-coast": "QLD", "sunshine-coast": "QLD", "noosa": "QLD",
    "mooloolaba": "QLD", "burleigh-heads": "QLD", "port-douglas": "QLD", "airlie-beach": "QLD",
    "melbourne": "VIC", "mornington-peninsula": "VIC", "great-ocean-road": "VIC",
    "yarra-valley": "VIC", "daylesford": "VIC", "st-kilda": "VIC",
    "canberra": "ACT", "adelaide-hills": "SA", "barossa-valley": "SA", "adelaide": "SA",
    "margaret-river": "WA", "perth": "WA", "bali": "Bali",
}

FIXES = {"nsw": "NSW", "qld": "QLD", "vic": "VIC", "act": "ACT", "sa": "SA", "wa": "WA", "st": "St"}


def pretty(slug: str) -> str:
    return " ".join(FIXES.get(w, w.capitalize()) for w in slug.split("-"))


counts = Counter(p["data"]["destination"] for p in packages if p["data"]["destination"])

items = []
for i, (slug, n) in enumerate(sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))):
    items.append({
        "slug": slug,
        "status": "published",
        "position": i,
        "data": {
            "name": pretty(slug),
            "state": STATE.get(slug),
            "blurb": None,
            "image": None,
            "package_count": n,
        },
    })

with open(os.path.join(OUT, "destinations.json"), "w", encoding="utf-8") as f:
    json.dump(items, f, indent=2, ensure_ascii=False)
    f.write("\n")

missing = [i["slug"] for i in items if not i["data"]["state"]]
print(f"wrote {len(items)} destinations")
print(f"  packages per destination, top 8: {counts.most_common(8)}")
if missing:
    print(f"  no state mapped ({len(missing)}): {missing}")
