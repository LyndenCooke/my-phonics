import { Composition } from 'remotion';
import { HookWrongBooks } from './compositions/HookWrongBooks';
import { HookThreeMinutes } from './compositions/HookThreeMinutes';
import { HookTheGap } from './compositions/HookTheGap';
import { HookStillGuessing } from './compositions/HookStillGuessing';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Hook 1: Wrong Books (15s) */}
      <Composition
        id="HookWrongBooks"
        component={HookWrongBooks}
        durationInFrames={450} // 15s at 30fps
        fps={30}
        width={1080}
        height={1350} // 4:5 for Instagram/Facebook feed
        defaultProps={{
          childName: "Emma",
        }}
      />

      {/* Hook 2: 3 Minutes (15s) */}
      <Composition
        id="HookThreeMinutes"
        component={HookThreeMinutes}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1350}
      />

      {/* Hook 3: The Gap (15s) */}
      <Composition
        id="HookTheGap"
        component={HookTheGap}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1350}
      />

      {/* Hook 4: Still Guessing (15s) */}
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
