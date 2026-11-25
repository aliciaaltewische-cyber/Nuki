-- ═══════════════════════════════════════════════════════════════
--  Nooks, Update 2: Hundestrände, Seen und Cafés aus Recherche
--  (Update 1 muss vorher gelaufen sein.)  Einmal in den SQL Editor
--  kopieren und auf „Run“ tippen. Mehrfaches Ausführen ist harmlos.
-- ═══════════════════════════════════════════════════════════════
insert into public.places (name, cat, area, region, lat, lon, rules, note, source, status, exact, source_name)
select * from (values
  -- Seen & Hundestrände (Quelle: Outdoor-Renner-Ratgeber „Baden mit Hund in Bayern“, Stand Mai 2026)
  ('Hundestrand Rottach-Egern','see','Tegernsee, neben dem Strandbad Ringsee','de',47.698,11.765,
   '[["Hundeabschnitt","Y","offizieller Hundebereich, Eintritt frei"],["Außerhalb","MZ","Leinenpflicht"]]'::jsonb,
   'Offizieller Hundeabschnitt neben dem Strandbad; an heißen Wochenenden voll, unter der Woche oder früh morgens ruhiger.','recherche','ok',false,'Outdoor-Renner: „Baden mit Hund in Bayern“ (2026)'),
  ('Hundebadestellen Schliersee','see','Schliersee','de',47.735,11.86,
   '[["Hundeabschnitte","Y","Baden erlaubt"],["Strandbad","N"],["Außerhalb","MZ","Leinenpflicht"]]'::jsonb,
   'Ausgewiesene Hundestrand-Abschnitte; im offiziellen Strandbad sind Hunde nicht erlaubt.','recherche','ok',false,'Outdoor-Renner: „Baden mit Hund in Bayern“ (2026)'),
  ('Hundewiese & Hundestrand Eching','see','Ammersee, Eching','de',48.075,11.115,
   '[["Hundewiese & Strand","Y"],["Andere Abschnitte","E","je nach Abschnitt, Schilder beachten"]]'::jsonb,
   'Am Ammersee ist Hundebaden nicht überall erlaubt; in Eching gibt es Hundewiese und Hundestrand.','recherche','ok',false,'Outdoor-Renner: „Baden mit Hund in Bayern“ (2026)'),
  ('Hundebadeplatz Bernau-Felden','see','Chiemsee, zwischen Dampfersteg und Wasserwacht','de',47.82,12.40,
   '[["Hundebadeplatz","Y"],["Umgebung","MZ","teilweise Leinenpflicht, Schilder beachten"],["Strandbäder & Naturschutzgebiete","N"]]'::jsonb,
   'Ausgewiesener Hundebadeplatz mit kleinem Sandstrand.','recherche','ok',false,'Outdoor-Renner: „Baden mit Hund in Bayern“ (2026)'),
  ('Hundestrand Chieming','see','Chiemsee, Chieming','de',47.89,12.535,
   '[["Hundestrand","Y"],["Strandbäder & Naturschutzgebiete","N"]]'::jsonb,
   'Hundestrand am Ostufer des Chiemsees.','recherche','ok',false,'Outdoor-Renner: „Baden mit Hund in Bayern“ (2026)'),
  ('Hundestrand Übersee','see','Chiemsee, Übersee','de',47.84,12.47,
   '[["Hundestrand","Y"],["Strandbäder & Naturschutzgebiete","N"]]'::jsonb,
   'Hundestrand am Südufer des Chiemsees.','recherche','ok',false,'Outdoor-Renner: „Baden mit Hund in Bayern“ (2026)'),
  ('Freie Badestellen Forggensee','see','Forggensee, Ostallgäu','de',47.60,10.73,
   '[["Freie Badestellen","Y","ohne Leine"],["Strandbäder","N"]]'::jsonb,
   'An den freien Badestellen (nicht in den offiziellen Strandbädern) dürfen Hunde ohne Leine ins Wasser.','recherche','ok',false,'Outdoor-Renner: „Baden mit Hund in Bayern“ (2026)'),
  ('Hopfensee Nordufer','see','Hopfensee bei Füssen','de',47.61,10.68,
   '[["Nordufer","Y","ohne Leine"],["Südseite","E","Bootsverkehr"]]'::jsonb,
   'Freie Uferbereiche am Nordufer; der See wird früh warm (ab etwa Mai).','recherche','ok',false,'Outdoor-Renner: „Baden mit Hund in Bayern“ (2026)'),
  ('Walchensee','see','Walchensee','de',47.59,11.33,
   '[["Baden mit Hund","N","Badeverbot für Hunde"],["Uferspaziergang","MZ","Leinenpflicht"]]'::jsonb,
   'Kein Baden mit Hund, nur Spaziergänge am Ufer an der Leine.','recherche','ok',false,'Outdoor-Renner: „Baden mit Hund in Bayern“ (2026)'),
  -- München (Quelle: München Tourismus)
  ('Olympiasee','see','München, Olympiapark','muc',48.172,11.551,
   '[["Baden mit Hund","Y","eine von zwei Ausnahmen vom Hunde-Badeverbot in Münchner Badeseen"],["Sport- & Spielflächen","N","kein Freilauf"]]'::jsonb,
   'In Münchner Badeseen gilt Badeverbot für Hunde, mit zwei Ausnahmen: Olympiasee und Mallertshofer See.','recherche','ok',false,'München Tourismus: „München mit Hund“'),
  ('Mallertshofer See','see','Oberschleißheim, Norden von München','muc',48.245,11.62,
   '[["Baden mit Hund","Y","Ausnahme vom Hunde-Badeverbot in München"]]'::jsonb,
   'In Münchner Badeseen gilt Badeverbot für Hunde, mit zwei Ausnahmen: Olympiasee und Mallertshofer See.','recherche','ok',false,'München Tourismus: „München mit Hund“'),
  ('Guggenberger See, Hundestrand','see','Neuherberg, Norden von München','muc',48.228,11.598,
   '[["Hundestrand-Abschnitt","Y"]]'::jsonb,
   'Am Guggenberger See gibt es einen Abschnitt mit Hundestrand.','recherche','ok',false,'1000things: „6 Ausflüge mit Hund in und um München“'),
  -- Cafés in München (Quelle: 1000things „7 hundefreundliche Lokale in München“)
  ('Lost Weekend','cafe','München · Maxvorstadt, Schellingstraße 3','muc',48.1498,11.5775,
   '[["Innenraum","Y"],["Draußen","Y"],["Extras","Y","Puppuccino"]]'::jsonb,
   'Hundefreundliches Café mit Puppuccino, Plätze drinnen und draußen.','recherche','ok',false,'1000things: „7 hundefreundliche Lokale in München“'),
  ('Patisserie Siessl','cafe','München · Schwabing-West, Hiltenspergerstraße 15','muc',48.1595,11.5698,
   '[["Innenraum","Y","Hunde willkommen"],["Draußen","Y"]]'::jsonb,
   'Hunde willkommen, Plätze drinnen und draußen.','recherche','ok',false,'1000things: „7 hundefreundliche Lokale in München“'),
  ('Daddee Blu','cafe','München · Glockenbach, Angertorstraße 4','muc',48.1315,11.5689,
   '[["Café","Y","Hunde willkommen"],["Abends","E","Do bis Sa DJ, mit Hund lieber früh kommen"]]'::jsonb,
   'Zwei Golden Retriever sind hier die „Gastgeber“; Tisch am besten online reservieren.','recherche','ok',false,'1000things: „7 hundefreundliche Lokale in München“'),
  ('Pintu, Hunde-Spa & Café','cafe','München · Altstadt, Amiraplatz 1','muc',48.1415,11.5768,
   '[["Café","Y","Puppuccino, Hunde-Donuts & Snacks"],["Extras","Y","Hundesalon"]]'::jsonb,
   'Hunde-Spa mit Café: Puppuccino, Donuts, Salami und Jerky für Hunde.','recherche','ok',false,'1000things: „7 hundefreundliche Lokale in München“'),
  ('hundskerle','cafe','München · Haidhausen, Rosenheimer Straße 67 bis 69','muc',48.127,11.596,
   '[["Hunde-Eisbar","Y","Hunde-Eis auf Joghurtbasis & Snackbar"]]'::jsonb,
   'Hunde-Boutique mit Eis- und Snackbar für Hunde.','recherche','ok',false,'1000things: „7 hundefreundliche Lokale in München“')
) as v(name, cat, area, region, lat, lon, rules, note, source, status, exact, source_name)
where not exists (select 1 from public.places p where p.name = v.name);

-- Bereinigung: keine Gedankenstriche mehr in bestehenden Texten
update public.places set
  note  = regexp_replace(replace(replace(note,' – ',', '),' — ',', '),'(\d)\s*–\s*(\d)','\1 bis \2','g'),
  rules = regexp_replace(replace(replace(rules::text,' – ',', '),' — ',', '),'(\d)\s*–\s*(\d)','\1 bis \2','g')::jsonb,
  area  = regexp_replace(replace(replace(area,' – ',', '),' — ',', '),'(\d)\s*–\s*(\d)','\1 bis \2','g')
where note ~ '[–—]' or rules::text ~ '[–—]' or area ~ '[–—]';

update public.posts set
  body  = regexp_replace(replace(replace(body,' – ',', '),' — ',', '),'(\d)\s*–\s*(\d)','\1 bis \2','g'),
  title = replace(replace(title,' – ',', '),' — ',', ')
where body ~ '[–—]' or title ~ '[–—]';
update public.places set note=replace(note,'–',' bis '), rules=replace(rules::text,'–',' bis ')::jsonb, area=replace(area,'–',' bis ')
where note ~ '–' or rules::text ~ '–' or area ~ '–';
