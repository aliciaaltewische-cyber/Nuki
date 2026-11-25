import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, View } from "react-native";
import { AvatarPicker } from "../../src/components/AvatarPicker";
import { BREEDS } from "../../src/components/DogSticker";
import { Icon } from "../../src/components/Icon";
import { Avatar, Chip, Pill, PlaceRow, Screen, Sec, T } from "../../src/components/ui";
import { AGE, CATS, ICAT, SIZE } from "../../src/data";
import type { Profile } from "../../src/data/types";
import { useStore } from "../../src/store";
import { useTheme } from "../../src/theme";

export default function ProfileScreen() {
  const t = useTheme(); const r = useRouter(); const { profile, set, saved, allPlaces } = useStore(); const P = profile!;
  const up = (p: Partial<Profile>) => set(s => ({ profile: { ...s.profile!, ...p } }));
  const sv = allPlaces.filter(p => saved.includes(p.id));
  const Item = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <Pressable onPress={onPress} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18, borderBottomWidth: 1, borderColor: t.line }}>
      <T>{label}</T><Icon name="chev" size={18} color={t.mut} />
    </Pressable>
  );
  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Avatar photo={P.photo} breed={P.avatar} letter={P.dog[0]} size={72} />
        <View><T style={{ fontSize: 26 }}>{P.dog}</T><T style={{ color: t.mut, fontStyle: "italic" }}>mit {P.owner} · {SIZE[P.size][0]}{!P.photo && BREEDS[P.avatar] ? " · " + BREEDS[P.avatar][0] : ""}</T></View>
      </View>
      <Sec title="Profilbild" />
      <AvatarPicker value={P} onChange={v => up(v)} />
      <Sec title="Gemerkte Orte" action={String(sv.length)} />
      {sv.length ? sv.map(p => <PlaceRow key={p.id} p={p} />) : <T style={{ fontSize: 13, color: t.mut }}>Tipp auf das Herz bei einem Ort.</T>}
      <Sec title="Interessen" />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{ICAT.map(k => <Pill key={k} label={CATS[k]} on={P.int.includes(k)} onPress={() => up({ int: P.int.includes(k) ? P.int.filter(x => x !== k) : [...P.int, k] })} />)}</View>
      <Sec title="Größe" />
      <View style={{ flexDirection: "row", gap: 8 }}>{(Object.keys(SIZE) as Profile["size"][]).map(k => <Chip key={k} label={SIZE[k][0]} on={P.size === k} onPress={() => up({ size: k })} />)}</View>
      <Sec title="Tragbar" />
      <View style={{ flexDirection: "row", gap: 8 }}><Chip label="Ja" on={P.carry === "Y"} onPress={() => up({ carry: "Y" })} /><Chip label="Nein" on={P.carry === "N"} onPress={() => up({ carry: "N" })} /></View>
      <Sec title="Alter" />
      <View style={{ flexDirection: "row", gap: 8 }}>{(Object.keys(AGE) as Profile["age"][]).map(k => <Chip key={k} label={AGE[k][0]} on={P.age === k} onPress={() => up({ age: k })} />)}</View>
      <Sec title="Rechtliches" />
      <View style={{ backgroundColor: t.card, borderRadius: 20, overflow: "hidden" }}>
        <Item label="Impressum" onPress={() => r.push("/legal/impressum")} />
        <Item label="Datenschutz" onPress={() => r.push("/legal/datenschutz")} />
        <Item label="Onboarding neu starten" onPress={() => { r.replace("/welcome"); setTimeout(() => set(() => ({ profile: null })), 400); }} />
      </View>
      <Image source={require("../../assets/logo-blue.png")} style={{ width: 100, height: 48, alignSelf: "center", marginTop: 28, opacity: 0.85 }} resizeMode="contain" />
      <T style={{ fontSize: 12, color: t.mut, textAlign: "center" }}>Version 0.1</T>
    </Screen>
  );
}
