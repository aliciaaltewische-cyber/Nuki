import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Scene } from "../../src/components/Scene";
import { Avatar, Btn, PlaceRow, Sec, T, TopBack } from "../../src/components/ui";
import { img } from "../../src/data/types";
import { useStore } from "../../src/store";
import { useTheme } from "../../src/theme";

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme(); const r = useRouter(); const ins = useSafeAreaInsets(); const { height, width } = useWindowDimensions();
  const { allPosts, place, profile } = useStore();
  const b = allPosts.find(x => x.id === Number(id));
  if (!b) return <View style={{ flex: 1, backgroundColor: t.bg, padding: 40 }}><T>Bericht nicht gefunden.</T></View>;
  const pl = b.place ? place(b.place) : undefined;
  const mine = b.builtin || b.by === `${profile!.owner} & ${profile!.dog}`;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={{ height: height * 0.62 }}>
        {b.img[0] != null ? <Image source={img(b.img[0])} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <Scene t={pl?.t || "hike"} id={"ph" + b.id} />}
        <View style={{ position: "absolute", top: ins.top + 8, left: 16 }}><TopBack light onPress={() => r.back()} /></View>
      </View>
      <View style={{ backgroundColor: t.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -34, padding: 22 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Avatar photo={b.photoBy} breed={b.av || "mix"} size={40} />
          <View><T w="med">{b.by}</T><T style={{ fontSize: 12, color: t.mut }}>{b.date}{b.draft ? " · Entwurf" : ""}</T></View>
        </View>
        <T w="reg" style={{ fontSize: 28, fontStyle: "italic", marginTop: 16 }}>{b.title}</T>
        {b.paws > 0 && <T style={{ marginTop: 6 }}>{"🐾".repeat(b.paws)}  <T style={{ fontSize: 12, color: t.mut }}>Hundefreundlichkeit</T></T>}
        <View style={{ marginTop: 16 }}>{b.text.split(/\n\n+/).map((x, i) => <T key={i} style={{ fontSize: 17, lineHeight: 28, marginBottom: 14 }}>{x}</T>)}</View>
        {b.img.length > 1 && <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {b.img.slice(1).map((u, i) => <Image key={i} source={img(u)} style={{ width: (width - 52) / 2, aspectRatio: 1, borderRadius: 16 }} />)}
        </View>}
        {pl && <><Sec title="Der Ort" /><PlaceRow p={pl} /></>}
        {mine && <Btn label={b.draft ? "Weiter schreiben" : "Bericht bearbeiten"} onPress={() => r.push({ pathname: "/post/edit", params: { id: String(b.id) } })} style={{ marginTop: 14 }} />}
      </View>
    </ScrollView>
  );
}
