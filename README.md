# 🐾 Nuki – Hundefreundliche Orte weltweit

Eine Web-App (auch am Handy als App installierbar), in der alle hundefreundliche Orte auf einer Weltkarte
entdecken und selbst ergänzen können: Cafés, Restaurants, Unterkünfte, Hundewiesen, Hundestrände,
Wanderwege, Geschäfte, Tierärzte und mehr.

## Funktionen

- 🗺️ Weltkarte (OpenStreetMap) mit Markern je Kategorie
- ➕ Orte hinzufügen: Adresse suchen, auf der Karte tippen, eigenen Standort nutzen
  oder per Rechtsklick/langem Drücken direkt auf der Karte
- 🦴 Ausstattung: Wassernapf, Leckerlis, drinnen erlaubt, leinenfrei, eingezäunt, Schatten, …
- ⭐ Bewertung, Beschreibung, Website und Link zur Route
- 🔎 Suche und Filter nach Kategorie, „In meiner Nähe“
- ✏️ Eigene Einträge bearbeiten und löschen
- 💾 Export/Import als JSON

## Starten

Es braucht keinen Build-Schritt. Einfach einen beliebigen statischen Webserver im Ordner starten:

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

Ohne weitere Einrichtung werden Orte **nur lokal in deinem Browser** gespeichert.

## Weltweit teilen (gemeinsame Datenbank)

Damit alle Nutzer*innen dieselben Orte sehen, nutzt die App optional [Supabase](https://supabase.com)
(kostenloser Tarif reicht):

1. Bei Supabase ein neues Projekt anlegen.
2. Im Dashboard unter **SQL Editor** den Inhalt von [`supabase/schema.sql`](supabase/schema.sql) ausführen.
3. Unter **Project Settings → API** die *Project URL* und den *anon public* Key kopieren
   und in [`config.js`](config.js) eintragen.

Danach steht unten in der Seitenleiste „🌍 Gemeinsame Datenbank“. Alle können Orte hinzufügen;
bearbeiten und löschen kann man nur die eigenen (erkannt über ein geheimes Token im Browser).
Moderieren kannst du über das Supabase-Dashboard (Table Editor → `places`).

## Veröffentlichen

Da die App aus statischen Dateien besteht, läuft sie kostenlos auf **GitHub Pages**
(Repository → Settings → Pages → Branch auswählen), Netlify, Vercel o. Ä.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Seitenstruktur und Formular |
| `styles.css` | Design (inkl. Dark Mode und Handy-Layout) |
| `app.js` | Karte, Liste, Filter, Formular |
| `storage.js` | Speicherung lokal oder in Supabase |
| `config.js` | Supabase-Zugangsdaten (optional) |
| `supabase/schema.sql` | Datenbanktabelle und Zugriffsregeln |
| `vendor/leaflet/` | Kartenbibliothek [Leaflet](https://leafletjs.com) 1.9.4 (BSD-2-Lizenz) |

Kartendaten © OpenStreetMap-Mitwirkende. Adresssuche über Nominatim. Bitte deren
[Nutzungsrichtlinien](https://operations.osmfoundation.org/policies/) beachten; für viel Verkehr
einen eigenen Kachel- bzw. Geocoding-Anbieter verwenden.
