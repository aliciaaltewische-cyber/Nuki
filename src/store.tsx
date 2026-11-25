import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BLOG, PENDING, PLACES } from "./data";
import type { Place, Post, Profile } from "./data/types";

type State = {
  profile: Profile | null; saved: number[]; going: number[]; votes: Record<number, "y" | "n">;
  confirms: Record<number, boolean>; community: Place[]; posts: Post[]; photos: Record<number, string>;
};
const EMPTY: State = { profile: null, saved: [], going: [], votes: {}, confirms: {}, community: [], posts: [], photos: {} };
const KEY = "nooks-v1";

type Ctx = State & {
  ready: boolean;
  set: (fn: (s: State) => Partial<State>) => void;
  toggle: (key: "saved" | "going", id: number) => void;
  allPlaces: Place[]; allPosts: Post[];
  isPending: (p: Place) => boolean; place: (id: number) => Place | undefined;
  reset: () => void;
};
const C = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<State>(EMPTY);
  const [ready, setReady] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => { if (v) try { setS({ ...EMPTY, ...JSON.parse(v) }); } catch {} }).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});
  }, [s, ready]);

  const value = useMemo<Ctx>(() => {
    const isPending = (p: Place) => !!p.need && (p.have || 0) + (s.confirms[p.id] ? 1 : 0) < p.need;
    const allPlaces = [...PLACES, ...PENDING, ...s.community];
    const allPosts = [
      ...s.posts.filter(b => !BLOG.some(x => x.id === b.id)).reverse(),
      ...BLOG.map(b => s.posts.find(x => x.id === b.id) || b),
    ];
    return {
      ...s, ready, allPlaces, allPosts, isPending,
      place: id => allPlaces.find(p => p.id === id),
      set: fn => setS(prev => ({ ...prev, ...fn(prev) })),
      toggle: (key, id) => setS(prev => ({ ...prev, [key]: prev[key].includes(id) ? prev[key].filter(x => x !== id) : [...prev[key], id] })),
      reset: () => setS(EMPTY),
    };
  }, [s, ready]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
export function useStore() {
  const c = useContext(C);
  if (!c) throw new Error("useStore außerhalb von StoreProvider");
  return c;
}
