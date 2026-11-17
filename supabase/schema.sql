-- Nuki: gemeinsame Datenbank für hundefreundliche Orte
-- Im Supabase-Dashboard unter "SQL Editor" komplett ausführen.

create table if not exists public.places (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 120),
  category    text not null check (char_length(category) <= 40),
  address     text check (char_length(address) <= 200),
  lat         double precision not null check (lat between -90 and 90),
  lng         double precision not null check (lng between -180 and 180),
  amenities   text[] not null default '{}' check (cardinality(amenities) <= 20),
  rating      smallint not null default 0 check (rating between 0 and 5),
  description text check (char_length(description) <= 1000),
  website     text check (website is null or website = '' or website ~* '^https?://'),
  owner_token text not null check (char_length(owner_token) >= 32)
);

create index if not exists places_created_at_idx on public.places (created_at desc);

alter table public.places enable row level security;

-- Das Eigentümer-Token darf niemals öffentlich lesbar sein.
revoke all on public.places from anon, authenticated;
grant select (id, created_at, name, category, address, lat, lng, amenities, rating, description, website)
  on public.places to anon, authenticated;
grant insert (name, category, address, lat, lng, amenities, rating, description, website, owner_token)
  on public.places to anon, authenticated;
grant update (name, category, address, lat, lng, amenities, rating, description, website)
  on public.places to anon, authenticated;
grant delete on public.places to anon, authenticated;

create or replace function public.request_owner_token() returns text
language sql stable as $$
  select coalesce(current_setting('request.headers', true)::json ->> 'x-owner-token', '')
$$;

drop policy if exists "Alle dürfen lesen" on public.places;
create policy "Alle dürfen lesen" on public.places for select using (true);

drop policy if exists "Alle dürfen hinzufügen" on public.places;
create policy "Alle dürfen hinzufügen" on public.places for insert with check (true);

drop policy if exists "Nur eigene bearbeiten" on public.places;
create policy "Nur eigene bearbeiten" on public.places for update
  using (owner_token = public.request_owner_token())
  with check (owner_token = public.request_owner_token());

drop policy if exists "Nur eigene löschen" on public.places;
create policy "Nur eigene löschen" on public.places for delete
  using (owner_token = public.request_owner_token());

-- Liefert die IDs der Einträge, die zu einem Token gehören (ohne das Token preiszugeben).
create or replace function public.my_place_ids(token text) returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from public.places where owner_token = token and char_length(token) >= 32
$$;
revoke all on function public.my_place_ids(text) from public;
grant execute on function public.my_place_ids(text) to anon, authenticated;
