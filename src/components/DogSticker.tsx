import React from "react";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";

const INK = "#3b2219", CR = "#f4ead6", BL = "#bcd6ef", RD = "#e2463b", BR = "#4a2b20";
type O = { f: string; i: string; fl?: boolean; ear: string; ec?: string; tail: string; len: number; leg: number; sn: number; pt?: string; chest?: string; dots?: boolean; fe?: boolean; mask?: string };
export const BREEDS: Record<string, [string, O]> = {
  samojede: ["Samojede", { f: "#fbf8f1", i: INK, fl: true, ear: "p", tail: "curl", len: 1, leg: 1, sn: 1 }],
  golden: ["Golden Retriever", { f: CR, i: RD, ear: "f", ec: RD, tail: "feather", len: 1.05, leg: 1, sn: 1, fe: true }],
  labrador: ["Labrador", { f: BR, i: CR, ear: "f", tail: "straight", len: 1.05, leg: 1, sn: 1.05 }],
  dackel: ["Dackel", { f: RD, i: INK, ear: "l", ec: RD, tail: "straight", len: 1.7, leg: 0.45, sn: 1.2, pt: CR }],
  frenchie: ["Frz. Bulldogge", { f: CR, i: INK, ear: "b", tail: "stub", len: 0.72, leg: 0.8, sn: 0.4, pt: BR }],
  border: ["Border Collie", { f: BR, i: CR, ear: "h", tail: "feather", len: 1.1, leg: 1, sn: 1, chest: CR }],
  mops: ["Mops", { f: "#e9d6b2", i: INK, ear: "s", ec: BR, tail: "curl", len: 0.8, leg: 0.75, sn: 0.35, mask: BR }],
  husky: ["Husky", { f: BL, i: INK, ear: "p", tail: "curl", len: 1.05, leg: 1, sn: 1.15, chest: "#fbf8f1" }],
  mix: ["Mischling", { f: BL, i: INK, ear: "f", ec: BR, tail: "up", len: 1, leg: 1, sn: 1, dots: true }],
};

function scallop(cx: number, cy: number, rx: number, ry: number, n: number, k = 1.12) {
  let d = "";
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, m = ((i - 0.5) / n) * Math.PI * 2;
    const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
    d += i ? `Q${(cx + rx * k * Math.cos(m)).toFixed(1)} ${(cy + ry * k * Math.sin(m)).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}` : `M${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + "Z";
}

/** Hunderassen-Sticker im Linien-Stil. Der Sticker-Rand entsteht durch eine dicke, cremefarbene Unterlage. */
export function DogSticker({ breed, size = 64 }: { breed: string; size?: number }) {
  const o = (BREEDS[breed] || BREEDS.mix)[1], f = o.f, ink = o.i;
  const x0 = 34, x1 = x0 + 44 * o.len, y0 = 40, y1 = 66, L = 17 * o.leg, hx = x0, hy = y0 - 9;
  const W = Math.round(x1 + 28), H = Math.round(y1 + L + 10), sx = hx - 11 * o.sn, mx = (x0 + x1) / 2;
  const legs = [[x0 + 6, -3], [x0 + 15, -1], [x1 - 16, 1], [x1 - 7, 3]].map(([x, t]) => `M${x} ${y1 - 8} Q${x + t} ${y1 + L * 0.5} ${x + t * 0.6} ${y1 + L}`);
  const tail = ({
    curl: `M${x1 - 4} ${y0 + 4} C${x1 + 14} ${y0 - 4} ${x1 + 16} ${y0 - 24} ${x1 + 1} ${y0 - 20}`,
    feather: `M${x1 - 3} ${y0 + 6} C${x1 + 12} ${y0 + 10} ${x1 + 18} ${y0 + 22} ${x1 + 24} ${y0 + 28}`,
    straight: `M${x1 - 3} ${y0 + 6} C${x1 + 10} ${y0 + 4} ${x1 + 18} ${y0} ${x1 + 24} ${y0 - 4}`,
    up: `M${x1 - 3} ${y0 + 5} C${x1 + 8} ${y0} ${x1 + 12} ${y0 - 10} ${x1 + 14} ${y0 - 20}`,
    stub: `M${x1 - 3} ${y0 + 6} L${x1 + 4} ${y0 + 2}`,
  } as Record<string, string>)[o.tail];
  const body = o.fl ? scallop(mx, (y0 + y1) / 2, (x1 - x0) / 2 + 2, (y1 - y0) / 2 + 2, 14)
    : `M${x0 - 2} ${y0 + 12} C${x0 - 2} ${y0 - 1} ${x0 + 12} ${y0 - 2} ${mx} ${y0 + 2} S${x1 + 2} ${y0 - 3} ${x1 + 2} ${y0 + 10} C${x1 + 4} ${y1 - 2} ${x1 - 4} ${y1 + 1} ${x1 - 12} ${y1 - 2} C${mx} ${y1 - 6} ${x0 + 20} ${y1 - 4} ${x0 + 10} ${y1 + 1} C${x0} ${y1 + 3} ${x0 - 3} ${y0 + 20} ${x0 - 2} ${y0 + 12}Z`;
  const ears = ({
    p: `M${hx - 3} ${hy - 9} Q${hx} ${hy - 21} ${hx + 2} ${hy - 19} Q${hx + 5} ${hy - 14} ${hx + 7} ${hy - 9}Z M${hx + 5} ${hy - 8} Q${hx + 9} ${hy - 19} ${hx + 11} ${hy - 17} Q${hx + 13} ${hy - 11} ${hx + 12} ${hy - 5}Z`,
    f: `M${hx + 2} ${hy - 8} C${hx + 14} ${hy - 8} ${hx + 14} ${hy + 12} ${hx + 6} ${hy + 13} C${hx} ${hy + 12} ${hx - 2} ${hy} ${hx + 2} ${hy - 8}Z`,
    l: `M${hx + 1} ${hy - 8} C${hx + 14} ${hy - 8} ${hx + 15} ${hy + 18} ${hx + 6} ${hy + 19} C${hx - 1} ${hy + 18} ${hx - 3} ${hy} ${hx + 1} ${hy - 8}Z`,
    b: `M${hx - 8} ${hy - 6} L${hx - 9} ${hy - 24} L${hx + 1} ${hy - 10}Z M${hx + 2} ${hy - 10} L${hx + 11} ${hy - 23} L${hx + 11} ${hy - 4}Z`,
    h: `M${hx - 2} ${hy - 9} L${hx + 3} ${hy - 21} L${hx + 10} ${hy - 8}Z`,
    s: `M${hx - 1} ${hy - 10} C${hx + 6} ${hy - 16} ${hx + 13} ${hy - 12} ${hx + 11} ${hy - 4} L${hx + 4} ${hy - 6}Z`,
  } as Record<string, string>)[o.ear];
  const neck = `M${x0 + 8} ${y0 + 10} L${hx + 3} ${hy + 6}`;

  // Unterlage = Sticker-Rand
  const under = (
    <G stroke={CR} fill={CR} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round">
      {legs.map((d, i) => <Path key={i} d={d} strokeWidth={18} fill="none" />)}
      <Path d={tail} strokeWidth={14} fill="none" />
      <Path d={body} /><Path d={neck} strokeWidth={26} fill="none" />
      <Ellipse cx={sx + 2} cy={hy + 4} rx={10 * o.sn + 3} ry={7} /><Circle cx={hx} cy={hy} r={13} /><Path d={ears} />
    </G>
  );
  const limb = (d: string, w: number, k: string) => (
    <G key={k}><Path d={d} stroke={ink} strokeWidth={w + 3.2} strokeLinecap="round" fill="none" /><Path d={d} stroke={f} strokeWidth={w} strokeLinecap="round" fill="none" /></G>
  );
  return (
    <Svg width={size} height={size * (H + 12) / (W + 12)} viewBox={`-6 -6 ${W + 12} ${H + 12}`}>
      {under}
      {legs.map((d, i) => limb(d, 8, "l" + i))}
      {limb(tail, o.tail === "stub" ? 6 : 4.5, "t")}
      <Path d={body} fill={f} stroke={ink} strokeWidth={1.6} strokeLinejoin="round" />
      {o.pt && <><Ellipse cx={x0 + 14} cy={y0 + 7} rx={7} ry={5} fill={o.pt} /><Ellipse cx={x1 - 12} cy={y0 + 10} rx={8} ry={6} fill={o.pt} /></>}
      {o.dots && [[x0 + 10, y0 + 8], [x0 + 22, y0 + 15], [x0 + 33, y0 + 7], [x1 - 8, y0 + 16], [x0 + 18, y0 + 5], [x1 - 14, y0 + 6]].map(([cx, cy], i) => <Circle key={i} cx={cx} cy={cy} r={1.6} fill={INK} />)}
      {o.chest && <Path d={`M${x0 + 2} ${y0 + 8} C${x0 + 8} ${y1 + 2} ${x0 + 16} ${y1} ${x0 + 16} ${y0 + 6}Z`} fill={o.chest} />}
      {o.fe && [0, 1, 2, 3, 4, 5, 6].map(i => <Path key={i} d={`M${x0 + 8 + i * 6} ${y0 + 6 + (i % 2) * 4} l1 6`} stroke={ink} strokeWidth={1.2} strokeLinecap="round" />)}
      {limb(neck, 17, "n")}
      <Ellipse cx={sx + 2} cy={hy + 4} rx={10 * o.sn + 3} ry={7} fill={o.mask || f} stroke={ink} strokeWidth={1.6} />
      <Circle cx={hx} cy={hy} r={13} fill={f} stroke={ink} strokeWidth={1.6} />
      <Path d={ears} fill={o.ec || f} stroke={ink} strokeWidth={1.6} strokeLinejoin="round" />
      <Circle cx={sx - 8 * o.sn + 2} cy={hy + 1.5} r={2.6} fill={INK} />
      <Path d={`M${hx - 5} ${hy - 2} q1.5 -1.5 3 0`} stroke={f === BR ? CR : INK} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Path d={`M${sx + 1} ${hy + 7} q3 2 6 0`} stroke={ink} strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
