import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../../src/components/Icon";
import { Btn, Chip, T } from "../../src/components/ui";
import { img, type Post, type PostImage } from "../../src/data/types";
import { useStore } from "../../src/store";
import { F, useTheme } from "../../src/theme";

export default function EditPost() {
  const { id, place: placeParam } = useLocalSearchParams<{ id?: string; place?: string }>();
  const t = useTheme(); const r = useRouter(); const { allPosts, allPlaces, place, profile, set } = useStore(); const P = profile!;
  const orig = id ? allPosts.find(x => x.id === Number(id)) : undefined;
  const fresh = orig?.builtin && orig.draft; // Platzhaltertext nicht übernehmen
  const [title, setTitle] = useState(orig?.title || "");
  const [text, setText] = useState(fresh ? "" : orig?.text || "");
  const [pl, setPl] = useState<number | null>(orig?.place ?? (placeParam ? Number(placeParam) : null));
  const [pics, setPics] = useState<PostImage[]>(orig?.img || []);
  const [paws, setPaws] = useState(orig?.paws || 0);
  const [pick, setPick] = useState(false); const [q, setQ] = useState("");
  const input = { borderWidth: 1, borderColor: t.line, backgroundColor: t.card, borderRadius: 16, paddingHorizontal: 16, fontSize: 16, fontFamily: F.reg, color: t.ink } as const;
  const addPics = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, quality: 0.7 });
    if (!res.canceled) setPics(p => [...p, ...res.assets.map(a => a.uri)]);
  };
  const save = (draft: boolean) => {
    if (!title.trim()) return Alert.alert("Titel fehlt", "Bitte gib deinem Bericht einen Titel.");
    const b: Post = { id: orig?.id || Date.now(), place: pl, title: title.trim(), text: text.trim(), img: pics, paws, draft, by: `${P.owner} & ${P.dog}`, av: P.avatar, photoBy: P.photo, builtin: orig?.builtin,
      date: new Date().toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" }) };
    set(s => ({ posts: [...s.posts.filter(x => x.id !== b.id), b] }));
    r.back();
  };
  const L = (s: string) => <T style={{ fontSize: 13, color: t.mut, marginTop: 16, marginBottom: 6 }}>{s}</T>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <T style={{ fontSize: 24 }}>{orig ? "Bericht bearbeiten" : "Neuer Bericht"}</T>
            <Pressable onPress={() => r.back()} hitSlop={10}><Icon name="x" color={t.ink} /></Pressable>
          </View>
          <T style={{ color: t.mut, fontSize: 14 }}>Erzähl anderen Hundebesitzern, wie es wirklich war.</T>
          {L("Titel")}<TextInput style={[input, { height: 52 }]} value={title} onChangeText={setTitle} placeholder="z. B. Zur Kenzenhütte mit Nuki" placeholderTextColor={t.mut} />
          {L("Ort")}
          <Pressable onPress={() => setPick(true)} style={[input, { height: 52, justifyContent: "center" }]}><T style={{ color: pl ? t.ink : t.mut }}>{pl ? place(pl)?.n : "Ort auswählen (optional)"}</T></Pressable>
          {L("Fotos")}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {pics.map((u, i) => (
              <View key={i} style={{ width: 84, height: 84, borderRadius: 18, overflow: "hidden" }}>
                <Image source={img(u)} style={{ width: 84, height: 84 }} />
                <Pressable onPress={() => setPics(p => p.filter((_, j) => j !== i))} style={{ position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" }}><Icon name="x" size={12} color="#121210" /></Pressable>
              </View>
            ))}
            <Pressable onPress={addPics} style={{ width: 84, height: 84, borderRadius: 18, borderWidth: 1, borderColor: t.line, backgroundColor: t.card, alignItems: "center", justifyContent: "center" }}><Icon name="plus" color={t.mut} /><T style={{ fontSize: 12, color: t.mut }}>Foto</T></Pressable>
          </ScrollView>
          {L("Dein Bericht")}
          <TextInput style={[input, { minHeight: 240, paddingTop: 14, textAlignVertical: "top", lineHeight: 24 }]} multiline value={text} onChangeText={setText}
            placeholder={fresh ? orig!.text : "Wie war der Weg, wo durfte dein Hund hin, eure Tipps …"} placeholderTextColor={t.mut} />
          {L("Wie hundefreundlich war's?")}
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>{[1, 2, 3, 4, 5].map(n => <Chip key={n} label={`${n} 🐾`} on={paws === n} onPress={() => setPaws(n)} />)}</View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 28 }}>
            <Pressable onPress={() => save(true)}><T style={{ textDecorationLine: "underline" }}>Als Entwurf speichern</T></Pressable>
            <Btn label="Veröffentlichen" onPress={() => save(false)} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal visible={pick} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPick(false)}>
        <View style={{ flex: 1, backgroundColor: t.bg, padding: 20 }}>
          <TextInput style={[input, { height: 50, marginBottom: 12 }]} value={q} onChangeText={setQ} placeholder="Ort suchen" placeholderTextColor={t.mut} autoFocus />
          <ScrollView keyboardShouldPersistTaps="handled">
            <Pressable onPress={() => { setPl(null); setPick(false); }} style={{ paddingVertical: 14 }}><T style={{ color: t.mut }}>– ohne Ort –</T></Pressable>
            {allPlaces.filter(p => p.n.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.n.localeCompare(b.n, "de")).map(p => (
              <Pressable key={p.id} onPress={() => { setPl(p.id); setPick(false); }} style={{ paddingVertical: 14, borderBottomWidth: 1, borderColor: t.line }}>
                <T w={pl === p.id ? "med" : "light"}>{p.n}</T><T style={{ fontSize: 12, color: t.mut }}>{p.a}</T>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
