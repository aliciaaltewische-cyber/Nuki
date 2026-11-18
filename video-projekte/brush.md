# Projekt „Brush my Samoyed with me – Episode 1“ (in Arbeit)

- Roh: `Raw Footage/brush-hd-teil1..3.mov` – Reihenfolge beim Zusammensetzen: **Teil 3, Teil 2, Teil 1** (Start 0 / 10,03 / 20,03 s)
- main.mp4: concat der drei Teile, `-vf fps=30,setsar=1 -c:v libx264 -crf 16 -c:a aac -ar 48000`
- intro-brush.wav: main.mp4 ab 2 s, 5 s, highpass 200 / lowpass 2500, -6 dB, Fades
- Intro: Münchner Dächer (m-*.svg), Titel hinter Frauenkirche, Vogel, Dachfenster blau mit Samojede von oben (samoyed-top.png), Zoom, harter Schnitt
- (entfernt auf Wunsch) Text hinter Personen: FLUFF / SOFT / TREAT; Freisteller per rembg `birefnet-general-lite` (Masken 10–12 fps, ~50 s/Bild, NIE zwei gleichzeitig – Speicher!),
  dann RGBA-WebM (VP9 yuva420p) – im Remotion-Code in eigenes `<AbsoluteFill>` legen, sonst liegt Text davor
- Nur Spa-Karte „Willkommen“, Abspann „Folge uns für mehr Samojeden-Alltag“ + @nuki.nooks; Intro-Musik: eigene Synth-Melodie (sitcom-intro.wav, 160 BPM, C-Dur-Lauf → gehaltener F7)
