-- ═══════════════════════════════════════════════════════════════
--  Nooks – Datenbank (Supabase)
--  Einmal komplett in den SQL Editor kopieren und auf „Run“ tippen.
-- ═══════════════════════════════════════════════════════════════

-- Orte (Hütten aus der Liste + Community-Meldungen)
create table if not exists public.places (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(name) between 2 and 120),
  cat         text not null check (cat in ('huette','hike','walk','cafe','food','see','hotel')),
  area        text,
  region      text,
  lat         double precision,
  lon         double precision,
  rules       jsonb not null default '[]'::jsonb,   -- [[Bereich, Code, Hinweis], …]
  note        text,                                  -- Hinweis aus der Liste
  closed      boolean not null default false,
  web         text,
  photo_url   text,
  source      text not null default 'community' check (source in ('liste','community')),
  status      text not null default 'pending' check (status in ('ok','pending','hidden')),
  exact       boolean not null default true,         -- false = Pin nur ungefähr
  need        int not null default 5,                -- nötige Bestätigungen für Community-Orte
  author_name text,
  author_avatar text,
  created_by  uuid default auth.uid() references auth.users on delete set null,
  created_at  timestamptz not null default now()
);

-- Bestätigungen „Ich war da – stimmt“ / „hat sich geändert“
create table if not exists public.confirmations (
  place_id   bigint references public.places on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  vote       text not null default 'y' check (vote in ('y','n')),
  created_at timestamptz not null default now(),
  primary key (place_id, user_id)
);

-- Berichte (Blog)
create table if not exists public.posts (
  id          bigint generated always as identity primary key,
  place_id    bigint references public.places on delete set null,
  title       text not null check (char_length(title) between 2 and 140),
  body        text not null default '',
  images      text[] not null default '{}',
  paws        int not null default 0 check (paws between 0 and 5),
  draft       boolean not null default false,
  author_name text,
  author_avatar text,
  created_by  uuid not null default auth.uid() references auth.users on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Zähler für Bestätigungen pro Ort
create or replace view public.place_stats with (security_invoker = on) as
  select place_id,
         count(*) filter (where vote = 'y') as yes,
         count(*) filter (where vote = 'n') as no,
         max(created_at) as last_at
  from public.confirmations group by place_id;

-- ── Zugriffsregeln (Row Level Security) ──────────────────────────
alter table public.places        enable row level security;
alter table public.confirmations enable row level security;
alter table public.posts         enable row level security;

drop policy if exists "Orte lesen" on public.places;
create policy "Orte lesen" on public.places for select using (status <> 'hidden');
drop policy if exists "Orte melden" on public.places;
create policy "Orte melden" on public.places for insert to authenticated
  with check (created_by = auth.uid() and source = 'community' and status = 'pending');

drop policy if exists "Bestätigungen lesen" on public.confirmations;
create policy "Bestätigungen lesen" on public.confirmations for select using (true);
drop policy if exists "Bestätigen" on public.confirmations;
create policy "Bestätigen" on public.confirmations for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Bestätigung ändern" on public.confirmations;
create policy "Bestätigung ändern" on public.confirmations for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Berichte lesen" on public.posts;
create policy "Berichte lesen" on public.posts for select using (draft = false or created_by = auth.uid());
drop policy if exists "Bericht schreiben" on public.posts;
create policy "Bericht schreiben" on public.posts for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "Bericht bearbeiten" on public.posts;
create policy "Bericht bearbeiten" on public.posts for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists "Bericht löschen" on public.posts;
create policy "Bericht löschen" on public.posts for delete to authenticated using (created_by = auth.uid());

-- Community-Orte gelten ab genug Bestätigungen automatisch als geprüft
create or replace function public.promote_place() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.places p set status = 'ok'
   where p.id = new.place_id and p.status = 'pending'
     and (select count(*) from public.confirmations c where c.place_id = p.id and c.vote = 'y') >= p.need;
  return new;
end $$;
drop trigger if exists on_confirmation on public.confirmations;
create trigger on_confirmation after insert or update on public.confirmations for each row execute function public.promote_place();

-- ── Fotos (Speicher) ─────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('photos','photos', true) on conflict (id) do nothing;
drop policy if exists "Fotos lesen" on storage.objects;
create policy "Fotos lesen" on storage.objects for select using (bucket_id = 'photos');
drop policy if exists "Fotos hochladen" on storage.objects;
create policy "Fotos hochladen" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── Startdaten: Hütten aus der Liste „Berghütten mit Hund“ ──────
-- (nur beim ersten Mal einfügen)
do $$ begin
if not exists (select 1 from public.places where source = 'liste') then
  insert into public.places (name,cat,area,region,lat,lon,rules,note,closed,source,status,exact) values
  ('Vorderkaiserfeldenhütte','huette','Kaisergebirge','at',47.62,12.17,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Vajolethütte','huette','Rosengarten, Dolomiten','it',46.44,11.62,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Spitzsteinhaus','huette','Chiemgauer Alpen','at',47.66,12.2,'[["Tagesbesuch","Y"],["Übernachtung","A","nur auf Anfrage"]]'::jsonb,'Übernachtungen mit Hund nur auf Anfrage',false,'liste','ok',false),
  ('Pforzheimer Hütte','huette','Sellrain, Tirol','at',47.16,11.12,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Hochalm Schutzhütte','huette',null,'at',null,null,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Tierser-Alpl-Hütte','huette','Schlern, Dolomiten','it',46.5,11.63,'[["Übernachtung","A","nur auf Anfrage, 18 € pro Tag"]]'::jsonb,'Hund nur auf Anfrage: 18 € pro Tag',true,'liste','ok',false),
  ('Richterhütte','huette','Zillertaler Alpen','at',47.12,12.12,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Dresdner Hütte','huette','Stubaier Alpen','at',47,11.13,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Neue Regensburger Hütte','huette','Stubaier Alpen','at',47.07,11.22,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Sulzenauhütte','huette','Stubaier Alpen','at',47,11.18,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Zittauer Hütte','huette','Wildgerlostal','at',47.17,12.13,'[["Übernachtung im Lager","Y","bei der Reservierung den Hund angeben"]]'::jsonb,'Im Lager reservieren und einfach dazuschreiben',false,'liste','ok',false),
  ('Pflerscher Tribulaunhütte','huette','Pflerschtal, Südtirol','it',46.98,11.32,'[["Hütte","Y"],["Übernachtung","Y"]]'::jsonb,'Hunde sind willkommen und dürfen übernachten. Bezahlt wird bar.',false,'liste','ok',false),
  ('Plattkofelhütte','huette','Seiser Alm, Dolomiten','it',46.53,11.71,'[["Zimmer","Y","20 € pro Tag, Hundedecke mitbringen"],["Andere Räume","N"]]'::jsonb,'Hunde nur im Zimmer, 20 € pro Tag, Hundedecke mitbringen',false,'liste','ok',false),
  ('Santnerpasshütte','huette','Rosengarten, Dolomiten','it',46.46,11.61,'[["Aufenthalt & Übernachtung","A","Nächtigung vorab abklären"]]'::jsonb,'Nächtigung mit Hund vorab abklären',false,'liste','ok',false),
  ('Edelrauthütte','huette','Pfunderer Berge, Südtirol','it',46.95,11.73,'[["Übernachtung","A","vorher anrufen, 20 € Reinigung"],["Voraussetzung","E","Hund muss Menschen und andere Tiere mögen"]]'::jsonb,'Hund willkommen, wenn er Menschen und Tiere mag. Vorher anrufen, 20 € Reinigung.',false,'liste','ok',false),
  ('Langkofelhütte','huette','Dolomiten','it',46.53,11.74,'[["Aufenthalt & Übernachtung","A","vorher abklären"]]'::jsonb,'Hüttenaufenthalt mit Hund im Vorfeld abklären',false,'liste','ok',false),
  ('ÖTK-Hochmölbinghütte','huette','Totes Gebirge','at',47.58,14.12,'[["Aufenthalt & Übernachtung","A","vorher anmelden – nur 2 Hundezimmer"]]'::jsonb,'Hunde willkommen, vorher anmelden – 2 Zimmer für Hunde',false,'liste','ok',false),
  ('Peer Alm','huette',null,'at',null,null,'[["Aufenthalt & Übernachtung","A","Haustiere auf Anfrage"]]'::jsonb,'Haustiere auf Anfrage',false,'liste','ok',false),
  ('Chamonna Tuoi CAS','huette','Unterengadin','ch',46.82,10.13,'[["Zimmer","A","nur nach Anruf, ganzes Zimmer buchen, CHF 10 pro Nacht"],["Lager","N"]]'::jsonb,'Nur nach Anruf, nur Doppel- oder Spezialzimmer, CHF 10 pro Nacht',false,'liste','ok',false),
  ('Austriahütte','huette','Dachstein','at',47.46,13.65,'[["Aufenthalt & Übernachtung","A","vorher abklären"]]'::jsonb,'Hüttenaufenthalt mit Hund im Vorfeld abklären',false,'liste','ok',false),
  ('Kenzenhütte','huette','Ammergauer Alpen','de',47.56,10.85,'[["Zimmer","Y","bei Zimmerbuchung willkommen"],["Lager","N"]]'::jsonb,'Hunde bei Zimmerbuchung willkommen, im Lager keine Hunde',true,'liste','ok',false),
  ('Klagenfurter Hütte','huette','Karawanken','at',46.46,14.24,'[["Aufenthalt & Übernachtung","A","Hund vorher anmelden"]]'::jsonb,'Vorherige Anmeldung des Hundes',false,'liste','ok',false),
  ('Berghotel Arthurhaus','hotel','Hochkönig','at',47.4,13.12,'[["Zimmer","Y"],["Restaurant","MZ","mit Leine"],["Draußen","Y","Spielwiese & Hundeparcours im Sommer"]]'::jsonb,'Hund schläft im Zimmer, mit Leine ins Restaurant, Napf, Spielwiese & Parcours',false,'liste','ok',false),
  ('Königalm','huette',null,'at',null,null,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Ostpreußenhütte','huette','Hochkönig','at',47.45,13.15,'[["Zimmer","A","nur mit Einzelgenehmigung, 10 € Reinigung, Decke mitbringen"]]'::jsonb,'Nur mit Einzelgenehmigung, 10 € Reinigung, Decke & Zimmerreservierung',false,'liste','ok',false),
  ('Neue Sajathütte','huette','Virgental, Osttirol','at',47.03,12.36,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Schlüterhütte','huette','Villnöß, Dolomiten','it',46.63,11.77,'[["Zimmer","A","nur mit Voranmeldung"],["Andere Räume","N"]]'::jsonb,'Bei Voranmeldung und nur im Zimmer',true,'liste','ok',false),
  ('Kärlingerhaus','huette','Steinernes Meer, Berchtesgaden','de',47.49,12.94,'[["Übernachtung","A","per Mail anmelden, max. 2 Hundeplätze, 10 € pro Hund"],["Ausstattung","Y","Näpfe, Decken und Hundeboxen vorhanden"]]'::jsonb,'1 Hund auf Anfrage, per Mail anmelden, max. 2 Hundeplätze, 10 € pro Hund',false,'liste','ok',false),
  ('Gleiwitzer Hütte','huette','Glocknergruppe','at',47.21,12.8,'[["Winterraum","A","nur nach Absprache & Reservierung, 5 € pro Hund"]]'::jsonb,'Winterraum nur für Gäste mit Hund, nach Absprache, 5 € pro Hund',false,'liste','ok',false),
  ('Sadnighaus','huette','Mölltal, Kärnten','at',46.95,12.95,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Osnabrücker Hütte','huette','Ankogelgruppe','at',47.07,13.32,'[["Aufenthalt & Übernachtung","A","vorab mit der Hüttenwirtin absprechen"]]'::jsonb,'Mit der Hüttenwirtin vorab absprechen',false,'liste','ok',false),
  ('Hannoverhaus','huette','Ankogel','at',47.04,13.2,'[["Hundezimmer","A","nur 1 Hundezimmer – früh reservieren"]]'::jsonb,'1 Hundezimmer',false,'liste','ok',false),
  ('Zupalseehütte','huette','Virgental, Osttirol','at',47.02,12.46,'[["Übernachtung","Y","unkompliziert"]]'::jsonb,'Unkompliziert',false,'liste','ok',false),
  ('Lasörlinghütte','huette','Osttirol','at',46.96,12.46,'[["Übernachtung","Y","5 € pro Hund"],["Zustieg","E","nur zu Fuß, kein Radweg"]]'::jsonb,'Hund 5 € · nur zu Fuß erreichbar',false,'liste','ok',false),
  ('Berghotel Rudolfshütte','hotel','Weißsee, Hohe Tauern','at',47.13,12.62,'[["Hotel","Y","Hunde herzlich willkommen"]]'::jsonb,'Vierbeiner herzlich willkommen',false,'liste','ok',false),
  ('Oberwalderhütte','huette','Großglockner','at',47.1,12.73,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Capanna Corno-Gries','huette','Bedretto, Tessin','ch',46.48,8.43,'[["Aufenthalt & Übernachtung","A","vorab telefonisch anmelden"]]'::jsonb,'Hunde willkommen, vorab telefonisch anmelden',true,'liste','ok',false),
  ('Monte Rosa Hütte','huette','Zermatt, Wallis','ch',45.96,7.82,'[["Übernachtung","Y","in separatem Raum, CHF 20 pro Nacht"]]'::jsonb,'Separater Raum mit Besitzer, CHF 20 pro Nacht',false,'liste','ok',false),
  ('Schwarzensteinhütte','huette','Ahrntal, Südtirol','it',47.03,11.85,'[["Privatzimmer","Y","8 € Aufpreis"],["Lager","N"],["Zustieg","E","anspruchsvoll, u. a. 4 m hohe Leiter"]]'::jsonb,'8 € Aufpreis, nur Privatzimmer. Zustieg anspruchsvoll (4-m-Leiter).',false,'liste','ok',false),
  ('Berggasthof Plätzwiese','huette','Prags, Dolomiten','it',46.66,12.18,'[["Aufenthalt & Übernachtung","A","vorher abklären"]]'::jsonb,'Vorher abklären',false,'liste','ok',false),
  ('Zsigmondy-Hütte','huette','Sextner Dolomiten','it',46.64,12.37,'[["Aufenthalt & Übernachtung","A","vorher abklären"]]'::jsonb,'Vorher abklären',false,'liste','ok',false),
  ('Berghaus Diavolezza','hotel','Engadin','ch',46.41,9.96,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Berggasthof Loosbühelalm','huette','Großarltal','at',47.24,13.3,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Kölner Haus','huette','Serfaus','at',47.03,10.62,'[["Aufenthalt & Übernachtung","A","vorher abklären"]]'::jsonb,'Vorher abklären',false,'liste','ok',false),
  ('Fraganter Schutzhaus','huette','Mölltal, Kärnten','at',46.97,13.07,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Olpererhütte','huette','Zillertal','at',47.05,11.67,'[["Aufenthalt & Übernachtung","A","vorher abklären"]]'::jsonb,'Vorher abklären',false,'liste','ok',false),
  ('Peter-Wiechenthaler-Hütte','huette','Steinernes Meer','at',47.45,12.85,'[["Hundezimmer","Y","kleines Zimmer mit 2 Matratzen bei den Waschräumen"]]'::jsonb,'Hundezimmer: Mini-Zimmer bei den Waschräumen',false,'liste','ok',false),
  ('Edmund-Probst-Haus','huette','Nebelhorn, Allgäu','de',47.42,10.35,'[["Zimmer","E","nur bei Buchung eines kompletten 4-Bett-Zimmers"],["Alternative","E","im Sommer Skikeller mit Isomatte & Schlafsack"]]'::jsonb,'Hund bei Buchung eines ganzen 4-Bett-Zimmers, sonst im Sommer Skikeller',false,'liste','ok',false),
  ('Ostlerhütte','huette','Breitenberg, Pfronten','de',47.56,10.56,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Taschachhaus','huette','Pitztal','at',46.9,10.8,'[["Hütte","N","keine Hunde erlaubt"]]'::jsonb,'Keine Hunde erlaubt',false,'liste','ok',false),
  ('Schutzhaus Schöne Aussicht','huette','Schnalstal, Südtirol','it',46.78,10.79,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Zufallhütte','huette','Martelltal, Südtirol','it',46.47,10.65,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Zammer Alm','huette','Zams, Tirol','at',47.17,10.6,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Winnebachseehütte','huette','Ötztaler Alpen','at',47.1,11.06,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Ingolstädter Haus','huette','Steinernes Meer','at',47.48,12.88,'[["Übernachtung","E","im Nebenhaus, als Lager buchen – sehr eng"]]'::jsonb,'Mit Hund im Nebenhaus (als Lager buchen), sehr eng',false,'liste','ok',false),
  ('Grawandhütte','huette','Zillertal','at',47.02,11.8,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Oberhauser Hütte','huette',null,'at',null,null,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,true,'liste','ok',false),
  ('Almbad Sillberghaus','huette','Bayrischzell','de',47.67,11.98,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Ücia Fanes-Hütte','huette','Fanes, Dolomiten','it',46.62,12.02,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Schutzhütte Kreuzwiesenalm','huette','Lüsen, Südtirol','it',46.7,11.72,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Hermann-von-Barth-Hütte','huette','Allgäuer Alpen','at',47.32,10.4,'[["Übernachtung","E","nur Notlager"]]'::jsonb,'Nur Notlager',false,'liste','ok',false),
  ('Bernhardseckhütte','huette','Lechtal','at',47.29,10.43,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Neue Traunsteiner Hütte','huette','Reiter Alm','de',47.63,12.78,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false),
  ('Hamilton Lodge','hotel','Belalp, Wallis','ch',46.37,7.96,'[["Hunde","?","laut Liste hundefreundlich – Details noch offen"]]'::jsonb,null,false,'liste','ok',false);
end if;
end $$;
