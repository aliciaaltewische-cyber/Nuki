-- Nooks Update 3: Wer schon hier war (Besuche und Fotowand)
-- Kann gefahrlos mehrmals ausgeführt werden.

create table if not exists public.visits (
  id         bigint generated always as identity primary key,
  place_id   bigint not null references public.places on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  dog        text not null check (char_length(dog) between 1 and 40),
  avatar     text check (avatar is null or avatar ~ '^[a-z]{0,20}$' or avatar like 'https://iehiaytlzaorkopmzvly.supabase.co/storage/v1/object/public/photos/%'),
  photo      text check (photo is null or photo like 'https://iehiaytlzaorkopmzvly.supabase.co/storage/v1/object/public/photos/%'),
  created_at timestamptz not null default now()
);
create index if not exists visits_place on public.visits (place_id, created_at desc);

alter table public.visits enable row level security;
drop policy if exists "Besuche lesen" on public.visits;
create policy "Besuche lesen" on public.visits for select using (true);
drop policy if exists "Besuch eintragen" on public.visits;
create policy "Besuch eintragen" on public.visits for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Eigenen Besuch löschen" on public.visits;
create policy "Eigenen Besuch löschen" on public.visits for delete to authenticated using (user_id = auth.uid());
