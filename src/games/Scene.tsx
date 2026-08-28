/**
 * Scene — painted backdrop for a fullscreen mini-game.
 *
 * The Milo's Cannon treatment for the DOM games: a full-bleed painted
 * picture-book scene (generated in the cannon_sea.webp style — detail at
 * the edges, calm centre) with a soft radial wash of the app background
 * over the middle so cards and text stay readable on top of it.
 *
 * The scene only renders once its image has actually loaded, so a missing
 * or failed asset degrades silently to the game's plain paper background —
 * the same never-break-on-a-missing-asset rule the Cannon follows.
 *
 * `fixed` positioning matches the games' existing blur-wash layers; the
 * games are portalled to document.body from /games so it resolves against
 * the viewport.
 */
import { useEffect, useState } from 'react';

interface Props {
  img: string;
  /** How much of the app background is washed over the centre:
   *  light = scene shines through (open skies), default = balanced,
   *  strong = scene becomes a tint (dark scenes under dark text). */
  wash?: 'light' | 'default' | 'strong';
}

const WASHES: Record<NonNullable<Props['wash']>, [number, number, number]> = {
  light: [0.35, 0.15, 0],
  default: [0.85, 0.55, 0.15],
  strong: [0.93, 0.72, 0.4],
};

export default function Scene({ img, wash = 'default' }: Props) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    const im = new Image();
    im.onload = () => { if (live) setLoaded(true); };
    im.src = img;
    return () => { live = false; };
  }, [img]);

  if (!loaded) return null;
  const [a, b, c] = WASHES[wash];

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 95% at 50% 40%, hsl(var(--background) / ${a}) 0%, hsl(var(--background) / ${b}) 55%, hsl(var(--background) / ${c}) 100%)`,
        }}
      />
    </div>
  );
}
