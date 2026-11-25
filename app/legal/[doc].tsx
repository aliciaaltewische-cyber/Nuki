import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { Card, Screen, T, TopBack } from "../../src/components/ui";
import { useTheme } from "../../src/theme";

// VORLAGE mit Platzhaltern [ … ] – vor dem Launch mit echten Angaben füllen und rechtlich prüfen lassen.
const IMPRESSUM: [string, string][] = [
  ["Angaben gemäß § 5 DDG", "[Vor- und Nachname / Firma]\n[Straße Hausnummer]\n[PLZ Ort]"],
  ["Kontakt", "E-Mail: [hallo@…]\nTelefon: [optional]"],
  ["Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV", "[Name, Anschrift]"],
  ["Umsatzsteuer-ID", "[falls vorhanden]"],
  ["Nutzerinhalte", "Orte, Regeln, Fotos und Berichte werden von der Community beigetragen. Wir prüfen Meldungen, können aber nicht für die Aktualität jeder Angabe garantieren. Hinweise auf falsche Angaben bitte an [E-Mail]."],
];
const DATENSCHUTZ: [string, string][] = [
  ["1. Verantwortlicher", "[Name, Anschrift, E-Mail]"],
  ["2. Welche Daten wir verarbeiten", "Profilangaben (dein Name, Name, Größe, Alter und Tragbarkeit deines Hundes, Interessen), Profilbild, gemerkte Orte, Event-Teilnahmen, von dir gemeldete Orte, Fotos, Berichte und Bestätigungen sowie – nur mit deiner Zustimmung – deinen Standort."],
  ["3. Zweck und Rechtsgrundlage", "Personalisierte Anzeige, ob Orte für deinen Hund erlaubt sind; Bereitstellung der Community-Funktionen. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Nutzungsvertrag) und lit. a (Einwilligung, z. B. Standort)."],
  ["4. Dienstleister", "[Hosting / Datenbank, z. B. Supabase], [Kartendienst: Apple Maps / Google Maps], [App Stores]. Auftragsverarbeitungsverträge nach Art. 28 DSGVO."],
  ["5. Speicherdauer", "Solange dein Konto besteht. Nach Löschung des Kontos werden deine Daten [innerhalb von X Tagen] gelöscht; öffentlich beigetragene Orte bleiben anonymisiert erhalten."],
  ["6. Deine Rechte", "Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch und Widerruf von Einwilligungen; Beschwerde bei einer Datenschutz-Aufsichtsbehörde, in Bayern z. B. dem [BayLDA]."],
  ["7. Kontakt", "[Datenschutz-E-Mail]"],
  ["Hinweis zu dieser Version", "In Version 0.1 werden alle Angaben nur auf deinem Gerät gespeichert."],
];

export default function Legal() {
  const { doc } = useLocalSearchParams<{ doc: string }>(); const r = useRouter(); const t = useTheme();
  const imp = doc === "impressum";
  return (
    <Screen paws={false}>
      <TopBack onPress={() => r.back()} />
      <T style={{ fontSize: 30, marginTop: 16 }}>{imp ? "Impressum" : "Datenschutz"}</T>
      <Card style={{ marginTop: 12 }}><T style={{ fontSize: 13, color: t.mut }}>Vorlage mit Platzhaltern. Vor dem Launch mit echten Angaben füllen und rechtlich prüfen lassen – das hier ist keine Rechtsberatung.</T></Card>
      {(imp ? IMPRESSUM : DATENSCHUTZ).map(([h, b]) => (
        <View key={h} style={{ marginTop: 22 }}><T w="med" style={{ marginBottom: 6 }}>{h}</T><T style={{ lineHeight: 24 }}>{b}</T></View>
      ))}
    </Screen>
  );
}
