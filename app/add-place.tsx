import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../src/components/Icon";
import { Btn, Chip, T } from "../src/components/ui";
import { AREAS, CATS, ICAT, MAP_REGIONS, RT, RULE_CODES } from "../src/data";
import type { Cat, Code, Rule } from "../src/data/types";
import { useStore } from "../src/store";
import { F, useTheme } from "../src/theme";

const regionOf = (lat: number, lon: number) =>
  lat > 48.0 && lon > 11.3 && lon < 11.85 ? "muc" : lat > 47.55 && lon < 13.0 ? "de" : lon < 9.6 ? "ch" : lat < 46.95 && lon > 10.5 ? "it" : "at";

export default function AddPlace() {
  const t = useTheme(); const r = useRouter(); const { profile, set } = useStore(); const P = profile!;
  const [n, setN] = useState(""); const [a, setA] = useState(""); const [cat, setCat] = useState<Cat>("huette");
  const [pos, setPos] = useState<{ latitude: number; longitude: number } | null>(null);
  const [rules, setRules] = useState<Rule[]>([["Terrasse", "Y"]]);
  const [web, setWeb] = useState(""); const [photo, setPhoto] = useState<string | undefined>();
  const input = { borderWidth: 1, borderColor: t.line, backgroundColor: t.card, borderRadius: 16, paddingHorizontal: 16, height: 52, fontSize: 16, fontFamily: F.reg, color: t.ink } as const;
  const L = (s: string) => <T style={{ fontSize: 13, color: t.mut, marginTop: 18, marginBottom: 6 }}>{s}</T>;
  const setRule = (i: number, k: 0 | 1, v: string) => setRules(rs => rs.map((x, j) => (j === i ? (k === 0 ? [v, x[1], x[2]] : [x[0], v as Code, x[2]]) : x)) as Rule[]);
  const submit = () => {
    if (!n.trim() || !a.trim()) return Alert.alert("Fast geschafft", "Bitte Name und Gegend angeben.");
    if (!pos) return Alert.alert("Wo ist der Ort?", "Bitte tippe auf die Karte, um den Ort zu markieren.");
    const id = Date.now();
    set(s => ({
      community: [...s.community, { id, n: n.trim(), t: cat, a: a.trim(), reg: regionOf(pos.latitude, pos.longitude), lat: pos.latitude, lon: pos.longitude, r: rules, web: /^https?:\/\//.test(web.trim()) ? web.trim() : undefined, by: `${P.owner} & ${P.dog}`, byAvatar: P.avatar, ago: "gerade eben", need: 5, have: 0 }],
      photos: photo ? { ...s.photos, [id]: photo } : s.photos,
    }));
    Alert.alert("Danke!", "Der Ort wird jetzt von der Community geprüft.");
    r.back();
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <T style={{ fontSize: 24 }}>Neuen Ort melden</T>
            <Pressable onPress={() => r.back()} hitSlop={10}><Icon name="x" color={t.ink} /></Pressable>
          </View>
          <T style={{ color: t.mut, fontSize: 14 }}>Nur Orte, die ihr selbst mit Hund besucht habt.</T>
          {L("Name des Ortes")}<TextInput style={input} value={n} onChangeText={setN} placeholder="z. B. Hütte am Sonnenhang" placeholderTextColor={t.mut} />
          {L("Kategorie")}<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{ICAT.map(k => <Chip key={k} label={CATS[k]} on={cat === k} onPress={() => setCat(k)} />)}</View>
          {L("Ort / Gegend")}<TextInput style={input} value={a} onChangeText={setA} placeholder="z. B. Spitzingsee" placeholderTextColor={t.mut} />
          {L("Wo genau? Tippe auf die Karte")}
          <View style={{ height: 240, borderRadius: 18, overflow: "hidden" }}>
            <MapView style={{ flex: 1 }} initialRegion={MAP_REGIONS[0].r} onPress={e => setPos(e.nativeEvent.coordinate)}>
              {pos && <Marker coordinate={pos} />}
            </MapView>
          </View>
          {L("Regeln für Hunde pro Bereich")}
          {rules.map((rl, i) => (
            <View key={i} style={{ backgroundColor: t.card, borderRadius: 16, padding: 12, marginBottom: 8 }}>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TextInput style={[input, { flex: 1, height: 44 }]} value={rl[0]} onChangeText={v => setRule(i, 0, v)} placeholder="Bereich" placeholderTextColor={t.mut} />
                <Pressable onPress={() => setRules(rs => rs.filter((_, j) => j !== i))} hitSlop={8}><Icon name="x" size={18} color={t.mut} /></Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
                {RULE_CODES.map(c => <Chip key={c} label={RT[c]} on={rl[1] === c} onPress={() => setRule(i, 1, c)} />)}
              </ScrollView>
            </View>
          ))}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {AREAS.map(x => <Chip key={x} label={`+ ${x}`} onPress={() => setRules(rs => [...rs, [x, "Y"]])} />)}
          </ScrollView>
          {L("Website (optional)")}<TextInput style={input} value={web} onChangeText={setWeb} placeholder="https://" placeholderTextColor={t.mut} autoCapitalize="none" keyboardType="url" />
          {L("Foto (optional)")}
          <Pressable onPress={async () => { const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 }); if (!res.canceled) setPhoto(res.assets[0].uri); }}
            style={{ height: photo ? 160 : 52, borderRadius: 16, borderWidth: 1, borderColor: t.line, backgroundColor: t.card, alignItems: "center", justifyContent: "center", overflow: "hidden", flexDirection: "row", gap: 8 }}>
            {photo ? <Image source={{ uri: photo }} style={{ width: "100%", height: "100%" }} /> : <><Icon name="cam" size={18} color={t.ink} /><T>Foto hochladen</T></>}
          </Pressable>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 28 }}>
            <Pressable onPress={() => r.back()}><T style={{ textDecorationLine: "underline" }}>Abbrechen</T></Pressable>
            <Btn label="Ort einreichen" onPress={submit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
