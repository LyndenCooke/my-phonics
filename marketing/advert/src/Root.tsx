import { Composition } from "remotion";
import { MyPhonicsAdvert } from "./MyPhonicsAdvert";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyPhonicsAdvert"
        component={MyPhonicsAdvert}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
