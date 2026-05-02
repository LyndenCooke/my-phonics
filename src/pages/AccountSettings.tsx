/**
 * AccountSettings — edit the parent's profile + their child's details.
 *
 * Backed by the existing `profiles` and `children` tables. Email is
 * read-only: changing it goes through Supabase Auth's flow which needs
 * verification, deferred until we have a proper email-change UI.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useChildren } from '@/hooks/useBooks';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Mail, Lock } from 'lucide-react';

export default function AccountSettings() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: children } = useChildren();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const child = children?.[0] as { id?: string; name?: string; date_of_birth?: string } | undefined;

  const [fullName, setFullName] = useState('');
  const [childName, setChildName] = useState('');
  const [childDob, setChildDob] = useState('');
  const [saving, setSaving] = useState(false);

  // Hydrate once data lands. We track changed-vs-loaded with a separate
  // ref-style guard via the loaded values themselves — simpler than a
  // Boolean flag.
  useEffect(() => {
    if (profile?.full_name !== undefined) setFullName(profile.full_name ?? '');
  }, [profile?.full_name]);
  useEffect(() => {
    if (child?.name !== undefined) setChildName(child.name ?? '');
    if (child?.date_of_birth !== undefined) setChildDob(child.date_of_birth ?? '');
  }, [child?.name, child?.date_of_birth]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Profile name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() || null })
        .eq('id', user.id);
      if (profileError) throw profileError;

      // Child details
      if (child?.id) {
        const { error: childError } = await supabase
          .from('children')
          .update({
            name: childName.trim(),
            date_of_birth: childDob || null,
          })
          .eq('id', child.id);
        if (childError) throw childError;
      }

      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['children'] });
      toast({ title: 'Saved', description: 'Your changes are live.' });
    } catch (err) {
      toast({
        title: 'Save failed',
        description: (err as Error).message ?? 'Try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: 'Could not send reset', description: error.message, variant: 'destructive' });
      return;
    }
    toast({
      title: 'Reset email sent',
      description: `Check ${user.email} for a password-reset link.`,
    });
  };

  if (!user) {
    return (
      <Layout>
        <div className="px-4 pt-6 pb-8 max-w-lg mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-3">Sign in to edit your settings.</p>
          <button
            onClick={() => navigate('/auth')}
            className="px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-button"
          >
            Sign In
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 pt-5 pb-8 max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            aria-label="Back to Profile"
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <h1 className="font-display text-xl font-extrabold text-foreground">Account Settings</h1>
        </div>

        {/* Your details */}
        <section className="bg-card rounded-3xl border border-border p-5 shadow-card space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your details</p>

          <Field label="Your name">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Parent name"
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </Field>

          <Field label="Email">
            <div className="w-full px-4 py-3 rounded-xl bg-muted text-sm text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{user.email}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Email changes need verification — contact support if you need to switch.
            </p>
          </Field>

          <button
            onClick={handlePasswordReset}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted/50 transition-colors"
          >
            <Lock className="w-4 h-4" /> Send password reset email
          </button>
        </section>

        {/* Child details */}
        <section className="bg-card rounded-3xl border border-border p-5 shadow-card space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Child's details</p>

          {child?.id ? (
            <>
              <Field label="Child's name">
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Child's name"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </Field>
              <Field label="Date of birth">
                <input
                  type="date"
                  value={childDob}
                  onChange={(e) => setChildDob(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </Field>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No child added yet. Head back to your profile to add one.
            </p>
          )}
        </section>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-button active:scale-[0.97] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </Layout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
