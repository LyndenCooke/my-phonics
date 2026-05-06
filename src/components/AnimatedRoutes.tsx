/**
 * AnimatedRoutes — wraps the route subtree in a framer-motion enter/exit
 * animation keyed by location.pathname.
 *
 * On native (iOS / Android via Capacitor) we use a true stack-style
 * slide-from-right transition with the previous screen parallaxing 30%
 * to the left underneath — this is the iOS push-navigation pattern.
 *
 * On web we use a fast cross-fade (slide animations on a desktop browser
 * just look stuttery and nobody expects them there).
 *
 * NB: AnimatePresence with `mode="wait"` ensures the outgoing screen has
 * fully animated out before the new screen mounts. Keeps memory low and
 * stops two screens from being interactive simultaneously.
 */
import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { isNative } from '@/lib/native';

const NATIVE_TRANSITION = {
  initial: { x: '100%', opacity: 0.85 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-30%', opacity: 0.6 },
  transition: { type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.28 },
};

const WEB_TRANSITION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.12 },
};

export default function AnimatedRoutes({ children }: { children: ReactNode }) {
  const location = useLocation();
  const t = isNative ? NATIVE_TRANSITION : WEB_TRANSITION;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={t.initial}
        animate={t.animate}
        exit={t.exit}
        transition={t.transition}
        // Absolute-positioned so the outgoing + incoming screens can
        // overlap during the slide. Each screen is full-height so this
        // is fine layout-wise.
        style={{ minHeight: '100vh', willChange: 'transform, opacity' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
