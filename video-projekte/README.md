# Video-Projekte (Remotion-Quellcode)

Wird in `~/.ki-video-editor/video-studio` gerendert. Wiederherstellen in einer neuen Sitzung:

```bash
cp -r video-projekte/src/* ~/.ki-video-editor/video-studio/src/
cp -r video-projekte/public/* ~/.ki-video-editor/video-studio/public/
cd ~/.ki-video-editor/video-studio && npm i @remotion/fonts@4.0.544
```

Die Videoclips (`public/eisbaer/main.mp4`, `hook.mp4`) sind nicht in Git – sie werden aus
`KI Video Editor/Raw Footage` neu erzeugt (Befehle siehe `eisbaer.md`).
