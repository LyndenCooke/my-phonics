/**
 * Profile — parent hub.
 *
 * Spec'd sections (top → bottom):
 *  1. Header (title + settings)
 *  2. Child card (avatar + name + level + Switch Child)
 *  3. For You card — 2-3 high-priority items
 *  4. Parent controls list: Parent View / Messages / My Rewards / Referrals
 *  5. Account list: Download History / Account Settings / Help & Support / Sign Out
 *
 * Existing widgets we keep because they're load-bearing:
 *  - ChildProgress (heat map + sound coverage — moved into Parent View)
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useChildren } from '@/hooks/useBooks';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  User, Baby, LogOut, Download, Settings, ChevronRight, Plus,
  LayoutDashboard, MessageSquare, Trophy, Users, HelpCircle, Gift, PlayCircle, Sparkles, X,
  Shield, Star,
} from 'lucide-react';
import FeedbackDialog from '@/components/FeedbackDialog';
import { LEVELS } from '@/lib/types';
import { getUnreadMessageCount } from '@/lib/nudges';
import { useNotifications } from '@/hooks/useNotifications';

// Notification icon → Lucide component. New kinds added here as the
// store grows; default falls back to Sparkles so a missing mapping
// doesn't render an empty circle.
const FOR_YOU_ICON = {
  download: Download,
  gift: Gift,
  video: PlayCircle,
  users: Users,
  reward: Trophy,
  sparkle: Sparkles,
} as const;

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
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const child = children?.[0];
  const childLevel = child?.current_level ?? 1;
  const levelInfo = LEVELS.find(l => l.level === childLevel);
  const unreadMessages = getUnreadMessageCount();
  const { notifications, dismiss: dismissNotification } = useNotifications();
  const forYouItems = notifications.filter(n => !n.read).slice(0, 3);

  const handleForYouTap = (id: string, href?: string) => {
    dismissNotification(id);
    if (href) navigate(href);
  };

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

  // ─── Signed-out state ─────────────────────────────────────────
  if (!user) {
    return (
      <Layout>
        <div className="px-4 lg:px-8 pt-5 pb-8 max-w-lg lg:max-w-3xl mx-auto">
          <h1 className="font-display text-2xl font-extrabold text-foreground mb-6 tracking-tight">Profile</h1>
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
          <section className="bg-card rounded-3xl border border-border divide-y divide-border shadow-card overflow-hidden">
            <ProfileLink to="/admin" icon={Shield} label="Admin" sub="CRM & analytics (staff only)" />
          </section>
        </div>
      </Layout>
    );
  }

  // ─── Signed-in state ──────────────────────────────────────────
  return (
    <Layout>
      <div className="px-4 lg:px-8 pt-5 pb-8 max-w-lg lg:max-w-5xl mx-auto space-y-5">
        {/* 1. Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-extrabold text-foreground tracking-tight">Profile</h1>
          <Link
            to="/profile/account"
            aria-label="Account settings"
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <Settings className="w-4 h-4 text-foreground" />
          </Link>
        </div>

        {/* 2. Child hero — full-width banner so the child anchors the page
            on laptop instead of being squashed into a grid cell. */}
        <section className="bg-gradient-to-br from-tint-pink via-card to-card rounded-3xl border border-border p-5 lg:p-6 shadow-card">
          {child ? (
            <div className="flex items-center gap-4 lg:gap-5">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-3xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                <Baby className="w-8 h-8 lg:w-10 lg:h-10 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-xl lg:text-2xl font-extrabold text-foreground leading-tight truncate">{child.name}</p>
                <span className={`inline-flex items-center mt-1.5 px-2.5 py-1 rounded-full bg-white/70 text-xs font-bold ${levelInfo?.colorClass ?? 'text-muted-foreground'}`}>
                  Level {childLevel} · {levelInfo?.name ?? ''}
                </span>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Link
                  to="/profile/parent-dashboard"
                  className="text-xs font-bold text-white gradient-primary px-3 py-1.5 rounded-xl shadow-button hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Parent View
                </Link>
                <button
                  onClick={() => setEditingChild(true)}
                  className="text-xs font-bold text-primary-ink hover:underline shrink-0"
                >
                  Switch Child
                </button>
              </div>
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
                <button onClick={() => setEditingChild(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium">Cancel</button>
                <button onClick={handleAddChild} className="flex-1 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-bold shadow-button">Save</button>
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
        </section>

        {/* Lists — two balanced columns on laptop, single stack on mobile.
            Left = alerts + feedback + parent controls; right = account. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:items-start">
        {/* Left column */}
        <div className="space-y-5">

        {/* 3. For You — unread notifications (download ready, etc.). Each
            card dismisses on tap; the CTA navigates. The section vanishes
            when the queue empties so the page doesn't sit on a hollow
            "0 new" header. */}
        {forYouItems.length > 0 && (
          <section className="bg-card rounded-3xl border border-border p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">For You</p>
              <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">
                {forYouItems.length} new
              </span>
            </div>
            <div className="space-y-2">
              {forYouItems.map(item => {
                const Icon = FOR_YOU_ICON[item.icon] ?? Sparkles;
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleForYouTap(item.id, item.ctaHref)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleForYouTap(item.id, item.ctaHref);
                      }
                    }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-tint-pink border border-primary/15 hover:border-primary/30 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                      <Icon className="w-4 h-4 text-primary-ink" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground leading-snug truncate">{item.title}</p>
                      {item.body && <p className="text-[11px] text-muted-foreground leading-snug truncate">{item.body}</p>}
                    </div>
                    {item.ctaLabel && (
                      <span className="text-xs font-bold text-primary-ink shrink-0 flex items-center gap-0.5">
                        {item.ctaLabel}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {/* Quiet dismiss — stops the card's click from also firing. */}
                    <button
                      type="button"
                      aria-label="Dismiss notification"
                      onClick={(e) => { e.stopPropagation(); dismissNotification(item.id); }}
                      className="w-7 h-7 -mr-1 rounded-full flex items-center justify-center text-muted-foreground hover:bg-white/60 hover:text-foreground shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 3b. Share feedback — opens the rating + testimonial dialog. */}
        <section className="bg-gradient-to-br from-tint-pink to-card rounded-3xl border border-primary/15 p-5 shadow-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0">
              <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-base font-extrabold text-foreground leading-tight">Share your feedback</p>
              <p className="text-xs text-muted-foreground mt-0.5">Rate the app & help us improve</p>
            </div>
          </div>
          <button
            onClick={() => setFeedbackOpen(true)}
            className="mt-4 w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-button active:scale-[0.97] transition-transform duration-200"
          >
            Leave a review
          </button>
        </section>

        {/* 4. Parent controls */}
        <section className="bg-card rounded-3xl border border-border divide-y divide-border shadow-card overflow-hidden">
          <ProfileLink
            to="/profile/parent-dashboard"
            icon={LayoutDashboard}
            label="Parent View"
            sub="Go to parent dashboard"
          />
          <ProfileLink
            to="/profile/messages"
            icon={MessageSquare}
            label="Messages"
            sub="Rewards, tips & updates"
            badge={unreadMessages}
          />
          <ProfileLink
            to="/profile/messages?type=reward"
            icon={Trophy}
            label="My Rewards"
            sub="See your unlocked rewards"
          />
          <ProfileLink
            to="/profile/referrals"
            icon={Gift}
            label="Refer & Earn"
            sub="Earn 50% commission — share your link"
          />
        </section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
        {/* 5. Account */}
        <section className="bg-card rounded-3xl border border-border divide-y divide-border shadow-card overflow-hidden">
          <ProfileLink to="/profile/downloads" icon={Download} label="Download History" />
          <ProfileLink to="/profile/account" icon={Settings} label="Account Settings" />
          <ProfileLink to="/profile/help" icon={HelpCircle} label="Help & Support" />
          <ProfileLink to="/admin" icon={Shield} label="Admin" sub="CRM & analytics (staff only)" />
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Sign Out</span>
            </div>
          </button>
        </section>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center pt-2">
          {profile?.email}
        </p>
      </div>

      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} source="profile" />
    </Layout>
  );
}

function ProfileLink({
  to, icon: Icon, label, sub, badge,
}: {
  to: string; icon: typeof Settings; label: string; sub?: string; badge?: number;
}) {
  return (
    <Link to={to} className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <span className="text-sm font-medium text-foreground block truncate">{label}</span>
          {sub && <span className="text-[11px] text-muted-foreground block truncate">{sub}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge !== undefined && badge > 0 && (
          <span className="min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center px-1.5">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </Link>
  );
}
