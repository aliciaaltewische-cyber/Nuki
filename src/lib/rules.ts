import type { Code, Place, Profile, Verdict } from "../data/types";

/** 1 = erlaubt, 0.5 = mit Einschränkung / auf Anfrage, 0 = nicht erlaubt – bezogen auf das Hundeprofil */
export function ok(code: Code, p: Profile): number {
  switch (code) {
    case "Y": return 1;
    case "N": return 0;
    case "S": return p.size === "S" || p.carry === "Y" ? 1 : 0;
    case "SM": return p.size !== "L" ? 1 : 0;
    case "C": return p.carry === "Y" ? 1 : 0;
    case "NP": return p.age !== "P" ? 1 : 0;
    default: return 0.5; // MZ, A, E, ?
  }
}
export function verdict(pl: Place, p: Profile): Verdict {
  const v = pl.r.map(r => ok(r[1], p));
  if (v.every(x => x === 1)) return "ok";
  if (v.reduce((a, b) => a + b, 0) === 0) return "no";
  return "mid";
}
export const VTXT: Record<Verdict, string> = { ok: "Erlaubt", mid: "Mit Einschränkung", no: "Nicht erlaubt" };
const INDOOR = ["Innenraum", "Gaststube", "Zimmer", "Restaurant", "Privatzimmer", "Hundezimmer"];
const STAY = ["Übernachtung", "Zimmer", "Übernachtung im Lager", "Privatzimmer", "Hundezimmer", "Hotel", "Winterraum"];
export const allowsIn = (pl: Place, p: Profile, list: string[]) => pl.r.some(r => list.includes(r[0]) && ok(r[1], p) > 0);
export const allowsIndoor = (pl: Place, p: Profile) => allowsIn(pl, p, INDOOR);
export const allowsStay = (pl: Place, p: Profile) => allowsIn(pl, p, STAY);
export const allowsFree = (pl: Place) => pl.r.some(r => /Freilauf|Hundestrand|Kiesbänke/.test(r[0] + " " + (r[2] || "")));

export function kmFromMunich(lat?: number | null, lon?: number | null): number | null {
  if (lat == null || lon == null) return null;
  const R = 6371, r = Math.PI / 180;
  const a = Math.sin(((lat - 48.137) * r) / 2) ** 2 + Math.cos(48.137 * r) * Math.cos(lat * r) * Math.sin(((lon - 11.575) * r) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}
export const mapsUrl = (pl: Place) =>
  "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(pl.lat != null ? `${pl.n} ${pl.a}` : pl.n);
