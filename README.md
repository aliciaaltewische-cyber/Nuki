# Nooks – die App

Wo darf dein Hund mit – und wo nicht. Version 0.1, gebaut mit **Expo / React Native** (läuft auf iPhone und Android).

## Was drin ist

- **Onboarding:** Name, Hundename, Profilbild (eigenes Foto oder Rassen-Sticker), Größe, tragbar ja/nein, Interessen als Kacheln, Alter
- **Start:** „Hallo Alicia & hallo Nuki“, Auswahl passend zu euren Interessen, Berichte, nächstes Event, Orte nahe München
- **Karte:** echte Apple-/Google-Karte mit Ampel-Pins, Suche, Kategorien, Schnellwahl der Regionen und Filter („komplett erlaubt für Nuki“, drinnen, übernachten, Freilauf, Land)
- **Ortsseite:** Ampel für deinen Hund, Regeln pro Bereich, Hinweis aus der Hüttenliste, „In Google Maps öffnen“, eigenes Foto hinzufügen, Berichte, „Stimmt das noch?“, Merken
- **Community:** Berichte schreiben (mit mehreren Fotos und Pfoten-Bewertung), neue Orte melden (Pin auf der echten Karte setzen, Regeln pro Bereich), Orte bestätigen
- **Events**, **Profil** mit gemerkten Orten, Interessen und **Impressum & Datenschutz** (Vorlagen)
- 64 Hütten aus der Liste „Berghütten mit Hund“, dein Kenzenhütte-Foto als Bericht-Entwurf, das neue Nooks-Logo als App-Icon und Splash
- Leichte Pfotenspuren im Hintergrund (aus bei „Bewegung reduzieren“)

## So startest du die App auf deinem Handy

Du brauchst einen Computer (Mac oder Windows) und dein Handy im selben WLAN.

1. **Node.js installieren:** auf nodejs.org die „LTS“-Version herunterladen und installieren.
2. **Expo Go installieren:** die App „Expo Go“ aus dem App Store bzw. Google Play aufs Handy laden.
3. **Projekt anlegen:** Terminal öffnen (Mac: Programm „Terminal“, Windows: „PowerShell“) und eintippen:
   ```
   npx create-expo-app@latest nooks
   cd nooks
   ```
4. **Beispielcode entfernen:** im neuen Ordner `nooks` die Ordner `app`, `components`, `hooks`, `constants` und `scripts` löschen (falls vorhanden).
5. **Nooks hineinkopieren:** aus dieser ZIP die Ordner `app`, `src`, `assets` und die Dateien `app.json` und `tsconfig.json` in den Ordner `nooks` kopieren (vorhandene Dateien ersetzen).
6. **Bausteine installieren:**
   ```
   npx expo install react-native-maps react-native-svg expo-image-picker @react-native-async-storage/async-storage expo-linear-gradient expo-blur @expo-google-fonts/inter expo-font expo-splash-screen expo-status-bar react-native-safe-area-context
   ```
7. **Starten:**
   ```
   npx expo start
   ```
   Es erscheint ein QR-Code. iPhone: mit der Kamera scannen. Android: in Expo Go scannen. Die App öffnet sich in Expo Go.

Wenn etwas hakt, kopiere die Fehlermeldung aus dem Terminal in den Chat mit Claude.

## Gut zu wissen (Version 0.1)

- **Alles wird nur auf dem Handy gespeichert.** Profil, Berichte, gemeldete Orte und Bestätigungen sieht noch niemand sonst. Für echte Konten und eine gemeinsame Community kommt als Nächstes ein Backend (Vorschlag: Supabase).
- **Fotos** werden als Verweis auf die Galerie gespeichert. Mit dem Backend werden sie hochgeladen und bleiben dauerhaft.
- **Pins der Hütten** sind anhand der Region gesetzt, also ungefähr. Hochalm Schutzhütte, Peer Alm, Königalm und Oberhauser Hütte haben noch keinen Pin.
- **Hunderegeln** stammen aus den Notizen der Google-Maps-Liste – vor dem Launch mit den Hütten abgleichen.
- **Impressum & Datenschutz** sind Vorlagen mit Platzhaltern in `app/legal/[doc].tsx` – vor dem Launch füllen und rechtlich prüfen lassen.
- **Café, Restaurant, Isar-Runde, Badesee, Events** sind Beispiele (in `src/data/index.ts`).

## Für den App Store / Google Play (später)

1. Kostenloses Konto bei expo.dev, dann `npx eas build` – Expo baut die App in der Cloud.
2. Apple-Entwicklerkonto (jährliche Gebühr) und Google-Play-Konto (einmalige Gebühr).
3. Für Android im Store: einen Google-Maps-API-Schlüssel im `app.json` beim Plugin `react-native-maps` eintragen (in Expo Go nicht nötig).

## Wo was liegt

| Ordner / Datei | Inhalt |
|---|---|
| `app/` | alle Screens (Start, Karte, Community, Events, Profil, Ortsseite, Berichte, Ort melden, Rechtliches) |
| `src/data/huts.ts` | die Hütten aus deiner Liste |
| `src/data/index.ts` | Kategorien, Regionen, Beispielorte, Events, Bericht-Entwurf |
| `src/lib/rules.ts` | die Logik hinter der Ampel (erlaubt / mit Einschränkung / nicht erlaubt) |
| `src/theme.ts` | Farben und Schriften |
| `src/components/` | Bausteine: Karten, Sticker, Pfoten, Icons, Landschaften |
| `assets/` | Logo, App-Icon, Splash, Kenzenhütte-Foto |
