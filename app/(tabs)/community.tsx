import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { Avatar, Btn, Card, meta, PlaceRow, PostCard, PostRow, Screen, Sec, T } from "../../src/components/ui";
import { useStore } from "../../src/store";
import { useTheme } from "../../src/theme";

export default function Community() {
  const t = useTheme(); const r = useRouter(); const { width } = useWindowDimensions();
  const { allPosts, allPlaces, isPending, confirms, community, set } = useStore();
  const [tab, setTab] = useState<"blog" | "orte">("blog");
  const pend = allPlaces.filter(p => p.need && isPending(p));
  return (
    <Screen>
      <T style={{ fontSize: 30, marginBottom: 12 }}>Community</T>
      <View style={{ flexDirection: "row", backgroundColor: t.soft, borderRadius: 999, padding: 4 }}>
        {([["blog", "Berichte"], ["orte", "Orte melden & prüfen"]] as const).map(([k, l]) => (
          <Pressable key={k} onPress={() => setTab(k)} style={{ flex: 1, height: 42, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: tab === k ? t.card : "transparent" }}>
            <T style={{ fontSize: 14, color: tab === k ? t.ink : t.mut }}>{l}</T>
          </Pressable>
        ))}
      </View>
      {tab === "blog" ? <>
        <Btn icon="plus" label="Bericht schreiben" onPress={() => r.push("/post/edit")} style={{ marginTop: 16 }} />
        <Sec title="Neueste Berichte" action={String(allPosts.length)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -18 }} contentContainerStyle={{ paddingHorizontal: 18, gap: 14 }}>
          {allPosts.map(b => <PostCard key={b.id} b={b} width={width * 0.7} />)}
        </ScrollView>
        <View style={{ marginTop: 12 }}>{allPosts.map(b => <PostRow key={b.id} b={b} />)}</View>
      </> : <>
        <T style={{ color: t.mut, marginVertical: 16, fontSize: 15 }}>Neue Orte kommen von Hundebesitzern wie euch. Ab 5 Bestätigungen gilt ein Ort als geprüft.</T>
        <Btn icon="plus" label="Neuen Ort melden" onPress={() => r.push("/add-place")} />
        <Sec title="Hilf mit beim Prüfen" action={`${pend.length} offen`} />
        {pend.length ? pend.map(p => {
          const have = (p.have || 0) + (confirms[p.id] ? 1 : 0);
          return (
            <Card key={p.id} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 10 }}>
                <Avatar breed={p.byAvatar || "mix"} size={40} />
                <View style={{ flex: 1 }}><T w="med">{p.n}</T><T style={{ fontSize: 13, color: t.mut }}>{meta(p)} · gemeldet von {p.by} {p.ago || ""}</T></View>
              </View>
              <View style={{ height: 4, borderRadius: 4, backgroundColor: t.line, overflow: "hidden" }}><View style={{ width: `${(have / (p.need || 5)) * 100}%`, height: 4, backgroundColor: t.ink }} /></View>
              <T style={{ fontSize: 12, color: t.mut, marginTop: 4, marginBottom: 10 }}>{have} von {p.need} Bestätigungen</T>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {confirms[p.id] ? <T style={{ fontStyle: "italic" }}>Danke fürs Bestätigen!</T> : <Btn small ghost label="Ich war da – stimmt" onPress={() => set(s => ({ confirms: { ...s.confirms, [p.id]: true } }))} />}
                <Btn small ghost label="Ansehen" onPress={() => r.push(`/place/${p.id}`)} />
              </View>
            </Card>
          );
        }) : <T style={{ color: t.mut }}>Alles geprüft – danke!</T>}
        <Sec title="Von dir gemeldet" />
        {community.length ? community.map(p => <PlaceRow key={p.id} p={p} />) : <T style={{ fontSize: 13, color: t.mut }}>Noch keine Orte gemeldet.</T>}
      </>}
    </Screen>
  );
}
