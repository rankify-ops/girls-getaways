"""Turn the 343 captured Squarespace URLs into a small set of redirect RULES.

Written to be argued with: every URL lands in exactly one rule, each rule says
how many URLs it covers, and anything that cannot be placed is listed rather
than quietly swept into the home page.

Two target columns, because the choice of target is Tom's:
  simple   - only the three URL shapes that exist today (home, catalogue, package)
  filtered - adds a query string the catalogue reads, so a place or style URL
             lands on that subset instead of the whole catalogue

The filtered column assumes three parameters:
  ?place=<slug>   matches a package's destination OR its area OR one of its
                  place tags. All three, because the same town is filed
                  differently from package to package - Gerringong is its own
                  destination on three and an area of NSW South Coast on two -
                  and a filter that reads only one of the three silently
                  answers short. Her records are not wrong; they are two
                  reasonable models of the same coastline, so the filter bends
                  rather than the data.
  ?state=<CODE>   NSW / QLD / VIC / ACT / SA / WA / Bali, for her seven state
                  pages. Every destination carries one as of 2026-11-12.
  ?style=<name>   one of the 18 styles her packages actually carry.
  ?girls=<n>      a group size the package's price table covers.

Run it again whenever the catalogue changes: it reads the live portal, so a new
destination or a re-filed package shows up as a changed target rather than a
silently stale one.

    python -I scripts/build_redirect_rules.py
"""

import json
import os
import urllib.request
from urllib.parse import unquote_plus

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
HANDOFF = os.path.join(REPO, "docs", "portal-handoff")

BASE = os.environ.get("PORTAL_API_BASE")
SITE = os.environ.get("PORTAL_SITE_ID")
if not BASE or not SITE:
    for line in open(os.path.join(REPO, ".env.local"), encoding="utf-8"):
        if "=" in line and not line.strip().startswith("#"):
            k, _, v = line.strip().partition("=")
            if k == "PORTAL_API_BASE":
                BASE = BASE or v
            if k == "PORTAL_SITE_ID":
                SITE = SITE or v


def portal(collection):
    url = "%s/sites/%s/collections/%s" % (BASE, SITE, collection)
    with urllib.request.urlopen(url, timeout=60) as res:
        return json.load(res)["items"]


rows = json.load(open(os.path.join(HANDOFF, "redirects.json"), encoding="utf-8"))
pk = portal("packages")
dests = portal("destinations")

STATE_OF = {d["slug"]: d["data"].get("state") for d in dests}
STYLES = sorted({s for p in pk for s in (p["data"].get("styles") or [])})


def slugify(v):
    s = unquote_plus(v).strip().lower().replace("'", "").replace("/", "-").replace("+", "-")
    return "-".join(x for x in s.replace(" ", "-").split("-") if x)


def place_matches(value):
    """Packages a ?place=<value> filter would show: destination OR area OR place tag."""
    out = []
    for p in pk:
        d = p["data"]
        if d.get("destination") == value or d.get("area") == value:
            out.append(p)
            continue
        if any(slugify(str(t)) == value for t in (d.get("place_tags") or [])):
            out.append(p)
    return out


# Values the catalogue does not know under that name. Each falls back to the
# nearest place it does know, checked against the catalogue before being added.
ALIAS = {
    "st-kilda": "melbourne",              # a Melbourne suburb, no packages of its own
    "alexandra-headland": "sunshine-coast",
    "wollombi": "hunter-valley",          # Hunter Valley village, unclaimed by any package
    "sydney-beaches": "sydney",
    "gold-coast-queensland": "gold-coast",
    "kangaroo-valley-getaways": "kangaroo-valley",
    "daylesford-getaways": "daylesford",
    "culburra-currarong": "culburra",     # two towns in one old URL; Culburra has the packages
    "nsw-south-coast": "south-coast",     # the tag reaches 32 packages, the destination 11
}

# Her seven state pages. SA and WA are also destination names, but the state
# reaches packages the destination misses (Glenelg is in SA and not under it).
STATE_PAGE = {
    "/nsw": "NSW", "/qld": "QLD", "/victoria": "VIC", "/act": "ACT",
    "/south-australia": "SA", "/western-australia": "WA", "/bali": "Bali",
    "/package-search/category/victoria": "VIC",
}

# Sections that already exist on the new home page.
ANCHOR = {
    "/how-it-works": "/#how",
    "/gg-sisterhood": "/#sisterhood",
    "/join-the-gg-sisterhood": "/#sisterhood",
    "/gift-cards": "/#gift",
    "/secret-specials": "/#specials",
    "/explore": "/#getaways",
}

# Nothing on the new site answers these.
HOMELESS = {
    "/contact-us", "/gg-team", "/couples-getaways",
    "/booking-request-luxury-spas-resort-bars",
    "/home", "/home-1", "/coming-soon", "/thank-you-for-your-enquiry",
}

# Checked against all 123 packages: nothing claims these, so there is no subset
# to land on and the whole catalogue is the honest answer.
UNPLACEABLE = {"italy", "nsw-north-coast", "north-coast", "holidays-for-hope", "wallaringa", "test"}

# Her blog's categories and tags, against the site's own style names.
BLOG_STYLE = {
    "beach-break": "beach break", "beach-breaks": "beach break",
    "city-escape": "city escape", "city-escapes": "city escape",
    "country-escape": "country escape", "country-escapes": "country escape",
    "foodie-feast": "foodie feast", "foodie-feasts": "foodie feast",
    "hens-party": "hens", "luxury-stay": "luxury", "luxury-stays": "luxury",
    "pamper-day": "pamper day", "spa-retreat": "spa retreat", "spa-retreats": "spa retreat",
    "wine-weekend": "wine weekend", "wine-weekends": "wine weekend",
}
# Articles whose subject is plainly one place or one style.
BLOG_ARTICLE = {
    "guide-to-noosa-queensland": ("place", "noosa"),
    "guide-to-noosa-queensland-6an2h": ("place", "noosa"),
    "how-to-spend-a-weekend-in-newcastle-nsw": ("place", "newcastle"),
    "ideas-for-your-next-girls-weekend-canberra": ("place", "canberra"),
    "nsw-south-coast-road-trip-guide": ("place", "south-coast"),
    "our-top-5-bar-recommendations-when-visiting-melbourne": ("place", "melbourne"),
    "welcome-to-daylseford": ("place", "daylesford"),
    "ultimate-hens-party-top-packages-for-a-stress-free-unforgettable-celebration": ("style", "hens"),
    "reasons-to-book-a-country-retreat-for-your-next-girls-weekend": ("style", "country retreat"),
    "rejuvenating-bathhouse-and-spa-packages-for-a-girls-getaway": ("style", "spa retreat"),
    "the-best-winter-wine-weekend-getaways": ("style", "winter wines"),
}

CATALOGUE = "/package-search/"
HOME = "/"


def place_target(value):
    """A ?place= value that shows something, or None."""
    if place_matches(value):
        return value
    alt = ALIAS.get(value)
    if alt and place_matches(alt):
        return alt
    return None


def classify(r):
    """-> (rule key, simple target, filtered target, note)"""
    frm, typ = r["from"], r["type"]

    if typ in ("package", "package-listing"):
        return "R0-packages", None, None, "resolves today"

    tail = slugify(frm.split("/")[-1])

    # ---- blog ------------------------------------------------------------
    if typ == "blog-index":
        return "R6-blog-home", HOME, HOME, "blog index"
    if typ == "blog-post":
        if tail in UNPLACEABLE:
            return "R6-blog-home", HOME, HOME, "no subject"
        if tail in BLOG_STYLE:
            st = BLOG_STYLE[tail]
            return "R6-blog-style", CATALOGUE, CATALOGUE + "?style=" + st.replace(" ", "+"), "style: " + st
        if tail in BLOG_ARTICLE:
            kind, val = BLOG_ARTICLE[tail]
            if kind == "place":
                return "R6-blog-place", CATALOGUE, CATALOGUE + "?place=" + val, "place: " + val
            return "R6-blog-style", CATALOGUE, CATALOGUE + "?style=" + val.replace(" ", "+"), "style: " + val
        return "R6-blog-home", HOME, HOME, "article, no single subject"

    # ---- archives --------------------------------------------------------
    if typ in ("package-category-archive", "package-tag-archive"):
        if frm in STATE_PAGE:
            return "R2-state", CATALOGUE, CATALOGUE + "?state=" + STATE_PAGE[frm], "state: " + STATE_PAGE[frm]
        if tail in UNPLACEABLE:
            return "R7-catalogue", CATALOGUE, CATALOGUE, "nothing in the catalogue matches"
        place = place_target(tail)
        if place:
            return "R1-place", CATALOGUE, CATALOGUE + "?place=" + place, "place: " + place
        name = unquote_plus(frm.split("/")[-1]).lower().replace("+", " ")
        if name in STYLES:
            return "R3-style", CATALOGUE, CATALOGUE + "?style=" + name.replace(" ", "+"), "style: " + name
        if any(c.isdigit() for c in tail):
            n = "".join(c for c in tail.split("-")[0] if c.isdigit()) or "12"
            return "R4-group-size", CATALOGUE, CATALOGUE + "?girls=" + n, "group size: " + tail
        return "R7-catalogue", CATALOGUE, CATALOGUE, "unclassified archive"

    # ---- pages -----------------------------------------------------------
    if frm in STATE_PAGE:
        return "R2-state", CATALOGUE, CATALOGUE + "?state=" + STATE_PAGE[frm], "state: " + STATE_PAGE[frm]
    if frm in ANCHOR:
        return "R5-home-section", ANCHOR[frm], ANCHOR[frm], "section on the new home page"
    if frm in HOMELESS:
        return "R8-home", HOME, HOME, "no equivalent on the new site"
    if tail in UNPLACEABLE:
        return "R7-catalogue", CATALOGUE, CATALOGUE, "nothing in the catalogue matches"
    if tail == "winter-wines":
        return "R3-style", CATALOGUE, CATALOGUE + "?style=winter+wines", "style: winter wines"
    place = place_target(tail)
    if place:
        return "R1-place", CATALOGUE, CATALOGUE + "?place=" + place, "place: " + place
    return "R7-catalogue", CATALOGUE, CATALOGUE, "unplaced page"


out = []
for r in rows:
    key, simple, filt, note = classify(r)
    out.append({
        "from": r["from"], "type": r["type"], "rule": key,
        "to_simple": simple, "to_filtered": filt, "why": note,
    })

# ---- every filtered target has to show something -------------------------
# A redirect onto an empty catalogue is worse than one onto the whole catalogue,
# so this is checked over all 123 packages rather than a sample.
def shows(target):
    if not target or "?" in target is False:
        return None
    q = target.split("?", 1)[1] if "?" in target else ""
    k, _, v = q.partition("=")
    v = unquote_plus(v)
    if k == "place":
        return len(place_matches(v))
    if k == "state":
        return len([p for p in pk if STATE_OF.get(p["data"].get("destination")) == v])
    if k == "style":
        return len([p for p in pk if v in (p["data"].get("styles") or [])])
    if k == "girls":
        n, hits = int(v), 0
        for p in pk:
            sizes = [int(x["girls"]) for x in (p["data"].get("price_table") or [])
                     if str(x.get("girls", "")).isdigit()]
            if sizes and min(sizes) <= n <= max(sizes):
                hits += 1
        return hits
    return None


targets = sorted({o["to_filtered"] for o in out if o["to_filtered"] and "?" in o["to_filtered"]})
empty = [t for t in targets if shows(t) == 0]

RULE_TITLE = {
    "R0-packages": "Package pages and the catalogue - nothing to do, they resolve already",
    "R1-place": "A place -> the catalogue, filtered to that place",
    "R2-state": "A state page -> the catalogue, filtered to that state",
    "R3-style": "A getaway style -> the catalogue, filtered to that style",
    "R4-group-size": "A group size -> the catalogue, filtered to that number of girls",
    "R5-home-section": "A page that is now a section of the home page -> that section",
    "R6-blog-style": "A GG Diaries category or tag that is one of her styles -> that style",
    "R6-blog-place": "A GG Diaries guide about one place -> that place",
    "R6-blog-home": "The rest of the GG Diaries -> the home page",
    "R7-catalogue": "Covers more than one place, or nothing matches -> the whole catalogue",
    "R8-home": "No equivalent anywhere on the new site -> the home page",
}
ORDER = ["R0-packages", "R1-place", "R2-state", "R3-style", "R4-group-size", "R5-home-section",
         "R6-blog-style", "R6-blog-place", "R6-blog-home", "R7-catalogue", "R8-home"]

if __name__ == "__main__":
    need = [o for o in out if o["rule"] != "R0-packages"]
    print("343 captured URLs: %d already resolve, %d need a rule.\n" % (len(out) - len(need), len(need)))
    for key in ORDER:
        g = [o for o in out if o["rule"] == key]
        if g:
            print("%-18s %3d   %s" % (key, len(g), RULE_TITLE[key]))

    print("\n%d distinct filtered targets, %d of them empty." % (len(targets), len(empty)))
    for t in empty:
        print("   EMPTY", t)

    print("\n%-44s %s" % ("filtered target", "shows"))
    for t in targets:
        print("%-44s %5d" % (t, shows(t)))

    path = os.path.join(HANDOFF, "redirect-rules.json")
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(out, fh, indent=1, ensure_ascii=False)
    print("\nwrote", path)
