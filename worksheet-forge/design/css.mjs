// ---------------------------------------------------------------------------
// The forge's page stylesheet. One theme colour per sheet (ledger level
// colour), Andika everywhere, mm-based A4 canvas, panels + badges + pills in
// the locked MPB house style. Ligatures killed globally (decodability: "off"
// must render as o-f-f, never a single glyph).
// ---------------------------------------------------------------------------
import { INK, PAGE, FONTS, fileUrl } from './tokens.mjs';

export function baseCSS(theme) {
  return `
@font-face { font-family:'Andika'; src:url('${fileUrl(FONTS.regular)}'); font-weight:400; }
@font-face { font-family:'Andika'; src:url('${fileUrl(FONTS.bold)}'); font-weight:700; }

* { margin:0; padding:0; box-sizing:border-box;
    font-variant-ligatures:none;
    font-feature-settings:"liga" 0,"clig" 0,"dlig" 0,"hlig" 0,"calt" 0; }
@page { size:A4; margin:0; }
html,body { width:${PAGE.w}mm; }
body { font-family:${FONTS.family}; color:${INK.text};
       -webkit-print-color-adjust:exact; print-color-adjust:exact; }

.page { width:${PAGE.w}mm; height:${PAGE.h}mm; position:relative; overflow:hidden;
        padding:${PAGE.margin}mm; display:flex; flex-direction:column; gap:3.5mm;
        page-break-after:always; background:#fff; }

/* ---------- header ---------- */
.header { background:${theme.primary}; border-radius:5mm; min-height:24mm;
          display:flex; align-items:center; padding:3mm 5mm; gap:4mm; flex:0 0 auto; }
.header .tile { background:#fff; border-radius:3.5mm; width:18mm; height:18mm; flex:0 0 auto;
                display:flex; align-items:center; justify-content:center; overflow:hidden; }
.header .tile .glyph { color:${theme.primary}; font-weight:700; font-size:11mm; line-height:1; }
.header .tile img { width:82%; height:82%; object-fit:contain; }
.header .titles { flex:1; text-align:center; color:#fff; }
.header .title { font-size:8.4mm; font-weight:700; line-height:1.12; }
.header .subtitle { font-size:3.6mm; opacity:.92; margin-top:.8mm; }
.header .pills { display:flex; flex-direction:column; gap:2mm; flex:0 0 auto; }
.header .pill { background:#fff; color:${theme.accentText}; font-weight:700; font-size:3.4mm;
                border-radius:4mm; padding:1.4mm 3.6mm; text-align:center; min-width:24mm; }

.namebar { display:flex; gap:6mm; align-items:baseline; font-size:3.8mm; color:${INK.muted};
           padding:0 1mm; flex:0 0 auto; }
.namebar .fill { flex:1; border-bottom:.4mm solid ${INK.rule}; min-height:6mm; }
.namebar .datefill { flex:0 0 34mm; border-bottom:.4mm solid ${INK.rule}; min-height:6mm; }

/* ---------- section panels ---------- */
/* Panels must never silently compress — if the page is too full they have to
   OVERFLOW so the auto-fit loop can detect it and trim content. */
.panel { border:.5mm solid ${theme.border}; border-radius:4.5mm; padding:3.5mm 4mm 4mm;
         display:flex; flex-direction:column; gap:2.6mm; background:#fff; flex:0 0 auto; }
.panel.tinted { background:${theme.light}; border-color:${theme.border}; }
.panel.grow { flex:1 0 auto; }

.sechead { display:flex; align-items:center; gap:3mm; }
.sechead .num { background:${theme.primary}; color:#fff; width:8mm; height:8mm; border-radius:50%;
                display:flex; align-items:center; justify-content:center;
                font-weight:700; font-size:4.6mm; flex:0 0 auto; }
.sechead .st { font-size:5.4mm; font-weight:700; color:${INK.text}; }
.sechead .instr { font-size:3.7mm; color:${INK.muted}; margin-left:auto; text-align:right; max-width:60%; }
.instrline { font-size:3.9mm; color:${INK.muted}; }

/* ---------- shared atoms ---------- */
.wordpill { display:inline-flex; align-items:center; justify-content:center;
            border:.45mm solid ${theme.border}; border-radius:3.5mm; background:#fff;
            padding:1.6mm 4mm; font-size:5.6mm; }
.bank { display:flex; flex-wrap:wrap; gap:2.6mm; justify-content:center;
        background:${theme.light}; border-radius:3.5mm; padding:2.8mm 3mm; }
.bank .label { font-size:3.4mm; font-weight:700; color:${theme.accentText};
               text-transform:uppercase; letter-spacing:.3mm; width:100%; text-align:center; }
.hl { color:${theme.primary}; font-weight:700; }

.artcard { border:.4mm solid ${INK.rule}; border-radius:3mm; background:#fff;
           display:flex; align-items:center; justify-content:center; overflow:hidden; }
.artcard img { width:88%; height:88%; object-fit:contain; }
.artmissing { border:.4mm dashed ${INK.rule}; border-radius:3mm; }

.tickbox { width:7mm; height:7mm; border:.5mm solid ${INK.ruleStrong}; border-radius:1.8mm;
           background:#fff; display:inline-block; }
.dot { width:2.2mm; height:2.2mm; border-radius:50%; background:${INK.text}; display:inline-block; }

/* sound buttons under a word */
/* Top-aligned so equal font-size glyphs share one baseline regardless of
   whether the button below is a dot or a bar. */
.sbword { display:inline-flex; align-items:flex-start; gap:.4mm; }
.sbg { display:inline-flex; flex-direction:column; align-items:center; gap:.9mm; }
.sbg .g { font-size:6.2mm; line-height:1.05; }
.sbg .btn-dot { width:2mm; height:2mm; border-radius:50%; background:${INK.text}; }
.sbg .btn-bar { width:100%; height:1.4mm; border-radius:1mm; background:${INK.text}; margin-top:.3mm; }
.sbg .btn-none { height:2mm; }

/* star self-check strip */
.stars { display:flex; gap:1.6mm; align-items:center; }
.stars svg { width:5.4mm; height:5.4mm; }

/* footer */
.footer { background:${INK.footerBg}; border-radius:3mm; min-height:8mm; flex:0 0 auto; margin-top:auto;
          display:flex; align-items:center; justify-content:space-between; padding:1.6mm 4mm; }
.footer .brand { font-size:3.4mm; color:${INK.muted}; }
.footer .brand b { color:${theme.primary}; }
.footer .caption { font-size:3.2mm; color:${INK.faint}; }

/* grown-up zone (quarantined adult layer) */
.grownup { background:#f7f7f7; border-radius:3mm; padding:2.4mm 3.2mm; font-size:3mm;
           color:${INK.muted}; border:.3mm solid ${INK.rule}; }
.grownup b { color:${INK.text}; }

table { border-collapse:collapse; }
`;
}

export function starSVG(color = '#c9c9c9', fill = 'none') {
  return `<svg viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z" fill="${fill}" stroke="${color}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
}
