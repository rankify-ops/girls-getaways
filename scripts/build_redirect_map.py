"""Turn the redirect rules into the map the site actually uses.

docs/portal-handoff/redirect-rules.json says where each of her 343 old addresses
should go (scripts/build_redirect_rules.py wrote it, and argues each one). This
turns the "filtered" column into src/content/redirects.json, leaving out every
address that is a real page on the new site and so needs no redirect:

  - the 123 packages and the catalogue, which kept their addresses
  - the standing pages that were rebuilt (contact, team, gift cards, how it
    works, couples) and the blog with its 23 posts

Two shapes come out, because two things read it:

  paths     plain addresses like /berry. next.config.ts turns these into redirects.
  archives  tag and category archives, whose addresses carry spaces, plus signs
            and percent signs (/package-search/tag/12%2B+girls). Those are matched
            in the page itself, on a tidied key, because a pattern-matcher is the
            wrong tool for a string that is already half-encoded.

    python -I scripts/build_redirect_map.py
"""

import json
import os
import re
from urllib.parse import unquote

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
RULES = os.path.join(REPO, "docs", "portal-handoff", "redirect-rules.json")
OUT = os.path.join(REPO, "src", "content", "redirects.json")

# Rebuilt as real pages: no redirect, they simply resolve.
REAL = {"/contact-us", "/gg-team", "/gift-cards", "/how-it-works", "/couples-getaways", "/the-gg-diaries"}
ARCHIVES = ("/package-search/tag/", "/package-search/category/", "/the-gg-diaries/category/", "/the-gg-diaries/tag/")


def slugify(v):
    """The same tidy-up as src/lib/filters.ts, so a key made here matches one made there."""
    s = re.sub(r"['\u2019]", "", unquote(v).strip().lower())
    s = re.sub(r"[/+\s_]+", "-", s)
    return "-".join(x for x in s.split("-") if x)


def main():
    rules = json.load(open(RULES, encoding="utf-8"))
    posts = {"/the-gg-diaries/" + d["slug"] for d in json.load(open(os.path.join(REPO, "src", "content", "diaries.json"), encoding="utf-8"))}
    paths, archives, skipped = {}, {a.strip("/"): {} for a in ARCHIVES}, 0

    for r in rules:
        frm, to = r["from"], r.get("to_filtered")
        if r["rule"] == "R0-packages" or frm in REAL or frm in posts or not to:
            skipped += 1
            continue
        arch = next((a for a in ARCHIVES if frm.startswith(a)), None)
        if arch:
            # Blog archives used to point at the home page; there is a blog to point at now.
            if arch.startswith("/the-gg-diaries/") and to == "/":
                to = "/the-gg-diaries/"
            archives[arch.strip("/")][slugify(frm[len(arch):])] = to
        elif re.fullmatch(r"/[a-z0-9\-/]+", frm):
            paths[frm] = to
        else:
            raise SystemExit("an address that is neither plain nor an archive: " + frm)

    out = {"paths": dict(sorted(paths.items())), "archives": {k: dict(sorted(v.items())) for k, v in archives.items()}}
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("%d plain redirects, %d archive redirects, %d addresses that need none" % (len(paths), sum(len(v) for v in archives.values()), skipped))
    for k, v in archives.items():
        print("  %-28s %d" % (k, len(v)))


if __name__ == "__main__":
    main()
