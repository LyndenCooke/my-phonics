import { Composition } from 'remotion';
import { HookWrongBooks } from './compositions/HookWrongBooks';
import { HookThreeMinutes } from './compositions/HookThreeMinutes';
import { HookTheGap } from './compositions/HookTheGap';
import { HookStillGuessing } from './compositions/HookStillGuessing';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HookWrongBooks"
        component={HookWrongBooks}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1350}
        defaultProps={{ childName: "Emma" }}
      />
      <Composition
        id="HookThreeMinutes"
        component={HookThreeMinutes}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="HookTheGap"
        component={HookTheGap}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="HookStillGuessing"
        component={HookStillGuessing}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1350}
      />
    </>
  );
};
