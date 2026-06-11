// ---------------------------------------------------------------------------
// measure-font.mjs — print the TRUE handwriting metrics of a .ttf, read from
// the actual glyph bounding boxes (not the OS/2 table, which on literacy fonts
// is padded for diacritics and lies about the visible ascender).
//
// These numbers drive the SVG handwriting guideline system in
// src/design/handwriting.ts. When you swap the trace font, run:
//     node scripts/measure-font.mjs public/fonts/<TheFont>.ttf
// and paste the printed `xHeight / ascender / capHeight / descender` em-ratios
// into TRACE_METRICS.
//
// All ratios are in em units (font-size = 1em). baseline = 0.
// ---------------------------------------------------------------------------

import fs from 'node:fs';

function readFont(p) {
  const b = fs.readFileSync(p);
  const num = b.readUInt16BE(4);
  const t = {};
  for (let i = 0; i < num; i++) {
    const o = 12 + i * 16;
    t[b.toString('ascii', o, o + 4)] = b.readUInt32BE(o + 8);
  }
  const upm = b.readUInt16BE(t.head + 18);
  const locFmt = b.readInt16BE(t.head + 50);

  // cmap: prefer a (3,1) or (3,0) or (0,*) format-4 unicode subtable.
  const cmap = t.cmap;
  const nt = b.readUInt16BE(cmap + 2);
  let sub = null;
  for (let i = 0; i < nt; i++) {
    const o = cmap + 4 + i * 8;
    const pid = b.readUInt16BE(o);
    const eid = b.readUInt16BE(o + 2);
    const off = b.readUInt32BE(o + 4);
    if ((pid === 3 && (eid === 1 || eid === 0)) || pid === 0) sub = cmap + off;
  }

  function gid(cp) {
    const segX2 = b.readUInt16BE(sub + 6);
    const seg = segX2 / 2;
    const endO = sub + 14;
    const startO = endO + segX2 + 2;
    const deltaO = startO + segX2;
    const rangeO = deltaO + segX2;
    for (let i = 0; i < seg; i++) {
      const end = b.readUInt16BE(endO + i * 2);
      if (cp <= end) {
        const start = b.readUInt16BE(startO + i * 2);
        if (cp < start) return 0;
        const delta = b.readInt16BE(deltaO + i * 2);
        const ro = b.readUInt16BE(rangeO + i * 2);
        if (ro === 0) return (cp + delta) & 0xffff;
        const gi = b.readUInt16BE(rangeO + i * 2 + ro + (cp - start) * 2);
        return gi === 0 ? 0 : (gi + delta) & 0xffff;
      }
    }
    return 0;
  }

  function loca(g) {
    return locFmt === 0
      ? b.readUInt16BE(t.loca + g * 2) * 2
      : b.readUInt32BE(t.loca + g * 4);
  }

  function bbox(ch) {
    const g = gid(ch.codePointAt(0));
    const o1 = loca(g);
    const o2 = loca(g + 1);
    if (o2 <= o1) return null; // empty glyph (e.g. space)
    const o = t.glyf + o1;
    return { yMin: b.readInt16BE(o + 4), yMax: b.readInt16BE(o + 8) };
  }

  const top = (chars) => Math.max(...chars.map((c) => bbox(c)?.yMax ?? -Infinity));
  const bot = (chars) => Math.min(...chars.map((c) => bbox(c)?.yMin ?? Infinity));

  const xHeight = top(['x', 'o', 'a', 'n', 'u']) / upm;
  const ascender = top(['h', 'b', 'd', 'k', 'l']) / upm;
  const capHeight = top(['H', 'I', 'T']) / upm;
  const descender = -bot(['p', 'q', 'g', 'y', 'j']) / upm;

  return { upm, xHeight, ascender, capHeight, descender };
}

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/measure-font.mjs <font.ttf>');
  process.exit(1);
}
const m = readFont(file);
const r = (n) => Number(n.toFixed(4));
console.log(file);
console.log({
  unitsPerEm: m.upm,
  xHeight: r(m.xHeight),
  ascender: r(m.ascender),
  capHeight: r(m.capHeight),
  descender: r(m.descender),
});
