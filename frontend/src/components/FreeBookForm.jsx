import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';

const LEVELS = [
  { id: 1, name: 'Level 1', subtitle: 'First Sounds', color: '#E84B8A', desc: 's, a, t, p, i, n...' },
  { id: 2, name: 'Level 2', subtitle: 'New Sounds', color: '#F59E0B', desc: 'sh, ch, th, ng' },
  { id: 3, name: 'Level 3', subtitle: 'Longer Sounds', color: '#22C55E', desc: 'ee, oo, ai, igh' },
  { id: 4, name: 'Level 4', subtitle: 'Blending', color: '#3B82F6', desc: 'fr, st, mp clusters' },
  { id: 5, name: 'Level 5', subtitle: 'Split Sounds', color: '#8B5CF6', desc: 'a-e, i-e, o-e' },
  { id: 6, name: 'Level 6', subtitle: 'Reading to Learn', color: '#14B8A6', desc: 'prefixes & suffixes' },
];

export default function FreeBookForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const [childName, setChildName] = useState(location.state?.childName || '');
  const [level, setLevel] = useState(null);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = childName.trim() && level && email.trim() && consent && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/free-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_name: childName.trim(),
          level,
          email: email.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Something went wrong. Please try again.');
      }

      const data = await res.json();
      navigate('/thank-you', {
        state: {
          childName: childName.trim(),
          level,
          downloadUrl: data.download_url,
        },
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/30 font-sans relative overflow-hidden">
      {/* Background */}
      <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-pink-200/30 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-amber-200/20 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="p-4 sm:p-6">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-pink-500/20">
            <BookOpen size={18} />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-slate-800">
            MyPhonicsBooks
          </span>
        </div>
      </header>

      {/* Form */}
      <main className="relative z-10 px-4 pb-20 pt-8">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-6 sm:p-8 max-w-lg mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-2">
              Get free templates for {childName || 'your child'}
            </h1>
            <p className="text-slate-600">
              Phonics-verified book templates, ready to print at home.
            </p>
          </div>

          {/* Child's name */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Child's first name
            </label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="e.g. Emma"
              className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
              required
            />
          </div>

          {/* Level selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Reading level
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Not sure? Start with Level 1 &mdash; it's better to feel successful than to struggle.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {LEVELS.map((l) => {
                const isSelected = level === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLevel(l.id)}
                    className={`relative p-3 rounded-xl border-2 text-center transition-all ${
                      isSelected
                        ? 'border-transparent shadow-md scale-105'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                    style={isSelected ? { backgroundColor: l.color + '18', borderColor: l.color } : {}}
                  >
                    <div
                      className="w-8 h-8 rounded-lg mx-auto mb-1 flex items-center justify-center text-white text-sm font-bold shadow-sm"
                      style={{ backgroundColor: l.color }}
                    >
                      {l.id}
                    </div>
                    <span className="text-xs font-medium text-slate-700 block leading-tight">
                      {l.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Your email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
              required
            />
          </div>

          {/* Consent */}
          <div className="mb-8">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm text-slate-600 leading-relaxed">
                I'd like to receive my free templates and occasional reading tips by email. You can unsubscribe anytime.{' '}
                <a href="/privacy" className="text-pink-600 underline hover:text-pink-800">Privacy policy</a>
              </span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={!canSubmit}
            whileHover={canSubmit ? { scale: 1.02 } : {}}
            whileTap={canSubmit ? { scale: 0.98 } : {}}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              canSubmit
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-xl'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Preparing templates...
              </>
            ) : (
              <>
                Get free templates
                <ArrowRight size={20} />
              </>
            )}
          </motion.button>

          {/* Upsell hint */}
          <p className="text-center text-xs text-slate-400 mt-4">
            Want a fully personalised book with your child's name in every story?{' '}
            <span className="text-pink-500 font-medium">Customised books also available.</span>
          </p>
        </motion.form>
      </main>
    </div>
  );
}
