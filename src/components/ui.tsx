import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextProps, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CATS } from "../data";
import { img, type Place, type Post } from "../data/types";
import { kmFromMunich, verdict, VTXT } from "../lib/rules";
import { useStore } from "../store";
import { F, useTheme } from "../theme";
import { DogSticker } from "./DogSticker";
import { Icon } from "./Icon";
import { Paws } from "./Paws";
import { Scene } from "./Scene";

export function T({ w = "light", style, ...p }: TextProps & { w?: keyof typeof F }) {
  const t = useTheme();
  return <Text {...p} style={[{ fontFamily: F[w], color: t.ink, fontSize: 16 }, style]} />;
}

export function Screen({ children, paws = true, pad = true }: { children: React.ReactNode; paws?: boolean; pad?: boolean }) {
  const t = useTheme();
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      {paws && <Paws />}
      <ScrollView contentContainerStyle={{ padding: pad ? 18 : 0, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>{children}</ScrollView>
    </SafeAreaView>
  );
}

export function Btn({ label, onPress, ghost, icon, style, small }: { label: string; onPress: () => void; ghost?: boolean; icon?: string; style?: ViewStyle; small?: boolean }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ minHeight: small ? 44 : 52, borderRadius: 999, paddingHorizontal: small ? 18 : 26, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: ghost ? t.card : t.ink, borderWidth: ghost ? 1 : 0, borderColor: t.line, opacity: pressed ? 0.8 : 1 }, style]}>
      {icon && <Icon name={icon} size={18} color={ghost ? t.ink : t.bg} />}
      <T w="med" style={{ color: ghost ? t.ink : t.bg, fontSize: small ? 14 : 16 }}>{label}</T>
    </Pressable>
  );
}

export function Pill({ label, on, onPress }: { label: string; on?: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={{ borderRadius: 999, paddingHorizontal: 18, height: 40, justifyContent: "center", backgroundColor: on ? t.ink : t.soft }}>
      <T style={{ fontSize: 14, color: on ? t.bg : t.mut }}>{label}</T>
    </Pressable>
  );
}
export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={{ borderRadius: 999, paddingHorizontal: 14, height: 40, justifyContent: "center", borderWidth: 1, borderColor: on ? t.ink : t.line, backgroundColor: on ? t.ink : t.card }}>
      <T style={{ fontSize: 14, color: on ? t.bg : t.ink }}>{label}</T>
    </Pressable>
  );
}
export function Pills({ children }: { children: React.ReactNode }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -18, marginTop: 16 }} contentContainerStyle={{ paddingHorizontal: 18, gap: 8 }}>{children}</ScrollView>;
}

export function Sec({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 28, marginBottom: 12 }}>
      <T w="med" style={{ fontSize: 17 }}>{title}</T>
      {action && <Pressable onPress={onAction} hitSlop={10}><T style={{ fontSize: 13, color: t.mut }}>{action}</T></Pressable>}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return <View style={[{ backgroundColor: t.card, borderRadius: 20, padding: 16 }, style]}>{children}</View>;
}

export function Glass({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }, style]}>
      <BlurView intensity={30} tint="dark" style={{ padding: 14, backgroundColor: "rgba(25,25,18,0.25)" }}>{children}</BlurView>
    </View>
  );
}

export function Visual({ place, id }: { place: Place; id: string }) {
  const { photos } = useStore();
  const uri = photos[place.id] || place.img;
  if (uri) return <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />;
  return <Scene t={place.t} colors={place.sc} id={id} />;
}

export function Avatar({ photo, breed, letter, size = 50 }: { photo?: string; breed?: string; letter?: string; size?: number }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.soft, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
      {photo ? <Image source={{ uri: photo }} style={{ width: size, height: size }} /> : breed ? <DogSticker breed={breed} size={size * 0.88} /> : <T w="med">{letter}</T>}
    </View>
  );
}

export function Dot({ v, size = 8 }: { v: "ok" | "mid" | "no"; size?: number }) {
  const t = useTheme();
  return <View style={{ width: size, height: size, borderRadius: size, backgroundColor: t[v] }} />;
}

export const meta = (p: Place) => {
  const km = kmFromMunich(p.lat, p.lon);
  return `${CATS[p.t]} · ${p.a}${km != null ? ` · ${km} km` : ""}`;
};

export function PlaceRow({ p }: { p: Place }) {
  const t = useTheme(); const r = useRouter(); const { profile, isPending } = useStore();
  const v = verdict(p, profile!);
  return (
    <Pressable onPress={() => r.push(`/place/${p.id}`)} style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: t.card, borderRadius: 20, padding: 8, paddingRight: 16, marginBottom: 8 }}>
      <View style={{ width: 60, height: 60, borderRadius: 14, overflow: "hidden" }}><Visual place={p} id={"r" + p.id} /></View>
      <View style={{ flex: 1 }}>
        <T w="med" style={{ fontSize: 15 }} numberOfLines={1}>{p.n}</T>
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          {p.closed && <Badge label="vorüb. geschlossen" />}{isPending(p) && <Badge label="wird geprüft" />}{p.by && !isPending(p) && <Badge label="Community" />}
        </View>
        <T style={{ fontSize: 13, color: t.mut }} numberOfLines={1}>{meta(p)}</T>
      </View>
      <Dot v={v} />
    </Pressable>
  );
}
export function Badge({ label }: { label: string }) {
  const t = useTheme();
  return <View style={{ borderWidth: 1, borderColor: t.line, borderRadius: 999, paddingHorizontal: 8, marginVertical: 2 }}><T style={{ fontSize: 11, color: t.mut }}>{label}</T></View>;
}

export function HeartBtn({ id, style }: { id: number; style?: ViewStyle }) {
  const { saved, toggle } = useStore(); const on = saved.includes(id);
  return (
    <Pressable onPress={() => toggle("saved", id)} hitSlop={8} style={[{ width: 46, height: 46, borderRadius: 23, backgroundColor: on ? "#121210" : "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" }, style]}>
      <Icon name="heart" size={21} color={on ? "#fff" : "#121210"} fill={on ? "#fff" : "none"} />
    </Pressable>
  );
}

export function BigCard({ p, width }: { p: Place; width: number }) {
  const r = useRouter(); const { profile } = useStore(); const t = useTheme(); const v = verdict(p, profile!);
  return (
    <Pressable onPress={() => r.push(`/place/${p.id}`)} style={{ width, aspectRatio: 3 / 4, borderRadius: 28, overflow: "hidden", backgroundColor: t.soft }}>
      <Visual place={p} id={"b" + p.id} />
      <HeartBtn id={p.id} style={{ position: "absolute", top: 12, right: 12 }} />
      <Glass style={{ position: "absolute", left: 10, right: 10, bottom: 10 }}>
        <T style={{ color: "#fff", fontSize: 10, letterSpacing: 3, opacity: 0.8 }} numberOfLines={1}>{p.a.split(",")[0].toUpperCase()}</T>
        <T w="reg" style={{ color: "#fff", fontSize: 21, marginTop: 2 }} numberOfLines={2}>{p.n}</T>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginTop: 8 }}>
          <Dot v={v} size={7} /><T style={{ color: "#fff", fontSize: 12 }}>{VTXT[v]} für {profile!.dog}</T>
        </View>
      </Glass>
    </Pressable>
  );
}

export function PostCard({ b, width }: { b: Post; width: number }) {
  const r = useRouter(); const { place } = useStore(); const pl = b.place ? place(b.place) : undefined; const t = useTheme();
  return (
    <Pressable onPress={() => r.push(`/post/${b.id}`)} style={{ width, aspectRatio: 4 / 5, borderRadius: 28, overflow: "hidden", backgroundColor: t.soft }}>
      {b.img[0] != null ? <Image source={img(b.img[0])} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <Scene t={pl?.t || "hike"} id={"p" + b.id} />}
      {b.draft && <View style={{ position: "absolute", top: 12, left: 12, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 }}><T style={{ fontSize: 12, color: "#121210" }}>Entwurf</T></View>}
      <Glass style={{ position: "absolute", left: 10, right: 10, bottom: 10 }}>
        <T style={{ color: "#fff", fontSize: 10, letterSpacing: 2, opacity: 0.8 }}>{b.by.toUpperCase()} · {b.date.toUpperCase()}</T>
        <T w="reg" style={{ color: "#fff", fontSize: 20, marginTop: 2 }} numberOfLines={2}>{b.title}</T>
        {pl && <T style={{ color: "#fff", fontSize: 12, marginTop: 6 }}>{pl.n}</T>}
      </Glass>
    </Pressable>
  );
}

export function PostRow({ b }: { b: Post }) {
  const r = useRouter(); const { place } = useStore(); const pl = b.place ? place(b.place) : undefined; const t = useTheme();
  return (
    <Pressable onPress={() => r.push(`/post/${b.id}`)} style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: t.card, borderRadius: 20, padding: 8, paddingRight: 16, marginBottom: 8 }}>
      <View style={{ width: 60, height: 60, borderRadius: 14, overflow: "hidden" }}>
        {b.img[0] != null ? <Image source={img(b.img[0])} style={StyleSheet.absoluteFill} /> : <Scene t={pl?.t || "hike"} id={"pr" + b.id} />}
      </View>
      <View style={{ flex: 1 }}>
        <T w="med" style={{ fontSize: 15 }} numberOfLines={1}>{b.title}</T>
        {b.draft && <View style={{ flexDirection: "row" }}><Badge label="Entwurf" /></View>}
        <T style={{ fontSize: 13, color: t.mut }} numberOfLines={1}>{b.by}{pl ? " · " + pl.n : ""}</T>
      </View>
    </Pressable>
  );
}

export function Legend() {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 12 }}>
      {(["ok", "mid", "no"] as const).map(v => (
        <View key={v} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Dot v={v} /><T style={{ fontSize: 12, color: t.mut }}>{{ ok: "erlaubt", mid: "mit Einschränkung / auf Anfrage", no: "nicht erlaubt" }[v]}</T></View>
      ))}
    </View>
  );
}

export function TopBack({ onPress, light }: { onPress: () => void; light?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: light ? "rgba(25,25,18,0.35)" : "rgba(0,0,0,0.06)" }}>
      <Icon name="back" size={22} color={light ? "#fff" : "#121210"} />
    </Pressable>
  );
}
