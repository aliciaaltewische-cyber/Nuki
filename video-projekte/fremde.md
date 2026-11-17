# Projekt „Was Fremde über Nuki sagen“ (Export 2026-11-17)

- Roh: `Raw Footage/fremde-roh-01.mov` (4 Gesprächs-Clips), `Raw Footage/fremde-hops-nuki.mov` (Nuki hüpft, CapCut-Logo am Ende)
- main.mp4: `ffmpeg -i fremde-roh-01.mov -vf "scale=1080:1920:flags=lanczos,fps=30,setsar=1" -c:v libx264 -crf 16 -c:a aac -ar 48000 main.mp4`
- hops-slow.mp4 (Zeitlupe 50 %, nur Nuki vorne): `ffmpeg -ss 3.35 -t 0.7 -i fremde-hops-nuki.mov -vf "setpts=2*PTS,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,scale=1080:1920:flags=lanczos,setsar=1" -an -c:v libx264 -crf 16 hops-slow.mp4`
- Reihenfolge: Platz 4 Hopps · 3 Teddybärohren · 2 „aggressiv“ (WUFF) · Karte „Und Platz 1 …“ · 1 Perwoll. Notiz „Nuki: ich bin ein gefährlicher Eisbär!“ bei Platz 2, Hook-Notiz „Platz 1 kennen wir alle“, Platz-4-Caption ohne Band (v2)
- Schnittliste in `src/Fremde.tsx` (`SHOTS`), Pausen per Jump Cut entfernt
- Render: `npx remotion render Fremde render.mp4 --crf=16`, dann 2-Pass-loudnorm auf −14 LUFS / TP −1,5
