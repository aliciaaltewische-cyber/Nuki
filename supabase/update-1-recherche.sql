-- ═══════════════════════════════════════════════════════════════
--  Nooks, Update 1: weitere hundefreundliche Hütten aus Recherche
--  Einmal komplett in den SQL Editor kopieren und auf „Run“ tippen.
-- ═══════════════════════════════════════════════════════════════

-- Quelle pro Ort + neue Herkunft „recherche“
alter table public.places add column if not exists source_name text;
alter table public.places drop constraint if exists places_source_check;
alter table public.places add constraint places_source_check check (source in ('liste','community','recherche'));
update public.places set source_name = 'Liste „Berghütten mit Hund“ (Google Maps)' where source = 'liste' and source_name is null;

-- Hütten aus der Liste, die bisher keinen Pin hatten (Lage laut Bergwelten, ungefähr)
update public.places set lat = 47.12, lon = 11.53, area = 'Navis, Tuxer Alpen' where name = 'Peer Alm' and lat is null;
update public.places set lat = 47.17, lon = 13.49, area = 'Zederhaus, Radstädter Tauern' where name = 'Königalm' and lat is null;

-- Neue Hütten (nur einfügen, wenn noch nicht vorhanden)
insert into public.places (name, cat, area, region, lat, lon, rules, note, source, status, exact, source_name)
select * from (values
  ('Sonnrißhütte','huette','Kleinreifling, Ennstaler Alpen','at',47.84,14.63,
   '[["Übernachtung","Y","Hund schläft in der Gaststube"],["Verpflegung","E","Selbstversorgerhütte"]]'::jsonb,
   'Hunde willkommen, müssen aber in der Gaststube schlafen. Selbstversorgerhütte.','recherche','ok',false,'Bergwelten: „11 Hütten, auf denen Hunde willkommen sind“'),
  ('Waldfreundehütte Obersberg','huette','Schwarzau im Gebirge, Mürzsteger Alpen','at',47.80,15.70,
   '[["Übernachtung","A","nur nach Anmeldung"]]'::jsonb,
   'Hunde willkommen; Übernachtung mit Hund nur nach vorheriger Anmeldung.','recherche','ok',false,'Bergwelten: „11 Hütten, auf denen Hunde willkommen sind“'),
  ('Goiserer Hütte','huette','Bad Goisern, Salzkammergut-Berge','at',47.62,13.66,
   '[["Übernachtung","A","nur nach Anmeldung, Gaststube oder mit Besitzer im Winterraum"]]'::jsonb,
   'Übernachtung mit Hund nach Anmeldung; Hund schläft in der Gaststube oder mit Besitzer im Winterraum.','recherche','ok',false,'Bergwelten: „Hütten, auf denen du mit deinem Hund übernachten kannst“ (2019)'),
  ('Carschinahütte','huette','St. Antönien, Rätikon','ch',47.04,9.84,
   '[["Holzschopf","Y","kostenlos"],["Aufenthaltsraum","Y","mit Besitzer, CHF 10"],["Ausstattung","Y","Napf & Wolldecken vorhanden"]]'::jsonb,
   'Hund kostenlos im Holzschopf oder für CHF 10 mit Besitzer im Aufenthaltsraum; Napf und Wolldecken vorhanden. Vorher anmelden.','recherche','ok',false,'Bergwelten: „Hütten, auf denen du mit deinem Hund übernachten kannst“ (2019)'),
  ('Lötschenpasshütte','huette','Lötschenpass, Berner Alpen','ch',46.42,7.72,
   '[["Übernachtung","A","im Aufenthaltsraum, vorher anmelden"]]'::jsonb,
   'Hunde schlafen im Aufenthaltsraum; Übernachtung mit Hund vorher anmelden.','recherche','ok',false,'Bergwelten: „Hütten, auf denen du mit deinem Hund übernachten kannst“ (2019)'),
  ('Rifugio Similaun','huette','Schnalstal, Ötztaler Alpen','it',46.77,10.84,
   '[["Hunde","A","Hunde akzeptiert, Bedingungen vorher erfragen"]]'::jsonb,
   'Laut Südtiroler Tourismus-Verzeichnis werden Hunde akzeptiert.','recherche','ok',false,'Südtirol Marketing (b2b.suedtirol.info)')
) as v(name, cat, area, region, lat, lon, rules, note, source, status, exact, source_name)
where not exists (select 1 from public.places p where p.name = v.name);
