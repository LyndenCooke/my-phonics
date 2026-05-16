import Layout from '@/components/Layout';
import { SoundMatsResources } from '@/components/SoundMatsResources';
import { LEVELS } from '@/lib/types';
import { FileText, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { id: 'sound-mats', label: 'Sound mats' },
  ...LEVELS.map((l) => ({ id: `level-${l.level}-worksheets`, label: `L${l.level} worksheets` })),
];

const levelBgs: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

export default function Resources() {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Resources
          </h1>
          <p className="text-base text-muted-foreground mt-2 max-w-2xl">
            Free printable phonics resources for parents and teachers. Sound mats, posters, and worksheets — all aligned with the UK Letters and Sounds curriculum.
          </p>
        </header>

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

        {LEVELS.map((l) => (
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
          </section>
        ))}
      </div>
    </Layout>
  );
}
