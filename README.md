# 🐾 Nuki – Die Community für hundefreundliche Orte

Nuki ist eine Community-App, in der Hundemenschen weltweit hundefreundliche Orte teilen, bewerten und
entdecken: Cafés, Restaurants, Unterkünfte, Hundewiesen, Hundestrände, Wanderwege, Geschäfte, Tierärzte
und mehr. Unternehmen können ihren Ort gegen Bezahlung als **„Empfohlen“** hervorheben lassen.

## Funktionen

**Für Mitglieder**
- Anmeldung per E-Mail-Link (ohne Passwort), eigenes Profil
- Orte teilen mit Foto, Kategorie, Standort (Adresssuche, Karte oder GPS) und Ausstattung
  (Wassernapf, Leckerlis, leinenfrei, Hunde-Menü …)
- Orte mit Sternen und Text bewerten
- Favoriten speichern
- Punkte sammeln (10 pro Ort, 3 pro Bewertung) und in der Rangliste aufsteigen
- Orte melden (Moderation)

**Featured / Empfohlene Orte (Bezahlfunktion)**
- Pakete: 1 Woche, 1 Monat, 3 Monate (Preise in der Datenbank anpassbar)
- Bezahlung über Stripe Checkout (Karte, Apple Pay, Google Pay …)
- Empfohlene Orte erscheinen im Karussell ganz oben, zuerst in der Liste, mit goldenem Marker und Badge
- Laufzeit wird nach Zahlung automatisch verlängert

**Oberfläche**
- Modernes Design mit Karte und Liste nebeneinander (Desktop) bzw. Bottom-Navigation (Handy)
- Dark Mode, installierbar als App (PWA), teilbare Links zu jedem Ort

## Ausprobieren (Demo-Modus)

Ohne Einrichtung läuft die App im **Demo-Modus**: Alles funktioniert (inkl. simulierter Zahlung), wird
aber nur im eigenen Browser gespeichert.

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Live schalten

### 1. Supabase (Datenbank, Login, Fotos)

1. Kostenloses Projekt auf [supabase.com](https://supabase.com) anlegen.
2. **SQL Editor** → Inhalt von [`supabase/schema.sql`](supabase/schema.sql) einfügen und ausführen.
3. **Project Settings → API**: *Project URL* und *anon public* Key in [`config.js`](config.js) eintragen.
4. **Authentication → URL Configuration**: die Adresse deiner Website als *Site URL* und *Redirect URL*
   eintragen (z. B. `https://deinname.github.io/Nuki/`).

### 2. Stripe (Bezahlung für „Empfohlen“)

1. Konto auf [stripe.com](https://stripe.com) anlegen, den **Secret Key** kopieren.
2. [Supabase CLI](https://supabase.com/docs/guides/cli) installieren und die Funktionen deployen:
   ```bash
   supabase link --project-ref <dein-projekt>
   supabase secrets set STRIPE_SECRET_KEY=sk_live_... SITE_URL=https://deinname.github.io/Nuki/
   supabase functions deploy create-checkout
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
3. In Stripe unter **Developers → Webhooks** einen Endpoint anlegen:
   `https://<dein-projekt>.supabase.co/functions/v1/stripe-webhook`,
   Events `checkout.session.completed` und `checkout.session.async_payment_succeeded`.
4. Das Webhook-Signing-Secret hinterlegen:
   `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`

Zum Testen zuerst die Test-Keys von Stripe (`sk_test_...`) verwenden.
Preise und Pakete änderst du in der Tabelle `featured_plans`.

### 3. Website veröffentlichen

Die App besteht nur aus statischen Dateien, ein Build-Schritt ist nicht nötig. Sie läuft z. B. kostenlos auf
**GitHub Pages** (Repository → Settings → Pages → Branch wählen), Netlify oder Vercel.

## Moderation

- Meldungen landen in der Tabelle `reports`.
- Einen Ort ausblenden: in `places` die Spalte `hidden` auf `true` setzen.
- Admin-Rechte (alle Orte/Bewertungen löschen dürfen): in `profiles` die Spalte `is_admin` auf `true` setzen.
- Hervorhebung manuell vergeben: `featured_until` in `places` setzen.

## Sicherheit

- Row Level Security: Mitglieder können nur eigene Orte, Bewertungen und Favoriten ändern.
- `featured_until` kann nur durch eine bezahlte Bestellung gesetzt werden (Stripe-Webhook mit geprüfter
  Signatur). Preise kommen ausschließlich aus der Datenbank, nie vom Browser.
- Fotos werden vor dem Upload verkleinert und in einen eigenen Ordner pro Mitglied gespeichert.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `index.html`, `styles.css` | App-Gerüst und Design |
| `js/app.js` | Steuerung: Routing, Aktionen, Formulare |
| `js/views.js` | Ansichten: Entdecken, Ort, Community, Profil, Dialoge |
| `js/map.js` | Karte und Marker (Leaflet) |
| `js/backend/demo.js` | Demo-Backend (localStorage) |
| `js/backend/supabase.js` | Echtes Backend (Supabase) |
| `js/constants.js` | Kategorien, Ausstattung, Pakete |
| `config.js` | Supabase-Zugangsdaten |
| `supabase/schema.sql` | Datenbank, Rechte, Foto-Speicher |
| `supabase/functions/` | Stripe-Checkout und -Webhook (Edge Functions) |
| `vendor/` | Leaflet 1.9.4 (BSD-2), supabase-js 2.45.4 (MIT) |

Kartendaten © OpenStreetMap-Mitwirkende, Kartenstil © CARTO, Adresssuche über Nominatim.
Bei viel Verkehr bitte deren Nutzungsbedingungen beachten bzw. eigene Anbieter verwenden.
