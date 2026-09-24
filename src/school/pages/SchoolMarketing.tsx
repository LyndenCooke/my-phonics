import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import {
  ArrowRight, BookOpen, Camera, CheckCircle2, ClipboardCheck, GraduationCap, Layers,
  Printer, Sparkles, Users, Grid3x3, Repeat, ListChecks, PlayCircle,
} from 'lucide-react';
import { SCHOOL_LEVELS } from '../data/levels';
import { programmeTotals } from '../data/pathway';
import { OpenWindowFeatureCard } from '../components/PathwayPieces';

// A few real storybook covers across the levels, tagged with their level
// colour, for the hero collage + "three kinds of book" imagery.
const HERO_COVERS: { key: string; level: number }[] = [
  { key: '1_1', level: 1 }, { key: '2_1', level: 2 }, { key: '3_1', level: 3 },
  { key: '4_1', level: 4 }, { key: '5_1', level: 5 }, { key: '6_1', level: 6 },
];
const HEX: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.hex]));

// A small mock roster so the dashboard preview looks alive.
const MOCK_GROUPS = [
  { level: 1, names: ['Amara', 'Yusuf', 'Lily'] },
  { level: 3, names: ['Noah', 'Zainab', 'Theo', 'Mia'] },
  { level: 5, names: ['Aisha', 'Leo', 'Grace'] },
  { level: 7, names: ['Omar', 'Ivy'] },
];

export default function SchoolMarketing() {
  const totals = programmeTotals();
  const { t } = useTranslation('schoolPublic');

  return (
    <div className="space-y-16">
      {/* ── HERO ── */}
      <section className="relative -mx-4 px-4 pt-4 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-amber-50/40 to-teal-50 -z-10" />
        <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-pink-200/30 blur-3xl -z-10" />
        <div className="absolute bottom-0 -left-10 w-72 h-72 rounded-full bg-teal-200/30 blur-3xl -z-10" />

        <div className="grid lg:grid-cols-[1.1fr,1fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur text-pink-700 text-xs font-bold uppercase tracking-wider mb-5 shadow-sm">
              <GraduationCap className="w-3.5 h-3.5" /> {t('marketing.heroBadge')}
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight leading-[1.04]">
              <Trans
                t={t}
                i18nKey="marketing.heroTitle"
                components={{ grad: <span className="bg-gradient-to-r from-pink-600 via-amber-500 to-teal-500 bg-clip-text text-transparent" /> }}
              />
            </h1>
            <p className="text-slate-600 mt-5 text-lg max-w-xl">
              {t('marketing.heroBody', { resources: totals.totalResources, steps: totals.teachingSteps })}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-7">
              <Link
                to="/school/signup"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white font-display font-extrabold rounded-2xl transition-all active:translate-y-[3px]"
                style={{ boxShadow: '0 4px 0 #0f172a, 0 14px 28px -10px rgba(15,23,42,0.45)' }}
              >
                {t('marketing.ctaTrial')} <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
              </Link>
              <Link
                to="/school/preview"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-slate-800 font-display font-extrabold rounded-2xl transition-all active:translate-y-[2px]"
                style={{ boxShadow: '0 3px 0 rgba(15,23,42,0.10), 0 8px 20px rgba(15,23,42,0.08)', border: '1px solid rgba(15,23,42,0.08)' }}
              >
                {t('marketing.ctaCurriculum')}
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-teal-500" /> {t('marketing.noCard')}</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-teal-500" /> {t('marketing.builtBy')}</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-teal-500" /> {t('marketing.setUpMinutes')}</span>
            </div>
          </div>

          {/* Cover collage */}
          <div className="relative h-[340px] sm:h-[400px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-3 sm:gap-4 rotate-3">
                {HERO_COVERS.map((c, i) => (
                  <div
                    key={c.key}
                    className="rounded-xl overflow-hidden shadow-xl ring-2 ring-white bg-white"
                    style={{ animation: 'floaty 3.5s ease-in-out infinite', animationDelay: `${i * 0.3}s` }}
                  >
                    <picture>
                      <source srcSet={`/illustrations/${c.key}/cover.webp`} type="image/webp" />
                      <img src={`/illustrations/${c.key}/cover.png`} alt="" width={140} height={186}
                        className="w-full aspect-[3/4] object-cover" loading="eager" decoding="async" draggable={false} />
                    </picture>
                    <div className="h-1.5" style={{ backgroundColor: HEX[c.level] }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <style>{`@keyframes floaty { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-7px) } }`}</style>
      </section>

      {/* ── VIDEO TOUR ── */}
      <section>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 text-pink-700 text-xs font-bold uppercase tracking-wider mb-3">
            <PlayCircle className="w-3.5 h-3.5" /> {t('marketing.tourBadge')}
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight">{t('marketing.tourTitle')}</h2>
          <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
            {t('marketing.tourBody')}
          </p>
        </div>
        <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-900/10 bg-slate-900">
          <video
            controls
            preload="metadata"
            playsInline
            poster="/videos/school-intro-poster.jpg"
            className="w-full aspect-video block"
          >
            <source src="/videos/school-intro.webm" type="video/webm" />
            <source src="/videos/school-intro.mp4" type="video/mp4" />
            <Trans
              t={t}
              i18nKey="marketing.videoFallback"
              components={{ link: <a href="/videos/school-intro.mp4" className="underline" /> }}
            />
          </video>
        </div>
      </section>

      {/* ── THE 8-LEVEL JOURNEY ── */}
      <section>
        <div className="text-center mb-6">
          <h2 className="font-display text-3xl font-extrabold tracking-tight">{t('marketing.journeyTitle')}</h2>
          <p className="text-slate-600 mt-2">{t('marketing.journeyBody')}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {SCHOOL_LEVELS.map((lvl) => (
            <div key={lvl.level} className="rounded-2xl p-3.5 text-white shadow-sm flex flex-col" style={{ backgroundColor: lvl.hex }}>
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">{t('marketing.level', { n: lvl.level })}</div>
              <div dir="ltr" lang="en" className="font-display font-extrabold leading-tight mt-0.5 text-start">{lvl.name}</div>
              <div className="text-[11px] opacity-90 mt-1">{t('ages', { range: lvl.ageRange.replace(/^Ages\s*/, '') })}</div>
              <div dir="ltr" lang="en" className="mt-2 pt-2 border-t border-white/25 text-[10px] font-medium opacity-90 leading-snug text-start">
                {lvl.gpcs.slice(0, 5).join(' ')}…
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HEADLINE NUMBERS ── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <BigStat value={`${totals.totalResources}+`} label={t('marketing.stats.resources')} tint="bg-pink-50 text-pink-700" />
        <BigStat value={`${totals.teachingSteps}`} label={t('marketing.stats.steps')} tint="bg-amber-50 text-amber-700" />
        <BigStat value="8" label={t('marketing.stats.levels')} tint="bg-teal-50 text-teal-700" />
        <BigStat value={`${totals.soundBooks + totals.blendingBooks + totals.storybooks}`} label={t('marketing.stats.books')} tint="bg-indigo-50 text-indigo-700" />
        <BigStat value={`${totals.matchedWorksheets}`} label={t('marketing.stats.worksheets')} tint="bg-rose-50 text-rose-700" />
        <BigStat value={`${totals.phonemeAudio}+`} label={t('marketing.stats.audio')} tint="bg-blue-50 text-blue-700" />
      </section>

      {/* ── THREE KINDS OF BOOK ── */}
      <section>
        <div className="text-center mb-6">
          <h2 className="font-display text-3xl font-extrabold tracking-tight">{t('marketing.bookTypesTitle')}</h2>
          <p className="text-slate-600 mt-2 max-w-2xl mx-auto">{t('marketing.bookTypesBody')}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <BookType cover="2_1" tint="#F97066" icon={<Camera className="w-4 h-4" />} kind={t('levels.soundBooks')}
            body={t('marketing.soundBooksBody')} />
          <BookType cover="3_1" tint="#F59E0B" icon={<Layers className="w-4 h-4" />} kind={t('levels.blendingBooks')}
            body={t('marketing.blendingBooksBody')} />
          <BookType cover="5_1" tint="#3B82F6" icon={<BookOpen className="w-4 h-4" />} kind={t('levels.storybooks')}
            body={t('marketing.storybooksBody')} />
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <section className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 overflow-hidden">
        <div className="grid lg:grid-cols-[1fr,1.2fr] gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pink-300 mb-3">
              <Grid3x3 className="w-4 h-4" /> {t('marketing.dashBadge')}
            </div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight">{t('marketing.dashTitle')}</h2>
            <p className="text-slate-300 mt-3">
              {t('marketing.dashBody')}
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-200">
              {[t('marketing.dashPoints.groups'), t('marketing.dashPoints.pathway'), t('marketing.dashPoints.registers')].map((x) => (
                <li key={x} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400 flex-none" /> {x}</li>
              ))}
            </ul>
          </div>
          {/* Mock groups board */}
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {MOCK_GROUPS.map((g) => {
              const lvl = SCHOOL_LEVELS.find((l) => l.level === g.level)!;
              return (
                <div key={g.level} className="rounded-xl bg-white/5 p-2.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lvl.hex }} />
                    <span dir="ltr" lang="en" className="text-[11px] font-bold">L{g.level} {lvl.name}</span>
                  </div>
                  <div className="space-y-1.5">
                    {g.names.map((n) => (
                      <div key={n} className="text-[11px] font-medium px-2 py-1 rounded-md bg-white/10">{n}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section>
        <h2 className="font-display text-3xl font-extrabold tracking-tight mb-6 text-center">{t('marketing.howTitle')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <HowStep n={1} tint="#E84B8A" icon={<ClipboardCheck className="w-4 h-4" />} title={t('marketing.how.assess.title')} body={t('marketing.how.assess.body')} />
          <HowStep n={2} tint="#F59E0B" icon={<Users className="w-4 h-4" />} title={t('marketing.how.group.title')} body={t('marketing.how.group.body')} />
          <HowStep n={3} tint="#22C55E" icon={<GraduationCap className="w-4 h-4" />} title={t('marketing.how.teach.title')} body={t('marketing.how.teach.body')} />
          <HowStep n={4} tint="#3B82F6" icon={<Sparkles className="w-4 h-4" />} title={t('marketing.how.practise.title')} body={t('marketing.how.practise.body')} />
          <HowStep n={5} tint="#8B5CF6" icon={<ListChecks className="w-4 h-4" />} title={t('marketing.how.track.title')} body={t('marketing.how.track.body')} />
          <HowStep n={6} tint="#14B8A6" icon={<Repeat className="w-4 h-4" />} title={t('marketing.how.reassess.title')} body={t('marketing.how.reassess.body')} />
        </div>
      </section>

      {/* ── WHAT SCHOOLS GET ── */}
      <section>
        <h2 className="font-display text-3xl font-extrabold tracking-tight mb-6 text-center">{t('marketing.featuresTitle')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Feature tint="bg-pink-100 text-pink-600" icon={<ClipboardCheck className="w-5 h-5" />} title={t('marketing.features.assessment.title')} body={t('marketing.features.assessment.body')} />
          <Feature tint="bg-amber-100 text-amber-600" icon={<ListChecks className="w-5 h-5" />} title={t('marketing.features.pathway.title', { steps: totals.teachingSteps })} body={t('marketing.features.pathway.body')} />
          <Feature tint="bg-teal-100 text-teal-600" icon={<Layers className="w-5 h-5" />} title={t('marketing.features.resources.title', { resources: totals.totalResources })} body={t('marketing.features.resources.body')} />
          <Feature tint="bg-indigo-100 text-indigo-600" icon={<Printer className="w-5 h-5" />} title={t('marketing.features.booklets.title')} body={t('marketing.features.booklets.body')} />
          <Feature tint="bg-rose-100 text-rose-600" icon={<Camera className="w-5 h-5" />} title={t('marketing.features.soundBooks.title')} body={t('marketing.features.soundBooks.body')} />
          <Feature tint="bg-blue-100 text-blue-600" icon={<Sparkles className="w-5 h-5" />} title={t('marketing.features.interactive.title')} body={t('marketing.features.interactive.body')} />
        </div>
      </section>

      {/* ── INTERNATIONAL + OPEN WINDOW ── */}
      <section className="grid lg:grid-cols-[2fr,1fr] gap-4 items-stretch">
        <OpenWindowFeatureCard />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-center">
          <h3 className="font-bold mb-1">{t('marketing.intlTitle')}</h3>
          <p className="text-sm text-slate-600">
            {t('marketing.intlBody')}
          </p>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section className="rounded-3xl bg-gradient-to-br from-pink-600 via-rose-500 to-amber-500 p-10 text-center text-white">
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">{t('marketing.closingTitle')}</h2>
        <p className="text-white/90 max-w-xl mx-auto mb-6">
          {t('marketing.closingBody')}
        </p>
        <Link
          to="/school/signup"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-slate-900 font-display font-extrabold rounded-2xl transition-all active:translate-y-[3px]"
          style={{ boxShadow: '0 4px 0 rgba(255,255,255,0.45), 0 14px 28px -10px rgba(0,0,0,0.25)' }}
        >
          {t('marketing.closingCta')} <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
        </Link>
      </section>
    </div>
  );
}

function BigStat({ value, label, tint }: { value: string; label: string; tint: string }) {
  return (
    <div className={`rounded-2xl p-4 text-center ${tint}`}>
      <div className="font-display text-3xl font-extrabold">{value}</div>
      <div className="text-[11px] font-semibold opacity-80 leading-tight mt-1">{label}</div>
    </div>
  );
}

function BookType({ cover, tint, icon, kind, body }: { cover: string; tint: string; icon: React.ReactNode; kind: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-[16/10] overflow-hidden" style={{ backgroundColor: `${tint}14` }}>
        <picture>
          <source srcSet={`/illustrations/${cover}/cover.webp`} type="image/webp" />
          <img src={`/illustrations/${cover}/cover.png`} alt={kind} className="w-full h-full object-cover" loading="lazy" decoding="async" draggable={false} />
        </picture>
      </div>
      <div className="p-5">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full mb-2" style={{ backgroundColor: `${tint}1a`, color: tint }}>
          {icon} {kind}
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function Feature({ icon, title, body, tint }: { icon: React.ReactNode; title: string; body: string; tint: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
      <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3 ${tint}`}>{icon}</div>
      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function HowStep({ n, icon, title, body, tint }: { n: number; icon: React.ReactNode; title: string; body: string; tint: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3">
      <div className="flex-none w-9 h-9 rounded-full text-white font-extrabold text-sm flex items-center justify-center" style={{ backgroundColor: tint }}>{n}</div>
      <div>
        <div className="font-bold text-sm flex items-center gap-1.5">{icon}{title}</div>
        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{body}</p>
      </div>
    </div>
  );
}
