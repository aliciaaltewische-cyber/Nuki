import type { ImageSourcePropType } from "react-native";

export type Code = "Y" | "N" | "S" | "SM" | "C" | "NP" | "MZ" | "A" | "E" | "?";
export type Rule = [area: string, code: Code, note?: string];
export type Cat = "huette" | "hike" | "walk" | "cafe" | "food" | "see" | "hotel";
export type Verdict = "ok" | "mid" | "no";

export type Place = {
  id: number; n: string; t: Cat; a: string; reg: string;
  lat?: number | null; lon?: number | null;
  r: Rule[]; note?: string; closed?: boolean; web?: string;
  sc?: string[]; src?: boolean; demo?: boolean; chk?: [number, number];
  // Community-Meldungen
  by?: string; byAvatar?: string; ago?: string; need?: number; have?: number; img?: string;
};

export type Profile = {
  owner: string; dog: string; size: "S" | "M" | "L"; carry: "Y" | "N"; age: "P" | "A" | "O";
  int: Cat[]; avatar: string; photo?: string;
};

export type PostImage = string | number; // URI oder require()
export type Post = {
  id: number; place: number | null; title: string; text: string; img: PostImage[];
  paws: number; draft: boolean; by: string; av?: string; photoBy?: string; date: string; builtin?: boolean;
};

export type DogEvent = { id: number; d: string; m: string; mo: number; n: string; t: Cat; k: string; w: string; x: string; g: number };

export const img = (i: PostImage): ImageSourcePropType => (typeof i === "number" ? i : { uri: i });
