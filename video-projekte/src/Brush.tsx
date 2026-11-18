import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRICO, GOCHI, POPPINS } from "./brandFonts";

// „Brush my Samoyed with me – Episode 1“ – Sitcom-Intro + Nuki Spa – Brand Sheet nuki.nooks
const BLAU = "#045AFF";
const OFF = "#FFF9F0";
const ROSA = "#FFB8D9";
const FPS = 30;
const f = (s: number) => Math.round(s * FPS);
const MAIN = "brush/main.mp4";
const XF = 8; // weiche Überblendung zwischen Szenen (Frames)

// ---------- Ablauf ----------
const INTRO = 4.5;
type Seg = { name: string; a: number; b: number; rate: number };
const SEGS: Seg[] = [
  { name: "willkommen", a: 0.0, b: 5.5, rate: 1 },
  { name: "fluff", a: 7.0, b: 12.5, rate: 1 },
  { name: "detox-fast", a: 15.0, b: 23.6, rate: 2 },
  { name: "detox", a: 23.6, b: 25.8, rate: 1 },
  { name: "ritual", a: 25.8, b: 30.5, rate: 1 },
];
const LAYOUT = (() => {
  let cur = f(INTRO);
  return SEGS.map((s, i) => {
    const dur = Math.round((f(s.b) - f(s.a)) / s.rate);
    const from = i === 0 ? cur : cur - XF;
    cur = from + dur;
    return { ...s, from, dur };
  });
})();
const lastSeg = LAYOUT[LAYOUT.length - 1];
const END_FROM = lastSeg.from + lastSeg.dur - XF;
const END = 3.2;
export const BRUSH_DURATION = END_FROM + f(END);
const seg = (n: string) => LAYOUT.find((s) => s.name === n)!;

// ---------- Intro: Münchner Dächer ----------
const SKY = { x: 450, y: 1480, w: 180, h: 320 }; // Dachfenster (9:16)

const Bird: React.FC<{ t: number }> = ({ t }) => {
  const p = interpolate(t, [0.6, 2.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (t < 0.6 || t > 2.5) return null;
  const x = -120 + p * 1320;
  const y = 600 - Math.sin(p * Math.PI) * 90 + Math.sin(t * 9) * 6;
  const flap = Math.sin(t * 22);
  const wy = 18 * flap;
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(${x},${y}) scale(2.8)`} fill="#0b0f24">
        <path d={`M0 0 Q-22 ${-14 - wy} -46 ${-6 - wy} Q-24 ${-2 - wy * 0.4} -6 6 Z`} />
        <path d={`M0 0 Q22 ${-14 - wy} 46 ${-6 - wy} Q24 ${-2 - wy * 0.4} 6 6 Z`} />
        <ellipse cx={0} cy={3} rx={9} ry={5} />
        <path d="M8 2 l8 -3 l-2 5z" />
      </g>
    </svg>
  );
};


// dunkler Samojeden-Umriss VON OBEN, rennt einmal am Dachfenster vorbei
const RunningSamoyed: React.FC<{ t: number }> = ({ t }) => {
  const p = interpolate(t, [3.35, 4.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (t < 3.35 || t > 4.3) return null;
  const w = 165; // Breite im Hauskoordinatensystem (Fenster ist 180 breit)
  const h = (w * 431) / 900;
  const x = SKY.x - w + p * (SKY.w + w);
  const y = SKY.y + SKY.h * 0.6 - h / 2;
  const g = t * 24;
  const stretch = 1 + Math.sin(g) * 0.05; // Galopp: strecken und stauchen
  return (
    <div style={{ position: "absolute", left: SKY.x, top: SKY.y, width: SKY.w, height: SKY.h, overflow: "hidden" }}>
      <Img
        src={staticFile("brush/samoyed-top.png")}
        style={{ position: "absolute", left: x - SKY.x, top: y - SKY.y + Math.sin(g * 0.5) * 2, width: w, height: h, opacity: 0.9, transform: `scaleX(${stretch}) scaleY(${2 - stretch}) rotate(${Math.sin(g * 0.5) * 3}deg)` }}
      />
    </div>
  );
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const titleOut = interpolate(t, [2.3, 2.9], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const z = interpolate(t, [2.6, INTRO], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const scale = 1 + (1080 / SKY.w - 1) * z;
  const cx = SKY.x + SKY.w / 2;
  const cy = SKY.y + SKY.h / 2;
  const dx = (540 - cx) * z;
  const dy = (960 - cy) * z;
  const glow = interpolate(t, [1.6, 2.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lines: { w: string; size: number; pink?: boolean; ls: number }[] = [
    { w: "BRUSH", size: 200, ls: -6 },
    { w: "SAMOYED", size: 176, pink: true, ls: -5 },
    { w: "with me", size: 150, ls: -3 },
  ];
  const ep = spring({ frame: frame - f(1.0), fps, config: { damping: 14 } });
  const L = (src: string) => <Img src={staticFile(src)} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />;
  return (
    <AbsoluteFill style={{ background: "#06123d", overflow: "hidden" }}>
      <AbsoluteFill style={{ transformOrigin: `${cx}px ${cy}px`, transform: `translate(${dx}px, ${dy}px) scale(${scale})` }}>
        {L("brush/m-sky.svg")}
        {/* Titel liegt HINTER den Türmen der Frauenkirche */}
        <div style={{ position: "absolute", top: 250, left: 0, right: 0, textAlign: "center", fontFamily: BRICO, fontWeight: 800, color: OFF, lineHeight: 0.84, textShadow: "0 10px 40px rgba(0,0,0,.45)", opacity: titleOut }}>
          {lines.map((l, i) => {
            const s = spring({ frame: frame - 4 - i * 5, fps, config: { damping: 12, mass: 0.6 } });
            return (
              <div key={i} style={{ fontSize: l.size, letterSpacing: l.ls, color: l.pink ? ROSA : OFF, transform: `translateY(${(1 - s) * 50}px) scale(${0.85 + 0.15 * s})`, opacity: Math.min(1, s * 1.4) }}>
                {l.pink ? (<><span style={{ fontSize: 150, letterSpacing: -3, color: OFF }}>my </span>{l.w}</>) : l.w}
              </div>
            );
          })}
          <div style={{ fontFamily: POPPINS, fontWeight: 600, fontSize: 46, letterSpacing: 10, marginTop: 34, opacity: 0.9 * ep }}>EPISODE 1</div>
        </div>
        {L("brush/m-frauenkirche.svg")}
        <div style={{ opacity: titleOut }}>
          <Bird t={t} />
        </div>
        {L("brush/m-roofs.svg")}
        {/* Dachfenster leuchtet blau wie in Version 1, dahinter rennt ein Samojeden-Umriss vorbei */}
        <div style={{ position: "absolute", left: SKY.x - 30, top: SKY.y - 30, width: SKY.w + 60, height: SKY.h + 60, background: "#4d8bff", filter: "blur(28px)", opacity: glow * 0.55 }} />
        <div style={{ position: "absolute", left: SKY.x, top: SKY.y, width: SKY.w, height: SKY.h, background: "linear-gradient(#7fb0ff, #045AFF)", opacity: glow }} />
        <RunningSamoyed t={t} />
        {L("brush/m-frame.svg")}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Hauptteil ----------
const fadeIn = (frame: number) => interpolate(frame, [0, XF], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const Footage: React.FC<{ s: (typeof LAYOUT)[number]; first: boolean; last: boolean }> = ({ s, first, last }) => {
  const frame = useCurrentFrame();
  const op = first ? 1 : fadeIn(frame);
  const vol = (fr: number) =>
    Math.min(first ? 1 : interpolate(fr, [0, XF], [0, 1], { extrapolateRight: "clamp" }), last ? interpolate(fr, [s.dur - XF - 10, s.dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : interpolate(fr, [s.dur - XF, s.dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const zoom = s.name === "ritual" ? interpolate(frame, [0, s.dur], [1, 1.1]) : s.name === "willkommen" ? interpolate(frame, [0, s.dur], [1.04, 1]) : 1;
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <OffthreadVideo src={staticFile(MAIN)} trimBefore={f(s.a)} playbackRate={s.rate} muted={s.rate !== 1} volume={vol} />
      </AbsoluteFill>
      {s.rate !== 1 && <Audio src={staticFile(MAIN)} trimBefore={f(s.a)} volume={vol} />}
    </AbsoluteFill>
  );
};

const SpaCard: React.FC<{ term: string; sub?: string; dur: number }> = ({ term, sub, dur }) => {
  const frame = useCurrentFrame();
  const inn = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const out = interpolate(frame, [dur - 14, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 260, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: inn * out }}>
      <div style={{ transform: `translateY(${(1 - inn) * -30}px)`, background: "rgba(255,249,240,0.94)", color: BLAU, borderRadius: 48, padding: "26px 64px 32px", textAlign: "center", boxShadow: "0 14px 40px rgba(0,24,77,0.28)", whiteSpace: "nowrap" }}>
        <div style={{ fontFamily: POPPINS, fontWeight: 600, fontSize: 30, letterSpacing: 12, opacity: 0.75 }}>✦ NUKI SPA ✦</div>
        <div style={{ fontFamily: BRICO, fontWeight: 800, fontSize: 88, letterSpacing: -2, lineHeight: 1.05 }}>{term}</div>
        {sub && <div style={{ fontFamily: GOCHI, fontSize: 56, opacity: 0.85 }}>{sub}</div>}
      </div>
    </div>
  );
};

const TextBehind: React.FC<{ dur: number; word: string; cut: string; top: number; rot: number; size?: number }> = ({ dur, word, cut, top, rot, size = 380 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 6, fps, config: { damping: 13, mass: 0.7 } });
  const out = interpolate(frame, [dur - 14, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top, left: -60, right: -60, textAlign: "center", fontFamily: BRICO, fontWeight: 800, fontSize: size, letterSpacing: -18, color: OFF, transform: `rotate(${rot}deg) scale(${0.7 + 0.3 * s})`, opacity: Math.min(1, s * 1.3) * out, textShadow: "0 18px 50px rgba(0,24,77,0.35)" }}>
        {word}
      </div>
      {/* Freisteller von euch liegt ÜBER dem Text */}
      <AbsoluteFill>
        <OffthreadVideo src={staticFile(cut)} transparent muted />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bg = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const a = (d: number) => spring({ frame: frame - d, fps, config: { damping: 16 } });
  const words: { w: string; pink?: boolean }[] = [
    { w: "Folge" }, { w: "uns" }, { w: "für" }, { w: "mehr" }, { w: "Samojeden-", pink: true }, { w: "Alltag", pink: true },
  ];
  return (
    <AbsoluteFill style={{ background: BLAU, opacity: bg, color: OFF }}>
      <div style={{ position: "absolute", top: 560, left: 80, right: 80 }}>
        <div style={{ fontFamily: BRICO, fontWeight: 800, fontSize: 132, lineHeight: 0.98, letterSpacing: -4 }}>
          {words.map((w, i) => {
            const s = a(8 + i * 3);
            return (
              <span key={i} style={{ display: "inline-block", marginRight: w.w.endsWith("-") ? 0 : 28, color: w.pink ? ROSA : OFF, opacity: s, transform: `translateY(${(1 - s) * 34}px)` }}>{w.w}</span>
            );
          })}
        </div>
        <div style={{ fontFamily: GOCHI, fontSize: 84, marginTop: 70, opacity: a(30), transform: `rotate(-3deg) scale(${a(30)})`, transformOrigin: "left center" }}>@nuki.nooks</div>
      </div>
    </AbsoluteFill>
  );
};

export const Brush: React.FC = () => {
  const fl = seg("fluff");
  const dt = seg("detox");
  const ri = seg("ritual");
  const wk = seg("willkommen");
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence durationInFrames={f(INTRO)}>
        <Intro />
      </Sequence>
      <Sequence durationInFrames={f(INTRO + 0.15)}>
        <Audio src={staticFile("brush/sitcom-intro.wav")} volume={0.6} />
      </Sequence>
      {LAYOUT.map((s, i) => (
        <Sequence key={s.name} from={s.from} durationInFrames={s.dur}>
          <Footage s={s} first={i === 0} last={i === LAYOUT.length - 1} />
        </Sequence>
      ))}
      <Sequence from={fl.from} durationInFrames={fl.dur}>
        <TextBehind dur={fl.dur} word="FLUFF" cut="brush/fluff-cut.webm" top={760} rot={-8} />
      </Sequence>
      <Sequence from={dt.from} durationInFrames={dt.dur}>
        <TextBehind dur={dt.dur} word="SOFT" cut="brush/soft-cut.webm" top={360} rot={-5} size={400} />
      </Sequence>
      <Sequence from={ri.from} durationInFrames={ri.dur}>
        <TextBehind dur={ri.dur} word="TREAT" cut="brush/treat-cut.webm" top={820} rot={-6} size={360} />
      </Sequence>
      <Sequence from={wk.from + 10} durationInFrames={wk.dur - 20}>
        <SpaCard term="Willkommen" sub="Heute: Fell-Treatment" dur={wk.dur - 20} />
      </Sequence>
      <Sequence from={END_FROM} durationInFrames={f(END)}>
        <EndCard />
      </Sequence>
      <Sequence from={END_FROM + 4}>
        <Audio src={staticFile("brush/bowl.wav")} volume={0.9} />
      </Sequence>
    </AbsoluteFill>
  );
};
