# Projekt „Weihnachtsgeschenke für Hundeeltern – Part 2“ (Export 2026-11-17)

- Roh: `Raw Footage/geschenke-roh-01.mov`, Screenshots in `Raw Footage/geschenke-screenshots/` (NICHT in Git – enthalten Lieferadresse)
- main.mp4: `ffmpeg -i geschenke-roh-01.mov -t 18 -vf "scale=1080:1920:flags=lanczos,fps=30,setsar=1" -c:v libx264 -crf 16 -c:a aac -ar 48000 main.mp4`
- Freisteller (`public/geschenke/*.png`): Produktbereich aus Screenshot (2752×2064) ausschneiden, `rembg i -m isnet-general-use`,
  Alpha deckend machen (Schwelle 70), Off-White-Sticker-Kontur 16 px. Regenjacke per Farb-Key (Sättigung > 0,25) + Rand-Flutfüllung.
  T-Shirt-Foto als Polaroid (Nuki lässt sich auf hellem Boden nicht freistellen).
- Schnittliste in `src/Geschenke.tsx` (`SEGS`), Produkte schweben bei Nennung ein und fliegen in die Leiste oben
- Render: `npx remotion render Geschenke render.mp4 --crf=16`, dann 2-Pass-loudnorm auf −14 LUFS / TP −1,5
