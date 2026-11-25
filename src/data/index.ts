import type { Cat, Code, DogEvent, Place, Post } from "./types";
import { HUT_PLACES, KENZEN_ID } from "./huts";

export const CATS: Record<Cat | "all", string> = {
  all: "Alle", huette: "Hütten", hike: "Wanderungen", walk: "Spaziergänge", cafe: "Cafés", food: "Restaurants", see: "Seen", hotel: "Hotels",
};
export const ICAT = Object.keys(CATS).filter(k => k !== "all") as Cat[];
export const REG: Record<string, string> = { muc: "München", de: "Deutschland", at: "Österreich", it: "Südtirol & Italien", ch: "Schweiz" };
export const RT: Record<Code, string> = {
  Y: "Hunde erlaubt", N: "Keine Hunde", S: "Nur kleine Hunde", SM: "Kleine & mittlere Hunde", C: "Nur getragen",
  NP: "Keine Welpen", MZ: "Mit Leine / Maulkorb", A: "Nur nach Anmeldung / auf Anfrage", E: "Mit Einschränkung", "?": "Regeln noch offen",
};
export const RULE_CODES: Code[] = ["Y", "A", "E", "SM", "S", "C", "MZ", "N"];
export const AREAS = ["Zimmer", "Lager", "Gaststube", "Terrasse", "Innenraum", "Übernachtung", "Biergarten", "Wanderweg", "Hundestrand", "Seilbahn"];
export const SIZE = { S: ["Klein", "bis ca. 10 kg"], M: ["Mittel", "10 – 25 kg"], L: ["Groß", "über 25 kg"] } as const;
export const AGE = { P: ["Welpe", "unter 1 Jahr"], A: ["Erwachsen", "1 – 8 Jahre"], O: ["Senior", "ab ca. 8 Jahren"] } as const;
export const SCENE: Record<string, string[]> = {
  huette: ["#8c8f6e", "#5d6247", "#3d4030"], hike: ["#a8a07c", "#6e6a4c", "#2f3024"], walk: ["#b9bf98", "#7f8a5c", "#3f4a2c"],
  cafe: ["#d9c3a0", "#a5815a", "#5a3f28"], food: ["#c9a98a", "#8a6448", "#4a3224"], see: ["#a9bcc0", "#6f8d90", "#34494c"], hotel: ["#b0a68c", "#787055", "#3c382a"],
};

// Beispielorte (erfunden) – vor dem Launch durch echte Orte ersetzen
const LOCAL: Place[] = [
  { id: 5, n: "Café Flausch", t: "cafe", a: "München · Glockenbach", reg: "muc", lat: 48.13, lon: 11.57, r: [["Innenraum", "Y", "Napf & Leckerli an der Theke"], ["Terrasse", "Y"]], chk: [2, 22], demo: true },
  { id: 6, n: "Wirtshaus Zur Linde", t: "food", a: "München · Au", reg: "muc", lat: 48.125, lon: 11.595, r: [["Biergarten", "Y"], ["Gaststube", "SM", "große Hunde nur im Biergarten"]], chk: [18, 11], demo: true },
  { id: 10, n: "Isarrunde am Flaucher", t: "walk", a: "München · Sendling", reg: "muc", lat: 48.105, lon: 11.555, r: [["Uferweg", "Y"], ["Kiesbänke", "Y", "Freilauf erlaubt"]], chk: [1, 40], demo: true },
  { id: 7, n: "Badebucht am Steg", t: "see", a: "Starnberger See", reg: "de", lat: 47.95, lon: 11.33, r: [["Hundestrand", "Y", "1. Mai – 30. Sept. nur bis 9 Uhr"], ["Liegewiese", "N"]], chk: [9, 17], demo: true },
];
export const PLACES: Place[] = [...HUT_PLACES, ...LOCAL];
export const PENDING: Place[] = [
  { id: 101, n: "Hundestrand Ammersee-Süd", t: "see", a: "Ammersee", reg: "de", lat: 47.92, lon: 11.12, by: "Lena & Bruno", byAvatar: "golden", ago: "vor 2 Tagen", need: 5, have: 3, r: [["Hundestrand", "Y", "ganzjährig"], ["Kiosk", "Y"]], demo: true },
  { id: 102, n: "Café Morgenrot", t: "cafe", a: "München · Schwabing", reg: "muc", lat: 48.16, lon: 11.585, by: "Tom & Kira", byAvatar: "border", ago: "vor 5 Tagen", need: 5, have: 1, r: [["Innenraum", "SM"], ["Terrasse", "Y"]], demo: true },
];

export const EVENTS: DogEvent[] = [
  { id: 1, d: "29", m: "Nov", mo: 11, n: "Samojeden-Spaziergang", t: "walk", k: "Treffen", w: "Englischer Garten · 10:00", x: "Flauschige Runde mit Kaffeestopp. Alle Rassen willkommen.", g: 18 },
  { id: 2, d: "06", m: "Dez", mo: 12, n: "Hunde-Weihnachtsmarkt", t: "cafe", k: "Markt", w: "Haidhausen · 14–19 Uhr", x: "Leckerli, Halsbänder, Fotoecke und Glühwein für die Menschen.", g: 42 },
  { id: 3, d: "13", m: "Dez", mo: 12, n: "Hüttenwanderung mit Hund", t: "huette", k: "Wanderung", w: "Ammergauer Alpen · 9:00", x: "Gemeinsame Tour zu einer hundefreundlichen Hütte, ca. 2,5 h, mittelschwer.", g: 12 },
  { id: 4, d: "10", m: "Jan", mo: 1, n: "Welpentreff Indoor", t: "food", k: "Treffen", w: "Sendling · 16:00", x: "Spielen und Sozialisieren im Warmen. Für Welpen bis 6 Monate.", g: 9 },
  { id: 5, d: "17", m: "Jan", mo: 1, n: "Fotowalk im Schnee", t: "hike", k: "Wanderung", w: "Spitzingsee · 11:00", x: "Tipps für Fotos mit Hund im Winterlicht.", g: 15 },
];

export const BLOG: Post[] = [{
  id: 1, place: KENZEN_ID, title: "Zur Kenzenhütte mit Nuki", by: "Alicia & Nuki", av: "samojede", date: "Herbst 2026",
  paws: 0, draft: true, builtin: true, img: [require("../../assets/kenzen.jpg")],
  text: "Hier kommt dein Bericht hin, Alicia – tippe auf „Weiter schreiben“.\n\nIdeen für die Gliederung: Anreise & Parken · der Weg (Länge, Höhenmeter, wie anstrengend für Nuki) · Wasserstellen unterwegs · Ankommen auf der Hütte: wo durfte Nuki hin? · Übernachten mit Hund · eure Tipps für andere Hundebesitzer.",
}];

// Schnellwahl-Regionen für die Karte
export const MAP_REGIONS = [
  { k: "by", l: "Bayern & Tirol", r: { latitude: 47.45, longitude: 11.6, latitudeDelta: 1.6, longitudeDelta: 2.4 } },
  { k: "all", l: "Alle Alpen", r: { latitude: 46.9, longitude: 11.1, latitudeDelta: 3.4, longitudeDelta: 7.5 } },
  { k: "muc", l: "München", r: { latitude: 48.13, longitude: 11.57, latitudeDelta: 0.12, longitudeDelta: 0.15 } },
  { k: "it", l: "Südtirol", r: { latitude: 46.65, longitude: 11.7, latitudeDelta: 0.9, longitudeDelta: 1.3 } },
  { k: "at", l: "Salzburg & Kärnten", r: { latitude: 47.2, longitude: 13.1, latitudeDelta: 1.2, longitudeDelta: 1.8 } },
  { k: "ch", l: "Schweiz", r: { latitude: 46.5, longitude: 8.9, latitudeDelta: 1.4, longitudeDelta: 2.6 } },
];
