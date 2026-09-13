/**
 * Render each Wall of Love testimonial as a single Instagram Story image
 * (1080 x 1920 PNG) on a plain background, ready to upload to the
 * @myphonicsbooks Stories highlights.
 *
 * Source of quotes: marketing/wall-of-love-stories/testimonials.json
 *   (exported from the `public_testimonials` Supabase view, the same view
 *   that feeds /love on the website). Re-export and re-run to refresh.
 *
 * Usage:
 *   node scripts/render_wall_of_love_stories.mjs            # plain soft-white set
 *   node scripts/render_wall_of_love_stories.mjs --bg white # pure white
 *   node scripts/render_wall_of_love_stories.mjs --bg pink  # brand pink
 *
 * Output: marketing/wall-of-love-stories/<bg>/NN-<name>.png
 *
 * Needs Playwright's Chromium. Uses `playwright` from node_modules when
 * installed (repo dev dependency), otherwise `playwright-core` plus the
 * PLAYWRIGHT_CHROMIUM_PATH env var pointing at a Chromium binary.
 */
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_ROOT = path.join(ROOT, 'marketing', 'wall-of-love-stories');

// ── CLI ──
const args = process.argv.slice(2);
const bgArg = args.includes('--bg') ? args[args.indexOf('--bg') + 1] : 'soft';

const BACKGROUNDS = {
  soft: { bg: '#FCFAF5', ink: '#1A1A1A', muted: '#66666B', footer: '#1A1A1A' },
  white: { bg: '#FFFFFF', ink: '#1A1A1A', muted: '#66666B', footer: '#1A1A1A' },
  pink: { bg: '#E84B8A', ink: '#1A1A1A', muted: '#66666B', footer: '#FFFFFF' },
};
if (!BACKGROUNDS[bgArg]) {
  console.error(`Unknown --bg "${bgArg}". Use one of: ${Object.keys(BACKGROUNDS).join(', ')}`);
  process.exit(1);
}
const theme = BACKGROUNDS[bgArg];

// ── Brand ──
const ACCENTS = ['#E84B8A', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6', '#14B8A6'];
const TILTS = [-1.5, 1, -0.5, 1.5, -1, 0.5];
const STICKER = '0 2px 4px rgba(40,30,40,0.10), 0 24px 60px rgba(40,30,40,0.14)';

const W = 1080;
const H = 1920;

// ── Assets ──
const dataUri = (file, mime) => `data:${mime};base64,${readFileSync(file).toString('base64')}`;
const logo = dataUri(path.join(ROOT, 'public', 'logo', 'mpb-lockup.png'), 'image/png');

let fontCss;
try {
  const fontsDir = path.join(OUT_ROOT, 'fonts');
  fontCss = `
    @font-face { font-family: 'Outfit'; font-weight: 500 900; src: url(${dataUri(path.join(fontsDir, 'Outfit.woff2'), 'font/woff2')}) format('woff2'); }
    @font-face { font-family: 'Plus Jakarta Sans'; font-weight: 400 800; src: url(${dataUri(path.join(fontsDir, 'PlusJakartaSans.woff2'), 'font/woff2')}) format('woff2'); }
  `;
} catch {
  fontCss = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');`;
}

// ── Data ──
const testimonials = JSON.parse(readFileSync(path.join(OUT_ROOT, 'testimonials.json'), 'utf8'));

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tidy = s => s.replace(/\s+/g, ' ').trim();
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Scale the quote so short quotes feel generous and long ones still fit. */
function quoteSize(quote) {
  const n = quote.length;
  if (n <= 70) return 62;
  if (n <= 110) return 56;
  if (n <= 160) return 50;
  if (n <= 230) return 44;
  return 40;
}

function starSvg(filled) {
  const fill = filled ? '#FBBF24' : 'rgba(40,30,40,0.14)';
  return `<svg width="44" height="44" viewBox="0 0 24 24" fill="${fill}" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.5l2.94 6.26 6.86.83-5.06 4.72 1.32 6.79L12 17.77 5.94 21.1l1.32-6.79L2.2 9.59l6.86-.83L12 2.5z"/></svg>`;
}

function heartSvg() {
  return `<svg width="26" height="26" viewBox="0 0 24 24" fill="#BE1862" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-7.5-4.6-9.6-9.1C1 8.6 2.9 5 6.4 5c2 0 3.4 1.1 4.1 2.2C11.2 6.1 12.6 5 14.6 5c3.5 0 5.4 3.6 4 6.9C19.5 16.4 12 21 12 21z"/></svg>`;
}

function html(t, i) {
  const accent = ACCENTS[i % ACCENTS.length];
  const tilt = TILTS[i % TILTS.length];
  const name = t.first_name ? tidy(t.first_name) : 'A parent';
  const initial = t.first_name ? name[0].toUpperCase() : '❤';
  const quote = tidy(t.quote);
  const rating = t.rating ?? 5;

  return `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  ${fontCss}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${W}px; height: ${H}px; }
  body {
    background: ${theme.bg};
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: ${theme.ink};
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 250px 80px; /* keep clear of the Instagram UI at top and bottom */
    -webkit-font-smoothing: antialiased;
  }
  .stage { display: flex; flex-direction: column; align-items: center; gap: 56px; width: 100%; }
  .pill {
    display: inline-flex; align-items: center; gap: 12px;
    background: #fff; color: #BE1862;
    font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 30px; letter-spacing: 0.01em;
    padding: 16px 34px; border-radius: 999px; transform: rotate(-2deg);
    box-shadow: ${STICKER}; border: 3px solid #fff; outline: 3px solid #E84B8A30;
  }
  .card {
    width: 100%; background: #fff; border-radius: 56px; padding: 72px 72px 64px;
    box-shadow: ${STICKER}; border: 2px solid rgba(40,30,40,0.05);
    transform: rotate(${tilt}deg);
  }
  .stars { display: flex; gap: 6px; }
  blockquote {
    margin-top: 40px; font-size: ${quoteSize(quote)}px; line-height: 1.38; font-weight: 600;
    color: ${theme.ink}; text-wrap: pretty; overflow-wrap: anywhere;
  }
  figcaption { margin-top: 48px; display: flex; align-items: center; gap: 22px; }
  .avatar {
    width: 84px; height: 84px; border-radius: 999px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: ${accent}; color: #fff; font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 40px;
  }
  .name { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 40px; color: ${theme.ink}; }
  .role { display: block; font-size: 26px; font-weight: 600; color: ${theme.muted}; margin-top: 4px; }
  .footer { display: flex; flex-direction: column; align-items: center; gap: 18px; margin-top: 8px; }
  .footer img { width: 420px; height: auto; }
  .footer span { font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 30px; color: ${theme.footer}; opacity: 0.85; }
</style></head>
<body>
  <div class="stage">
    <div class="pill">${heartSvg()} Wall of Love</div>
    <figure class="card">
      <div class="stars">${[1, 2, 3, 4, 5].map(n => starSvg(rating >= n)).join('')}</div>
      <blockquote>“${esc(quote)}”</blockquote>
      <figcaption>
        <div class="avatar">${initial}</div>
        <div><div class="name">${esc(name)}</div><span class="role">${t.role ? esc(t.role) : 'MyPhonicsBooks family'}</span></div>
      </figcaption>
    </figure>
    <div class="footer">
      <img src="${logo}" alt="my phonics books" />
      <span>myphonicsbooks.co.uk</span>
    </div>
  </div>
</body></html>`;
}

async function launchChromium() {
  try {
    const { chromium } = require('playwright');
    return chromium.launch();
  } catch {
    const { chromium } = require('playwright-core');
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
    if (!executablePath) throw new Error('playwright not installed; set PLAYWRIGHT_CHROMIUM_PATH for playwright-core');
    return chromium.launch({ executablePath });
  }
}

const outDir = path.join(OUT_ROOT, bgArg);
mkdirSync(outDir, { recursive: true });

const browser = await launchChromium();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

for (const [i, t] of testimonials.entries()) {
  await page.setContent(html(t, i), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  // Guard: warn if the card overflows the safe zone.
  const overflow = await page.evaluate(() => {
    const s = document.querySelector('.stage').getBoundingClientRect();
    return s.height > 1920 - 2 * 250 ? Math.round(s.height) : 0;
  });
  if (overflow) console.warn(`  ! ${t.first_name ?? 'parent'}: content is ${overflow}px tall, exceeds the safe zone`);
  const file = path.join(outDir, `${String(i + 1).padStart(2, '0')}-${slug(t.first_name ?? 'parent')}.png`);
  await page.screenshot({ path: file, type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
  console.log(`  ✓ ${path.relative(ROOT, file)}`);
}

await browser.close();
console.log(`\nDone: ${testimonials.length} stories in ${path.relative(ROOT, outDir)}`);
