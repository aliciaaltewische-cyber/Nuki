import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { Eisbaer, EISBAER_DURATION } from "./Eisbaer";
import { Fremde, FREMDE_DURATION } from "./Fremde";
import { Geschenke, GESCHENKE_DURATION } from "./Geschenke";
import { Brush, BRUSH_DURATION } from "./Brush";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Composition id="Brush" component={Brush} durationInFrames={BRUSH_DURATION} fps={30} width={1080} height={1920} />
      <Composition id="Geschenke" component={Geschenke} durationInFrames={GESCHENKE_DURATION} fps={30} width={1080} height={1920} />
      <Composition id="Fremde" component={Fremde} durationInFrames={FREMDE_DURATION} fps={30} width={1080} height={1920} />
      <Composition id="Eisbaer" component={Eisbaer} durationInFrames={EISBAER_DURATION} fps={30} width={1080} height={1920} />
    </>
  );
};
