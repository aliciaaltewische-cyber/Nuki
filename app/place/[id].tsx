import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Linking, Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../../src/components/Icon";
import { Btn, Card, Dot, HeartBtn, PostRow, Sec, T, TopBack, Visual } from "../../src/components/ui";
import { CATS, RT } from "../../src/data";
import { kmFromMunich, mapsUrl, ok, verdict } from "../../src/lib/rules";
import { useStore } from "../../src/store";
import { useTheme } from "../../src/theme";

export default function PlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme(); const r = useRouter(); const ins = useSafeAreaInsets(); const { height } = useWindowDimensions();
  const { place, profile, isPending, allPosts, votes, set, saved, toggle, photos } = useStore();
  const p = place(Number(id)); const P = profile!;
  if (!p) return <View style={{ flex: 1, backgroundColor: t.bg, padding: 40 }}><T>Ort nicht gefunden.</T></View>;
  const v = verdict(p, P); const km = kmFromMunich(p.lat, p.lon); const vote = votes[p.id]; const on = saved.includes(p.id);
  const addPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!res.canceled) set(s => ({ photos: { ...s.photos, [p.id]: res.assets[0].uri } }));
  };
  const posts = allPosts.filter(b => b.place === p.id);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={{ height: height * 0.5, minHeight: 320 }}>
        <Visual place={p} id={"d" + p.id} />
        <View style={{ position: "absolute", top: ins.top + 8, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <TopBack light onPress={() => r.back()} />
          <View style={{ backgroundColor: "rgba(25,25,18,0.35)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}><T style={{ color: "#fff", fontSize: 12 }}>{CATS[p.t]}{km != null ? ` · ${km} km von München` : ""}</T></View>
        </View>
        <Pressable onPress={addPhoto} style={{ position: "absolute", right: 16, bottom: 50, flexDirection: "row", gap: 6, alignItems: "center", backgroundColor: "rgba(25,25,18,0.4)", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}>
          <Icon name="cam" size={16} color="#fff" /><T style={{ color: "#fff", fontSize: 13 }}>Foto {photos[p.id] ? "ändern" : "hinzufügen"}</T>
        </Pressable>
      </View>
      <View style={{ backgroundColor: t.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -34, padding: 22 }}>
        <T w="reg" style={{ fontSize: 28, fontStyle: "italic" }}>{p.n}</T>
        <T style={{ color: t.mut, fontSize: 14 }}>{p.a}{p.by ? ` · gemeldet von ${p.by}` : ""}</T>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          {p.web ? <Btn small ghost icon="ext" label="Zur Website" onPress={() => Linking.openURL(p.web!)} /> : null}
          <Btn small ghost icon="route" label="In Google Maps öffnen" onPress={() => Linking.openURL(mapsUrl(p))} />
        </View>
        {p.lat == null && <T style={{ fontSize: 12, color: t.mut, marginTop: 8 }}>Pin auf der Karte folgt.</T>}
        {p.closed && <Card style={{ marginTop: 14 }}><T w="med">Laut Google Maps vorübergehend geschlossen</T></Card>}
        {isPending(p) && <Card style={{ marginTop: 14 }}><T w="med">Wird von der Community geprüft</T><T style={{ fontSize: 13, color: t.mut }}>Noch nicht bestätigt – Angaben können abweichen.</T></Card>}
        <Card style={{ marginTop: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><Dot v={v} size={10} /><T w="med" style={{ fontSize: 17 }}>{v === "ok" ? "Erlaubt" : v === "mid" ? "Mit Einschränkung" : "Nicht erlaubt"} für {P.dog}</T></View>
          <T style={{ color: t.mut, fontSize: 14, marginTop: 2 }}>{v === "ok" ? "Überall willkommen." : v === "mid" ? "Nicht überall oder nur nach Anmeldung – schau dir die Details an." : "Hier leider nicht. Schau dir Alternativen an."}</T>
        </Card>
        {p.r.map(([area, code, note], i) => {
          const o = ok(code, P); const c = o === 1 ? t.ok : o ? t.mid : t.no;
          return (
            <View key={i} style={{ flexDirection: "row", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderColor: t.line }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: c, alignItems: "center", justifyContent: "center", marginTop: 2 }}><T style={{ color: "#fff", fontSize: 11 }}>{o === 1 ? "✓" : o ? "!" : "✕"}</T></View>
              <View style={{ flex: 1 }}><T w="med">{area}</T><T style={{ fontSize: 13, color: t.mut }}>{RT[code]}{note ? ` · ${note}` : ""}</T></View>
            </View>
          );
        })}
        {p.note ? (
          <Card style={{ marginTop: 18 }}>
            <T w="med" style={{ marginBottom: 6 }}>Hinweis aus der Liste</T>
            <T style={{ fontStyle: "italic", fontSize: 17, lineHeight: 24 }}>„{p.note}“</T>
            <T style={{ fontSize: 12, color: t.mut, marginTop: 8 }}>Quelle: Liste „Berghütten mit Hund“ (Google Maps). Regeln können sich ändern – vor dem Besuch bei der Hütte bestätigen.</T>
          </Card>
        ) : p.src ? <T style={{ fontSize: 12, color: t.mut, marginTop: 12 }}>Quelle: Liste „Berghütten mit Hund“ (Google Maps). Regeln vor dem Besuch bei der Hütte bestätigen.</T> : null}
        <Sec title="Berichte" action="+ Bericht schreiben" onAction={() => r.push({ pathname: "/post/edit", params: { place: String(p.id) } })} />
        {posts.length ? posts.map(b => <PostRow key={b.id} b={b} />) : <T style={{ fontSize: 13, color: t.mut }}>Noch kein Bericht zu diesem Ort.</T>}
        <Card style={{ marginTop: 18 }}>
          <T w="med">Stimmt das noch?</T>
          <T style={{ fontSize: 13, color: t.mut, marginBottom: 12 }}>{p.chk ? `Zuletzt bestätigt vor ${p.chk[0]} Tagen von ${p.chk[1] + (vote === "y" ? 1 : 0)} Hundebesitzern` : "Warst du mit Hund dort? Hilf anderen mit einer Bestätigung."}</T>
          {vote ? <T style={{ fontStyle: "italic" }}>Danke, {P.owner}! {vote === "y" ? "Bestätigt." : "Wir prüfen das."}</T> : (
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Btn small ghost label="Ja, stimmt" onPress={() => set(s => ({ votes: { ...s.votes, [p.id]: "y" } }))} />
              <Btn small ghost label="Nein, hat sich geändert" onPress={() => set(s => ({ votes: { ...s.votes, [p.id]: "n" } }))} />
            </View>
          )}
        </Card>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: t.card, borderRadius: 999, borderWidth: 1, borderColor: t.line, padding: 8, paddingLeft: 24, marginTop: 18 }}>
          <View style={{ flex: 1 }}><T w="med" style={{ fontStyle: "italic", fontSize: 18 }}>{on ? "Gemerkt" : "Merken"}</T><T style={{ fontSize: 12, color: t.mut }}>für euren nächsten Ausflug</T></View>
          <Btn label={on ? "♥ Gespeichert" : "♡ Speichern"} onPress={() => toggle("saved", p.id)} />
        </View>
      </View>
    </ScrollView>
  );
}
