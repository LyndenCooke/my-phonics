// ---------------------------------------------------------------------------
// Activity block library. Every block renders one activity panel as an HTML
// string. Blocks receive (data, ctx): ctx = { theme, level, grapheme, rand,
// nextNum() } — colour ONLY from ctx.theme, words already validated upstream.
// The catalogue at the bottom tells the planner what exists, what each block
// needs, and roughly how much vertical space it consumes (mm) so a sheet can
// be composed to fit one A4 page.
// ---------------------------------------------------------------------------
import { INK, CONTENT_W, fileUrl } from '../design/tokens.mjs';
import { traceLineSVG, writeLineSVG } from '../design/handwriting.mjs';
import { starSVG } from '../design/css.mjs';
import { segmentWord, segmentPhonemes, cumulativeGraphemes, hasClipart, clipartPath, containsGrapheme } from '../content/content.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- shared atoms ----------
function panel({ num, title, instr, body, tinted = false, grow = false }) {
  return `<div class="panel${tinted ? ' tinted' : ''}${grow ? ' grow' : ''}">
    <div class="sechead">
      ${num ? `<div class="num">${num}</div>` : ''}
      ${title ? `<div class="st">${esc(title)}</div>` : ''}
      ${instr ? `<div class="instr">${esc(instr)}</div>` : ''}
    </div>${body}</div>`;
}

function artCard(word, sizeMm = 22, { showLabel = false } = {}) {
  const style = `width:${sizeMm}mm;height:${sizeMm}mm;flex:0 0 auto;`;
  if (hasClipart(word)) {
    return `<div class="artcard" style="${style}"><img src="${fileUrl(clipartPath(word))}"/></div>`;
  }
  return `<div class="artcard artmissing" style="${style};font-size:3mm;color:${INK.faint}">${showLabel ? esc(word) : ''}</div>`;
}

function highlight(word, grapheme, theme) {
  if (!grapheme || !word.includes(grapheme)) return esc(word);
  const i = word.indexOf(grapheme);
  return `${esc(word.slice(0, i))}<span class="hl">${esc(grapheme)}</span>${esc(word.slice(i + grapheme.length))}`;
}

/** A word with sound buttons: dot per 1-letter grapheme, bar per digraph+. */
function soundButtonWord(word, level, { fontMm = 6.2 } = {}) {
  const seg = segmentPhonemes(word, cumulativeGraphemes(level));
  if (!seg || seg.some((g) => /-/.test(g))) {
    return `<span class="sbword"><span class="sbg"><span class="g" style="font-size:${fontMm}mm">${esc(word)}</span><span class="btn-none"></span></span></span>`;
  }
  const groups = seg.map((g) =>
    `<span class="sbg"><span class="g" style="font-size:${fontMm}mm">${esc(g)}</span>${g.length === 1 ? '<span class="btn-dot"></span>' : '<span class="btn-bar"></span>'}</span>`).join('');
  return `<span class="sbword">${groups}</span>`;
}

/** The house alien — every nonsense word on a sheet must wear one, so a child
 *  never wonders whether they misread a real word. Eyes stay solid black. */
const alienIcon = (theme, sizeMm = 7) =>
  `<svg viewBox="0 0 24 24" style="width:${sizeMm}mm;height:${sizeMm}mm"><circle cx="12" cy="13" r="7" fill="none" stroke="${theme.primary}" stroke-width="1.6"/><circle cx="9.5" cy="12" r="1.3" fill="${INK.text}"/><circle cx="14.5" cy="12" r="1.3" fill="${INK.text}"/><path d="M9.5 16c1.6 1.2 3.4 1.2 5 0" fill="none" stroke="${INK.text}" stroke-width="1.4" stroke-linecap="round"/><line x1="8" y1="7.5" x2="6.5" y2="4.5" stroke="${theme.primary}" stroke-width="1.6" stroke-linecap="round"/><line x1="16" y1="7.5" x2="17.5" y2="4.5" stroke="${theme.primary}" stroke-width="1.6" stroke-linecap="round"/><circle cx="6.5" cy="4" r="1.2" fill="${theme.primary}"/><circle cx="17.5" cy="4" r="1.2" fill="${theme.primary}"/></svg>`;

// ---------- blocks ----------
const blocks = {};

/** §Formation: model letter + dotted traces + free row. */
blocks.trace_letters = (d, ctx) => {
  const g = d.grapheme ?? ctx.grapheme;
  const xh = d.xHeightMm ?? (ctx.level <= 2 ? 11 : 9);
  const traces = Array.from({ length: d.traces ?? 4 }, () => g).join(' ');
  const body = `
    ${traceLineSVG({ model: g, text: traces, xHeightMm: xh, midlineColor: ctx.theme.border, letterSpacingMm: 2 })}
    <div style="height:1.5mm"></div>
    ${traceLineSVG({ model: g, xHeightMm: xh, midlineColor: ctx.theme.border })}`;
  return panel({ num: ctx.nextNum(), title: d.title ?? `Trace the sound ${g}`, instr: d.instr ?? 'Start at the dot. Trace, then write your own.', body });
};

/** §Trace words: art | trace word | blank line. */
blocks.trace_words = (d, ctx) => {
  const xh = d.xHeightMm ?? (ctx.level <= 2 ? 8 : 7);
  const half = (CONTENT_W - 10 - 22 - 8) / 2;
  const rows = d.words.map((w) => `
    <div style="display:flex;align-items:center;gap:4mm">
      ${artCard(w, 20)}
      <div style="flex:1">${traceLineSVG({ text: w, xHeightMm: xh, widthMm: half, midlineColor: ctx.theme.border })}</div>
      <div style="flex:1">${traceLineSVG({ xHeightMm: xh, widthMm: half, midlineColor: ctx.theme.border })}</div>
    </div>`).join('');
  return panel({ num: ctx.nextNum(), title: d.title ?? 'Trace it, then write it', instr: d.instr ?? 'Say the word. Trace it, then write it yourself.', body: rows });
};

/** §Missing grapheme cards — the gap reserves its true width (transparent run). */
blocks.missing_grapheme = (d, ctx) => {
  const xh = 8;
  const cardW = (CONTENT_W - 8 - 3 * 4) / 4;
  const cards = d.items.map(({ word, gap }) => {
    const i = word.indexOf(gap);
    const segs = [
      { text: word.slice(0, i), fill: INK.text, fontWeight: 400 },
      { text: gap, fill: 'transparent' },
      { text: word.slice(i + gap.length), fill: INK.text, fontWeight: 400 },
    ].filter((s) => s.text);
    return `<div style="width:${cardW}mm;display:flex;flex-direction:column;align-items:center;gap:1.6mm">
      ${artCard(word, 21)}
      ${traceLineSVG({ segments: segs, xHeightMm: xh, widthMm: cardW, align: 'middle', midlineColor: ctx.theme.border })}
    </div>`;
  }).join('');
  return panel({
    num: ctx.nextNum(), title: d.title ?? `Write the missing sound`,
    instr: d.instr ?? `Say the word. Write the missing ${d.gapLabel ?? 'sound'}.`,
    body: `<div style="display:flex;gap:4mm;justify-content:space-between">${cards}</div>`,
  });
};

/** §Phoneme frames (Elkonin boxes) — one box per PHONEME, worked example first. */
blocks.phoneme_frames = (d, ctx) => {
  const rows = d.words.map((w, idx) => {
    const seg = segmentPhonemes(w, cumulativeGraphemes(ctx.level)) ?? [w];
    const boxes = seg.map((g) => `
      <div style="width:15mm;height:15mm;border:.5mm solid ${ctx.theme.border};display:flex;align-items:center;justify-content:center;font-size:7mm;background:#fff;${idx === 0 ? '' : 'color:transparent;'}">${esc(g)}</div>`).join('');
    return `<div style="display:flex;align-items:center;gap:5mm">
      ${artCard(w, 19)}
      <div style="display:flex;border-radius:2.5mm;overflow:hidden;gap:0">${boxes}</div>
      <div style="margin-left:auto;display:flex;align-items:center;gap:1.2mm">
        ${seg.map(() => `<span class="dot"></span>`).join('')}
      </div>
      ${idx === 0 ? `<div style="font-size:3.2mm;color:${INK.faint};max-width:22mm">like this!</div>` : ''}
    </div>`;
  }).join('');
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Sound boxes',
    instr: d.instr ?? 'Say the word slowly. Write one sound in each box.',
    body: `<div style="display:flex;flex-direction:column;gap:3mm">${rows}</div>`,
  });
};

/** §Read and tick: picture + word choices, tick the right one. */
blocks.read_and_tick = (d, ctx) => {
  const cardW = (CONTENT_W - 8 - 2 * 4) / 3;
  const cards = d.items.map(({ word, options }) => `
    <div style="width:${cardW}mm;border:.4mm solid ${INK.rule};border-radius:3mm;padding:2.6mm;display:flex;flex-direction:column;align-items:center;gap:2mm">
      ${artCard(word, 20)}
      ${options.map((o) => `
        <div style="display:flex;align-items:center;gap:2.5mm;width:100%;padding:0 3mm">
          <span class="tickbox" style="width:5.6mm;height:5.6mm"></span>
          <span style="font-size:5.4mm">${esc(o)}</span>
        </div>`).join('')}
    </div>`).join('');
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Read and tick',
    instr: d.instr ?? 'Read all the words. Tick the word that matches the picture.',
    body: `<div style="display:flex;gap:4mm;justify-content:space-between">${cards}</div>`,
  });
};

/** §Match word ↔ picture with anchor dots. */
blocks.match_word_picture = (d, ctx) => {
  const scrambled = d.scrambled;
  const rowH = Math.max(20, Math.min(26, 120 / d.words.length));
  const left = d.words.map((w) => `
    <div style="display:flex;align-items:center;justify-content:flex-end;gap:3mm;height:${rowH}mm">
      <span class="wordpill" style="min-width:34mm;justify-content:center">${highlight(w, ctx.grapheme, ctx.theme)}</span>
      <span class="dot" style="background:${ctx.theme.primary}"></span>
    </div>`).join('');
  const right = scrambled.map((w) => `
    <div style="display:flex;align-items:center;gap:3mm;height:${rowH}mm">
      <span class="dot" style="background:${ctx.theme.primary}"></span>
      ${artCard(w, rowH - 3)}
    </div>`).join('');
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Match the word to the picture',
    instr: d.instr ?? 'Read the word. Draw a line from dot to dot.',
    body: `<div style="display:flex;justify-content:space-between;padding:0 14mm">
      <div>${left}</div><div>${right}</div></div>`,
  });
};

/** §Real or alien tick sort — PSC style, sound buttons under every word. */
blocks.real_alien_sort = (d, ctx) => {
  const rows = d.words.map(({ word }) => `
    <tr>
      <td style="padding:1.8mm 3mm;border-bottom:.3mm solid ${INK.guideFaint}">${soundButtonWord(word, ctx.level)}</td>
      <td style="text-align:center;border-bottom:.3mm solid ${INK.guideFaint}"><span class="tickbox"></span></td>
      <td style="text-align:center;border-bottom:.3mm solid ${INK.guideFaint}"><span class="tickbox"></span></td>
    </tr>`).join('');
  const alien = alienIcon(ctx.theme);
  const bookIcon = `<svg viewBox="0 0 24 24" style="width:7mm;height:7mm"><path d="M4 5c3-1.5 5.5-1.5 8 0 2.5-1.5 5-1.5 8 0v13c-3-1.5-5.5-1.5-8 0-2.5-1.5-5-1.5-8 0z" fill="none" stroke="${ctx.theme.primary}" stroke-width="1.6" stroke-linejoin="round"/><line x1="12" y1="5" x2="12" y2="18" stroke="${ctx.theme.primary}" stroke-width="1.4"/></svg>`;
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Real word or alien word?',
    instr: d.instr ?? 'Use the sound buttons to read each word. Tick real or alien.',
    body: `<table style="width:100%">
      <tr>
        <th style="text-align:left;font-size:3.6mm;color:${INK.muted};padding:0 3mm">word</th>
        <th style="width:26mm;font-size:3.6mm;color:${INK.muted}"><div style="display:flex;flex-direction:column;align-items:center">${bookIcon}real</div></th>
        <th style="width:26mm;font-size:3.6mm;color:${INK.muted}"><div style="display:flex;flex-direction:column;align-items:center">${alien}alien</div></th>
      </tr>${rows}</table>`,
  });
};

const dieFace = (n, color) => {
  const pip = (x, y) => `<circle cx="${x}" cy="${y}" r="2.1" fill="#fff"/>`;
  const P = { 1: [[12, 12]], 2: [[7, 7], [17, 17]], 3: [[7, 7], [12, 12], [17, 17]], 4: [[7, 7], [17, 7], [7, 17], [17, 17]], 5: [[7, 7], [17, 7], [12, 12], [7, 17], [17, 17]], 6: [[7, 6.5], [17, 6.5], [7, 12], [17, 12], [7, 17.5], [17, 17.5]] };
  return `<svg viewBox="0 0 24 24" style="width:8.5mm;height:8.5mm"><rect x="2" y="2" width="20" height="20" rx="4.5" fill="${color}"/>${P[n].map(([x, y]) => pip(x, y)).join('')}</svg>`;
};

/** §Roll and read — 6 die-headed columns of words; colour a word each read. */
blocks.roll_and_read = (d, ctx) => {
  const cols = d.columns;
  const rows = cols[0].length;
  const head = cols.map((_, i) => `<th style="padding:1.2mm 0;background:${ctx.theme.light};border:.4mm solid ${ctx.theme.border}">${dieFace(i + 1, ctx.theme.primary)}</th>`).join('');
  const body = Array.from({ length: rows }, (_, r) =>
    `<tr>${cols.map((c) => `<td style="border:.4mm solid ${ctx.theme.border};text-align:center;font-size:5.6mm;padding:2.4mm 1mm">${highlight(c[r] ?? '', ctx.grapheme, ctx.theme)}</td>`).join('')}</tr>`).join('');
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Roll and read',
    instr: d.instr ?? 'Roll a die. Read a word from that column, then colour it in.',
    body: `<table style="width:100%;border-radius:3mm;overflow:hidden"><tr>${head}</tr>${body}</table>`,
  });
};

/** §Speed read grid + three-read star strip. */
blocks.speed_read = (d, ctx) => {
  const perRow = 4;
  // Full rows only — a lone word on the last row reads as a mistake.
  const words = d.words.slice(0, Math.max(8, Math.floor(d.words.length / perRow) * perRow));
  const rows = [];
  for (let i = 0; i < words.length; i += perRow) rows.push(words.slice(i, i + perRow));
  const grid = rows.map((r) =>
    `<tr>${r.map((w) => `<td style="text-align:center;font-size:6.4mm;padding:2.6mm 1mm;border-bottom:.3mm solid ${INK.guideFaint}">${highlight(w, ctx.grapheme, ctx.theme)}</td>`).join('')}</tr>`).join('');
  // No three-read star strip: it turned every word grid into a timed fluency
  // drill, which is a different task from just reading the words.
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Read the words',
    instr: d.instr ?? 'Read every word out loud.',
    body: `<table style="width:100%">${grid}</table>`,
  });
};

/** §Cloze: word bank pills + sentences with a ruled gap. */
blocks.cloze_sentences = (d, ctx) => {
  const bank = `<div class="bank"><div class="label">word bank</div>${d.bank.map((w) => `<span class="wordpill">${highlight(w, ctx.grapheme, ctx.theme)}</span>`).join('')}</div>`;
  const gap = `<span style="display:inline-block;width:26mm;border-bottom:.5mm solid ${INK.ruleStrong};height:6.6mm;vertical-align:bottom"></span>`;
  const sentences = d.sentences.map((s, i) => `
    <div style="display:flex;align-items:baseline;gap:3mm;font-size:5.6mm;line-height:2">
      <span style="color:${ctx.theme.primary};font-weight:700;font-size:4.4mm">${i + 1}.</span>
      <span>${esc(s).replace(/_{2,}/g, gap)}</span>
    </div>`).join('');
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Finish the sentence',
    instr: d.instr ?? 'Choose the best word from the bank. Write it in the gap.',
    body: bank + `<div style="display:flex;flex-direction:column;gap:1.6mm;padding:0 1mm">${sentences}</div>`,
  });
};

/** §Sentence unjumble — pills keep capital + full stop attached (real clues). */
blocks.sentence_unjumble = (d, ctx) => {
  const rows = d.sentences.map(({ jumbled }) => `
    <div style="display:flex;flex-direction:column;gap:2mm">
      <div style="display:flex;gap:2.6mm;flex-wrap:wrap">${jumbled.map((w) => `<span class="wordpill" style="background:${ctx.theme.light};border-color:${ctx.theme.border}">${esc(w)}</span>`).join('')}</div>
      ${writeLineSVG({ heightMm: 10 })}
    </div>`).join('<div style="height:2mm"></div>');
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Fix the muddled sentence',
    instr: d.instr ?? 'The words are in a muddle! Write the sentence in the right order.',
    body: rows,
  });
};

/** §Read, draw, write — read band, big draw box (grows), copy lines. */
blocks.read_draw_write = (d, ctx) => {
  const lineH = ctx.level <= 3 ? 13 : 11;
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Read it, draw it, write it',
    instr: d.instr ?? 'Read the sentence. Draw it. Then copy the sentence.',
    grow: true,
    body: `
      <div style="background:${ctx.theme.light};border-radius:3mm;padding:3mm 4mm;font-size:6.2mm;text-align:center">${esc(d.sentence)}</div>
      <div style="flex:1;min-height:40mm;border:.5mm dashed ${ctx.theme.border};border-radius:3mm"></div>
      ${writeLineSVG({ heightMm: lineH })}
      ${d.twoLines ? writeLineSVG({ heightMm: lineH }) : ''}`,
  });
};

/** §Silly yes/no questions with a tick rail. */
blocks.yes_no_questions = (d, ctx) => {
  const rows = d.questions.map((q, i) => `
    <div style="display:flex;align-items:center;gap:3mm;border-bottom:.3mm solid ${INK.guideFaint};padding:1.9mm 1mm">
      <span style="color:${ctx.theme.primary};font-weight:700;font-size:4.4mm">${i + 1}.</span>
      <span style="font-size:5.4mm;flex:1">${esc(q)}</span>
      <span style="font-size:3.6mm;color:${INK.muted}">yes</span><span class="tickbox" style="width:6mm;height:6mm"></span>
      <span style="font-size:3.6mm;color:${INK.muted};margin-left:2mm">no</span><span class="tickbox" style="width:6mm;height:6mm"></span>
    </div>`).join('');
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Silly questions',
    instr: d.instr ?? 'Read each question. Tick yes or no.',
    body: rows,
  });
};

/** §Dictation — numbered write-lines + quarantined, rotated adult script.
 *  Plain rules, not 4-line trace guides: this is spelling, not letter
 *  formation (house rule — guides teach formation and clutter ordinary writing). */
blocks.dictation = (d, ctx) => {
  const lineH = ctx.level <= 3 ? 14 : 12;
  const rows = d.items.map((_, i) => `
    <div style="display:flex;align-items:flex-end;gap:3mm">
      <span style="color:${ctx.theme.primary};font-weight:700;font-size:4.6mm;width:6mm;padding-bottom:2mm">${i + 1}.</span>
      <div style="flex:1">${writeLineSVG({ heightMm: lineH, widthMm: CONTENT_W - 20 })}</div>
    </div>`).join('');
  const script = d.items.map((t, i) => `${i + 1}. ${t}`).join('&nbsp;&nbsp;&middot;&nbsp;&nbsp;');
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Listen and write',
    instr: d.instr ?? 'A grown-up reads each one. You write it — sound it out!',
    body: rows + `<div class="grownup" style="transform:rotate(180deg)"><b>Grown-ups:</b> read these aloud, one at a time. ${esc(script).replace(/&amp;/g, '&')}</div>`,
  });
};

/** §Board game — serpentine track, start/finish, event cells. THE showpiece. */
blocks.board_game = (d, ctx) => {
  const cols = 5;
  const cells = ['START', ...d.words, 'FINISH'];
  const aliens = new Set(d.aliens ?? []);
  const rows = [];
  for (let i = 0; i < cells.length; i += cols) rows.push(cells.slice(i, i + cols));
  const rowHtml = rows.map((row, r) => {
    const ordered = r % 2 === 1 ? [...row].reverse() : row;
    const pad = cols - row.length;
    const padCells = Array.from({ length: pad }, () => `<div style="flex:1"></div>`).join('');
    const cellsHtml = ordered.map((w) => {
      const idx = cells.indexOf(w);
      const isEnd = w === 'START' || w === 'FINISH';
      const ev = d.events?.[w];
      const bg = isEnd ? ctx.theme.primary : ev ? ctx.theme.light : '#fff';
      const color = isEnd ? '#fff' : INK.text;
      const evIcon = ev === 'again' ? `<div style="font-size:2.8mm;color:${ctx.theme.accentText};font-weight:700">roll again!</div>` : ev === 'miss' ? `<div style="font-size:2.8mm;color:${ctx.theme.accentText};font-weight:700">miss a turn</div>` : '';
      // Alien cells wear the alien badge — an unmarked nonsense word reads as
      // a mistake to the child.
      const alienBadge = aliens.has(w) ? `<span style="position:absolute;top:.8mm;right:1.4mm">${alienIcon(ctx.theme, 4.6)}</span>` : '';
      return `<div style="flex:1;border:.5mm solid ${ctx.theme.border};border-radius:3.5mm;background:${bg};min-height:16.5mm;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6mm;position:relative">
        <span style="position:absolute;top:1mm;left:2mm;font-size:2.6mm;color:${isEnd ? 'rgba(255,255,255,.75)' : INK.faint}">${idx === 0 ? '' : idx}</span>${alienBadge}
        <span style="font-size:${isEnd ? 4.4 : 5.4}mm;font-weight:${isEnd ? 700 : 400};color:${color}">${isEnd ? w : highlight(w, ctx.grapheme, ctx.theme)}</span>${evIcon}
      </div>`;
    }).join('');
    return `<div style="display:flex;gap:2.5mm">${r % 2 === 1 ? padCells : ''}${cellsHtml}${r % 2 === 0 ? padCells : ''}</div>`;
  }).join('');
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Read and race!',
    instr: d.instr ?? 'Roll a die and move. Read the word you land on — if you can’t, go back 2!',
    grow: true,
    body: `<div style="display:flex;flex-direction:column;gap:2.5mm;flex:1;justify-content:space-evenly">${rowHtml}</div>
      <div style="font-size:3.2mm;color:${INK.muted};text-align:center;display:flex;align-items:center;justify-content:center;gap:1.5mm">You need: a die 🎲 and a counter each. First to FINISH wins!${aliens.size ? `<span style="display:inline-flex;align-items:center;gap:1mm">${alienIcon(ctx.theme, 4)} = an alien word — not real, but you can still sound it out!</span>` : ''}</div>`,
  });
};

/** §Bingo — grid + caller word list (self-contained). */
blocks.bingo = (d, ctx) => {
  const size = d.size ?? 3;
  const grid = Array.from({ length: size }, (_, r) => `
    <tr>${Array.from({ length: size }, (_, c) => {
      const w = d.grid[r * size + c];
      const free = w === '★';
      return `<td style="width:${100 / size}%;border:.6mm solid ${ctx.theme.border};text-align:center;font-size:6mm;padding:4mm 1mm;background:${free ? ctx.theme.light : '#fff'}">${free ? starSVG(ctx.theme.primary, ctx.theme.primary) : highlight(w, ctx.grapheme, ctx.theme)}</td>`;
    }).join('')}</tr>`).join('');
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Word bingo',
    instr: d.instr ?? 'A grown-up reads words from the caller list. Cross off each word you hear. Full card = BINGO!',
    body: `<div style="display:flex;gap:5mm;align-items:flex-start">
      <table style="flex:1;width:60%;border-radius:3mm;overflow:hidden">${grid}</table>
      <div style="flex:1" class="bank"><div class="label">caller list — grown-ups only</div>
        ${d.caller.map((w) => `<span class="wordpill" style="font-size:4.4mm;padding:1.2mm 3mm">${esc(w)}</span>`).join('')}
      </div></div>`,
  });
};

/** §Sound-button mark-up: child draws the dots and bars (first is a model). */
blocks.sound_button_markup = (d, ctx) => {
  const items = d.words.map((w, i) => {
    const seg = segmentPhonemes(w, cumulativeGraphemes(ctx.level)) ?? [w];
    const shown = i === 0
      ? soundButtonWord(w, ctx.level, { fontMm: 7 })
      : `<span style="font-size:7mm;letter-spacing:.8mm">${esc(w)}</span>`;
    return `<div style="display:flex;align-items:center;gap:4mm;border-bottom:.3mm solid ${INK.guideFaint};padding:2.6mm 1mm">
      ${shown}
      <span style="margin-left:auto;font-size:3.4mm;color:${INK.muted}">sounds:</span>
      <span style="width:8mm;height:8mm;border:.4mm solid ${INK.ruleStrong};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:4.4mm;color:${i === 0 ? INK.text : 'transparent'}">${seg.length}</span>
    </div>`;
  }).join('');
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Press the sound buttons',
    instr: d.instr ?? 'Draw a dot under each sound and a bar under sounds made by two letters. Count the sounds!',
    body: items,
  });
};

/** §Best bet — circle the correct spelling (upper levels). */
blocks.best_bet = (d, ctx) => {
  const rows = d.items.map(({ options }, i) => `
    <div style="display:flex;align-items:center;gap:4mm;padding:1.6mm 0">
      <span style="color:${ctx.theme.primary};font-weight:700;font-size:4.4mm">${i + 1}.</span>
      ${options.map((o) => `<span class="wordpill" style="min-width:30mm;justify-content:center">${esc(o)}</span>`).join('')}
      <div style="flex:1">${writeLineSVG({ heightMm: 8, widthMm: 60 })}</div>
    </div>`).join('');
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Circle the real spelling',
    instr: d.instr ?? 'One spelling is right. Circle it, then write it on the line.',
    body: (d.rule ? `<div style="background:${ctx.theme.light};border-radius:2.5mm;padding:2mm 3mm;font-size:4mm;color:${ctx.theme.accentText};text-align:center;font-weight:700">${esc(d.rule)}</div>` : '') + rows,
  });
};

/** §Picture write — write the word for each picture; colour the target-sound ones. */
blocks.picture_write = (d, ctx) => {
  // Art scales with how many cards share the page: a 3x3 remake of a
  // single-activity sheet should use the space, not sit in the top third.
  const artMm = d.words.length <= 6 ? 30 : d.words.length <= 9 ? 26 : 21;
  const cells = d.words.map((w) => `
    <div style="width:31%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5mm;flex:1 0 auto;border:.4mm solid ${INK.guideFaint};border-radius:3mm;padding:2.5mm 2mm">
      ${artCard(w, artMm)}
      ${writeLineSVG({ heightMm: 9, widthMm: 42 })}
    </div>`).join('');
  const soundBit = d.grapheme ? ` Then colour the pictures whose word has ${d.grapheme}.` : '';
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Look, say, write',
    instr: d.instr ?? `Say what you see. Write the word on the line.${soundBit}`,
    grow: true,
    body: `<div style="display:flex;flex-wrap:wrap;gap:3mm;justify-content:center;align-content:space-evenly;flex:1">${cells}</div>`,
  });
};

/** §Word search — ring the hidden target-sound words in the letter grid. */
blocks.word_search = (d, ctx) => {
  const cols = d.grid[0].length;
  const gridRows = d.grid.map((row) => `<tr>${row.map((ch) =>
    `<td style="border:.35mm solid ${INK.guideFaint};width:${100 / cols}%;height:6.2mm;text-align:center;font-size:4.6mm;color:${INK.text}">${esc(ch)}</td>`).join('')}</tr>`).join('');
  const tick = `<span style="display:inline-block;width:3.2mm;height:3.2mm;border:.4mm solid ${INK.ruleStrong};border-radius:.8mm;margin-right:1.5mm;flex:0 0 auto"></span>`;
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Word search',
    instr: d.instr ?? 'Find each word and draw a ring around it. Tick it off the list.',
    body: `<div style="display:flex;gap:5mm;align-items:flex-start">
      <table style="flex:1.5;border-collapse:collapse;border:.6mm solid ${ctx.theme.border};border-radius:3mm;overflow:hidden">${gridRows}</table>
      <div style="flex:1" class="bank"><div class="label">find these words</div>
        ${d.words.map((w) => `<span class="wordpill" style="font-size:4.6mm;padding:1.2mm 3mm">${tick}${highlight(w, ctx.grapheme, ctx.theme)}</span>`).join('')}
      </div></div>`,
  });
};

/** §Crack the code — symbol cipher; decode each word and write it. */
blocks.crack_the_code = (d, ctx) => {
  const keyTiles = d.key.map(([letter, sym]) => `
    <div style="border:.4mm solid ${ctx.theme.border};border-radius:2.5mm;background:#fff;min-width:9mm;padding:1mm 1.5mm;display:flex;flex-direction:column;align-items:center;gap:.4mm">
      <span style="font-size:4.6mm;color:${ctx.theme.primary}">${esc(sym)}</span>
      <span style="font-size:4.2mm;font-weight:700">${esc(letter)}</span>
    </div>`).join('');
  const rows = d.items.map(({ symbols }, i) => `
    <div style="display:flex;align-items:center;gap:3mm;padding:1.4mm 0">
      <span style="color:${ctx.theme.primary};font-weight:700;font-size:4.4mm">${i + 1}.</span>
      <div style="display:flex;gap:1.5mm">${symbols.map((s) => `<span style="width:8mm;height:8mm;border:.4mm solid ${INK.ruleStrong};border-radius:2mm;display:inline-flex;align-items:center;justify-content:center;font-size:4.8mm;color:${ctx.theme.accentText};background:${ctx.theme.light}">${esc(s)}</span>`).join('')}</div>
      <div style="flex:1">${writeLineSVG({ heightMm: 8, widthMm: 55 })}</div>
    </div>`).join('');
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Crack the code',
    instr: d.instr ?? 'Use the key to turn the symbols back into letters. Write the secret word.',
    body: `<div style="display:flex;flex-wrap:wrap;gap:1.5mm;justify-content:center;background:${ctx.theme.light};border-radius:2.5mm;padding:2mm">${keyTiles}</div>${rows}`,
  });
};

/** §Cut-and-stick sort — cut the word cards, sort them by target sound. */
blocks.sound_sort = (d, ctx) => {
  const colBox = (label, tinted) => `
    <div style="flex:1;border:.5mm solid ${ctx.theme.border};border-radius:3mm;min-height:45mm;background:${tinted ? ctx.theme.light : '#fff'};display:flex;flex-direction:column">
      <div style="background:${ctx.theme.primary};color:#fff;font-weight:700;text-align:center;font-size:4.6mm;padding:1.6mm;border-radius:2.4mm 2.4mm 0 0">${esc(label)}</div>
    </div>`;
  const cards = d.cards.map((w) => `<span style="border:.45mm dashed ${INK.ruleStrong};border-radius:2mm;background:#fff;padding:1.8mm 3.5mm;font-size:5.4mm">${esc(w)}</span>`).join('');
  return panel({
    num: ctx.nextNum(), title: d.title ?? `Sort the ${d.grapheme} words`,
    instr: d.instr ?? 'Cut out the cards. Read each word. Stick it in the right box.',
    grow: true,
    body: `<div style="display:flex;gap:4mm;flex:1">${colBox(`has ${d.grapheme}`, true)}${colBox(`no ${d.grapheme}`, false)}</div>
      <div style="margin-top:3.5mm;border:.5mm dashed ${INK.ruleStrong};border-radius:2.5mm;padding:3mm 2.5mm 2.5mm;display:flex;flex-wrap:wrap;gap:2.5mm;justify-content:center;position:relative">
        <span style="position:absolute;top:-2.6mm;left:4mm;background:#fff;padding:0 1.5mm;font-size:3.4mm;color:${INK.muted}">✂ cut out the cards</span>
        ${cards}</div>`,
  });
};

/** §Odd one out — rows of 4, circle the one with a different sound. */
blocks.odd_one_out = (d, ctx) => {
  const rows = d.rows.map((row, i) => `
    <div style="display:flex;align-items:center;gap:3.5mm;padding:1.4mm 0">
      <span style="color:${ctx.theme.primary};font-weight:700;font-size:4.4mm">${i + 1}.</span>
      ${row.map((w) => `<span class="wordpill" style="flex:1;justify-content:center;font-size:5.8mm">${esc(w)}</span>`).join('')}
    </div>`).join('');
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Odd one out',
    instr: d.instr ?? `Read each row. Circle the word that does NOT have the ${ctx.grapheme ? `sound ${ctx.grapheme}` : 'same sound'}.`,
    body: rows,
  });
};

// ---------------------------------------------------------------------------
// Generic layouts — subject-neutral.
//
// Everything above generates its own phonics content. These take content as
// data and render a LAYOUT, so the same block serves "3 x 7 =" and "write the
// word". This is what lets the forge remake a maths sheet: the layout is ours,
// the content comes from whichever engine owns that subject.
// ---------------------------------------------------------------------------

/** §Prompt grid — a grid of cards: optional picture, a prompt, an answer line
 *  or box. Covers "write the word", "write the answer", "label the shape". */
blocks.prompt_grid = (d, ctx) => {
  const perRow = d.perRow ?? 3;
  const width = `${Math.floor(100 / perRow) - 2}%`;
  const boxed = d.answer === 'box';
  const cells = d.items.map((it) => {
    const item = typeof it === 'string' ? { prompt: it } : it;
    const art = item.picture && hasClipart(item.picture)
      ? artCard(item.picture, d.items.length <= 6 ? 28 : 22) : '';
    const answer = boxed
      ? `<div style="width:26mm;height:13mm;border:.5mm solid ${ctx.theme.border};border-radius:2.5mm;background:#fff"></div>`
      : writeLineSVG({ heightMm: 9, widthMm: 42 });
    return `
      <div style="width:${width};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2mm;flex:1 0 auto;border:.4mm solid ${INK.guideFaint};border-radius:3mm;padding:3mm 2mm">
        ${art}
        ${item.prompt ? `<div style="font-size:${d.promptMm ?? 6.4}mm;text-align:center">${esc(item.prompt)}</div>` : ''}
        ${answer}
      </div>`;
  }).join('');
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Have a go', instr: d.instr ?? '', grow: true,
    body: `<div style="display:flex;flex-wrap:wrap;gap:3mm;justify-content:center;align-content:space-evenly;flex:1">${cells}</div>`,
  });
};

/** §Question rows — numbered questions with a ruled answer or a box. */
blocks.question_rows = (d, ctx) => {
  const rows = d.items.map((it, i) => {
    const item = typeof it === 'string' ? { prompt: it } : it;
    const answer = d.answer === 'box'
      ? `<div style="width:24mm;height:11mm;border:.5mm solid ${ctx.theme.border};border-radius:2.5mm"></div>`
      : `<div style="flex:1">${writeLineSVG({ heightMm: 11 })}</div>`;
    return `
      <div style="display:flex;align-items:flex-end;gap:3mm;padding:1.4mm 0">
        <span style="color:${ctx.theme.primary};font-weight:700;font-size:4.6mm;width:7mm;padding-bottom:2mm">${i + 1}.</span>
        <span style="font-size:${d.promptMm ?? 5.6}mm;padding-bottom:1.5mm">${esc(item.prompt)}</span>
        ${answer}
      </div>`;
  }).join('');
  return panel({ num: ctx.nextNum(), title: d.title ?? 'Answer these', instr: d.instr ?? '', body: rows });
};

/** §Match columns — draw a line from each left item to its partner. Content
 *  agnostic: words↔pictures, sums↔answers, countries↔capitals.
 *
 *  Data is PAIRS, not two lists. Two parallel lists can be trimmed out of step
 *  by the auto-fit loop, which silently produces an unsolvable puzzle (drop
 *  "7 x 10" from the left and "70" stays on the right while "42" vanishes).
 *  Pairs can only be removed whole. The right column is shuffled at render. */
blocks.match_columns = (d, ctx) => {
  const pairs = d.pairs ?? d.left.map((l, i) => [l, d.right[i]]);
  const left = pairs.map((p) => p[0]);
  // Deterministic shuffle (ctx.rand is seeded), and never leave the answers
  // sitting in the same order as the prompts.
  const right = pairs.map((p) => p[1]);
  for (let i = right.length - 1; i > 0; i--) {
    const j = Math.floor(ctx.rand() * (i + 1));
    [right[i], right[j]] = [right[j], right[i]];
  }
  if (right.length > 1 && right.every((r, i) => r === pairs[i][1])) right.push(right.shift());
  d = { ...d, left, right };
  const rowH = Math.max(18, Math.min(26, 120 / Math.max(d.left.length, d.right.length)));
  const side = (items, alignEnd) => items.map((it) => {
    const item = typeof it === 'string' ? { prompt: it } : it;
    const cell = item.picture && hasClipart(item.picture)
      ? artCard(item.picture, rowH - 4)
      : `<span class="wordpill" style="min-width:34mm;justify-content:center">${esc(item.prompt)}</span>`;
    const dot = `<span class="dot" style="background:${ctx.theme.primary}"></span>`;
    return `<div style="display:flex;align-items:center;gap:3mm;height:${rowH}mm;justify-content:${alignEnd ? 'flex-end' : 'flex-start'}">${alignEnd ? `${cell}${dot}` : `${dot}${cell}`}</div>`;
  }).join('');
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Match them up',
    instr: d.instr ?? 'Draw a line from each one to its pair.',
    body: `<div style="display:flex;justify-content:space-between;padding:0 12mm">
      <div>${side(d.left, true)}</div><div>${side(d.right, false)}</div></div>`,
  });
};

/** §Fill table — a grid with some cells pre-filled and the rest blank.
 *  Times tables, number squares, tally charts, verb tables. */
blocks.fill_table = (d, ctx) => {
  const head = d.headers?.length
    ? `<tr>${d.headers.map((h) => `<th style="border:.4mm solid ${ctx.theme.border};background:${ctx.theme.light};padding:2.4mm 1mm;font-size:4.6mm">${esc(h)}</th>`).join('')}</tr>`
    : '';
  const body = d.rows.map((row) => `<tr>${row.map((cell) => {
    const filled = cell !== null && cell !== undefined && cell !== '';
    return `<td style="border:.4mm solid ${ctx.theme.border};text-align:center;font-size:5.6mm;padding:${filled ? '3mm' : '5mm'} 1mm;background:${filled ? ctx.theme.light : '#fff'}">${filled ? esc(cell) : ''}</td>`;
  }).join('')}</tr>`).join('');
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Fill in the table', instr: d.instr ?? 'Complete the empty boxes.',
    body: `<table style="width:100%;border-collapse:collapse">${head}${body}</table>`,
  });
};

/** §Illustrated write — the classic "look at the picture, write about it" row:
 *  a picture on the left, a boxed set of ruled lines on the right, repeated
 *  down the page. Picture slots may be empty (a dashed frame the child draws
 *  in, or a placeholder where the source had art we won't copy). */
blocks.illustrated_write = (d, ctx) => {
  const lines = d.linesPerItem ?? 3;
  const artW = d.artWidthMm ?? 42;
  const rows = d.items.map((it) => {
    const item = typeof it === 'string' ? { prompt: it } : (it ?? {});
    const art = item.picture && hasClipart(item.picture)
      ? artCard(item.picture, artW - 8)
      : `<div style="width:${artW - 8}mm;height:${artW - 10}mm;border:.4mm dashed ${ctx.theme.border};border-radius:3mm"></div>`;
    const ruled = Array.from({ length: lines }, () => writeLineSVG({ heightMm: d.lineGapMm ?? 10 })).join('');
    return `
      <div style="display:flex;align-items:center;gap:3mm;flex:1 0 auto">
        <div style="width:${artW}mm;display:flex;flex-direction:column;align-items:center;gap:1mm;flex:0 0 auto">
          ${art}
          ${item.prompt ? `<div style="font-size:4mm;text-align:center">${esc(item.prompt)}</div>` : ''}
        </div>
        <div style="flex:1;border:.5mm solid ${ctx.theme.border};border-radius:4mm;padding:2.5mm 4mm">${ruled}</div>
      </div>`;
  }).join('');
  // Model answers ride upside-down at the foot, the same convention as the
  // dictation script: a grown-up can prompt with them, the child can't casually
  // read the sentence they're supposed to be composing.
  // Numbers must match the ROW they belong to. `answers` is aligned to `items`,
  // so a gap (a row whose picture failed to draw) leaves its number out rather
  // than shifting every later prompt onto the wrong picture.
  const answers = (d.answers ?? [])
    .map((a, i) => ({ a, n: i + 1 }))
    .filter((x) => x.a);
  const key = answers.length
    ? `<div class="grownup" style="transform:rotate(180deg)"><b>Grown-ups:</b> ideas to prompt with — ${answers.map((x) => `${x.n}. ${esc(x.a)}`).join('&nbsp; ')}</div>`
    : '';
  return panel({
    num: ctx.nextNum(), title: d.title ?? 'Write about the picture',
    instr: d.instr ?? '', grow: true,
    body: `<div style="display:flex;flex-direction:column;gap:3mm;flex:1;justify-content:space-evenly">${rows}</div>${key}`,
  });
};

/** §Check strip — the self-marking reminder bar that closes a writing sheet
 *  ("Check: capital letters, gaps, full stops"). Not numbered: it's a prompt
 *  about the work above, not another activity. */
blocks.check_strip = (d, ctx) => {
  const tick = `<svg viewBox="0 0 24 24" style="width:5mm;height:5mm;flex:0 0 auto"><path d="M4 13l5 5L20 6" fill="none" stroke="${ctx.theme.primary}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const items = (d.items ?? ['capital letters', 'gaps', 'full stops']).map((label) =>
    `<span style="display:inline-flex;align-items:center;gap:1.6mm;font-size:4.4mm">${tick}${esc(label)}</span>`).join('');
  return `<div style="display:flex;align-items:center;gap:5mm;border:.5mm solid ${ctx.theme.border};border-radius:3mm;padding:2.5mm 4mm;margin-top:1mm;flex:0 0 auto">
    <b style="font-size:4.6mm;color:${ctx.theme.accentText}">${esc(d.title ?? 'Check')}</b>${items}</div>`;
};

export function renderBlock(spec, ctx) {
  const fn = blocks[spec.type];
  if (!fn) throw new Error(`Unknown block type "${spec.type}". Known: ${Object.keys(blocks).join(', ')}`);
  return fn(spec, ctx);
}

// ---------------------------------------------------------------------------
// Catalogue — what the planner may use. approxH = typical mm consumed.
// ---------------------------------------------------------------------------
export const CATALOG = {
  trace_letters:      { approxH: 48, levels: [1, 4], needs: 'grapheme', desc: 'Letter formation: model + dotted traces + free write row (4-line guides).' },
  trace_words:        { approxH: 16, perItem: 25, trim: 'words', minItems: 2, levels: [1, 4], needs: 'words(2-4, clipart preferred)', desc: 'Rows: picture card, dotted word to trace, blank line to write.' },
  missing_grapheme:   { approxH: 58, levels: [1, 6], needs: 'items[{word,gap}] x4 with clipart', desc: 'Picture cards; write the missing grapheme in a width-true gap.' },
  phoneme_frames:     { approxH: 16, perItem: 24, trim: 'words', minItems: 2, levels: [1, 4], needs: 'words(3) with clipart, no split digraphs', desc: 'Elkonin sound boxes — one box per phoneme, worked example first.' },
  read_and_tick:      { approxH: 68, levels: [1, 5], needs: 'items[{word,options[3]}] x3 with clipart', desc: 'Picture + three near-miss words; tick the right one.' },
  match_word_picture: { approxH: 18, perItem: 23, trim: 'words', minItems: 3, levels: [1, 4], needs: 'words(4-5) with clipart', desc: 'Draw dot-to-dot lines from words to scrambled pictures.' },
  real_alien_sort:    { approxH: 26, perItem: 16, trim: 'words', minItems: 4, levels: [2, 8], needs: 'words[{word,alien}] x5-6', desc: 'PSC-style: read with sound buttons, tick real or alien.' },
  roll_and_read:      { approxH: 84, levels: [1, 8], needs: 'columns[6][4]', desc: 'Six die-face columns of words; roll, read, colour. Repeat-play.' },
  speed_read:         { approxH: 26, perItem: 3.6, trim: 'words', minItems: 8, levels: [1, 8], needs: 'words(12-16)', desc: 'Austere fluency grid + three-read star strip.' },
  cloze_sentences:    { approxH: 48, perItem: 12, trim: 'sentences', minItems: 2, levels: [3, 8], needs: 'bank + sentences(3-4) with ___ gaps', desc: 'Word bank pills; write the missing word in the gap.' },
  sentence_unjumble:  { approxH: 14, perItem: 26, trim: 'sentences', minItems: 1, levels: [3, 8], needs: 'sentences[{jumbled[]}] x2', desc: 'Muddled word pills; write the sentence correctly.' },
  read_draw_write:    { approxH: 82, levels: [1, 6], needs: 'sentence', desc: 'Read a sentence, illustrate it in a big frame, copy it. (Flexible height)' },
  yes_no_questions:   { approxH: 16, perItem: 13, trim: 'questions', minItems: 3, levels: [3, 8], needs: 'questions(4-6, silly + decodable)', desc: 'Absurd decodable questions with yes/no tick rail.' },
  dictation:          { approxH: 22, perItem: 14, trim: 'items', minItems: 2, levels: [1, 8], needs: 'items(3-4 words or sentences)', desc: 'Numbered write-lines + rotated grown-up script panel.' },
  board_game:         { approxH: 115, levels: [1, 8], needs: 'words(13-18), events{word:again|miss}, aliens[]', desc: 'Serpentine reading race track with event cells; alien cells badged. Needs die + counters.' },
  // RETIRED 2026-07-24: caller list + child's card share one sheet, so the
  // game self-spoils. No recipe plans it; kept only so old spec JSONs render.
  bingo:              { approxH: 76, levels: [1, 8], needs: 'grid(9 incl ★) + caller(12)', desc: 'RETIRED — 3×3 word bingo + caller list on one sheet.' },
  sound_button_markup:{ approxH: 20, perItem: 20, trim: 'words', minItems: 3, levels: [2, 8], needs: 'words(4-5)', desc: 'Child draws dots/bars under graphemes and counts phonemes; first is a model.' },
  best_bet:           { approxH: 30, perItem: 19, trim: 'items', minItems: 3, levels: [5, 8], needs: 'items[{options[3]}] x3-4 + rule banner', desc: 'Circle the correct spelling among plausible alternatives; rewrite it.' },
  odd_one_out:        { approxH: 20, perItem: 19, trim: 'rows', minItems: 3, levels: [1, 8], needs: 'rows[4 words] x4', desc: 'Circle the word without the target sound.' },
  picture_write:      { approxH: 84, perItem: 8, trim: 'words', minItems: 6, perRow: 3, maxItems: 9, levels: [1, 8], needs: 'words(6) with clipart, mixed target/other', desc: 'Picture grid: write the word for each picture; colour the ones with the target sound.' },
  word_search:        { approxH: 80, levels: [2, 8], needs: 'grid(8x11) + words(5-6)', desc: 'Letter grid hiding target-sound words; ring them and tick the list.' },
  crack_the_code:     { approxH: 24, perItem: 15, trim: 'items', minItems: 3, levels: [2, 8], needs: 'key + items(4)', desc: 'Symbol cipher: decode each word and write it on the line.' },
  sound_sort:         { approxH: 96, levels: [2, 8], needs: 'cards(8) mixed has/has-not', desc: 'Cut-and-stick: sort word cards into has-the-sound / not columns.' },

  // --- generic layouts: any subject, content supplied rather than generated ---
  prompt_grid:        { approxH: 84, perItem: 9, trim: 'items', minItems: 4, perRow: 3, maxItems: 12, levels: [1, 8], generic: true, needs: 'items[{prompt,picture?}]', desc: 'Grid of cards: optional picture, a prompt, an answer line or box.' },
  question_rows:      { approxH: 20, perItem: 15, trim: 'items', minItems: 3, maxItems: 10, levels: [1, 8], generic: true, needs: 'items[{prompt}]', desc: 'Numbered questions, each with a ruled answer line or an answer box.' },
  match_columns:      { approxH: 24, perItem: 22, trim: 'pairs', minItems: 3, levels: [1, 8], generic: true, needs: 'pairs[[left,right]]', desc: 'Draw a line from each left item to its partner on the right.' },
  fill_table:         { approxH: 70, levels: [1, 8], generic: true, needs: 'rows[][] (null = blank cell), headers?', desc: 'A table with some cells filled and the rest blank to complete.' },
  illustrated_write:  { approxH: 24, perItem: 46, trim: 'items', minItems: 2, maxItems: 5, levels: [1, 8], generic: true, needs: 'items[{picture?,prompt?}], linesPerItem', desc: 'Rows of picture + a boxed set of ruled lines: look at it, write about it.' },
  check_strip:        { approxH: 14, levels: [1, 8], generic: true, needs: 'items[label]', desc: 'Self-check reminder bar (capital letters / gaps / full stops). Not an activity.' },
};
