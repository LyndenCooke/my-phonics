import { motion } from 'framer-motion';

const COLORS = ['#E84B8A', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6', '#F97066', '#14B8A6'];

/**
 * Confetti — a lightweight framer-motion burst. Render with a changing `seedKey`
 * (e.g. a counter) to re-fire; pieces fly out from the centre and fade.
 */
export default function Confetti({ seedKey, count = 80 }: { seedKey: number | string; count?: number }) {
  const pieces = Array.from({ length: count }, (_, i) => {
    // deterministic pseudo-random from index + seed so SSR/Date.now isn't needed
    const r = (n: number) => {
      const x = Math.sin((i + 1) * 99.13 + Number(String(seedKey).length) * 7.1 + n * 3.3) * 10000;
      return x - Math.floor(x);
    };
    const angle = r(1) * Math.PI * 2;
    const dist = 140 + r(2) * 420;
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 120,
      rot: (r(3) - 0.5) * 720,
      delay: r(4) * 0.15,
      color: COLORS[i % COLORS.length],
      size: 8 + r(5) * 10,
      round: r(6) > 0.5,
    };
  });

  return (
    <div key={seedKey} className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rot, scale: 0.6 }}
          transition={{ duration: 1.3, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'absolute', width: p.size, height: p.size, backgroundColor: p.color, borderRadius: p.round ? '9999px' : '2px' }}
        />
      ))}
    </div>
  );
}
