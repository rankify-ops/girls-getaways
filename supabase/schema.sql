-- Girls Getaways portal — database schema
--
-- Run once against the client's own Supabase project (not Rankify's).
-- Everything the public site renders lives here, so the client edits a
-- package in /admin and the site picks it up on the next revalidation.
--
-- Design notes:
--  * Public pages read through the anon key, so every public table has an RLS
--    policy allowing SELECT of PUBLISHED rows only. Drafts stay invisible.
--  * Writes are never done with the anon key — the portal's server actions use
--    the service-role key, which bypasses RLS. No write policies exist on
--    purpose, so a leaked anon key cannot change anything.
--  * Slugs mirror the live Squarespace URLs so existing links and SEO survive
--    the migration (e.g. /package-search/gold-coast/burleigh-heads/...).

create extension if not exists "pgcrypto";

-- ── states ──────────────────────────────────────────────────────────────
create table if not exists states (
  code        text primary key,                  -- nsw, qld, vic, act, sa, wa, bali
  name        text not null,                     -- "New South Wales"
  short       text not null,                     -- "NSW"
  grouping    text not null default 'Australia', -- Australia | International
  image_url   text,
  position    int  not null default 0
);

-- ── destinations ────────────────────────────────────────────────────────
create table if not exists destinations (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,              -- "hunter-valley"
  name        text not null,                     -- "Hunter Valley"
  state_code  text not null references states(code) on update cascade,
  blurb       text,
  image_url   text,
  position    int  not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists destinations_state_idx on destinations(state_code);

-- ── styles (Hens, Luxury, Winter Wines…) ────────────────────────────────
create table if not exists styles (
  id        uuid primary key default gen_random_uuid(),
  slug      text unique not null,
  name      text not null,
  icon      text,                                -- /img/ico-*.png
  position  int not null default 0
);

-- ── packages ────────────────────────────────────────────────────────────
-- status: draft → the client is still writing it; published → live on the site.
create table if not exists packages (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  venue           text,
  destination_id  uuid references destinations(id) on delete set null,
  area            text,                          -- "Burleigh Heads" within a destination
  blurb           text,
  description     text,                          -- long copy, markdown
  price_from      numeric(10,2),                 -- per person, AUD. null = "price on request"
  guests_min      int,
  guests_max      int,
  nights          int,
  hero_image_url  text,
  tag             text,                          -- Trending | Featured | New
  popular         boolean not null default false,
  slots_left      int,                           -- shown as "3 SLOTS LEFT"; null hides the badge
  status          text not null default 'draft' check (status in ('draft','published','archived')),
  position        int not null default 0,
  legacy_path     text,                          -- the old Squarespace URL, for redirects
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists packages_status_idx on packages(status);
create index if not exists packages_destination_idx on packages(destination_id);

-- Which styles a package belongs to (the live site's Style filter).
create table if not exists package_styles (
  package_id uuid references packages(id) on delete cascade,
  style_id   uuid references styles(id)   on delete cascade,
  primary key (package_id, style_id)
);

-- Gallery images beyond the hero.
create table if not exists package_images (
  id          uuid primary key default gen_random_uuid(),
  package_id  uuid not null references packages(id) on delete cascade,
  url         text not null,
  alt         text,
  position    int  not null default 0
);
create index if not exists package_images_package_idx on package_images(package_id);

-- What's included / not included, shown as ticked lists on the package page.
create table if not exists package_inclusions (
  id          uuid primary key default gen_random_uuid(),
  package_id  uuid not null references packages(id) on delete cascade,
  text        text not null,
  included    boolean not null default true,
  position    int  not null default 0
);
create index if not exists package_inclusions_package_idx on package_inclusions(package_id);

-- ── enquiries (the booking request form on the site) ────────────────────
create table if not exists enquiries (
  id            uuid primary key default gen_random_uuid(),
  package_id    uuid references packages(id) on delete set null,
  name          text not null,
  email         text not null,
  phone         text,
  occasion      text,
  guests        int,
  start_date    date,
  end_date      date,
  notes         text,
  payment_pref  text,                            -- split | full
  status        text not null default 'new' check (status in ('new','contacted','quoted','won','lost')),
  created_at    timestamptz not null default now()
);
create index if not exists enquiries_status_idx on enquiries(status);

-- ── editable site content (hero copy, how-it-works steps, etc.) ─────────
-- Key/value JSON so the client can edit homepage copy without a deploy.
create table if not exists site_content (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

-- ── updated_at maintenance ──────────────────────────────────────────────
create or replace function touch_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists packages_touch on packages;
create trigger packages_touch before update on packages
  for each row execute function touch_updated_at();

drop trigger if exists destinations_touch on destinations;
create trigger destinations_touch before update on destinations
  for each row execute function touch_updated_at();

-- ── row level security ──────────────────────────────────────────────────
-- Public read of published content only; all writes go through the
-- service-role key in the portal's server actions.
alter table states              enable row level security;
alter table destinations        enable row level security;
alter table styles              enable row level security;
alter table packages            enable row level security;
alter table package_styles      enable row level security;
alter table package_images      enable row level security;
alter table package_inclusions  enable row level security;
alter table site_content        enable row level security;
alter table enquiries           enable row level security;

drop policy if exists "public read states" on states;
create policy "public read states" on states for select to anon, authenticated using (true);

drop policy if exists "public read styles" on styles;
create policy "public read styles" on styles for select to anon, authenticated using (true);

drop policy if exists "public read destinations" on destinations;
create policy "public read destinations" on destinations for select to anon, authenticated using (published);

drop policy if exists "public read published packages" on packages;
create policy "public read published packages" on packages
  for select to anon, authenticated using (status = 'published');

drop policy if exists "public read package styles" on package_styles;
create policy "public read package styles" on package_styles for select to anon, authenticated
  using (exists (select 1 from packages p where p.id = package_id and p.status = 'published'));

drop policy if exists "public read package images" on package_images;
create policy "public read package images" on package_images for select to anon, authenticated
  using (exists (select 1 from packages p where p.id = package_id and p.status = 'published'));

drop policy if exists "public read package inclusions" on package_inclusions;
create policy "public read package inclusions" on package_inclusions for select to anon, authenticated
  using (exists (select 1 from packages p where p.id = package_id and p.status = 'published'));

drop policy if exists "public read site content" on site_content;
create policy "public read site content" on site_content for select to anon, authenticated using (true);

-- Enquiries: the public may INSERT one (the booking form) but never read them.
drop policy if exists "public submit enquiry" on enquiries;
create policy "public submit enquiry" on enquiries for insert to anon, authenticated with check (true);
