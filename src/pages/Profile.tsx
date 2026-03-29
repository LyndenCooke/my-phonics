import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useChildren } from '@/hooks/useBooks';
import { supabase } from '@/integrations/supabase/client';
import { User, Baby, LogOut, Download, Settings, ChevronRight, Pencil, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: children } = useChildren();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingChild, setEditingChild] = useState(false);
  const [childName, setChildName] = useState('');
  const [childDob, setChildDob] = useState('');

  const child = children?.[0];

  const handleAddChild = async () => {
    if (!user || !childName.trim()) return;
    const { error } = await supabase.from('children').insert({
      user_id: user.id,
      name: childName.trim(),
      date_of_birth: childDob || null,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setEditingChild(false);
      setChildName('');
      setChildDob('');
      queryClient.invalidateQueries({ queryKey: ['children'] });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return (
      <Layout>
        <div className="px-4 pt-5 pb-8 max-w-lg mx-auto">
          <h2 className="text-2xl font-extrabold text-foreground mb-6 tracking-tight">Profile</h2>
          <div className="bg-card rounded-2xl border border-border p-5 mb-6 shadow-card">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-tint-pink flex items-center justify-center">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground text-lg">Welcome!</p>
                <p className="text-sm text-muted-foreground">Sign in to access your library</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-button active:scale-[0.97] transition-transform duration-200"
            >
              Sign In / Sign Up
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 pt-5 pb-8 max-w-lg mx-auto">
        <h2 className="text-2xl font-extrabold text-foreground mb-6 tracking-tight">Profile</h2>

        {/* User card */}
        <div className="bg-card rounded-2xl border border-border p-5 mb-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-tint-pink flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">{profile?.full_name || 'Parent'}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
        </div>

        {/* Child details */}
        <div className="bg-card rounded-2xl border border-border p-5 mb-6 shadow-card">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Baby className="w-4 h-4 text-primary" /> Child's Details
          </h3>

          {child ? (
            <div className="space-y-0">
              {[
                { label: 'Name', value: child.name },
                { label: 'Date of Birth', value: child.date_of_birth || 'Not set' },
                { label: 'Current Level', value: `Level ${child.current_level}`, isLevel: true },
              ].map(({ label, value, isLevel }, i, arr) => (
                <div
                  key={label}
                  className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <div className="flex items-center gap-2">
                    {isLevel ? (
                      <span className={`text-xs font-bold text-white px-2.5 py-0.5 rounded-full bg-level-${child.current_level ?? 1}`}>
                        {value}
                      </span>
                    ) : (
                      <span className="text-sm text-foreground">{value}</span>
                    )}
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          ) : editingChild ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Child's name"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="date"
                value={childDob}
                onChange={(e) => setChildDob(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex gap-2">
                <button onClick={() => setEditingChild(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium">
                  Cancel
                </button>
                <button onClick={handleAddChild} className="flex-1 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-bold shadow-button">
                  Save
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditingChild(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="w-4 h-4" /> Add child's details
            </button>
          )}
        </div>

        {/* Menu items */}
        <div className="bg-card rounded-2xl border border-border divide-y divide-border shadow-card mb-6">
          {[
            { icon: Download, label: 'Download History' },
            { icon: Settings, label: 'Account Settings' },
          ].map(({ icon: Icon, label }) => (
            <button key={label} className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-destructive/30 text-destructive text-sm font-bold hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </Layout>
  );
}
