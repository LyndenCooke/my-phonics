/**
 * SoundlingSprite — procedural placeholder creatures (Phase 1).
 *
 * Hand-drawn SVG bodies, one family silhouette per level (the same family
 * plan the generated art will follow), tinted by the level colour with the
 * grapheme on the belly. Eye style honours the house rule: tiny solid
 * black dots only. These are stand-ins for the Higgsfield-generated art in
 * Phase 2 — same props, so the swap is images-in, SVG-out.
 */
import type { Stage } from './soundlingStore';

interface Props {
  grapheme: string;
  /** Journey level 1–8 — picks the body family. */
  level: number;
  stage: Stage;
  hex: string;
  inkHex: string;
  asleep?: boolean;
  className?: string;
  /** Feed progress toward hatching, 0..1 — draws spreading cracks on the
   *  shell (the barn habitat's replacement for a progress bar). */
  crack?: number;
  /** Scene-grounded rendering: warm straw shell + no floating shadow disc,
   *  for sprites sitting directly in the barn rather than on a white card. */
  inScene?: boolean;
}

/** Small deterministic per-grapheme variation so siblings differ. */
function hashOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function SoundlingSprite({ grapheme, level, stage, hex, inkHex, asleep, className, crack = 0, inScene }: Props) {
  const shown = grapheme.replace(/^-/, '');
  const h = hashOf(grapheme);
  const tilt = ((h % 9) - 4) * 1.2; // −4.8°…+4.8°
  const gold = stage === 'golden';
  const body = gold ? '#F6C453' : hex;
  const ink = gold ? '#8A6210' : inkHex;

  if (stage === 'egg') {
    // In the barn, eggs are barn-coloured: warm straw-cream shell with
    // hay-brown speckles. On white cards they keep the level tint.
    const shell = inScene ? '#FBF3DE' : '#FFFDF6';
    const speck = inScene ? '#C9A15E' : hex;
    const line = inScene ? '#8A6a3B' : ink;
    // Crack stages: hairline → forked → wide zigzag ring near hatching.
    const crackPaths = [
      'M44 24 L48 32 L43 39',
      'M58 30 L54 40 L60 47 L55 53',
      'M31 52 L39 56 L35 63 L44 66 L41 73',
    ];
    const crackCount = crack >= 0.85 ? 3 : crack >= 0.5 ? 2 : crack > 0.12 ? 1 : 0;
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden>
        <g transform={`rotate(${tilt} 50 58)`}>
          {!inScene && <ellipse cx="50" cy="84" rx="26" ry="8" fill={hex} opacity="0.18" />}
          {/* shell */}
          <path
            d="M50 16 C67 16 78 38 78 58 C78 76 66 88 50 88 C34 88 22 76 22 58 C22 38 33 16 50 16 Z"
            fill={shell} stroke={line} strokeOpacity="0.35" strokeWidth="2.5"
          />
          {/* soft top-light on the shell */}
          <path d="M40 24 C34 30 30 38 29 46 C33 34 39 27 45 23 Z" fill="#FFFFFF" opacity="0.55" />
          {/* speckles */}
          {[0, 1, 2, 3].map(i => (
            <circle key={i} cx={36 + ((h >> (i * 3)) % 30)} cy={34 + ((h >> (i * 2 + 1)) % 36)} r={2 + (i % 2)} fill={speck} opacity="0.4" />
          ))}
          {/* spreading cracks as the egg is fed */}
          {crackPaths.slice(0, crackCount).map((d, i) => (
            <path key={i} d={d} fill="none" stroke={line} strokeWidth={i === 2 ? 2.4 : 1.8}
              strokeLinejoin="round" strokeLinecap="round" opacity="0.75" />
          ))}
          {/* a peek of who's inside at the widest crack */}
          {crackCount === 3 && <circle cx="40" cy="60" r="2.6" fill="#0D0D0D" opacity="0.85" />}
          {/* who's inside? */}
          <text x="50" y="60" textAnchor="middle" fontSize="22" fontWeight="800"
            fill={inScene ? line : ink} opacity="0.3" fontFamily="inherit">{shown}</text>
        </g>
      </svg>
    );
  }

  const grown = stage === 'grown' || gold;
  const r = stage === 'hatched' ? 26 : 32; // babies are smaller
  const cy = 100 - r - 14;

  // Family accessories per level
  const accessory = (() => {
    switch (level) {
      case 1: // round chick — beak + head tuft
        return (
          <>
            <path d={`M${50 - 5} ${cy + 2} L50 ${cy + 9} L${50 + 5} ${cy + 2} Z`} fill="#F5A524" />
            <path d={`M50 ${cy - r} q-3 -9 2 -13 M50 ${cy - r} q4 -8 8 -9`} stroke={ink} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
          </>
        );
      case 2: // pebble-bug — antennae with bobbles
        return (
          <>
            <path d={`M${50 - r * 0.5} ${cy - r * 0.8} q-8 -12 -14 -14 M${50 + r * 0.5} ${cy - r * 0.8} q8 -12 14 -14`} stroke={ink} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
            <circle cx={50 - r * 0.5 - 14} cy={cy - r * 0.8 - 13} r="3.5" fill={body} stroke={ink} strokeOpacity="0.4" />
            <circle cx={50 + r * 0.5 + 14} cy={cy - r * 0.8 - 13} r="3.5" fill={body} stroke={ink} strokeOpacity="0.4" />
          </>
        );
      case 3: // special friends — two tails (two letters, two tails!)
        return (
          <path d={`M${50 - r} ${cy + 6} q-14 4 -12 16 M${50 + r} ${cy + 6} q14 4 12 16`} stroke={ink} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.65" />
        );
      case 5: // split-charm — orbiting sparkle
        return (
          <path d={`M${50 + r + 9} ${cy - r - 4} l2.4 5 5 2.4 -5 2.4 -2.4 5 -2.4 -5 -5 -2.4 5 -2.4 Z`} fill="#F6C453" stroke={ink} strokeOpacity="0.3" />
        );
      case 6: // chameleon — curled tail
        return (
          <path d={`M${50 + r - 2} ${cy + r * 0.55} q16 4 14 -8 q-2 -8 -9 -5`} stroke={ink} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.65" />
        );
      case 7: // wise bird — wing bumps + tiny beak
        return (
          <>
            <path d={`M${50 - 4} ${cy - 2} L50 ${cy + 4} L${50 + 4} ${cy - 2} Z`} fill="#F5A524" />
            <path d={`M${50 - r} ${cy} q-9 8 -3 16 M${50 + r} ${cy} q9 8 3 16`} stroke={ink} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.6" />
          </>
        );
      case 8: // champion — cape
        return (
          <path d={`M${50 - r * 0.8} ${cy - r * 0.5} L${50 - r - 12} ${cy + r + 8} L50 ${cy + r * 0.6} L${50 + r + 12} ${cy + r + 8} L${50 + r * 0.8} ${cy - r * 0.5}`} fill={ink} opacity="0.22" />
          );
      default: // L4 handled by tall body below
        return null;
    }
  })();

  const tall = level === 4; // long sounds → long creatures
  const rx = tall ? r * 0.78 : r;
  const ry = tall ? r * 1.22 : r;

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <g transform={`rotate(${tilt} 50 ${cy})`}>
        <ellipse cx="50" cy={100 - 10} rx={rx * 0.9} ry="6" fill={inScene ? '#6B4A23' : hex} opacity={inScene ? 0.22 : 0.18} />
        {level === 8 || level === 3 || level === 6 || level === 7 ? accessory : null}
        {/* body: white base + colour wash = pastel of the level colour */}
        <ellipse cx="50" cy={cy} rx={rx} ry={ry} fill="#FFFFFF" />
        <ellipse cx="50" cy={cy} rx={rx} ry={ry} fill={body} opacity={gold ? 0.85 : 0.4} stroke={ink} strokeOpacity="0.3" strokeWidth="2.5" />
        {level === 1 || level === 2 || level === 5 ? accessory : null}
        {/* eyes — tiny solid black dots ONLY (house rule) */}
        {asleep ? (
          <>
            <path d={`M${50 - 10} ${cy - ry * 0.25} h7 M${50 + 3} ${cy - ry * 0.25} h7`} stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round" />
            <text x={50 + rx * 0.75} y={cy - ry * 0.8} fontSize="11" fill={ink} opacity="0.7" fontWeight="700">z z</text>
          </>
        ) : (
          <>
            <circle cx={50 - 8} cy={cy - ry * 0.28} r="3.2" fill="#0D0D0D" />
            <circle cx={50 + 8} cy={cy - ry * 0.28} r="3.2" fill="#0D0D0D" />
            <path d={`M${50 - 4} ${cy - ry * 0.05} q4 4 8 0`} stroke="#0D0D0D" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        )}
        {/* belly badge with the grapheme */}
        <ellipse cx="50" cy={cy + ry * 0.45} rx={rx * 0.55} ry={ry * 0.34} fill="#FFFDF6" opacity="0.95" />
        <text x="50" y={cy + ry * 0.45 + 5.5} textAnchor="middle" fontSize={shown.length > 3 ? 11 : shown.length > 2 ? 13 : 16}
          fontWeight="800" fill={ink} fontFamily="inherit">{shown}</text>
        {/* golden sparkles */}
        {gold && grown && (
          <>
            <text x="16" y="26" fontSize="12">✨</text>
            <text x="74" y="18" fontSize="10">✨</text>
          </>
        )}
      </g>
    </svg>
  );
}
