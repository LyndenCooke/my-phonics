import { Composition } from "remotion";
import { ReelGapWidens } from "./compositions/ReelGapWidens";
import { ReelGapNeverCloses } from "./compositions/ReelGapNeverCloses";
import { ReelTenMinutes } from "./compositions/ReelTenMinutes";
import { ReelExpatGap } from "./compositions/ReelExpatGap";
import { FeedReadingAge } from "./compositions/FeedReadingAge";
import { FeedReadLikeBritish } from "./compositions/FeedReadLikeBritish";
import { FeedCriticalWindow } from "./compositions/FeedCriticalWindow";
import { FeedTenMinutes } from "./compositions/FeedTenMinutes";
import { StoryExpatFear } from "./compositions/StoryExpatFear";
import { StorySixMonths } from "./compositions/StorySixMonths";
import { FeedBritishTeacher } from "./compositions/FeedBritishTeacher";
import { FeedSocialProof } from "./compositions/FeedSocialProof";
import { StoryAssessmentCTA } from "./compositions/StoryAssessmentCTA";
import { FbStartRight } from "./compositions/FbStartRight";
import { FeedReadingPurpose } from "./compositions/FeedReadingPurpose";
import { MetaDontGuess } from "./compositions/MetaDontGuess";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ── REELS (1080x1920, 30fps) ── */}
      <Composition id="reel-01-gap-widens" component={ReelGapWidens}
        durationInFrames={50 * FPS} fps={FPS} width={1080} height={1920} />
      <Composition id="reel-02-gap-never-closes" component={ReelGapNeverCloses}
        durationInFrames={45 * FPS} fps={FPS} width={1080} height={1920} />
      <Composition id="reel-03-ten-minutes" component={ReelTenMinutes}
        durationInFrames={45 * FPS} fps={FPS} width={1080} height={1920} />
      <Composition id="reel-04-expat-gap" component={ReelExpatGap}
        durationInFrames={50 * FPS} fps={FPS} width={1080} height={1920} />

      {/* ── INSTAGRAM FEED (1080x1080, 30fps, short animations) ── */}
      <Composition id="feed-01-reading-age" component={FeedReadingAge}
        durationInFrames={6 * FPS} fps={FPS} width={1080} height={1080} />
      <Composition id="feed-02-read-like-british" component={FeedReadLikeBritish}
        durationInFrames={6 * FPS} fps={FPS} width={1080} height={1080} />
      <Composition id="feed-03-critical-window" component={FeedCriticalWindow}
        durationInFrames={6 * FPS} fps={FPS} width={1080} height={1080} />
      <Composition id="feed-04-ten-minutes" component={FeedTenMinutes}
        durationInFrames={6 * FPS} fps={FPS} width={1080} height={1080} />
      <Composition id="feed-10-british-teacher" component={FeedBritishTeacher}
        durationInFrames={6 * FPS} fps={FPS} width={1080} height={1080} />
      <Composition id="feed-14-social-proof" component={FeedSocialProof}
        durationInFrames={6 * FPS} fps={FPS} width={1080} height={1080} />
      <Composition id="feed-09-reading-purpose" component={FeedReadingPurpose}
        durationInFrames={6 * FPS} fps={FPS} width={1080} height={1080} />
      <Composition id="meta-12-dont-guess" component={MetaDontGuess}
        durationInFrames={6 * FPS} fps={FPS} width={1080} height={1080} />

      {/* ── STORIES (1080x1920, 30fps) ── */}
      <Composition id="story-04-expat-fear" component={StoryExpatFear}
        durationInFrames={8 * FPS} fps={FPS} width={1080} height={1920} />
      <Composition id="story-05-six-months" component={StorySixMonths}
        durationInFrames={8 * FPS} fps={FPS} width={1080} height={1920} />
      <Composition id="story-13-assessment-cta" component={StoryAssessmentCTA}
        durationInFrames={8 * FPS} fps={FPS} width={1080} height={1920} />

      {/* ── FACEBOOK (1200x628, 30fps) ── */}
      <Composition id="fb-07-start-right" component={FbStartRight}
        durationInFrames={6 * FPS} fps={FPS} width={1200} height={628} />
    </>
  );
};
