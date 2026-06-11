import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { INK, RADIUS } from '@/design/tokens';
import { GRAMMAR_ASSETS } from '@/data/grammarAssets';

// ---------------------------------------------------------------------------
// Clipart — pulls a picture from the OWNED clipart library (/public/clipart),
// keyed by imageKey. NEVER generates an image. If the asset is missing it
// renders a deterministic dashed placeholder box (so the page still lays out
// and `npm run validate` can warn you which words need art) instead of a
// broken-image icon. This is a server component — the fs check runs at render.
// ---------------------------------------------------------------------------

const CLIPART_DIR = path.join(process.cwd(), 'public', 'clipart');
const EXTS = ['svg', 'png', 'webp', 'jpg'];

function resolveClipart(imageKey: string): string | null {
  // Manifest gate: a key in the grammar manifest renders ONLY when its approved
  // art is in place (status 'ok'). A file alone is not enough — an off-style
  // file (wrong eyes, colour) must never reach a page; the slot stays empty and
  // `npm run validate` reports it. Keys outside the manifest (the sound-sheet
  // word clipart) keep the plain file-existence check.
  const entry = GRAMMAR_ASSETS[imageKey];
  if (entry && entry.status !== 'ok') return null;
  for (const ext of EXTS) {
    const file = `${imageKey}.${ext}`;
    if (fs.existsSync(path.join(CLIPART_DIR, file))) return `/clipart/${file}`;
  }
  return null;
}

/** True when owned clipart art exists for this key. Lets a template reserve an
 *  icon slot ONLY when the picture exists, so sheets without grammar art yet
 *  stay clean (no empty boxes) instead of showing placeholders. */
export function hasClipart(imageKey?: string): boolean {
  return !!imageKey && resolveClipart(imageKey) !== null;
}

interface Props {
  imageKey: string;
  /** Word, shown in the placeholder when art is missing. */
  word: string;
  size?: number; // mm (square)
  /** When art is missing, render just the faint word (no dashed box). Use this
   *  inside an already-bordered card so the placeholder stays clean. */
  plain?: boolean;
  /** When art is missing, render an EMPTY box (no text at all). Picture sheets
   *  must never show a word as a stand-in for the image (the picture has to
   *  communicate the word), so missing art is left blank and reported instead. */
  blank?: boolean;
  /** Blend the image with `multiply` so a pure-white background disappears
   *  against a white card (no "pasted-on box" look). Safe only on white cards. */
  multiply?: boolean;
  /** Fill the PARENT box (100% × contain) instead of a fixed square. The art is
   *  pre-trimmed (scripts/trim-clipart.mjs) so "contain" makes the object fill
   *  the card with NO cropping. Use this on picture sheets. */
  fill?: boolean;
}

export default function Clipart({ imageKey, word, size = 18, plain = false, blank = false, multiply = false, fill = false }: Props) {
  const src = resolveClipart(imageKey);
  const box: React.CSSProperties = fill
    ? { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }
    : {
        width: `${size}mm`,
        height: `${size}mm`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '0 0 auto',
      };

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <div style={box}>
        <img
          src={src}
          alt={word}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            mixBlendMode: multiply ? 'multiply' : undefined,
          }}
        />
      </div>
    );
  }

  if (blank) {
    return <div style={{ ...box }} title={`Missing clipart: ${imageKey}`} />;
  }

  if (plain) {
    return (
      <div style={{ ...box, color: INK.faint, fontSize: '9pt', textAlign: 'center' }} title={`Missing clipart: ${imageKey}`}>
        {word}
      </div>
    );
  }

  return (
    <div
      style={{
        ...box,
        border: `0.3mm dashed ${INK.rule}`,
        borderRadius: RADIUS.card,
        color: INK.faint,
        fontSize: '8pt',
        textAlign: 'center',
        padding: '1mm',
      }}
      title={`Missing clipart: ${imageKey}`}
    >
      {word}
    </div>
  );
}
