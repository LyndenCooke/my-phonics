import { Link } from 'react-router-dom';
import {
  ArrowRight, BookOpen, Camera, ClipboardCheck, GraduationCap, Layers,
  Printer, Sparkles, Users, Grid3x3, Repeat, ListChecks,
} from 'lucide-react';
import { SCHOOL_LEVELS } from '../data/levels';
import { programmeTotals } from '../data/pathway';
import { OpenWindowFeatureCard } from '../components/PathwayPieces';

export default function SchoolMarketing() {
  const t = programmeTotals();

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="text-center pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-100 text-pink-700 text-xs font-bold uppercase tracking-wider mb-4">
          For primary &amp; international schools
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-[1.05]">
          A complete {t.teachingSteps}-step phonics pathway with {t.totalResources}+ linked resources.
        </h1>
        <p className="text-slate-600 mt-5 max-w-2xl mx-auto text-lg">
          Assess children online, group them by level and block, then teach with printable booklets,
          interactive books, worksheets, sound mats and tricky word cards.
        </p>
        <p className="text-slate-900 mt-3 max-w-2xl mx-auto font-semibold">
          Every child’s next reading step is clear. Every teacher knows what to teach, print and practise.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
          <Link to="/school/signup" className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800">
            Sign your school up — free trial <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/school/signin" className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-300 text-slate-800 font-semibold rounded-xl hover:bg-slate-50">
            Sign in
          </Link>
        </div>
        <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
          <GraduationCap className="w-4 h-4 text-slate-600" />
          Built by a British primary teacher with QTS
        </div>
      </section>

      {/* Headline numbers */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <NumberStat value={`${t.totalResources}+`} label="resources across 8 levels" />
        <NumberStat value={`${t.teachingSteps}`} label="step teaching pathway" />
        <NumberStat value={`${t.soundBooks}`} label="real-photo Sound Books" />
        <NumberStat value={`${t.blendingBooks}`} label="Blending Books" />
        <NumberStat value={`${t.storybooks}`} label="illustrated Storybooks" />
        <NumberStat value={`${t.interactiveBooks}`} label="interactive digital Storybooks" />
        <NumberStat value={`${t.matchedWorksheets}`} label="matched worksheets" />
        <NumberStat value={`${t.soundMats}`} label="sound mats" />
        <NumberStat value={`${t.trickyWordCards}`} label="tricky word card sets" />
        <NumberStat value={`${t.phonemeAudio}+`} label="phoneme audio files" />
      </section>

      {/* Pathway explanation */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-2xl font-bold mb-2">One clear pathway, three kinds of book</h2>
        <p className="text-slate-600 max-w-3xl">
          Sound Books introduce new GPCs with real photographs. Blending Books build decoding confidence.
          Storybooks apply the sounds in culturally diverse decodable narratives with built-in practice and
          full interactive versions. Children move through the pathway in clear teaching blocks.
        </p>
        <div className="mt-4">
          <Link to="/school/preview" className="inline-flex items-center gap-1.5 text-sm font-semibold text-pink-600 hover:underline">
            See the 8-level curriculum <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Open Window */}
      <section className="grid lg:grid-cols-[2fr,1fr] gap-4 items-stretch">
        <OpenWindowFeatureCard />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-center">
          <h3 className="font-bold mb-1">Made for British-curriculum schools worldwide</h3>
          <p className="text-sm text-slate-600">
            A British phonics progression in a Letters and Sounds style structure, mapped to UK, Gulf, Pakistan,
            Australian, US Common Core and IB PYP curricula — ideal for international schools in Saudi Arabia,
            Pakistan and the Gulf.
          </p>
        </div>
      </section>

      {/* What schools get */}
      <section>
        <h2 className="font-display text-2xl font-bold mb-4 text-center">What schools get</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Feature icon={<ClipboardCheck className="w-5 h-5" />} title="Online assessment" body="Place children by level and track progress across half-termly windows." />
          <Feature icon={<ListChecks className="w-5 h-5" />} title={`${t.teachingSteps}-step teaching pathway`} body="A clear sequence across 8 levels, grouped into manageable teaching blocks." />
          <Feature icon={<Layers className="w-5 h-5" />} title={`${t.totalResources}+ linked resources`} body="Every step is supported by the right printable, interactive or classroom resource." />
          <Feature icon={<Printer className="w-5 h-5" />} title="Printable A5 booklets" body="Print the right books instantly — no waiting for delivery or buying expensive book stock." />
          <Feature icon={<Camera className="w-5 h-5" />} title="Real-photo Sound Books" body="Introduce new sounds clearly with high-quality photographs." />
          <Feature icon={<Layers className="w-5 h-5" />} title="Blending Books" body="Build decoding confidence before children meet words in a story." />
          <Feature icon={<BookOpen className="w-5 h-5" />} title="Illustrated Storybooks" body="Decodable narratives with culturally diverse characters and built-in activities." />
          <Feature icon={<Sparkles className="w-5 h-5" />} title="Interactive digital books" body="Tappable words, audio, phoneme pop-ups, quizzes, spelling, grammar and story ordering." />
          <Feature icon={<Grid3x3 className="w-5 h-5" />} title="Worksheets and sound mats" body="Matched worksheets, cumulative sound mats and tricky word cards support daily teaching." />
          <Feature icon={<Users className="w-5 h-5" />} title="Teacher-led progression" body="Teachers use professional judgement between assessment windows instead of over-testing children." />
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="font-display text-2xl font-bold mb-4 text-center">How it works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <HowStep n={1} icon={<ClipboardCheck className="w-4 h-4" />} title="Assess" body="Run an initial assessment or half-termly assessment window." />
          <HowStep n={2} icon={<Users className="w-4 h-4" />} title="Group" body="Children are grouped by level and block." />
          <HowStep n={3} icon={<GraduationCap className="w-4 h-4" />} title="Teach" body="Use the pathway to teach Sound Books, Blending Books where available and Storybooks." />
          <HowStep n={4} icon={<Sparkles className="w-4 h-4" />} title="Practise" body="Use built-in storybook activities, interactive books and matched worksheets." />
          <HowStep n={5} icon={<ListChecks className="w-4 h-4" />} title="Track" body="See every child’s level, block, current step and next resource." />
          <HowStep n={6} icon={<Repeat className="w-4 h-4" />} title="Reassess" body="Use the next half-termly window to regroup and plan the next cycle." />
        </div>
      </section>

      {/* Level palette */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">8-level Letters and Sounds progression</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-w-3xl mx-auto">
          {SCHOOL_LEVELS.map((lvl) => (
            <div key={lvl.level} data-school-level={lvl.level} className="s-bg-level rounded-xl p-3 text-white text-center">
              <div className="text-xs font-semibold opacity-90">L{lvl.level}</div>
              <div className="text-xs font-bold mt-0.5 leading-tight">{lvl.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Free 30-day school trial</h2>
        <p className="text-slate-600 max-w-xl mx-auto mb-5">
          No card required. Set up your classes, place your pupils and open your first assessment window within minutes.
        </p>
        <Link to="/school/signup" className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800">
          Get started <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}

function NumberStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
      <div className="text-[11px] text-slate-500 leading-tight mt-1">{label}</div>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 text-white mb-3">{icon}</div>
      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-slate-600 text-sm">{body}</p>
    </div>
  );
}

function HowStep({ n, icon, title, body }: { n: number; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3">
      <div className="flex-none w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center">{n}</div>
      <div>
        <div className="font-bold text-sm flex items-center gap-1.5">{icon}{title}</div>
        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{body}</p>
      </div>
    </div>
  );
}
