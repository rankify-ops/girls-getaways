"""
Add the slug-named hero copies to the media manifest.

The heroes were saved first, by save_hero_images.py, before the manifest
existed — so the manifest knows them only as gallery files with hashed names.
Rewiring `hero_image` per package is the single most important lookup in the
whole archive, so it gets an explicit entry: package slug → local file.

    python scripts/index_heroes.py
"""

import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.environ.get("GG_MEDIA_ROOT") or r"D:\RANKIFY-media\girls-getaways"
OUT = os.path.join(ROOT, "docs", "portal-handoff")

manifest_path = os.path.join(RAW, "manifest.json")
manifest = json.load(open(manifest_path, encoding="utf-8"))
packages = json.load(open(os.path.join(OUT, "packages.json"), encoding="utf-8"))

saved = {os.path.splitext(f)[0]: f for f in os.listdir(os.path.join(RAW, "packages"))}

linked, missing = 0, []
for p in packages:
    slug, url = p["slug"], p["data"].get("hero_image")
    file = saved.get(slug)
    if not url or not file:
        missing.append(slug)
        continue
    entry = manifest.get(url, {})
    entry.update({
        "hero_path": f"packages/{file}",
        "hero_for": slug,
        "kind": "image",
        "bytes": entry.get("bytes") or os.path.getsize(os.path.join(RAW, "packages", file)),
        "uses": entry.get("uses") or [{"page": p["data"].get("legacy_path"), "type": "package hero"}],
    })
    entry.setdefault("path", f"packages/{file}")
    entry.setdefault("chrome", False)
    manifest[url] = entry
    linked += 1

json.dump(manifest, open(manifest_path, "w", encoding="utf-8"), indent=1)
json.dump(manifest, open(os.path.join(OUT, "media-manifest.json"), "w", encoding="utf-8"), indent=1)

print(f"hero entries linked: {linked}/{len(packages)}")
if missing:
    print(f"  no saved hero for: {missing}")
print(f"manifest entries: {len(manifest)}")
