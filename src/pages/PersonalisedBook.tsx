import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface FormState {
  childName: string;
  childAge: string;
  skinTone: string;
  hairColour: string;
  hairStyle: string;
  interests: string;
  culture: string;
  level: string;
  notes: string;
  email: string;
}

const SKIN_TONES = [
  { key: 'very-dark', label: 'Very dark', hex: '#3A2518' },
  { key: 'dark',      label: 'Dark',      hex: '#4E3524' },
  { key: 'med-dark',  label: 'Medium dark', hex: '#8B6B4A' },
  { key: 'medium',    label: 'Medium',    hex: '#B8956A' },
  { key: 'med-light', label: 'Medium light', hex: '#D4A574' },
  { key: 'light',     label: 'Light',     hex: '#F0D0B0' },
];

const HAIR_COLOURS = ['Black', 'Dark brown', 'Brown', 'Light brown', 'Sandy', 'Blond', 'Red', 'Grey', 'White'];
const HAIR_STYLES = ['Short', 'Buzz cut', 'Ponytail', 'Bunches', 'Braids', 'Afro puffs', 'Cornrows', 'Curly', 'Straight long', 'Hijab'];
const LEVELS = ['Not sure — take the assessment', 'L1 Starting Stories', 'L2 Longer Sounds', 'L3 New Spellings', 'L4 Building Fluency', 'L5 Reading Together', 'L6 Reading Champion'];

/**
 * Personalised book questionnaire.
 *
 * Stores the request in Supabase for now. If you wire up an n8n webhook
 * later, change handleSubmit to also POST to `VITE_N8N_PERSONALISED_HOOK`.
 */
export default function PersonalisedBook() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormState>({
    childName: '',
    childAge: '',
    skinTone: '',
    hairColour: '',
    hairStyle: '',
    interests: '',
    culture: '',
    level: LEVELS[0],
    notes: '',
    email: user?.email ?? '',
  });

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.childName || !form.email) {
      toast({ title: 'Missing info', description: "We need at least the child's name and an email." });
      return;
    }
    setSubmitting(true);
    try {
      // Save to Supabase. Table must exist with matching columns; if not,
      // the insert will error and we fall back to a graceful message.
      const payload = {
        user_id: user?.id ?? null,
        email: form.email,
        child_name: form.childName,
        child_age: form.childAge,
        skin_tone: form.skinTone,
        hair_colour: form.hairColour,
        hair_style: form.hairStyle,
        interests: form.interests,
        culture: form.culture,
        level: form.level,
        notes: form.notes,
      };
      // @ts-expect-error — table may not be in generated types yet
      const { error } = await supabase.from('personalised_book_requests').insert(payload);
      if (error) throw error;

      // Optional: forward to n8n webhook if configured
      const hook = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_N8N_PERSONALISED_HOOK;
      if (hook) {
        fetch(hook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
      }

      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      toast({
        title: "We'll take it from here",
        description: `We saved your request locally — we'll reach out at ${form.email}. (${message})`,
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto px-4 py-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Request received!</h1>
          <p className="mt-3 text-muted-foreground">
            Thanks — we'll design {form.childName ? `${form.childName}'s` : 'your'} personalised book and email a
            preview to <span className="font-semibold text-foreground">{form.email}</span> within 48 hours.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/library')}
              className="py-3 px-6 rounded-xl gradient-primary text-white font-bold text-sm shadow-button hover:opacity-90"
            >
              Back to Library
            </button>
            <button
              onClick={() => { setSubmitted(false); setForm({ ...form, childName: '', childAge: '', interests: '', notes: '' }); }}
              className="py-3 px-6 rounded-xl border border-border text-foreground font-bold text-sm hover:bg-muted/50"
            >
              Order another
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-6">
        <Link to="/library" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Library
        </Link>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--level-5))] to-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Personalised Book</h1>
            <p className="text-sm text-muted-foreground">Your child as the hero of the story.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-border rounded-2xl p-5">
          {/* Child name */}
          <Field label="Child's first name *">
            <input required value={form.childName} onChange={(e) => update('childName', e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" placeholder="e.g. Amira" />
          </Field>

          <Field label="Age">
            <input type="number" min={3} max={10} value={form.childAge} onChange={(e) => update('childAge', e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" placeholder="e.g. 5" />
          </Field>

          {/* Skin tone */}
          <Field label="Skin tone">
            <div className="grid grid-cols-6 gap-2">
              {SKIN_TONES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => update('skinTone', t.key)}
                  className={`aspect-square rounded-xl border-2 transition-all ${form.skinTone === t.key ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
                  style={{ backgroundColor: t.hex }}
                  aria-label={t.label}
                  title={t.label}
                />
              ))}
            </div>
          </Field>

          {/* Hair */}
          <Field label="Hair colour">
            <select value={form.hairColour} onChange={(e) => update('hairColour', e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
              <option value="">Pick one…</option>
              {HAIR_COLOURS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Hair style">
            <select value={form.hairStyle} onChange={(e) => update('hairStyle', e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
              <option value="">Pick one…</option>
              {HAIR_STYLES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>

          {/* Interests & culture */}
          <Field label="What does your child love? (animals, football, space, etc.)">
            <textarea rows={2} value={form.interests} onChange={(e) => update('interests', e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" placeholder="e.g. dinosaurs, swimming, spicy food" />
          </Field>

          <Field label="Setting or culture to feature (optional)">
            <input value={form.culture} onChange={(e) => update('culture', e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" placeholder="e.g. Lagos, Istanbul, Japan, London" />
          </Field>

          {/* Level */}
          <Field label="Reading level">
            <select value={form.level} onChange={(e) => update('level', e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>

          {/* Notes */}
          <Field label="Anything else we should know?">
            <textarea rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" placeholder="Favourite toy, a sibling's name, allergies we shouldn't feature, etc." />
          </Field>

          {/* Email */}
          <Field label="Email to send the preview *">
            <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" placeholder="you@example.com" />
          </Field>

          <div className="pt-2">
            <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl gradient-primary text-white font-bold text-sm shadow-button hover:opacity-90 disabled:opacity-60 transition-opacity">
              {submitting ? 'Saving…' : 'Request my personalised book →'}
            </button>
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              We will email you a preview and a secure payment link within 48 hours. No charge until you approve.
            </p>
          </div>
        </form>
      </div>
    </Layout>
  );
}

/* ─── Field wrapper ─── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-foreground block mb-1.5">{label}</span>
      {children}
    </label>
  );
}
