import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AvatarPicker } from "../src/components/AvatarPicker";
import { Scene } from "../src/components/Scene";
import { Avatar, Btn, T } from "../src/components/ui";
import { AGE, CATS, ICAT, SIZE } from "../src/data";
import type { Cat, Profile } from "../src/data/types";
import { useStore } from "../src/store";
import { F, useTheme } from "../src/theme";

type Draft = { owner: string; dog: string; size?: Profile["size"]; carry?: Profile["carry"]; age?: Profile["age"]; int: Cat[]; avatar: string; photo?: string };

export default function Onboarding() {
  const t = useTheme(); const r = useRouter(); const { set } = useStore(); const { width } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>({ owner: "", dog: "", int: [], avatar: "samojede" });
  const up = (p: Partial<Draft>) => setD(x => ({ ...x, ...p }));
  const dog = d.dog.trim() || "dein Hund";
  const done = [d.owner.trim() && d.dog.trim(), d.size, d.carry, d.int.length, d.age][step];
  const finish = (p: Profile) => { set(() => ({ profile: p })); r.replace("/(tabs)"); };
  const Opt = ({ on, title, sub, onPress }: { on: boolean; title: string; sub?: string; onPress: () => void }) => (
    <Pressable onPress={onPress} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 60, borderRadius: 18, paddingHorizontal: 20, marginBottom: 10, borderWidth: 1, borderColor: on ? t.ink : t.line, backgroundColor: on ? t.ink : t.card }}>
      <T w="med" style={{ color: on ? t.bg : t.ink }}>{title}</T>{sub && <T style={{ fontSize: 13, color: t.mut }}>{sub}</T>}
    </Pressable>
  );
  const input = { borderWidth: 1, borderColor: t.line, backgroundColor: t.card, borderRadius: 16, paddingHorizontal: 16, height: 52, fontSize: 16, fontFamily: F.reg, color: t.ink } as const;
  const H = ({ title, sub }: { title: string; sub: string }) => <><T style={{ fontSize: 30, lineHeight: 34 }}>{title}</T><T style={{ color: t.mut, marginTop: 8, marginBottom: 22, fontSize: 15 }}>{sub}</T></>;
  const tileW = (width - 48 - 10) / 2;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 34 }}>{[0, 1, 2, 3, 4].map(i => <View key={i} style={{ flex: 1, height: 2, borderRadius: 2, backgroundColor: i <= step ? t.ink : t.line }} />)}</View>
          {step === 0 && <>
            <H title="Wer seid ihr zwei?" sub="Damit wir euch richtig begrüßen können." />
            <T style={{ fontSize: 13, color: t.mut, marginBottom: 6 }}>Dein Name</T>
            <TextInput style={input} value={d.owner} onChangeText={v => up({ owner: v })} placeholder="z. B. Alicia" placeholderTextColor={t.mut} autoComplete="given-name" />
            <T style={{ fontSize: 13, color: t.mut, marginTop: 16, marginBottom: 6 }}>Name deines Hundes</T>
            <TextInput style={input} value={d.dog} onChangeText={v => up({ dog: v })} placeholder="z. B. Nuki" placeholderTextColor={t.mut} />
            <T style={{ fontSize: 13, color: t.mut, marginTop: 16, marginBottom: 6 }}>Profilbild – eigenes Foto oder Rasse wählen</T>
            <AvatarPicker value={d} onChange={up} />
          </>}
          {step === 1 && <><H title={`Wie groß ist ${dog}?`} sub="Viele Orte erlauben nur bestimmte Größen." />
            {(Object.keys(SIZE) as Profile["size"][]).map(k => <Opt key={k} on={d.size === k} title={SIZE[k][0]} sub={SIZE[k][1]} onPress={() => up({ size: k })} />)}</>}
          {step === 2 && <><H title={`Kannst du ${dog} tragen?`} sub="Auf dem Arm oder in einer Tasche – manche Orte lassen nur so Hunde rein." />
            <Opt on={d.carry === "Y"} title="Ja, entspannt" sub="Arm oder Tasche" onPress={() => up({ carry: "Y" })} />
            <Opt on={d.carry === "N"} title="Nein" sub="zu groß oder mag es nicht" onPress={() => up({ carry: "N" })} /></>}
          {step === 3 && <><H title="Was interessiert euch am meisten?" sub="Wähle so viele, wie du magst." />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {ICAT.map((k, i) => {
                const on = d.int.includes(k);
                return (
                  <Pressable key={k} onPress={() => up({ int: on ? d.int.filter(x => x !== k) : [...d.int, k] })} style={{ width: tileW, height: i % 3 === 1 ? tileW : tileW * 1.25, borderRadius: 22, overflow: "hidden", borderWidth: on ? 2 : 0, borderColor: t.ink }}>
                    <Scene t={k} id={"t" + k} />
                    <T w="reg" style={{ position: "absolute", left: 14, bottom: 12, color: "#fff", fontSize: 15 }}>{CATS[k]}</T>
                    {on && <View style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}><T style={{ color: "#121210" }}>✓</T></View>}
                  </Pressable>
                );
              })}
            </View></>}
          {step === 4 && <><H title={`Wie alt ist ${dog}?`} sub="Für Welpen und Senioren gelten oft eigene Regeln." />
            {(Object.keys(AGE) as Profile["age"][]).map(k => <Opt key={k} on={d.age === k} title={AGE[k][0]} sub={AGE[k][1]} onPress={() => up({ age: k })} />)}</>}
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 24 }}>
            <Pressable hitSlop={10} onPress={() => step ? setStep(step - 1) : finish({ owner: "Alicia", dog: "Nuki", size: "L", carry: "N", age: "A", int: ["huette", "hike", "cafe"], avatar: "samojede" })}>
              <T style={{ color: t.mut }}>{step ? "Zurück" : "Überspringen"}</T>
            </Pressable>
            <Btn label={step === 4 ? "Fertig" : "Weiter"} style={{ opacity: done ? 1 : 0.25 }} onPress={() => {
              if (!done) return;
              if (step < 4) setStep(step + 1);
              else finish({ owner: d.owner.trim(), dog: d.dog.trim(), size: d.size!, carry: d.carry!, age: d.age!, int: d.int, avatar: d.avatar, photo: d.photo });
            }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
