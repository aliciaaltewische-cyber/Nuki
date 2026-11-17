-- ════════════════════════════════════════════════════════════════
--  Nuki – Community-Datenbank für hundefreundliche Orte
--  Im Supabase-Dashboard unter "SQL Editor" komplett ausführen.
--  Das Skript kann gefahrlos mehrfach ausgeführt werden.
-- ════════════════════════════════════════════════════════════════

-- ───────────── Profile (Mitglieder) ─────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null check (char_length(username) between 2 and 30),
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Profil automatisch anlegen, wenn sich jemand registriert
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  name text := left(trim(coalesce(new.raw_user_meta_data ->> 'username', '')), 30);
begin
  if char_length(name) < 2 then
    name := 'Mitglied-' || substr(new.id::text, 1, 6);
  end if;
  insert into public.profiles (id, username) values (new.id, name) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ───────────── Orte ─────────────
create table if not exists public.places (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  created_by     uuid default auth.uid() references public.profiles (id) on delete set null,
  name           text not null check (char_length(name) between 1 and 120),
  category       text not null check (char_length(category) <= 40),
  address        text check (char_length(address) <= 200),
  lat            double precision not null check (lat between -90 and 90),
  lng            double precision not null check (lng between -180 and 180),
  amenities      text[] not null default '{}' check (cardinality(amenities) <= 20),
  description    text check (char_length(description) <= 1000),
  website        text check (website is null or website = '' or website ~* '^https?://'),
  photo_url      text check (photo_url is null or char_length(photo_url) <= 500),
  featured_until timestamptz,          -- wird NUR durch bezahlte Bestellungen gesetzt
  hidden         boolean not null default false   -- Moderation
);
create index if not exists places_created_at_idx on public.places (created_at desc);
create index if not exists places_featured_idx on public.places (featured_until) where featured_until is not null;

-- ───────────── Bewertungen ─────────────
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  place_id    uuid not null references public.places (id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  text        text check (char_length(text) <= 800),
  created_at  timestamptz not null default now(),
  unique (place_id, user_id)
);
create index if not exists reviews_place_idx on public.reviews (place_id);

-- ───────────── Favoriten ─────────────
create table if not exists public.favorites (
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  place_id    uuid not null references public.places (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, place_id)
);

-- ───────────── Meldungen (Moderation) ─────────────
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  place_id    uuid not null references public.places (id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reason      text not null check (char_length(reason) <= 100),
  note        text check (char_length(note) <= 500),
  created_at  timestamptz not null default now()
);

-- ───────────── Featured: Pakete & Bestellungen ─────────────
create table if not exists public.featured_plans (
  id           text primary key,
  label        text not null,
  days         int not null check (days > 0),
  price_cents  int not null check (price_cents >= 50),
  currency     text not null default 'eur',
  popular      boolean not null default false,
  active       boolean not null default true
);
insert into public.featured_plans (id, label, days, price_cents, currency, popular) values
  ('week',    '1 Woche',   7,  999, 'eur', false),
  ('month',   '1 Monat',  30, 2999, 'eur', true),
  ('quarter', '3 Monate', 90, 6999, 'eur', false)
on conflict (id) do nothing;

create table if not exists public.featured_orders (
  id                 uuid primary key default gen_random_uuid(),
  place_id           uuid not null references public.places (id) on delete cascade,
  user_id            uuid references public.profiles (id) on delete set null,
  plan_id            text not null references public.featured_plans (id),
  days               int not null,
  amount_cents       int not null,
  currency           text not null,
  status             text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  stripe_session_id  text unique,
  created_at         timestamptz not null default now(),
  paid_at            timestamptz
);

-- ───────────── Views ─────────────
create or replace view public.places_view with (security_invoker = true) as
select p.id, p.created_at, p.created_by, p.name, p.category, p.address, p.lat, p.lng,
       p.amenities, p.description, p.website, p.photo_url, p.featured_until,
       pr.username as author_name,
       coalesce(avg(r.rating), 0)::float as avg_rating,
       count(r.id)::int as review_count
from public.places p
left join public.profiles pr on pr.id = p.created_by
left join public.reviews r on r.place_id = p.id
where not p.hidden
group by p.id, pr.username;

create or replace view public.leaderboard with (security_invoker = true) as
select pr.id, pr.username, pr.created_at,
       (select count(*) from public.places p where p.created_by = pr.id and not p.hidden)::int as places_count,
       (select count(*) from public.reviews r where r.user_id = pr.id)::int as reviews_count,
       ((select count(*) from public.places p where p.created_by = pr.id and not p.hidden) * 10
        + (select count(*) from public.reviews r where r.user_id = pr.id) * 3)::int as points
from public.profiles pr;

create or replace function public.community_stats()
returns table (members bigint, reviews bigint)
language sql stable security definer set search_path = public as $$
  select (select count(*) from public.profiles), (select count(*) from public.reviews)
$$;

-- Bezahlte Bestellung verbuchen (nur vom Stripe-Webhook mit Service-Role aufrufbar)
create or replace function public.mark_order_paid(p_order_id uuid, p_session_id text)
returns void language plpgsql security definer set search_path = public as $$
declare o public.featured_orders;
begin
  update public.featured_orders
     set status = 'paid', paid_at = now(), stripe_session_id = p_session_id
   where id = p_order_id and status = 'pending'
     and (stripe_session_id is null or stripe_session_id = p_session_id)
  returning * into o;
  if o.id is null then return; end if;   -- schon verbucht oder unbekannt → idempotent
  update public.places
     set featured_until = greatest(coalesce(featured_until, now()), now()) + make_interval(days => o.days)
   where id = o.place_id;
end $$;

-- ───────────── Rechte & Row Level Security ─────────────
alter table public.profiles        enable row level security;
alter table public.places          enable row level security;
alter table public.reviews         enable row level security;
alter table public.favorites       enable row level security;
alter table public.reports         enable row level security;
alter table public.featured_plans  enable row level security;
alter table public.featured_orders enable row level security;

revoke all on public.profiles, public.places, public.reviews, public.favorites,
              public.reports, public.featured_plans, public.featured_orders from anon, authenticated;

-- Lesen
grant select (id, username, created_at) on public.profiles to anon, authenticated;
grant select on public.places, public.reviews, public.featured_plans to anon, authenticated;
grant select on public.places_view, public.leaderboard to anon, authenticated;
grant select on public.favorites, public.featured_orders, public.reports to authenticated;

-- Schreiben (featured_until, hidden, created_by sind bewusst NICHT freigegeben)
grant update (username) on public.profiles to authenticated;
grant insert (name, category, address, lat, lng, amenities, description, website, photo_url) on public.places to authenticated;
grant update (name, category, address, lat, lng, amenities, description, website, photo_url) on public.places to authenticated;
grant delete on public.places to authenticated;
grant insert (place_id, rating, text, created_at), update (rating, text, created_at), delete on public.reviews to authenticated;
grant insert (place_id), delete on public.favorites to authenticated;
grant insert (place_id, reason, note) on public.reports to authenticated;

grant execute on function public.community_stats() to anon, authenticated;
revoke all on function public.mark_order_paid(uuid, text) from public, anon, authenticated;

-- Policies
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles for select using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "places_read" on public.places;
create policy "places_read" on public.places for select using (not hidden or created_by = auth.uid() or public.is_admin());
drop policy if exists "places_insert" on public.places;
create policy "places_insert" on public.places for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "places_update_own" on public.places;
create policy "places_update_own" on public.places for update to authenticated
  using (created_by = auth.uid() or public.is_admin()) with check (created_by = auth.uid() or public.is_admin());
drop policy if exists "places_delete_own" on public.places;
create policy "places_delete_own" on public.places for delete to authenticated using (created_by = auth.uid() or public.is_admin());

drop policy if exists "reviews_read" on public.reviews;
create policy "reviews_read" on public.reviews for select using (true);
drop policy if exists "reviews_insert" on public.reviews;
create policy "reviews_insert" on public.reviews for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews for delete to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "favorites_own" on public.favorites;
create policy "favorites_own" on public.favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "reports_insert" on public.reports;
create policy "reports_insert" on public.reports for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "reports_admin_read" on public.reports;
create policy "reports_admin_read" on public.reports for select to authenticated using (public.is_admin());

drop policy if exists "plans_read" on public.featured_plans;
create policy "plans_read" on public.featured_plans for select using (active);

drop policy if exists "orders_read_own" on public.featured_orders;
create policy "orders_read_own" on public.featured_orders for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- ───────────── Foto-Speicher ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('place-photos', 'place-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "photos_upload_own_folder" on storage.objects;
create policy "photos_upload_own_folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'place-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "photos_delete_own" on storage.objects;
create policy "photos_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'place-photos' and (storage.foldername(name))[1] = auth.uid()::text);
