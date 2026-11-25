import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { SCENE } from "../data";

/** Gezeichnete Landschaft als Platzhalter, solange es kein echtes Foto gibt */
export function Scene({ t, colors, id = "s" }: { t: string; colors?: string[]; id?: string }) {
  const [a, b, c] = colors || SCENE[t] || SCENE.huette;
  const gid = "g" + id;
  let mid: React.ReactNode = null;
  if (t === "peak") mid = <><Path d="M0 260 L80 170 L130 210 L200 90 L260 170 L300 140 L300 400 L0 400Z" fill={b} /><Path d="M200 90 L178 124 L196 116 L214 128Z" fill="#e9e6dc" opacity={0.85} /></>;
  if (t === "walk") mid = <><Path d="M0 220 Q80 180 160 210 T300 200 V400 H0Z" fill={b} /><Path d="M130 400 Q150 300 190 230" stroke="#e8dcc0" strokeWidth={14} fill="none" strokeLinecap="round" /><Circle cx={60} cy={190} r={26} fill="#4d5a35" /><Circle cx={250} cy={185} r={20} fill="#4d5a35" /></>;
  if (t === "huette" || t === "hotel" || t === "hike")
    mid = <>
      <Path d="M0 230 L70 120 L120 170 L190 70 L260 150 L300 110 L300 400 L0 400Z" fill={b} />
      <Path d="M190 70 L172 98 L190 92 L206 100Z" fill="#f4eee2" opacity={0.9} />
      {t === "hike"
        ? <Path d="M120 400 Q140 320 200 260 T230 190" stroke="#d8cfb4" strokeWidth={6} fill="none" strokeDasharray="2 10" strokeLinecap="round" />
        : <G transform="translate(150 230)"><Path d="M0 30 L30 6 L60 30 V58 H0Z" fill="#3a2c1f" /><Path d="M-6 32 L30 2 L66 32" stroke="#2a1f15" strokeWidth={6} fill="none" /><Rect x={22} y={36} width={14} height={22} fill="#e9c77d" /></G>}
    </>;
  if (t === "see") mid = <><Path d="M0 200 L90 130 L160 180 L240 120 L300 160 L300 400 L0 400Z" fill={b} /><Rect y={230} width={300} height={170} fill="#7fa3a8" /><Path d="M20 260h80M140 290h120M40 320h60" stroke="#dfe9ea" strokeWidth={3} opacity={0.6} /></>;
  if (t === "cafe" || t === "food") mid = <><Rect x={40} y={90} width={220} height={200} rx={110} fill={b} /><Rect x={70} y={120} width={160} height={150} rx={80} fill="#f1d9a8" opacity={0.85} /><Path d="M120 230h60v10a30 30 0 0 1-60 0z" fill="#fff" /><Path d="M180 236c14 0 14 18 0 18" stroke="#fff" strokeWidth={5} fill="none" /></>;
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice">
      <Defs><LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={a} /><Stop offset="1" stopColor={c} /></LinearGradient></Defs>
      <Rect width={300} height={400} fill={`url(#${gid})`} />
      <Circle cx={62} cy={64} r={20} fill="#f4eee2" opacity={0.22} />
      {mid}
      <Path d="M0 330 Q150 290 300 340 V400 H0Z" fill={c} />
    </Svg>
  );
}
