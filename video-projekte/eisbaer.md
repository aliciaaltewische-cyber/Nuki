# Projekt „Ist das ein Eisbär?“ (Export 2026-11-17)

- Roh: `Raw Footage/eisbaer-roh-01.mp4` (6 Clips, Wasserzeichen clideo.com), `Raw Footage/eisbaer-hook-nuki.mov`
- main.mp4: `ffmpeg -i eisbaer-roh-01.mp4 -vf "crop=iw*0.92:ih*0.92:iw*0.04:0,scale=1080:1920:flags=lanczos,fps=30,setsar=1" -c:v libx264 -crf 16 -c:a aac -ar 48000 main.mp4`
- hook.mp4: `ffmpeg -t 2.6 -i eisbaer-hook-nuki.mov -vf "scale=1080:1920:flags=lanczos,fps=30,setsar=1" -an -c:v libx264 -crf 16 hook.mp4`
- Sprechpausen per Jump Cut entfernt (Schnittliste in `src/Eisbaer.tsx`, `SEGS`)
- Passanten-Stimmen q1–q6: Piper TTS, ca. 21 dB unter der Stimme, Hall + Tiefpass
- Render: `npx remotion render Eisbaer render.mp4 --crf=16`, dann 2-Pass-loudnorm auf −14 LUFS / TP −1,5
