"""
Pull every package's hero image off Squarespace, before the account is cancelled.

All 123 hero images are hotlinked to static1.squarespace.com. The day that
account lapses, the whole catalogue loses its photography — including after the
content has moved into the portal, because the portal would be storing the
Squarespace URL, not the file.

This takes a local copy at full resolution so nothing depends on their old
host. Files land in assets-raw/packages/ (gitignored — too heavy for the repo)
and are the source for whichever home they end up in: the portal's attachment
storage, or public/img/ here.

    python scripts/save_hero_images.py
"""

import concurrent.futures as cf, json, os, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets-raw", "packages")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36"

os.makedirs(OUT, exist_ok=True)
packages = json.load(open(os.path.join(ROOT, "docs", "portal-handoff", "packages.json"), encoding="utf-8"))

failed: list[tuple[str, str]] = []


def grab(pkg: dict) -> int:
    slug, url = pkg["slug"], pkg["data"].get("hero_image")
    if not url:
        failed.append((slug, "no hero image"))
        return 0
    # Squarespace serves the original when asked for its largest rendition.
    src = url.split("?")[0] + "?format=2500w"
    ext = os.path.splitext(url.split("?")[0])[1].lower() or ".jpg"
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        ext = ".jpg"
    path = os.path.join(OUT, f"{slug}{ext}")
    if os.path.exists(path) and os.path.getsize(path) > 5_000:
        return os.path.getsize(path)
    try:
        req = urllib.request.Request(src, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=90) as r:
            body = r.read()
        if len(body) < 5_000:
            failed.append((slug, f"suspiciously small: {len(body)} bytes"))
            return 0
        open(path, "wb").write(body)
        return len(body)
    except Exception as e:  # noqa: BLE001 — collect and report, don't abort the batch
        failed.append((slug, str(e)[:80]))
        return 0


with cf.ThreadPoolExecutor(max_workers=6) as ex:
    sizes = list(ex.map(grab, packages))

got = [s for s in sizes if s]
print(f"saved {len(got)}/{len(packages)} hero images")
print(f"  total: {sum(got) / 1_048_576:.1f} MB into assets-raw/packages/")
if failed:
    print(f"  failed: {len(failed)}")
    for slug, why in failed[:12]:
        print(f"    {slug}: {why}")
