import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ClipboardCheck, Users, ShieldCheck } from 'lucide-react';
import { SCHOOL_LEVELS } from '../data/levels';

export default function SchoolMarketing() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-100 text-pink-700 text-xs font-bold uppercase tracking-wider mb-4">
          For primary schools
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-[1.05]">
          A complete phonics library, ready for your classroom on day one.
        </h1>
        <p className="text-slate-600 mt-5 max-w-2xl mx-auto text-lg">
          33 decodable storybooks, worksheets for every level, and a built-in assessment for every child —
          aligned to Letters & Sounds and the Phonics Screening Check.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
          <Link
            to="/school/signup"
            className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800"
          >
            Sign your school up — free trial <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/school/signin"
            className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-300 text-slate-800 font-semibold rounded-xl hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* What you get */}
      <section className="grid sm:grid-cols-3 gap-4">
        <FeatureCard
          icon={<Users className="w-5 h-5" />}
          title="Classrooms & students"
          body="Add classes, invite teachers, and keep an individual record for every child."
        />
        <FeatureCard
          icon={<ClipboardCheck className="w-5 h-5" />}
          title="Assessment per child"
          body="Diagnostic assessment puts every child on the right level. Re-assess at any time."
        />
        <FeatureCard
          icon={<BookOpen className="w-5 h-5" />}
          title="Full library access"
          body="33 storybooks + worksheets across 8 levels. Print, project, or read on screen."
        />
      </section>

      {/* Level palette */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">8-level RWI-aligned progression</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-w-3xl mx-auto">
          {SCHOOL_LEVELS.map((lvl) => (
            <div
              key={lvl.level}
              data-school-level={lvl.level}
              className="s-bg-level rounded-xl p-3 text-white text-center"
            >
              <div className="text-xs font-semibold opacity-90">L{lvl.level}</div>
              <div className="text-xs font-bold mt-0.5 leading-tight">{lvl.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
        <h2 className="text-2xl font-bold mb-2">Free 30-day school trial</h2>
        <p className="text-slate-600 max-w-xl mx-auto mb-5">
          No card required. Set up your classrooms, add your students, and run a class assessment within 10 minutes.
        </p>
        <Link
          to="/school/signup"
          className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800"
        >
          Get started <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 text-white mb-3">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-1">{title}</h3>
      <p className="text-slate-600 text-sm">{body}</p>
    </div>
  );
}
