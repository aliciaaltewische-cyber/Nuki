import React, { useState } from "react";
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { Scene } from "../../src/components/Scene";
import { Btn, Glass, Pill, Pills, Screen, Sec, T } from "../../src/components/ui";
import { EVENTS } from "../../src/data";
import type { DogEvent } from "../../src/data/types";
import { useStore } from "../../src/store";
import { useTheme } from "../../src/theme";

export default function Events() {
  const t = useTheme(); const { width } = useWindowDimensions(); const { going, toggle, profile } = useStore();
  const [k, setK] = useState("Alle"); const [open, setOpen] = useState<DogEvent | null>(null);
  const month = new Date().getMonth() + 1;
  const L = EVENTS.filter(e => k === "Alle" || (k === "Diesen Monat" ? e.mo === month : e.k === k));
  const Badge = ({ e }: { e: DogEvent }) => (
    <View style={{ position: "absolute", top: 12, left: 12, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, alignItems: "center" }}>
      <T w="med" style={{ fontSize: 20, color: "#121210" }}>{e.d}</T><T style={{ fontSize: 11, color: "#121210" }}>{e.m}</T>
    </View>
  );
  return (
    <Screen>
      <T style={{ fontSize: 30 }}>Events</T>
      <T style={{ color: t.mut, fontSize: 15 }}>Gemeinsam unterwegs mit anderen Hunden.</T>
      <Pills>{["Alle", "Diesen Monat", "Treffen", "Wanderung", "Markt"].map(x => <Pill key={x} label={x} on={k === x} onPress={() => setK(x)} />)}</Pills>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -18, marginTop: 14 }} contentContainerStyle={{ paddingHorizontal: 18, gap: 14 }}>
        {L.map(e => (
          <Pressable key={e.id} onPress={() => setOpen(e)} style={{ width: width * 0.75, aspectRatio: 4 / 5, borderRadius: 28, overflow: "hidden" }}>
            <Scene t={e.t} id={"e" + e.id} /><Badge e={e} />
            <Glass style={{ position: "absolute", left: 10, right: 10, bottom: 10 }}>
              <T style={{ color: "#fff", fontSize: 10, letterSpacing: 2, opacity: 0.8 }}>{e.k.toUpperCase()} · {e.g + (going.includes(e.id) ? 1 : 0)} HUNDE DABEI</T>
              <T w="reg" style={{ color: "#fff", fontSize: 21 }}>{e.n}</T>
              <T style={{ color: "#fff", fontSize: 12, marginTop: 6 }}>{e.w}</T>
            </Glass>
          </Pressable>
        ))}
        {!L.length && <T style={{ color: t.mut }}>Keine Events in dieser Auswahl.</T>}
      </ScrollView>
      <Sec title="Alle Termine" />
      {L.map(e => (
        <Pressable key={e.id} onPress={() => setOpen(e)} style={{ flexDirection: "row", gap: 14, alignItems: "center", backgroundColor: t.card, borderRadius: 20, padding: 8, marginBottom: 8 }}>
          <View style={{ width: 60, height: 60, borderRadius: 14, overflow: "hidden" }}><Scene t={e.t} id={"er" + e.id} /></View>
          <View style={{ flex: 1 }}><T w="med" style={{ fontSize: 15 }}>{e.n}</T><T style={{ fontSize: 13, color: t.mut }}>{e.d}. {e.m} · {e.w}</T></View>
          <T style={{ fontSize: 12, color: t.mut, marginRight: 8 }}>{going.includes(e.id) ? "✓ dabei" : `${e.g} 🐾`}</T>
        </Pressable>
      ))}
      <T style={{ fontSize: 12, color: t.mut, marginTop: 8 }}>Beispiel-Events. Später legen Partner und Community Events an.</T>
      <Modal visible={!!open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(null)}>
        {open && <View style={{ flex: 1, backgroundColor: t.bg, padding: 20 }}>
          <View style={{ height: 220, borderRadius: 22, overflow: "hidden" }}><Scene t={open.t} id="em" /><Badge e={open} /></View>
          <T style={{ fontSize: 26, marginTop: 18 }}>{open.n}</T>
          <T style={{ color: t.mut, fontSize: 14 }}>{open.w} · {open.g + (going.includes(open.id) ? 1 : 0)} Hunde dabei</T>
          <T style={{ marginTop: 14, fontSize: 16, lineHeight: 24 }}>{open.x}</T>
          <View style={{ flex: 1 }} />
          <Btn label={going.includes(open.id) ? `✓ ${profile!.dog} ist dabei` : `Mit ${profile!.dog} teilnehmen`} onPress={() => toggle("going", open.id)} />
          <Btn ghost label="Schließen" onPress={() => setOpen(null)} style={{ marginTop: 10, marginBottom: 20 }} />
        </View>}
      </Modal>
    </Screen>
  );
}
