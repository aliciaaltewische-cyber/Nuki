import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { Eisbaer, EISBAER_DURATION } from "./Eisbaer";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Composition id="Eisbaer" component={Eisbaer} durationInFrames={EISBAER_DURATION} fps={30} width={1080} height={1920} />
    </>
  );
};
