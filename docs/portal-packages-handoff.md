# Handoff: structured content ("Packages") for app.rankify.com.au

**From:** the Girls Getaways session · **For:** the RANKIFY CLIENT WEB PORTAL session
**Repo to change:** `rankify-editor` · **Date:** 11 Nov 2026

---

## The brief

Girls Getaways (won at $5,749 + ~$100/mo) sells boutique girls' weekend packages.
Their live Squarespace site has **234 package pages** across ~22 destinations, and the
things that change most — price, group size, slots left — change weekly.

Those edits should **not** go through the change-request pipeline. A price tweak is not
worth a Claude run, a branch, a preview and an approval. What they need is a form, a
Save button, and the website updated seconds later.

Everything else about them stays exactly as the portal already works: design and copy
edits remain change requests, their login is the existing phone + SMS, their roles are the
existing owner/approver/editor, and their billing is the existing Stripe setup.

So this is one new capability in the portal — **structured content a client edits
directly** — built generically, with Girls Getaways as its first user. Any client with a
catalogue (services, properties, menus, team members) gets it afterwards for free.

### What exists already

- org `girls-getaways` (50 changes/mo) and a site row for `rankify-ops/girls-getaways`,
  but **`sites.archived = true`** and `output_dir` is `out`, which is now wrong.
- That repo is **no longer a static export**. It is a server-rendered Next app on Vercel
  (`girls-getaways`, team rankifyops, syd1), live at https://girls-getaways.vercel.app.
  **There is no `out/` to preview** — see "the one open question" at the bottom.
- The site renders from `src/content/site.ts` today (16 packages) and has a fallback in
  `src/lib/admin-data.ts` that is where your endpoint gets wired in.

---

## 1. Migration

`supabase/migrations/20261111000000_collections.sql`

```sql
-- Structured content a client edits directly, without a change request.
--
-- A collection is a content type on one site ("Packages"); an item is one row of
-- it. `field_schema` describes the fields so the portal can render a form
-- without a deploy per client.
--
-- Reads follow the same rule as everything else: members of the owning org, via
-- can_see_site(). There are deliberately NO write policies — every write goes
-- through the server with the service role after an access.ts check, and lands
-- in `events` so it shows on the client's timeline.

create table if not exists collections (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid not null references sites(id) on delete cascade,
  key          text not null check (key ~ '^[a-z][a-z0-9-]{1,47}$'),
  name         text not null check (length(name) between 1 and 80),
  item_label   text not null default 'Item' check (length(item_label) between 1 and 40),
  field_schema jsonb not null default '[]'::jsonb,
  position     int  not null default 0,
  created_at   timestamptz not null default now(),
  unique (site_id, key)
);

create table if not exists collection_items (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid not null references collections(id) on delete cascade,
  slug          text not null check (slug ~ '^[a-z0-9][a-z0-9-]{0,119}$'),
  data          jsonb not null default '{}'::jsonb,
  status        text not null default 'draft'
                check (status in ('draft', 'published', 'archived')),
  position      int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references profiles(id),
  unique (collection_id, slug)
);

-- The two reads the product actually does: the client's list, and the public
-- endpoint fetching everything published.
create index if not exists collection_items_collection_status_idx
  on collection_items (collection_id, status, position);

-- Which extras a client has. Staff-only to set, like rankify_approves.
alter table orgs add column if not exists features jsonb not null default '{}'::jsonb;

create or replace function touch_collection_item() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists collection_items_touch on collection_items;
create trigger collection_items_touch before update on collection_items
  for each row execute function touch_collection_item();

alter table collections       enable row level security;
alter table collection_items  enable row level security;

create policy collections_read on collections
  for select using (can_see_site(site_id));

create policy collection_items_read on collection_items
  for select using (
    exists (select 1 from collections c
            where c.id = collection_id and can_see_site(c.site_id))
  );
```

## 2. Turning it on for Girls Getaways

```sql
-- The site is archived from an earlier attempt, and its build config predates
-- the move to Vercel.
update sites
   set archived = false,
       live_url = 'https://girls-getaways.vercel.app',
       output_dir = 'out'   -- see the open question; may need a server-rendered path
 where repo_owner = 'rankify-ops' and repo_name = 'girls-getaways';

update orgs
   set features = features || '{"collections": true}'::jsonb,
       plan_name = 'Partner'          -- or a custom name; ~$100/mo in Stripe
 where slug = 'girls-getaways';

insert into collections (site_id, key, name, item_label, position, field_schema)
select s.id, 'packages', 'Packages', 'Package', 0, '[
  {"key":"title","label":"Package name","type":"text","required":true},
  {"key":"venue","label":"Venue","type":"text"},
  {"key":"destination","label":"Destination","type":"reference","collection":"destinations"},
  {"key":"area","label":"Town or area","type":"text","help":"Burleigh Heads, Jervis Bay…"},
  {"key":"blurb","label":"Short description","type":"textarea","maxLength":400},
  {"key":"description","label":"Full description","type":"richtext"},
  {"key":"price_from","label":"From (per person, AUD)","type":"number","help":"Leave blank for “price on request”"},
  {"key":"guests_min","label":"Minimum girls","type":"number"},
  {"key":"guests_max","label":"Maximum girls","type":"number"},
  {"key":"nights","label":"Nights","type":"number"},
  {"key":"hero_image","label":"Main photo","type":"image"},
  {"key":"gallery","label":"Gallery","type":"image[]"},
  {"key":"inclusions","label":"What’s included","type":"list","fields":[
     {"key":"text","type":"text"},{"key":"included","type":"boolean","default":true}]},
  {"key":"styles","label":"Getaway styles","type":"multiselect",
     "options":["Hens","Classic","Luxury","Winter Wines","Girl'"'"'s Day"]},
  {"key":"tag","label":"Badge","type":"select","options":["","Trending","Featured","New"]},
  {"key":"popular","label":"Show “Popular”","type":"boolean"},
  {"key":"slots_left","label":"Slots left","type":"number","help":"Blank hides the badge"},
  {"key":"legacy_path","label":"Old Squarespace URL","type":"text","staffOnly":true}
]'::jsonb
from sites s where s.repo_owner = 'rankify-ops' and s.repo_name = 'girls-getaways';

insert into collections (site_id, key, name, item_label, position, field_schema)
select s.id, 'destinations', 'Destinations', 'Destination', 1, '[
  {"key":"name","label":"Name","type":"text","required":true},
  {"key":"state","label":"State","type":"select",
     "options":["NSW","QLD","VIC","ACT","SA","WA","Bali"]},
  {"key":"blurb","label":"Intro","type":"textarea"},
  {"key":"image","label":"Banner photo","type":"image"}
]'::jsonb
from sites s where s.repo_owner = 'rankify-ops' and s.repo_name = 'girls-getaways';
```

Seed data is ready to import: **`docs/portal-handoff/packages.json`** and
**`docs/portal-handoff/destinations.json`** in the girls-getaways repo — already in
`{slug, status, position, data}` shape, so it is one insert per row. 16 packages today;
I'm pulling the remaining ~218 from their live site and will regenerate the same files.

## 3. The public endpoint the website reads

`src/app/api/public/sites/[siteId]/collections/[key]/route.ts`

```ts
import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/store/supabase";

/*
 * Published items of one collection, for the client's own website to render.
 *
 * No auth: it returns exactly what is already public on their site. Drafts
 * never leave this route. Cached at the edge, so a busy site costs one query a
 * minute, and a save is visible within that.
 */
export const revalidate = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ siteId: string; key: string }> },
) {
  const { siteId, key } = await params;
  const db = serviceClient();

  const { data: collection } = await db
    .from("collections")
    .select("id")
    .eq("site_id", siteId)
    .eq("key", key)
    .maybeSingle();

  if (!collection) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: items, error } = await db
    .from("collection_items")
    .select("slug, data, position, updated_at")
    .eq("collection_id", collection.id)
    .eq("status", "published")
    .order("position");

  if (error) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  return NextResponse.json(
    { items: items ?? [] },
    {
      headers: {
        "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
        "access-control-allow-origin": "*",
      },
    },
  );
}
```

`access-control-allow-origin: *` is deliberate — the data is public either way, and the
site renders it server-side. Lock it to the site's domain if you'd rather.

## 4. Writes

Same shape as every other mutation in the portal: service role, after an `access.ts`
check, then an event.

- `view` → see the collection · `submit` → create and edit drafts ·
  `approve` → publish, unpublish, reorder, delete.
- Log `collection.item.created`, `collection.item.updated`, `collection.item.published`
  with `{collection: key, slug, title}` in `data`, so it reads properly on their
  timeline next to change requests.
- Images: reuse the attachments pipeline (one-time upload URL, server-side re-encode).
  An item's `hero_image` holds the resulting storage path.

## 5. The screen

`/(portal)/websites/[id]/content/[key]`, visible only when `orgs.features->>'collections'`
is true, with the collection name in the site's nav.

List: search, draft/live tabs, card grid with photo, reorder. Editor: form from
`field_schema`, Save as draft / Publish, "view on site" link.

In the portal's own design language. There is a working version of these screens in the
girls-getaways repo — `src/components/admin/PackageBrowser.tsx` and `PackageEditor.tsx` —
useful for the layout and states, but skinned to the client's cream/rose site palette, so
treat it as a reference, not something to paste.

## 6. What I'll do on my side once it exists

Replace the seed fallback in `src/lib/admin-data.ts` with a fetch of
`/api/public/sites/<siteId>/collections/packages`, cached with ISR, and delete the
standalone `/admin` from the client's repo so there is one backend, not two.

Tell me the final URL shape and the site id and I'll wire it the same day.

---

## The one open question

The portal previews a change by building the client's site and serving `out/` as files.
**Girls Getaways is server-rendered now, so there is no `out/`.** Either:

- **a)** the preview flow gains a path for server-rendered sites — point at the Vercel
  preview deployment for that branch instead of the file server; or
- **b)** I convert the site back to a static export, and it loses instant updates from
  the portal (every package edit would need a rebuild, which defeats the point).

(a) is the right answer for this client and for any future client with a database behind
their site. But it is your call and your pipeline — tell me which, and if it's (b) I'll
rebuild the site accordingly.
