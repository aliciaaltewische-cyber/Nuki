import React from "react";
import {
  AbsoluteFill,
  Audio,
  Freeze,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { BRICO, GOCHI } from "./brandFonts";

// Brand Sheet nuki.nooks
const BLAU = "#045AFF";
const OFF = "#FFF9F0";
const ROSA = "#FFB8D9";

const FPS = 30;
const f = (s: number) => Math.round(s * FPS);

// ---------- Schnittliste (Rohzeit in Sekunden) ----------
const HOOK = 2.5;
const FREEZE = 0.4;
const END = 3.0;
type Seg = { a: number; b: number; zoom?: "punch" | "hold" | "push"; punchAt?: number };
const SEGS: Seg[] = [
  { a: 0.0, b: 2.2 },
  { a: 2.72, b: 5.5, zoom: "punch", punchAt: 5.73 },
  { a: 6.02, b: 7.05 },
  { a: 8.45, b: 8.95 },
  { a: 9.65, b: 10.62, zoom: "hold" },
  { a: 12.3, b: 14.3, zoom: "punch", punchAt: 11.16 },
  { a: 14.75, b: 17.55, zoom: "push" },
];

// Startframes im fertigen Video berechnen
const layout = (() => {
  let cur = f(HOOK);
  const out: { from: number; dur: number; seg: Seg }[] = [];
  SEGS.forEach((seg, i) => {
    if (i === SEGS.length - 1) cur += f(FREEZE);
    const dur = f(seg.b) - f(seg.a);
    out.push({ from: cur, dur, seg });
    cur += dur;
  });
  return { segs: out, endFrom: cur, freezeFrom: out[out.length - 1].from - f(FREEZE) };
})();
export const EISBAER_DURATION = layout.endFrom + f(END);

// Zähler springt beim Wort „Eisbär“ (Sekunden im fertigen Video)
const TICKS = [3.91, 5.73, 7.92, 9.5, 11.16, 13.92];

// Captions: Wort + Zeitpunkt (fertiges Video); key = Schlüsselwort
type W = { t: number; w: string; key?: boolean };
const CAPS: { from: number; to: number; words: W[] }[] = [
  { from: 2.5, to: 4.7, words: [{ t: 2.68, w: "Ja," }, { t: 3.13, w: "genau," }, { t: 3.39, w: "wie" }, { t: 3.66, w: "ein" }, { t: 3.91, w: "Eisbär!", key: true }] },
  { from: 4.7, to: 7.48, words: [{ t: 4.79, w: "Ja," }, { t: 4.99, w: "ist" }, { t: 5.37, w: "ein" }, { t: 5.73, w: "Eisbär.", key: true }, { t: 6.78, w: "Genau." }] },
  { from: 7.48, to: 8.51, words: [{ t: 7.5, w: "Wie" }, { t: 7.76, w: "ein" }, { t: 7.92, w: "Eisbär.", key: true }] },
  { from: 8.51, to: 9.98, words: [{ t: 8.66, w: "Der" }, { t: 9.02, w: "ist" }, { t: 9.13, w: "wie" }, { t: 9.38, w: "ein" }, { t: 9.5, w: "Eisbär,", key: true }, { t: 9.78, w: "ja." }] },
  { from: 9.98, to: 11.98, words: [{ t: 10.0, w: "Ja," }, { t: 10.1, w: "wie" }, { t: 10.49, w: "ein" }, { t: 11.16, w: "Eisbär.", key: true }] },
  { from: 12.38, to: 15.18, words: [{ t: 12.56, w: "1" }, { t: 12.91, w: "zu" }, { t: 13.06, w: "1," }, { t: 13.4, w: "wie" }, { t: 13.66, w: "ein" }, { t: 13.92, w: "Eisbär!", key: true }] },
];

// Leise Passanten-Stimmen + Soundeffekte (Sekunden im fertigen Video)
const VOICES: [string, number][] = [
  ["q1", 0.5], ["q2", 4.2], ["q3", 5.9], ["q4", 8.05], ["q5", 10.0], ["q6", 11.3],
];
const SFX: [string, number][] = [
  ["pop", 0.3], ["pop", 1.2], ["swoosh", 2.38],
  ...TICKS.map((t) => ["ding", t] as [string, number]),
  ["pop", 7.55], ["swoosh", 15.1], ["pop", 15.2], ["pop", 16.05],
];

// ---------- Bausteine ----------
const PolarBear: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx="24" cy="26" r="14" fill="#fff" stroke={BLAU} strokeWidth="5" />
    <circle cx="76" cy="26" r="14" fill="#fff" stroke={BLAU} strokeWidth="5" />
    <circle cx="24" cy="26" r="6" fill={ROSA} />
    <circle cx="76" cy="26" r="6" fill={ROSA} />
    <ellipse cx="50" cy="56" rx="38" ry="34" fill="#fff" stroke={BLAU} strokeWidth="5" />
    <ellipse cx="50" cy="70" rx="17" ry="13" fill="#F2F4FA" />
    <circle cx="36" cy="50" r="4.5" fill={BLAU} />
    <circle cx="64" cy="50" r="4.5" fill={BLAU} />
    <ellipse cx="50" cy="64" rx="7" ry="5" fill={BLAU} />
    <path d="M50 69 Q50 76 43 77 M50 69 Q50 76 57 77" stroke={BLAU} strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);

const Counter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < 0.3) return null;
  const count = TICKS.filter((x) => t >= x).length;
  const last = [...TICKS].reverse().find((x) => t >= x);
  const appear = spring({ frame: frame - f(0.3), fps, config: { damping: 12, mass: 0.6 } });
  const bump = last !== undefined ? spring({ frame: frame - f(last), fps, config: { damping: 8, mass: 0.5 } }) : 1;
  const bumpScale = last !== undefined ? 1 + 0.35 * Math.sin(Math.PI * Math.min(1, bump)) * (1 - Math.min(1, bump) * 0.4) : 1;
  const finale = count >= 6;
  const big = finale ? 1.35 : 1;
  const wobble = finale ? Math.sin((frame - f(TICKS[5])) / 3) * 6 * Math.max(0, 1 - (frame - f(TICKS[5])) / 40) - 5 : 0;
  const bg = count >= 5 ? ROSA : OFF;
  const plus = last !== undefined ? interpolate(frame - f(last), [0, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return (
    <div style={{ position: "absolute", top: 250, right: 64, transformOrigin: "right top", transform: `scale(${appear * bumpScale * big}) rotate(${wobble}deg)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: bg, borderRadius: 40, padding: "16px 34px 16px 20px", boxShadow: "0 10px 30px rgba(0,24,77,0.25)" }}>
        <PolarBear size={84} />
        <div style={{ fontFamily: BRICO, fontWeight: 800, fontSize: 104, color: BLAU, lineHeight: 1, minWidth: 64, textAlign: "center" }}>{count}</div>
      </div>
      {last !== undefined && plus < 1 && (
        <div style={{ position: "absolute", left: -70, top: 40 - plus * 70, opacity: 1 - plus, fontFamily: GOCHI, fontSize: 72, color: ROSA, textShadow: "0 3px 12px rgba(0,24,77,0.55)", transform: "rotate(-8deg)" }}>+1</div>
      )}
    </div>
  );
};

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cap = CAPS.find((c) => t >= c.from && t < c.to);
  if (!cap) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
      <div style={{ position: "absolute", top: 1230, width: 940, textAlign: "center", lineHeight: 1.12 }}>
        {cap.words.filter((w) => t >= w.t).map((w, i) => {
          const s = spring({ frame: frame - f(w.t), fps, config: { damping: 10, mass: 0.5 } });
          const pop = w.key ? 1 + 0.15 * Math.sin(Math.PI * Math.min(1, s)) : 1;
          return (
            <span key={i} style={{ display: "inline-block", margin: "0 12px", fontFamily: BRICO, fontWeight: 700, fontSize: w.key ? 92 : 78, color: w.key ? ROSA : OFF, textShadow: "0 4px 18px rgba(0,24,77,0.75), 0 2px 4px rgba(0,24,77,0.6)", transform: `translateY(${(1 - Math.min(1, s)) * 24}px) scale(${pop})`, opacity: Math.min(1, s * 1.6) }}>
              {w.w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Clip: React.FC<{ seg: Seg; from: number }> = ({ seg, from }) => {
  const frame = useCurrentFrame(); // relativ zur Sequenz
  const { fps } = useVideoConfig();
  let scale = 1;
  if (seg.zoom === "punch" && seg.punchAt !== undefined) {
    const p = spring({ frame: frame - (f(seg.punchAt) - from), fps, config: { damping: 14, mass: 0.4 } });
    scale = 1 + 0.12 * p;
  } else if (seg.zoom === "hold") scale = 1.1;
  else if (seg.zoom === "push") scale = interpolate(frame, [0, f(seg.b - seg.a)], [1, 1.08]);
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      <OffthreadVideo src={staticFile("eisbaer/main.mp4")} trimBefore={f(seg.a)} />
    </AbsoluteFill>
  );
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zoom = interpolate(frame, [0, f(HOOK)], [1, 1.18], { easing: Easing.out(Easing.quad) });
  const words: { w: string; mark?: boolean }[] = [
    { w: "Wie" }, { w: "oft" }, { w: "wird" }, { w: "Nuki" }, { w: "heute" }, { w: "für" }, { w: "einen" }, { w: "Eisbären", mark: true }, { w: "gehalten?" },
  ];
  const note = spring({ frame: frame - f(1.2), fps, config: { damping: 10, mass: 0.5 } });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "36% 68%" }}>
        <OffthreadVideo src={staticFile("eisbaer/hook.mp4")} muted />
      </AbsoluteFill>
      <div style={{ position: "absolute", top: 440, left: 70, right: 70, fontFamily: BRICO, fontWeight: 800, fontSize: 112, lineHeight: 0.98, letterSpacing: -3, color: BLAU, textShadow: "0 0 30px rgba(255,255,255,0.75)" }}>
        {words.map((w, i) => {
          const s = spring({ frame: frame - i * 3, fps, config: { damping: 11, mass: 0.5 } });
          return (
            <span key={i} style={{ display: "inline-block", marginRight: 26, transform: `translateY(${(1 - s) * 40}px) scale(${0.8 + 0.2 * s})`, opacity: Math.min(1, s * 1.5), background: w.mark ? `linear-gradient(transparent 52%, ${ROSA} 52%, ${ROSA} 92%, transparent 92%)` : undefined, padding: w.mark ? "0 8px" : undefined }}>
              {w.w}
            </span>
          );
        })}
      </div>
      {frame >= f(1.2) && (
        <div style={{ position: "absolute", top: 1050, left: 470, fontFamily: GOCHI, fontSize: 88, color: BLAU, textShadow: "0 0 18px rgba(255,255,255,0.95), 0 0 6px rgba(255,255,255,0.9)", transform: `rotate(-7deg) scale(${note})`, transformOrigin: "left center" }}>
          Spoiler: Oft ↙
        </div>
      )}
    </AbsoluteFill>
  );
};

const NukiNote: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 10, mass: 0.5 } });
  return (
    <div style={{ position: "absolute", top: 560, left: 70, background: BLAU, borderRadius: 28, padding: "10px 30px", fontFamily: GOCHI, fontSize: 76, color: ROSA, transform: `rotate(-6deg) scale(${s})`, transformOrigin: "left center", boxShadow: "0 10px 30px rgba(0,24,77,0.3)" }}>
      Nuki so: 🙄
    </div>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bg = spring({ frame, fps, config: { damping: 16 } });
  const lines: { w: string; pink?: boolean }[] = [
    { w: "Wie" }, { w: "oft" }, { w: "wurde" }, { w: "euer", pink: true }, { w: "Hund" }, { w: "schon" }, { w: "für" }, { w: "einen" }, { w: "Eisbären" }, { w: "gehalten?" },
  ];
  const g = spring({ frame: frame - f(0.85), fps, config: { damping: 10, mass: 0.5 } });
  const h = spring({ frame: frame - f(1.2), fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ background: BLAU, clipPath: `circle(${bg * 150}% at 50% 50%)` }}>
      <div style={{ position: "absolute", top: 520, left: 80, right: 80, fontFamily: BRICO, fontWeight: 800, fontSize: 116, lineHeight: 1.0, letterSpacing: -3, color: OFF }}>
        {lines.map((w, i) => {
          const s = spring({ frame: frame - 3 - i * 2, fps, config: { damping: 11, mass: 0.5 } });
          return (
            <span key={i} style={{ display: "inline-block", marginRight: 26, color: w.pink ? ROSA : OFF, transform: `translateY(${(1 - s) * 40}px)`, opacity: Math.min(1, s * 1.5) }}>{w.w}</span>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1230, left: 80, fontFamily: GOCHI, fontSize: 84, color: ROSA, transform: `rotate(-4deg) scale(${g})`, transformOrigin: "left center" }}>
        Schreibt’s in die Kommentare 👇
      </div>
      <div style={{ position: "absolute", bottom: 420, width: "100%", textAlign: "center", fontFamily: GOCHI, fontSize: 72, color: OFF, opacity: h }}>
        @nuki.nooks
      </div>
    </AbsoluteFill>
  );
};

// ---------- Komposition ----------
export const Eisbaer: React.FC = () => {
  const last = layout.segs[layout.segs.length - 2]; // Clip 5 – sein letztes Bild wird eingefroren
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence durationInFrames={f(HOOK)}>
        <Hook />
      </Sequence>
      {layout.segs.map(({ from, dur, seg }, i) => (
        <Sequence key={i} from={from} durationInFrames={dur}>
          <Clip seg={seg} from={from} />
        </Sequence>
      ))}
      <Sequence from={layout.freezeFrom} durationInFrames={f(FREEZE)}>
        <AbsoluteFill style={{ transform: "scale(1.16)" }}>
          <Freeze frame={0}>
            <OffthreadVideo src={staticFile("eisbaer/main.mp4")} trimBefore={f(last.seg.b) - 1} muted />
          </Freeze>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={layout.segs[2].from} durationInFrames={layout.segs[4].from - layout.segs[2].from}>
        <NukiNote />
      </Sequence>
      <Sequence from={layout.endFrom} durationInFrames={f(END)}>
        <EndCard />
      </Sequence>
      <Captions />
      <Counter />
      {VOICES.map(([n, t]) => (
        <Sequence key={n} from={f(t)}>
          <Audio src={staticFile(`eisbaer/${n}.wav`)} />
        </Sequence>
      ))}
      {SFX.map(([n, t], i) => (
        <Sequence key={`sfx${i}`} from={f(t)}>
          <Audio src={staticFile(`eisbaer/${n}.wav`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
