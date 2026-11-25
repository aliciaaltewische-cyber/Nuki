import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { Avatar, BigCard, Btn, Card, Legend, PlaceRow, PostCard, Pill, Pills, Screen, Sec, T } from "../../src/components/ui";
import { CATS, EVENTS, ICAT } from "../../src/data";
import type { Cat } from "../../src/data/types";
import { kmFromMunich, verdict } from "../../src/lib/rules";
import { useStore } from "../../src/store";
import { useTheme } from "../../src/theme";

export default function Home() {
  const t = useTheme(); const r = useRouter(); const { width } = useWindowDimensions();
  const { profile, allPlaces, allPosts, isPending } = useStore();
  const P = profile!;
  const [cat, setCat] = useState<Cat | "all">("all");
  const mine = P.int.length ? P.int : ICAT;
  const all = allPlaces.filter(p => !isPending(p) && (cat === "all" || p.t === cat));
  const rank = (p: typeof all[0]) => ({ ok: 0, mid: 1, no: 2 })[verdict(p, P)];
  const km = (p: typeof all[0]) => kmFromMunich(p.lat, p.lon) ?? 9999;
  const picks = all.filter(p => (cat !== "all" || mine.includes(p.t)) && verdict(p, P) !== "no" && !p.closed).sort((a, b) => rank(a) - rank(b) || km(a) - km(b)).slice(0, 8);
  const near = [...all].sort((a, b) => km(a) - km(b)).slice(0, 8);
  const order: (Cat | "all")[] = ["all", ...mine, ...ICAT.filter(k => !mine.includes(k))];
  const ev = EVENTS[0];
  const cw = width * 0.8;
  return (
    <Screen>
      <Image source={require("../../assets/logo-blue.png")} style={{ width: 118, height: 56, marginBottom: 12, marginLeft: -4 }} resizeMode="contain" />
      <Pressable onPress={() => r.push("/profile")} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Avatar photo={P.photo} breed={P.avatar} letter={P.dog[0]} />
        <View><T style={{ fontSize: 26 }}>Hallo {P.owner}</T><T style={{ color: t.mut, fontStyle: "italic", fontSize: 17 }}>& hallo {P.dog}</T></View>
      </Pressable>
      <Pills>{order.map(k => <Pill key={k} label={CATS[k]} on={cat === k} onPress={() => setCat(k)} />)}</Pills>
      {picks.length > 0 && <>
        <Sec title={`Ausgewählt für ${P.dog}`} action={`${all.length} Orte`} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={cw + 14} decelerationRate="fast" style={{ marginHorizontal: -18 }} contentContainerStyle={{ paddingHorizontal: 18, gap: 14 }}>
          {picks.map(p => <BigCard key={p.id} p={p} width={cw} />)}
        </ScrollView>
      </>}
      <Sec title="Berichte" action="Alle Berichte" onAction={() => r.push("/community")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -18 }} contentContainerStyle={{ paddingHorizontal: 18, gap: 14 }}>
        {allPosts.slice(0, 4).map(b => <PostCard key={b.id} b={b} width={width * 0.62} />)}
      </ScrollView>
      <Sec title="Nächstes Event" action="Alle Events" onAction={() => r.push("/events")} />
      <Pressable onPress={() => r.push("/events")}><Card style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
        <View style={{ backgroundColor: t.soft, borderRadius: 14, width: 56, paddingVertical: 8, alignItems: "center" }}><T w="med" style={{ fontSize: 20 }}>{ev.d}</T><T style={{ fontSize: 12 }}>{ev.m}</T></View>
        <View style={{ flex: 1 }}><T w="med">{ev.n}</T><T style={{ color: t.mut, fontSize: 13 }}>{ev.w}</T></View>
      </Card></Pressable>
      <Sec title="Am nächsten an München" action="Auf der Karte" onAction={() => r.push("/map")} />
      <Legend />
      {near.map(p => <PlaceRow key={p.id} p={p} />)}
      <Btn ghost label={`Alle ${all.length} Orte auf der Karte`} onPress={() => r.push("/map")} style={{ marginTop: 6 }} />
      <T style={{ fontSize: 12, color: t.mut, marginTop: 12 }}>Hütten aus der Liste „Berghütten mit Hund“. Cafés, Restaurants und der See sind Beispiele.</T>
    </Screen>
  );
}
