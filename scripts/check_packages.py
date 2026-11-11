"""
Assert the captured catalogue is sane, over every row — not a sample.

Run after scrape_packages.py. Anything printed here is a row the portal would
import wrong, so it gets fixed or explained before the import, not after.

    python scripts/check_packages.py
"""

import json, os, re, sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
items = json.load(open(os.path.join(ROOT, "docs", "portal-handoff", "packages.json"), encoding="utf-8"))

problems: list[str] = []


def flag(cond: bool, msg: str) -> None:
    if cond:
        problems.append(msg)


slugs = [i["slug"] for i in items]
dupes = [s for s, n in Counter(slugs).items() if n > 1]
flag(bool(dupes), f"duplicate slugs: {dupes}")

for i in items:
    d, s = i["data"], i["slug"]
    flag(not d["title"], f"{s}: no title")
    flag(len(d["title"] or "") > 120, f"{s}: title suspiciously long — {str(d['title'])[:60]!r}")
    flag(not d["destination"], f"{s}: no destination")
    flag(not d["blurb"], f"{s}: no blurb")
    flag(not d["hero_image"], f"{s}: no hero image")
    flag(not d["inclusions"], f"{s}: no inclusions")
    flag(not d["styles"], f"{s}: no styles")

    pt = d["price_table"]
    flag(not pt, f"{s}: no price table")
    if pt:
        sizes = [r["girls"] for r in pt]
        prices = [r["price"] for r in pt]
        flag(sizes != sorted(sizes), f"{s}: price rows out of order — {sizes}")
        # A size may appear twice — several packages offer two accommodation
        # types at different prices. The same size at the SAME price is a
        # parsing fault, not a second option.
        rows = [(r["girls"], r["price"]) for r in pt]
        flag(len(set(rows)) != len(rows), f"{s}: identical price rows repeated — {sizes}")
        flag(min(prices) < 50, f"{s}: implausible low price ${min(prices)}")
        flag(max(prices) > 5000, f"{s}: implausible high price ${max(prices)}")
        flag(d["price_from"] != min(prices), f"{s}: price_from {d['price_from']} != table min {min(prices)}")
        flag(d["guests_min"] != min(sizes), f"{s}: guests_min disagrees with table")
        flag(d["guests_max"] != max(sizes), f"{s}: guests_max disagrees with table")
    flag(bool(d["nights"]) and not (1 <= d["nights"] <= 14), f"{s}: odd nights {d['nights']}")
    copy = " ".join(str(d.get(k) or "") for k in ("blurb", "description", "notes", "escape_style"))
    flag(bool(re.search(r"<[a-z]", copy, re.I)), f"{s}: markup leaked into the copy")
    flag("--tweak" in copy or "#block-" in copy, f"{s}: Squarespace CSS leaked into the copy")
    # Page furniture that follows the last section, and double-encoded entities
    # — both land in fields the client reads in the portal.
    furniture = re.search(r"(BOOKING REQUEST|View Booking Terms|GG Team|JOIN THE GG)", copy, re.I)
    flag(bool(furniture), f"{s}: page furniture in the copy — {furniture.group(1) if furniture else ''!r}")
    entity = re.search(r"&(nbsp|amp|quot|#\d+);", copy)
    flag(bool(entity), f"{s}: unescaped entity in the copy — {entity.group(0) if entity else ''!r}")
    flag("\xa0" in copy, f"{s}: non-breaking spaces left in the copy")

print(f"checked {len(items)} packages")
print(f"destinations: {len(set(i['data']['destination'] for i in items))}")
print(f"price range:  ${min(i['data']['price_from'] for i in items)}–${max(i['data']['price_from'] for i in items)} pp")
print(f"styles used:  {len(set(t for i in items for t in i['data']['styles']))}")
print()
print("most common styles:", Counter(t for i in items for t in i["data"]["styles"]).most_common(12))
print()
if problems:
    print(f"!! {len(problems)} problems")
    for p in problems[:40]:
        print("  -", p)
    sys.exit(1)
print("no problems")
