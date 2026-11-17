import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRICO, GOCHI, POPPINS } from "./brandFonts";

// „Die lustigsten Dinge, die Fremde über Nuki gesagt haben“ – Brand Sheet nuki.nooks
const BLAU = "#045AFF";
const OFF = "#FFF9F0";
const ROSA = "#FFB8D9";
const FPS = 30;
const f = (s: number) => Math.round(s * FPS);
const MAIN = "fremde/main.mp4";

// ---------- Schnittliste: Video (src, Rohzeit) + optional anderer Ton ----------
type Shot = {
  name: string;
  src?: string; // Video; ohne src = blaue Karte
  a: number; // Rohzeit Start (Video)
  len: number; // Dauer in s
  muted?: boolean;
  audioA?: number; // Ton aus MAIN ab dieser Rohzeit (für Platz 4: Antwort über Nuki-Clip)
  zoom?: number; // Zeitpunkt (fertiges Video) für Punch-in
  hold?: number; // konstanter Zoom
};
const SHOTS: Shot[] = [
  { name: "hook", src: MAIN, a: 18.14, len: 1.4 },
  { name: "p4a", src: MAIN, a: 1.05, len: 1.7 },
  { name: "p4b", src: "fremde/hops-slow.mp4", a: 0.0, len: 1.3, muted: true, audioA: 2.9 }, // Nuki hüpft, Zeitlupe 50 %
  { name: "p3a", src: MAIN, a: 12.95, len: 2.0 },
  { name: "p3b", src: MAIN, a: 15.55, len: 2.0, hold: 1.08 },
  { name: "p2a", src: MAIN, a: 19.5, len: 1.35 },
  { name: "p2b", src: MAIN, a: 21.65, len: 1.7, hold: 1.1 },
  { name: "p2c", src: MAIN, a: 24.0, len: 0.45, hold: 1.18 },
  { name: "break", a: 0, len: 0.6 },
  { name: "p1a", src: MAIN, a: 5.45, len: 0.3 },
  { name: "p1b", src: MAIN, a: 6.35, len: 2.35, zoom: 13.4 },
  { name: "p1c", src: MAIN, a: 9.2, len: 0.8, hold: 1.12 },
];
const END = 3.0;
const LAYOUT = (() => {
  let cur = 0;
  return SHOTS.map((s) => {
    const from = cur;
    const dur = f(s.len);
    cur += dur;
    return { ...s, from, dur };
  });
})();
const END_FROM = LAYOUT[LAYOUT.length - 1].from + LAYOUT[LAYOUT.length - 1].dur;
export const FREMDE_DURATION = END_FROM + f(END);
const at = (name: string) => LAYOUT.find((s) => s.name === name)!.from / FPS;

// ---------- Platzierungen, Sprechblasen, Captions (Sekunden im fertigen Video) ----------
const PLACES = [
  { n: 4, from: at("p4a"), to: at("p3a") },
  { n: 3, from: at("p3a"), to: at("p2a") },
  { n: 2, from: at("p2a"), to: at("break") },
  { n: 1, from: at("p1a"), to: END_FROM / FPS },
];
type Bubble = { from: number; to: number; parts: { t: string; pink?: boolean }[]; top?: boolean };
const BUBBLES: Bubble[] = [
  { from: at("p4a") + 0.05, to: at("p4b"), parts: [{ t: "„Der " }, { t: "hoppst", pink: true }, { t: " so lustig!“" }] },
  { from: at("p3a") + 0.05, to: at("p3b"), parts: [{ t: "„Kleine " }, { t: "Teddybärohren", pink: true }, { t: " hat er, gell?“" }] },
  { from: at("p3b") + 0.05, to: at("p2a"), parts: [{ t: "„Ganz klein, wie die da " }, { t: "rausschauen", pink: true }, { t: "!“" }] },
  { from: at("p2b") + 0.05, to: at("break"), top: true, parts: [{ t: "„Ob er " }, { t: "aggressiv", pink: true }, { t: " ist, weil er so bellt?“" }] },
  { from: at("p1a") + 0.05, to: END_FROM / FPS, parts: [{ t: "„Der schaut aus wie mit " }, { t: "Perwoll", pink: true }, { t: " gewaschen!“" }] },
];
type W = { t: number; w: string; key?: boolean };
const p4b = at("p4b");
const CAPS: { from: number; to: number; words: W[]; box?: boolean }[] = [
  { from: p4b, to: at("p3a"), box: true, words: [{ t: p4b + 0.08, w: "Ja," }, { t: p4b + 0.3, w: "der" }, { t: p4b + 0.45, w: "hoppst" }, { t: p4b + 0.75, w: "wirklich", key: true }, { t: p4b + 1.0, w: "lustig." }] },
  { from: at("p2c"), to: at("break"), words: [{ t: at("p2c") + 0.08, w: "Nee.", key: true }] },
  { from: at("p1c"), to: END_FROM / FPS, words: [{ t: at("p1c") + 0.1, w: "Ja." }] },
];
const WUFFS = [at("p2a") + 0.1, at("p2a") + 1.1];
const NOTE_FROM = at("p1b") + 1.1;

const SFX: [string, number][] = [
  ["swoosh", at("p4a") - 0.05],
  ...PLACES.map((p) => ["ding", p.from] as [string, number]),
  ...BUBBLES.map((b) => ["pop", b.from] as [string, number]),
  ["swoosh", at("break") - 0.05],
  ["pop", NOTE_FROM],
  ["swoosh", END_FROM / FPS - 0.05],
  ["pop", END_FROM / FPS + 0.85],
];

// ---------- Bausteine ----------
const usePop = (startSec: number, damping = 11) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - f(startSec), fps, config: { damping, mass: 0.5 } });
};

const PlaceBadge: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const p = PLACES.find((x) => t >= x.from && t < x.to);
  const s = usePop(p ? p.from : 0, 9);
  if (!p) return null;
  const first = p.n === 1;
  const bump = 1 + 0.25 * Math.sin(Math.PI * Math.min(1, s));
  // Platz 2: Badge wackelt beim Bellen
  const wob = p.n === 2 ? WUFFS.reduce((acc, w) => acc + Math.sin((t - w) * 40) * 8 * Math.max(0, 1 - Math.abs(t - w - 0.15) / 0.3) * (t > w ? 1 : 0), 0) : 0;
  return (
    <div style={{ position: "absolute", top: 250, left: 64, transformOrigin: "left top", transform: `scale(${Math.min(1, s * 1.2) * bump}) rotate(${(first ? -6 : 0) + wob}deg)` }}>
      <div style={{ background: first ? ROSA : OFF, borderRadius: 40, padding: "16px 36px 22px", textAlign: "center", boxShadow: "0 10px 30px rgba(0,24,77,0.28)", color: BLAU }}>
        <div style={{ fontFamily: POPPINS, fontWeight: 600, fontSize: 34, letterSpacing: 2, lineHeight: 1 }}>Platz</div>
        <div style={{ fontFamily: BRICO, fontWeight: 800, fontSize: 150, lineHeight: 0.9 }}>{p.n}</div>
      </div>
    </div>
  );
};

const Bubbles: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const b = BUBBLES.find((x) => t >= x.from && t < x.to);
  const s = usePop(b ? b.from : 0, 12);
  if (!b) return null;
  return (
    <div style={{ position: "absolute", left: 64, right: 80, top: b.top ? 560 : 1050, transformOrigin: "left bottom", transform: `scale(${s}) rotate(${(1 - s) * -4}deg)`, opacity: Math.min(1, s * 1.5) }}>
      <div style={{ position: "relative", background: BLAU, borderRadius: 48, padding: "34px 44px 40px", fontFamily: BRICO, fontWeight: 800, fontSize: 74, lineHeight: 1.06, letterSpacing: -1, color: OFF, boxShadow: "0 14px 40px rgba(0,24,77,0.35)" }}>
        {b.parts.map((p, i) => (
          <span key={i} style={{ color: p.pink ? ROSA : OFF }}>{p.t}</span>
        ))}
        <div style={{ position: "absolute", bottom: -40, left: 90, width: 0, height: 0, borderLeft: "26px solid transparent", borderRight: "26px solid transparent", borderTop: `44px solid ${BLAU}` }} />
      </div>
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
    <div style={{ position: "absolute", top: 1380, left: 60, right: 60, textAlign: "center", lineHeight: 1.12 }}>
      <div style={cap.box ? { display: "inline-block", background: BLAU, borderRadius: 40, padding: "14px 22px 20px", boxShadow: "0 10px 30px rgba(0,24,77,0.3)" } : { display: "inline" }}>
      {cap.words.filter((w) => t >= w.t).map((w, i) => {
        const s = spring({ frame: frame - f(w.t), fps, config: { damping: 10, mass: 0.5 } });
        const pop = w.key ? 1 + 0.15 * Math.sin(Math.PI * Math.min(1, s)) : 1;
        return (
          <span key={i} style={{ display: "inline-block", margin: "0 12px", fontFamily: BRICO, fontWeight: 700, fontSize: w.key ? 92 : 80, color: w.key ? ROSA : OFF, textShadow: "0 4px 18px rgba(0,24,77,0.8), 0 2px 4px rgba(0,24,77,0.6)", transform: `translateY(${(1 - Math.min(1, s)) * 24}px) scale(${pop})`, opacity: Math.min(1, s * 1.6) }}>
            {w.w}
          </span>
        );
      })}
      </div>
    </div>
  );
};

const Wuffs: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <>
      {WUFFS.map((w, i) => {
        if (t < w || t > w + 0.9) return null;
        const s = spring({ frame: frame - f(w), fps, config: { damping: 8, mass: 0.4 } });
        const fade = interpolate(t, [w + 0.6, w + 0.9], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={i} style={{ position: "absolute", top: i === 0 ? 640 : 760, right: i === 0 ? 80 : 300, background: BLAU, borderRadius: 36, padding: "6px 34px 12px", fontFamily: GOCHI, fontSize: 120, color: ROSA, transform: `rotate(${i === 0 ? 8 : -6}deg) scale(${s})`, opacity: fade, boxShadow: "0 10px 30px rgba(0,24,77,0.3)" }}>
            WUFF!
          </div>
        );
      })}
    </>
  );
};

const NukiNote: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const s = usePop(NOTE_FROM, 10);
  if (t < NOTE_FROM || t >= END_FROM / FPS) return null;
  return (
    <div style={{ position: "absolute", top: 300, left: 330, right: 50, background: BLAU, borderRadius: 30, padding: "14px 30px 18px", fontFamily: GOCHI, fontSize: 70, lineHeight: 1.05, color: ROSA, transform: `rotate(-4deg) scale(${s})`, transformOrigin: "left center", boxShadow: "0 10px 30px rgba(0,24,77,0.3)" }}>
      Nuki: ich bin ein gefährlicher Eisbär!
    </div>
  );
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame, fps, config: { damping: 13, mass: 0.5 } });
  const words: { w: string; pink?: boolean }[] = [
    { w: "Dinge," }, { w: "die" }, { w: "Fremde" }, { w: "wirklich", pink: true }, { w: "über" }, { w: "Nuki" }, { w: "gesagt" }, { w: "haben" },
  ];
  const note = spring({ frame: frame - f(0.7), fps, config: { damping: 10, mass: 0.5 } });
  return (
    <>
      <div style={{ position: "absolute", top: 250, left: 64, right: 64, background: BLAU, borderRadius: 48, padding: "40px 48px 48px", transform: `scale(${card})`, transformOrigin: "center top", boxShadow: "0 14px 40px rgba(0,24,77,0.35)" }}>
        <div style={{ fontFamily: BRICO, fontWeight: 800, fontSize: 104, lineHeight: 1.0, letterSpacing: -3, color: OFF }}>
          {words.map((w, i) => {
            const s = spring({ frame: frame - 2 - i * 2, fps, config: { damping: 11, mass: 0.5 } });
            return (
              <span key={i} style={{ display: "inline-block", marginRight: 24, color: w.pink ? ROSA : OFF, transform: `translateY(${(1 - s) * 34}px)`, opacity: Math.min(1, s * 1.5) }}>{w.w}</span>
            );
          })}
        </div>
      </div>
      {frame >= f(0.7) && (
        <div style={{ position: "absolute", top: 870, right: 70, background: BLAU, borderRadius: 28, padding: "8px 30px 14px", fontFamily: GOCHI, fontSize: 72, color: ROSA, transform: `rotate(-5deg) scale(${note})`, boxShadow: "0 10px 30px rgba(0,24,77,0.3)" }}>
          Platz 1 tut weh ↓
        </div>
      )}
    </>
  );
};

const BreakCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12, mass: 0.5 } });
  return (
    <AbsoluteFill style={{ background: BLAU, justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontFamily: BRICO, fontWeight: 800, fontSize: 130, color: OFF, letterSpacing: -3, transform: `scale(${0.85 + 0.15 * s})`, opacity: s }}>
        Und <span style={{ color: ROSA }}>Platz 1</span> …
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bg = spring({ frame, fps, config: { damping: 16 } });
  const words: { w: string; pink?: boolean }[] = [
    { w: "Was" }, { w: "haben" }, { w: "Fremde" }, { w: "schon" }, { w: "über" }, { w: "euren", pink: true }, { w: "Hund" }, { w: "gesagt?" },
  ];
  const g = spring({ frame: frame - f(0.85), fps, config: { damping: 10, mass: 0.5 } });
  const h = spring({ frame: frame - f(1.2), fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ background: BLAU, clipPath: `circle(${bg * 150}% at 50% 50%)` }}>
      <div style={{ position: "absolute", top: 520, left: 80, right: 80, fontFamily: BRICO, fontWeight: 800, fontSize: 124, lineHeight: 1.0, letterSpacing: -3, color: OFF }}>
        {words.map((w, i) => {
          const s = spring({ frame: frame - 3 - i * 2, fps, config: { damping: 11, mass: 0.5 } });
          return (
            <span key={i} style={{ display: "inline-block", marginRight: 26, color: w.pink ? ROSA : OFF, transform: `translateY(${(1 - s) * 40}px)`, opacity: Math.min(1, s * 1.5) }}>{w.w}</span>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1180, left: 80, fontFamily: GOCHI, fontSize: 84, color: ROSA, transform: `rotate(-4deg) scale(${g})`, transformOrigin: "left center" }}>
        Schreibt’s in die Kommentare 👇
      </div>
      <div style={{ position: "absolute", bottom: 420, width: "100%", textAlign: "center", fontFamily: GOCHI, fontSize: 72, color: OFF, opacity: h }}>
        @nuki.nooks
      </div>
    </AbsoluteFill>
  );
};

const ShotView: React.FC<{ shot: (typeof LAYOUT)[number] }> = ({ shot }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!shot.src) return <BreakCard />;
  let scale = shot.hold ?? 1;
  if (shot.zoom !== undefined) {
    const p = spring({ frame: frame - (f(shot.zoom) - shot.from), fps, config: { damping: 14, mass: 0.4 } });
    scale = 1 + 0.12 * p;
  }
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      <OffthreadVideo src={staticFile(shot.src)} trimBefore={f(shot.a)} muted={shot.muted} />
      {shot.audioA !== undefined && <Audio src={staticFile(MAIN)} trimBefore={f(shot.audioA)} />}
    </AbsoluteFill>
  );
};

export const Fremde: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    {LAYOUT.map((s) => (
      <Sequence key={s.name} from={s.from} durationInFrames={s.dur}>
        <ShotView shot={s} />
      </Sequence>
    ))}
    <Sequence durationInFrames={f(1.4)}>
      <Hook />
    </Sequence>
    <Sequence from={END_FROM} durationInFrames={f(END)}>
      <EndCard />
    </Sequence>
    <PlaceBadge />
    <Bubbles />
    <Captions />
    <Wuffs />
    <NukiNote />
    {SFX.map(([n, t], i) => (
      <Sequence key={i} from={f(t)}>
        <Audio src={staticFile(`fremde/${n}.wav`)} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
