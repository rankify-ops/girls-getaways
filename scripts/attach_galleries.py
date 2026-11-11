"""
Attach each package's gallery to packages.json, from the media manifest.

A package page also shows thumbnails of other packages, so "every image on
this page" is not this package's gallery. Only images that appear on exactly
one package page belong to it; anything cross-listed is someone else's hero.
The package's own hero is excluded too — it already has its own field.

    python scripts/attach_galleries.py
"""

import json, os
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "portal-handoff")

manifest = json.load(open(os.path.join(OUT, "media-manifest.json"), encoding="utf-8"))
packages = json.load(open(os.path.join(OUT, "packages.json"), encoding="utf-8"))

by_path = {p["data"]["legacy_path"]: p for p in packages}
heroes = {p["data"].get("hero_image") for p in packages}

galleries: dict[str, list[str]] = defaultdict(list)
for url, meta in manifest.items():
    pages = [u["page"] for u in meta.get("uses", []) if u.get("type") == "package page"]
    # Unique to one package page, and not a hero shown in its own gallery.
    if len(set(pages)) != 1 or url in heroes:
        continue
    page = pages[0]
    if page in by_path:
        galleries[by_path[page]["slug"]].append(url)

counts = []
for p in packages:
    imgs = galleries.get(p["slug"], [])
    p["data"]["gallery"] = imgs
    counts.append(len(imgs))

json.dump(packages, open(os.path.join(OUT, "packages.json"), "w", encoding="utf-8"), indent=2, ensure_ascii=False)

counts.sort()
print(f"galleries attached to {sum(1 for c in counts if c)}/{len(packages)} packages")
print(f"  images per package: min {counts[0]}, median {counts[len(counts) // 2]}, max {counts[-1]}")
print(f"  total gallery images: {sum(counts)}")
