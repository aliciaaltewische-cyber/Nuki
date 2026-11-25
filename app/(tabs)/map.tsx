import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../../src/components/Icon";
import { Btn, Chip, Dot, meta, Pill, T, Visual } from "../../src/components/ui";
import { CATS, ICAT, MAP_REGIONS, REG } from "../../src/data";
import type { Cat, Place } from "../../src/data/types";
import { allowsFree, allowsIndoor, allowsStay, verdict, VTXT } from "../../src/lib/rules";
import { useStore } from "../../src/store";
import { F, useTheme } from "../../src/theme";

type Filter = { cats: Cat[]; reg: string[]; fit: boolean; indoor: boolean; stay: boolean; free: boolean };
const EMPTY: Filter = { cats: [], reg: [], fit: false, indoor: false, stay: false, free: false };

export default function MapScreen() {
  const t = useTheme(); const r = useRouter(); const { profile, allPlaces } = useStore(); const P = profile!;
  const map = useRef<MapView>(null);
  const [q, setQ] = useState(""); const [sel, setSel] = useState<number | null>(null);
  const [F_, setF] = useState<Filter>(EMPTY); const [draft, setDraft] = useState<Filter>(EMPTY); const [open, setOpen] = useState(false);
  const apply = (f: Filter) => allPlaces.filter(p =>
    (!f.cats.length || f.cats.includes(p.t)) && (!f.reg.length || f.reg.includes(p.reg)) && (!f.fit || verdict(p, P) === "ok") &&
    (!f.indoor || allowsIndoor(p, P)) && (!f.stay || allowsStay(p, P)) && (!f.free || allowsFree(p)) &&
    (!q || `${p.n} ${p.a} ${CATS[p.t]}`.toLowerCase().includes(q.toLowerCase())));
  const list = useMemo(() => apply(F_), [F_, q, allPlaces, P]);
  const pinned = list.filter(p => p.lat != null && p.lon != null);
  // Android braucht einen Moment, um eigene Marker-Ansichten zu zeichnen
  const [tracks, setTracks] = useState(true);
  useEffect(() => { setTracks(true); const x = setTimeout(() => setTracks(false), 900); return () => clearTimeout(x); }, [list, sel]);
  const selP = list.find(p => p.id === sel);
  const count = F_.cats.length + F_.reg.length + [F_.fit, F_.indoor, F_.stay, F_.free].filter(Boolean).length;
  const tog = (k: "cats" | "reg", v: string) => setDraft(d => ({ ...d, [k]: (d[k] as string[]).includes(v) ? (d[k] as string[]).filter(x => x !== v) : [...d[k], v] }));

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <MapView ref={map} style={StyleSheet.absoluteFill} initialRegion={MAP_REGIONS[0].r} onPress={() => setSel(null)} toolbarEnabled={false} showsPointsOfInterest={false}>
        {pinned.map(p => {
          const on = sel === p.id;
          return (
            <Marker key={p.id + (on ? "-on" : "")} coordinate={{ latitude: p.lat!, longitude: p.lon! }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={tracks}
              onPress={e => { e.stopPropagation(); setSel(p.id); }}>
              <View style={[st.mk, { backgroundColor: on ? t.ink : t.card, borderStyle: p.by ? "dashed" : "solid", borderColor: p.by ? t.mut : "transparent" }, on && st.mkOn]}>
                <Dot v={verdict(p, P)} size={on ? 10 : 11} />{on && <T w="med" style={{ fontSize: 12, color: t.bg }} numberOfLines={1}>{p.n}</T>}
              </View>
            </Marker>
          );
        })}
      </MapView>

      <SafeAreaView edges={["top"]} pointerEvents="box-none">
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingTop: 6 }}>
          <View style={[st.search, { backgroundColor: t.card, borderColor: t.line }]}>
            <Icon name="search" color={t.mut} />
            <TextInput value={q} onChangeText={setQ} placeholder={`Wohin geht's mit ${P.dog}?`} placeholderTextColor={t.mut} style={{ flex: 1, fontFamily: F.reg, fontSize: 16, color: t.ink, height: 50 }} />
          </View>
          <Pressable onPress={() => { setDraft(F_); setOpen(true); }} style={[st.round, { backgroundColor: t.card, borderColor: t.line }]}>
            <Icon name="filter" color={t.ink} />
            {count > 0 && <View style={[st.badge, { backgroundColor: t.ink }]}><T style={{ color: t.bg, fontSize: 11 }}>{count}</T></View>}
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 8, paddingTop: 10 }}>
          {(["all", ...ICAT] as const).map(k => <Pill key={k} label={CATS[k]} on={k === "all" ? !F_.cats.length : F_.cats.length === 1 && F_.cats[0] === k} onPress={() => setF(f => ({ ...f, cats: k === "all" ? [] : [k] }))} />)}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 6, paddingTop: 8 }}>
          {MAP_REGIONS.map(z => (
            <Pressable key={z.k} onPress={() => map.current?.animateToRegion(z.r, 600)} style={{ backgroundColor: t.card + "e6", borderRadius: 999, paddingHorizontal: 12, height: 32, justifyContent: "center" }}>
              <T style={{ fontSize: 12 }}>{z.l}</T>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>

      <View style={{ position: "absolute", left: 12, right: 12, bottom: 100 }} pointerEvents="box-none">
        {selP ? (
          <Pressable onPress={() => r.push(`/place/${selP.id}`)} style={[st.card, { backgroundColor: t.card }]}>
            <View style={{ width: 84, height: 84, borderRadius: 16, overflow: "hidden" }}><Visual place={selP} id={"m" + selP.id} /></View>
            <View style={{ flex: 1 }}>
              <T w="med" numberOfLines={1}>{selP.n}</T>
              <T style={{ fontSize: 13, color: t.mut }} numberOfLines={1}>{meta(selP)}</T>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}><Dot v={verdict(selP, P)} /><T style={{ fontSize: 13 }}>{VTXT[verdict(selP, P)]} für {P.dog}</T></View>
            </View>
            <Pressable onPress={() => setSel(null)} hitSlop={10} style={[st.x, { backgroundColor: t.soft }]}><Icon name="x" size={16} color={t.ink} /></Pressable>
          </Pressable>
        ) : (
          <View style={{ alignSelf: "center", backgroundColor: t.card, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 }}>
            <T style={{ fontSize: 12, color: t.mut }}>{list.length} Orte{list.length > pinned.length ? ` · ${list.length - pinned.length} ohne Pin` : ""}</T>
          </View>
        )}
      </View>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: t.bg }}>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
            <T style={{ fontSize: 24, marginBottom: 6 }}>Filter</T>
            <Group title={`Für ${P.dog}`}><Toggle label={`Nur Orte, die für ${P.dog} komplett erlaubt sind`} sub="nach Größe, Alter und Tragbarkeit" v={draft.fit} on={v => setDraft(d => ({ ...d, fit: v }))} /></Group>
            <Group title="Kategorie"><View style={st.wrap}>{ICAT.map(k => <Chip key={k} label={CATS[k]} on={draft.cats.includes(k)} onPress={() => tog("cats", k)} />)}</View></Group>
            <Group title="Was muss gehen?">
              <Toggle label="Hund drinnen erlaubt" sub="Gaststube, Innenraum, Zimmer" v={draft.indoor} on={v => setDraft(d => ({ ...d, indoor: v }))} />
              <Toggle label="Übernachten mit Hund" sub="Hütten und Hotels" v={draft.stay} on={v => setDraft(d => ({ ...d, stay: v }))} />
              <Toggle label="Freilauf möglich" sub="Strände, Kiesbänke, Wiesen" v={draft.free} on={v => setDraft(d => ({ ...d, free: v }))} />
            </Group>
            <Group title="Region"><View style={st.wrap}>{Object.entries(REG).map(([k, v]) => <Chip key={k} label={v} on={draft.reg.includes(k)} onPress={() => tog("reg", k)} />)}</View></Group>
          </ScrollView>
          <View style={[st.foot, { backgroundColor: t.bg, borderColor: t.line }]}>
            <Pressable onPress={() => setDraft(EMPTY)}><T style={{ textDecorationLine: "underline" }}>Alles löschen</T></Pressable>
            <Btn label={`${apply(draft).length} Orte anzeigen`} onPress={() => { setF(draft); setSel(null); setOpen(false); }} />
          </View>
        </View>
      </Modal>
    </View>
  );
  function Group({ title, children }: { title: string; children: React.ReactNode }) {
    return <View style={{ borderBottomWidth: 1, borderColor: t.line, paddingVertical: 16 }}><T w="med" style={{ marginBottom: 10 }}>{title}</T>{children}</View>;
  }
  function Toggle({ label, sub, v, on }: { label: string; sub: string; v: boolean; on: (v: boolean) => void }) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 }}>
        <View style={{ flex: 1 }}><T>{label}</T><T style={{ fontSize: 13, color: t.mut }}>{sub}</T></View>
        <Switch value={v} onValueChange={on} trackColor={{ true: t.ink, false: t.line }} />
      </View>
    );
  }
}
const st = StyleSheet.create({
  mk: { height: 26, minWidth: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  mkOn: { paddingHorizontal: 12, height: 32, borderRadius: 16, maxWidth: 220 },
  search: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 999, borderWidth: 1, paddingHorizontal: 16 },
  round: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -2, right: -2, minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  card: { flexDirection: "row", gap: 12, alignItems: "center", borderRadius: 22, padding: 8, paddingRight: 12, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  x: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", alignSelf: "flex-start" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  foot: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 34, borderTopWidth: 1 },
});
