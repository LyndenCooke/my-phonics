import { SoundMatsResources } from '@/components/SoundMatsResources';
import { LEVELS } from '@/lib/types';
import { Download, FileText, Package, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { id: 'sound-mats', label: 'Sound mats' },
  { id: 'satpin-sound-pack', label: 'SATPIN sounds' },
  ...LEVELS.map((l) => ({ id: `level-${l.level}-worksheets`, label: `L${l.level} worksheets` })),
];

const levelBgs: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

type Sheet = {
  href: string;
  title: string;
  thumb?: string;
};

type Pack = {
  id: string;
  title: string;
  subtitle: string;
  bundleHref: string;
  bundleSize: string;
  sheets: Sheet[];
};

const L1_PACKS: Pack[] = [
  {
    id: 'l1-1-tap-tap-tap',
    title: 'Tap! Tap! Tap! — Worksheet Pack',
    subtitle: 'Book 1.1 · SATPIN · 5 printable A4 sheets',
    bundleHref: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/Tap_Tap_Tap_Pack.pdf',
    bundleSize: '5-page bundle',
    sheets: [
      { href: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/01_sound_hunt.pdf',         title: 'Sound Hunt',          thumb: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/01_sound_hunt.png' },
      { href: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/02_tap_the_sounds.pdf',     title: 'Tap the Sounds',      thumb: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/02_tap_the_sounds.png' },
      { href: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/03_read_and_do.pdf',        title: 'Read and Do',         thumb: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/03_read_and_do.png' },
      { href: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/04_alien_word_mission.pdf', title: 'Alien Word Mission',  thumb: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/04_alien_word_mission.png' },
      { href: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/05_story_and_draw.pdf',     title: 'Story and Draw',      thumb: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/05_story_and_draw.png' },
    ],
  },
];

const SATPIN_PACK: Pack = {
  id: 'satpin-sound-pack',
  title: 'SATPIN Single-Sound Pack',
  subtitle: 'One sheet per Level 1 starter sound — s, a, t, p, i, n',
  bundleHref: '/worksheets/Sound_Pack/SATPIN_Sound_Pack.pdf',
  bundleSize: '6-page bundle',
  sheets: [
    { href: '/worksheets/Sound_Pack/sound_s.pdf', title: 'Sound s', thumb: '/worksheets/Sound_Pack/sound_s.png' },
    { href: '/worksheets/Sound_Pack/sound_a.pdf', title: 'Sound a', thumb: '/worksheets/Sound_Pack/sound_a.png' },
    { href: '/worksheets/Sound_Pack/sound_t.pdf', title: 'Sound t', thumb: '/worksheets/Sound_Pack/sound_t.png' },
    { href: '/worksheets/Sound_Pack/sound_p.pdf', title: 'Sound p', thumb: '/worksheets/Sound_Pack/sound_p.png' },
    { href: '/worksheets/Sound_Pack/sound_i.pdf', title: 'Sound i', thumb: '/worksheets/Sound_Pack/sound_i.png' },
    { href: '/worksheets/Sound_Pack/sound_n.pdf', title: 'Sound n', thumb: '/worksheets/Sound_Pack/sound_n.png' },
  ],
};

function PackBlock({ pack, accent }: { pack: Pack; accent: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
      <div className="flex items-start gap-3 mb-4">
        <div className={`${accent} w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0`}>
          <Package className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{pack.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{pack.subtitle}</p>
        </div>
        <a
          href={pack.bundleHref}
          download
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full hover:opacity-90 active:scale-[0.97] transition-all shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Whole pack
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {pack.sheets.map((sheet) => (
          <a
            key={sheet.href}
            href={sheet.href}
            download
            target="_blank"
            rel="noopener"
            className="group bg-background rounded-xl overflow-hidden border border-border hover:shadow-md transition-all active:scale-[0.97] flex flex-col"
          >
            <div className="aspect-[1/1.4142] overflow-hidden bg-muted">
              {sheet.thumb ? (
                <img
                  src={sheet.thumb}
                  alt={`${sheet.title} preview`}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                  loading="lazy"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-muted-foreground/60" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-2">
              <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <p className="text-[11px] font-bold text-foreground truncate flex-1">{sheet.title}</p>
              <Download className="w-3 h-3 text-muted-foreground opacity-60 group-hover:opacity-100 shrink-0" />
            </div>
          </a>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3">
        {pack.bundleSize} · or pick individual sheets above
      </p>
    </div>
  );
}

export default function WorksheetsPanel() {
  return (
    <div className="max-w-6xl mx-auto">
      <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
        Free printable phonics resources for parents and teachers. Sound mats, posters, and worksheets — all aligned with the UK Letters and Sounds curriculum.
      </p>

      <nav
        aria-label="Resource categories"
        className="flex gap-2 overflow-x-auto pb-1 mb-8 scrollbar-hide sticky top-[60px] md:top-[68px] z-30 bg-background/85 backdrop-blur-md -mx-4 px-4 py-2 border-b border-border"
      >
        {CATEGORIES.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          >
            {c.label}
          </a>
        ))}
      </nav>

      <div id="sound-mats" className="scroll-mt-32">
        <SoundMatsResources />
      </div>

      <section id={SATPIN_PACK.id} className="scroll-mt-32 mb-10">
        <div className="mb-4">
          <h2 className="font-display text-xl font-extrabold text-foreground tracking-tight">
            SATPIN sound sheets
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            One A4 printable per Level 1 starter sound — for handwriting + early sound work
          </p>
        </div>
        <PackBlock pack={SATPIN_PACK} accent={levelBgs[1]} />
      </section>

      {LEVELS.map((l) => {
        const packs = l.level === 1 ? L1_PACKS : [];
        return (
          <section
            key={l.level}
            id={`level-${l.level}-worksheets`}
            className="scroll-mt-32 mb-10"
          >
            <div className="mb-4">
              <h2 className="font-display text-xl font-extrabold text-foreground tracking-tight">
                Level {l.level} worksheets
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {l.name} — {l.ageRange}
              </p>
            </div>

            {packs.length > 0 ? (
              <div className="space-y-4">
                {packs.map((p) => (
                  <PackBlock key={p.id} pack={p} accent={levelBgs[l.level]} />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card flex items-start gap-4">
                <div className={`${levelBgs[l.level]} w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Coming soon
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Printable handwriting, decoding and tricky-word worksheets for Level {l.level}. Bookmark this page — new sheets land here regularly.
                  </p>
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
