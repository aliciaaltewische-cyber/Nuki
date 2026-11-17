import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { BRICO, GOCHI, POPPINS } from "./brandFonts";

// „Weihnachtsgeschenke, über die sich Hundeeltern freuen – Part 2“ – Brand Sheet nuki.nooks
const BLAU = "#045AFF";
const OFF = "#FFF9F0";
const ROSA = "#FFB8D9";
const FPS = 30;
const f = (s: number) => Math.round(s * FPS);
const MAIN = "geschenke/main.mp4";

// ---------- Schnittliste (Rohzeit) – Pausen entfernt ----------
const SEGS = [
  { a: 0.6, b: 3.45 },
  { a: 4.35, b: 8.9 },
  { a: 9.62, b: 14.5 },
  { a: 15.3, b: 17.85 },
];
const LAYOUT = (() => {
  let cur = 0;
  return SEGS.map((s) => {
    const from = cur;
    const dur = f(s.b) - f(s.a);
    cur += dur;
    return { ...s, from, dur };
  });
})();
const END_FROM = LAYOUT[LAYOUT.length - 1].from + LAYOUT[LAYOUT.length - 1].dur; // ≈14,83 s
const END = 2.5;
export const GESCHENKE_DURATION = END_FROM + f(END);
const OUTRO = 12.3;

// ---------- Produkte (Sekunden im fertigen Video) ----------
type Product = { img: string; label: string; t: number; side: "l" | "r"; h: number; rot: number; spin?: boolean };
const PRODUCTS: Product[] = [
  { img: "regenjacke.png", label: "Regenjacke", t: 3.3, side: "l", h: 540, rot: -7 },
  { img: "gummistiefel.png", label: "Gummistiefel", t: 4.15, side: "r", h: 540, rot: 6 },
  { img: "einlagen.png", label: "Merino-Einlagen", t: 5.0, side: "r", h: 540, rot: 7 },
  { img: "anhaenger.png", label: "Personalisierter Anhänger", t: 7.7, side: "r", h: 430, rot: 4, spin: true },
  { img: "tshirt-polaroid.png", label: "Personalisiertes T-Shirt", t: 11.2, side: "l", h: 600, rot: -6 },
];
const SIZES: Record<string, [number, number]> = {
  "regenjacke.png": [769, 944],
  "gummistiefel.png": [613, 925],
  "einlagen.png": [725, 944],
  "anhaenger.png": [401, 551],
  "tshirt-polaroid.png": [780, 1163],
};
const SHELF_TOP = 250;
const SHELF_H = 180;
const SHELF_ITEM_H = 140;
const SHELF_FROM = PRODUCTS[1].t; // Leiste erscheint, wenn das erste Produkt hineinfliegt

// ---------- Captions ----------
type W = { t: number; w: string; key?: boolean };
const CAPS: { from: number; to: number; words: W[] }[] = [
  { from: 0.3, to: 2.2, words: [{ t: 0.35, w: "Weihnachtsgeschenke," }, { t: 0.84, w: "über" }, { t: 1.0, w: "die" }, { t: 1.11, w: "sich" }, { t: 1.28, w: "Hundeeltern", key: true }, { t: 1.8, w: "freuen." }] },
  { from: 2.2, to: 2.85, words: [{ t: 2.22, w: "Part" }, { t: 2.5, w: "2,", key: true }] },
  { from: 2.85, to: 4.0, words: [{ t: 3.0, w: "eine" }, { t: 3.19, w: "coole" }, { t: 3.3, w: "Regenjacke,", key: true }] },
  { from: 4.0, to: 5.0, words: [{ t: 4.0, w: "coole" }, { t: 4.15, w: "Gummistiefel,", key: true }] },
  { from: 5.0, to: 6.4, words: [{ t: 5.0, w: "Einlagen", key: true }, { t: 5.64, w: "für" }, { t: 5.76, w: "die" }, { t: 5.82, w: "Gummistiefel" }] },
  { from: 6.4, to: 7.4, words: [{ t: 6.42, w: "aus" }, { t: 6.6, w: "Merinowolle,", key: true }] },
  { from: 7.4, to: 8.5, words: [{ t: 7.44, w: "süße" }, { t: 7.7, w: "Schlüsselanhänger", key: true }] },
  { from: 8.5, to: 9.95, words: [{ t: 8.53, w: "oder" }, { t: 8.74, w: "Anhänger" }, { t: 9.17, w: "fürs" }, { t: 9.38, w: "Halsband,", key: true }] },
  { from: 9.95, to: 10.95, words: [{ t: 10.0, w: "die" }, { t: 10.13, w: "personalisiert", key: true }, { t: 10.73, w: "sind," }] },
  { from: 10.95, to: 12.28, words: [{ t: 11.0, w: "ein" }, { t: 11.1, w: "personalisiertes" }, { t: 11.9, w: "T-Shirt.", key: true }] },
  { from: 12.28, to: 14.83, words: [{ t: 12.32, w: "That’s" }, { t: 12.6, w: "it." }, { t: 13.1, w: "Folgt" }, { t: 13.44, w: "für" }, { t: 13.73, w: "weitere" }, { t: 14.24, w: "Parts.", key: true }] },
];

const SFX: [string, number][] = [
  ...PRODUCTS.map((p) => ["pop", p.t] as [string, number]),
  ["ding", OUTRO],
  ["swoosh", END_FROM / FPS - 0.05],
  ["pop", END_FROM / FPS + 0.9],
];

// ---------- Bausteine ----------
const Products: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = frame / fps;
  if (t >= END_FROM / fps) return null;
  const shelfIn = spring({ frame: frame - f(SHELF_FROM), fps, config: { damping: 14 } });
  const slotW = (width - 2 * 64) / PRODUCTS.length;
  return (
    <>
      {t >= SHELF_FROM && (
        <div style={{ position: "absolute", top: SHELF_TOP, left: 64, right: 64, height: SHELF_H, background: "rgba(4,90,255,0.88)", borderRadius: 48, transform: `scaleY(${shelfIn})`, transformOrigin: "top", boxShadow: "0 10px 30px rgba(0,24,77,0.3)" }} />
      )}
      {PRODUCTS.map((p, i) => {
        if (t < p.t) return null;
        const next = i < PRODUCTS.length - 1 ? PRODUCTS[i + 1].t : OUTRO;
        const [iw, ih] = SIZES[p.img];
        const bigH = p.h;
        const bigW = (iw / ih) * bigH;
        const bigX = p.side === "l" ? 40 : width - 40 - bigW;
        const bigY = 870 + (540 - bigH) / 2;
        const s = spring({ frame: frame - f(p.t), fps, config: { damping: 10, mass: 0.6 } });
        const fly = interpolate(t, [next, next + 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
        // Zielposition in der Leiste
        const sh = SHELF_ITEM_H;
        const sw = (iw / ih) * sh;
        const sx = 64 + slotW * i + (slotW - sw) / 2;
        const sy = SHELF_TOP + (SHELF_H - sh) / 2;
        const bob = Math.sin(t * 2.6 + i) * 14 * (1 - fly);
        const x = interpolate(fly, [0, 1], [bigX, sx]);
        const y = interpolate(fly, [0, 1], [bigY + bob, sy]);
        const scale = interpolate(fly, [0, 1], [1, sh / bigH]);
        const enter = (1 - Math.min(1, s)) * (p.side === "l" ? -260 : 260);
        const spin = p.spin ? Math.sin(t * 3.2) * 9 * (1 - fly) : 0;
        const rot = interpolate(fly, [0, 1], [p.rot, 0]) + spin + (1 - Math.min(1, s)) * (p.side === "l" ? -20 : 20);
        const done = t >= OUTRO ? spring({ frame: frame - f(OUTRO) - i * 2, fps, config: { damping: 8, mass: 0.4 } }) : 0;
        const doneBump = 1 + 0.18 * Math.sin(Math.PI * Math.min(1, done)) * (done > 0 ? 1 : 0);
        const labelOp = 1 - fly;
        return (
          <React.Fragment key={p.img}>
            <div style={{ position: "absolute", left: x + enter * (1 - fly), top: y, width: bigW, height: bigH, transformOrigin: "top left", transform: `scale(${scale * Math.min(1.05, 0.4 + 0.6 * s) * doneBump}) rotate(${rot}deg)`, filter: `drop-shadow(0 ${16 * (1 - fly) + 4}px ${24 * (1 - fly) + 6}px rgba(0,24,77,0.4))` }}>
              <Img src={staticFile(`geschenke/${p.img}`)} style={{ width: "100%", height: "100%" }} />
            </div>
            {labelOp > 0.01 && (
              <div style={{ position: "absolute", top: bigY - 70, [p.side === "l" ? "left" : "right"]: 60, background: OFF, color: BLAU, fontFamily: POPPINS, fontWeight: 600, fontSize: 38, borderRadius: 30, padding: "10px 26px", opacity: labelOp * Math.min(1, s * 1.5), transform: `scale(${0.6 + 0.4 * Math.min(1, s)})`, transformOrigin: p.side === "l" ? "left center" : "right center", boxShadow: "0 8px 22px rgba(0,24,77,0.3)", whiteSpace: "nowrap" }}>
                {p.label}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cap = CAPS.find((c) => t >= c.from && t < c.to);
  if (!cap) return null;
  return (
    <div style={{ position: "absolute", top: 1430, left: 50, right: 50, textAlign: "center", lineHeight: 1.08 }}>
      {cap.words.filter((w) => t >= w.t).map((w, i) => {
        const s = spring({ frame: frame - f(w.t), fps, config: { damping: 10, mass: 0.5 } });
        const pop = w.key ? 1 + 0.15 * Math.sin(Math.PI * Math.min(1, s)) : 1;
        return (
          <span key={i} style={{ display: "inline-block", margin: "0 11px", fontFamily: BRICO, fontWeight: 700, fontSize: w.key ? 78 : 68, color: w.key ? ROSA : OFF, textShadow: "0 4px 18px rgba(0,24,77,0.8), 0 2px 4px rgba(0,24,77,0.6)", transform: `translateY(${(1 - Math.min(1, s)) * 22}px) scale(${pop})`, opacity: Math.min(1, s * 1.6) }}>
            {w.w}
          </span>
        );
      })}
    </div>
  );
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame: frame - 3, fps, config: { damping: 13, mass: 0.5 } });
  const out = interpolate(frame, [f(2.6), f(2.85)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const words: { w: string; pink?: boolean }[] = [
    { w: "Weihnachtsgeschenke," }, { w: "über" }, { w: "die" }, { w: "sich" }, { w: "Hundeeltern", pink: true }, { w: "freuen 🎄" },
  ];
  return (
    <div style={{ position: "absolute", top: 250, left: 64, right: 64, background: BLAU, borderRadius: 48, padding: "34px 44px 44px", transform: `scale(${card * out})`, transformOrigin: "center top", boxShadow: "0 14px 40px rgba(0,24,77,0.35)" }}>
      <div style={{ display: "inline-block", background: OFF, color: BLAU, fontFamily: POPPINS, fontWeight: 600, fontSize: 36, borderRadius: 30, padding: "6px 24px", marginBottom: 18 }}>Part 2</div>
      <div style={{ fontFamily: BRICO, fontWeight: 800, fontSize: 84, lineHeight: 1.02, letterSpacing: -2.5, color: OFF }}>
        {words.map((w, i) => {
          const s = spring({ frame: frame - 5 - i * 2, fps, config: { damping: 11, mass: 0.5 } });
          return (
            <span key={i} style={{ display: "inline-block", whiteSpace: "nowrap", marginRight: 22, color: w.pink ? ROSA : OFF, transform: `translateY(${(1 - s) * 34}px)`, opacity: Math.min(1, s * 1.5) }}>{w.w}</span>
          );
        })}
      </div>
    </div>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bg = spring({ frame, fps, config: { damping: 16 } });
  const words: { w: string; pink?: boolean }[] = [
    { w: "Welches" }, { w: "Geschenk" }, { w: "wünscht" }, { w: "sich" }, { w: "euer", pink: true }, { w: "Hund?" },
  ];
  const pill = spring({ frame: frame - 2, fps, config: { damping: 12 } });
  const g = spring({ frame: frame - f(0.9), fps, config: { damping: 10, mass: 0.5 } });
  const h = spring({ frame: frame - f(1.2), fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ background: BLAU, clipPath: `circle(${bg * 150}% at 50% 50%)` }}>
      <div style={{ position: "absolute", top: 470, left: 80, right: 80 }}>
        <div style={{ display: "inline-block", background: OFF, color: BLAU, fontFamily: POPPINS, fontWeight: 600, fontSize: 40, borderRadius: 30, padding: "8px 28px", marginBottom: 30, transform: `scale(${pill})`, transformOrigin: "left center" }}>Part 3 kommt</div>
        <div style={{ fontFamily: BRICO, fontWeight: 800, fontSize: 124, lineHeight: 1.0, letterSpacing: -3, color: OFF }}>
          {words.map((w, i) => {
            const s = spring({ frame: frame - 3 - i * 2, fps, config: { damping: 11, mass: 0.5 } });
            return (
              <span key={i} style={{ display: "inline-block", marginRight: 26, color: w.pink ? ROSA : OFF, transform: `translateY(${(1 - s) * 40}px)`, opacity: Math.min(1, s * 1.5) }}>{w.w}</span>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", top: 1150, left: 80, fontFamily: GOCHI, fontSize: 84, lineHeight: 1.1, color: ROSA, transform: `rotate(-4deg) scale(${g})`, transformOrigin: "left center" }}>
        <div style={{ whiteSpace: "nowrap" }}>Schreibt’s in die</div>
        <div style={{ whiteSpace: "nowrap" }}>Kommentare 👇</div>
      </div>
      <div style={{ position: "absolute", bottom: 420, width: "100%", textAlign: "center", fontFamily: GOCHI, fontSize: 72, color: OFF, opacity: h }}>
        @nuki.nooks
      </div>
    </AbsoluteFill>
  );
};

export const Geschenke: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    {LAYOUT.map((s, i) => (
      <Sequence key={i} from={s.from} durationInFrames={s.dur}>
        <OffthreadVideo src={staticFile(MAIN)} trimBefore={f(s.a)} />
      </Sequence>
    ))}
    <Sequence durationInFrames={f(2.85)}>
      <Hook />
    </Sequence>
    <Products />
    <Captions />
    <Sequence from={END_FROM} durationInFrames={f(END)}>
      <EndCard />
    </Sequence>
    {SFX.map(([n, t], i) => (
      <Sequence key={i} from={f(t)}>
        <Audio src={staticFile(`geschenke/${n}.wav`)} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
