import { Download, FileImage } from 'lucide-react';

type Mat = {
  href: string;
  title: string;
  subtitle: string;
  level: number | string;        // for the colour accent
  combined?: boolean;
};

const MATS: Mat[] = [
  { href: '/phonics/posters/level_1_poster_oneshot.png', title: 'Level 1', subtitle: 'Starting Stories — 31 sounds', level: 1 },
  { href: '/phonics/posters/level_2_poster_oneshot.png', title: 'Level 2', subtitle: 'Longer Sounds — 11 sounds',  level: 2 },
  { href: '/phonics/posters/level_3_poster_oneshot.png', title: 'Level 3', subtitle: 'New Spellings — 10 sounds',  level: 3 },
  { href: '/phonics/posters/level_4_poster_oneshot.png', title: 'Level 4', subtitle: 'Building Fluency — 6 sounds', level: 4 },
  { href: '/phonics/posters/level_5_poster_oneshot.png', title: 'Level 5', subtitle: 'Reading Together — 9 sounds', level: 5 },
  { href: '/phonics/posters/level_6_poster_oneshot.png', title: 'Level 6', subtitle: 'Reading Champion — 5 sounds', level: 6 },
  { href: '/phonics/posters/L2_L3_combined.png',         title: 'Levels 2 & 3', subtitle: '21 sounds — combined teacher chart', level: '2-3', combined: true },
  { href: '/phonics/posters/L4_L5_L6_combined.png',      title: 'Levels 4–6',   subtitle: '20 sounds — combined teacher chart', level: '4-6', combined: true },
];

const LEVEL_BG: Record<string | number, string> = {
  1: 'bg-level-1',
  2: 'bg-level-2',
  3: 'bg-level-3',
  4: 'bg-level-4',
  5: 'bg-level-5',
  6: 'bg-level-6',
  '2-3': 'bg-gradient-to-br from-level-2 to-level-3',
  '4-6': 'bg-gradient-to-br from-level-4 via-level-5 to-level-6',
};

export function SoundMatsResources() {
  return (
    <div className="mt-10 mb-6">
      <div className="mb-4">
        <h2 className="font-display text-xl font-extrabold text-foreground tracking-tight">Resources</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Printable sound mats for home and classroom — A3 landscape PNGs
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {MATS.map((mat) => (
          <a
            key={mat.href}
            href={mat.href}
            download
            target="_blank"
            rel="noopener"
            className="group relative bg-card rounded-xl overflow-hidden shadow-card border border-border hover:shadow-lg transition-all duration-200 active:scale-[0.97] flex flex-col"
          >
            {/* Poster preview thumb */}
            <div className="aspect-[3/2] overflow-hidden bg-muted">
              <img
                src={mat.href}
                alt={`${mat.title} sound mat`}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                loading="lazy"
                draggable={false}
              />
            </div>

            {/* Footer label */}
            <div className="flex items-center gap-2 p-2.5">
              <div className={`${LEVEL_BG[mat.level]} w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0`}>
                <FileImage className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{mat.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{mat.subtitle}</p>
              </div>
              <Download className="w-3.5 h-3.5 text-muted-foreground opacity-60 group-hover:opacity-100 shrink-0" />
            </div>

            {mat.combined && (
              <span className="absolute top-1.5 right-1.5 bg-amber-100 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                Combined
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
