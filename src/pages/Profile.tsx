/**
 * Profile — parent hub. "Paper & stickers" design language.
 *
 * Landscape on laptop: child hero banner up top, then THREE columns
 * (For You + feedback · Parent controls · Account) so the whole page fits
 * a laptop viewport without scrolling. Mobile stays a single scroll stack.
 *
 * Sections:
 *  1. Header (title + settings)
 *  2. Child hero (avatar sticker + name + journey level + Switch Child)
 *  3. For You — unread notifications
 *  3b. Share the love — leave a review + Wall of Love link
 *  4. Parent controls list: Assess / Parent View / Messages / My Rewards / Referrals
 *     (Assess lives here on phones — the bottom bar gave its slot to
 *     Create a Book; the desktop sidebar still lists it.)
 *  5. Account list: Download History / Account Settings / Help & Support / Sign Out
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
  User, LogOut, Download, Settings, ChevronRight, Plus,
  LayoutDashboard, MessageSquare, Trophy, Users, HelpCircle, Gift, PlayCircle, Sparkles, X,
  Shield, Star, Heart, ClipboardList,
} from 'lucide-react';
import FeedbackDialog from '@/components/FeedbackDialog';
import { getJourneyLevel } from '@/lib/levels8';
import { getUnreadMessageCount } from '@/lib/nudges';
import { useNotifications } from '@/hooks/useNotifications';

const STICKER = '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)';

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
  // current_level is stored on the journey-8 scale.
  const journeyLevel = child?.current_level ?? 1;
  const levelInfo = getJourneyLevel(journeyLevel);
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
        <div className="px-4 lg:px-8 pt-6 pb-8 max-w-lg lg:max-w-3xl mx-auto">
          <h1 className="font-display text-3xl font-extrabold text-foreground mb-6 tracking-tight">Profile</h1>
          <div className="rounded-[2rem] bg-white p-5 mb-6" style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.05)' }}>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-tint-pink flex items-center justify-center">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="font-display font-extrabold text-foreground text-lg">Welcome!</p>
                <p className="text-sm text-muted-foreground">Sign in to access your library</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="w-full h-12 rounded-2xl font-display font-extrabold text-base text-white transition-all active:translate-y-[3px]"
              style={{ background: '#E84B8A', boxShadow: '0 4px 0 #BE1862, 0 12px 24px -10px #E84B8A80' }}
            >
              Sign In / Sign Up
            </button>
          </div>
          <Card>
            <ProfileLink to="/assess" icon={ClipboardList} label="Assess" sub="Find your child's reading level" />
            <ProfileLink to="/love" icon={Heart} label="Wall of Love" sub="What families say about us" />
            <ProfileLink to="/admin" icon={Shield} label="Admin" sub="CRM & analytics (staff only)" />
          </Card>
        </div>
      </Layout>
    );
  }

  // ─── Signed-in state ──────────────────────────────────────────
  return (
    <Layout>
      <div className="px-4 lg:px-8 pt-6 lg:pt-8 pb-8 max-w-lg lg:max-w-6xl mx-auto space-y-4 lg:space-y-5">
        {/* 1. Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight">Profile</h1>
          <Link
            to="/profile/account"
            aria-label="Account settings"
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center press-scale"
            style={{ boxShadow: STICKER }}
          >
            <Settings className="w-4 h-4 text-foreground/70" />
          </Link>
        </div>

        {/* 2. Child hero — full-width banner; compact on laptop so the
            three columns below still fit the viewport. */}
        <section
          className="rounded-[2rem] bg-white p-5 lg:px-7 lg:py-5"
          style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.05)' }}
        >
          {child ? (
            <div className="flex items-center gap-4 lg:gap-5">
              <div
                className="w-16 h-16 lg:w-[4.5rem] lg:h-[4.5rem] rounded-full flex items-center justify-center shrink-0 -rotate-2"
                style={{ background: `${levelInfo?.hex ?? '#E84B8A'}1A`, border: '3px solid #fff', outline: `3px solid ${levelInfo?.hex ?? '#E84B8A'}40`, boxShadow: STICKER }}
              >
                <span className="font-display text-2xl font-extrabold" style={{ color: levelInfo?.inkHex }}>
                  {(child.name?.[0] ?? '?').toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-xl lg:text-2xl font-extrabold text-foreground leading-tight truncate">{child.name}</p>
                <span
                  className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold text-white"
                  style={{ background: levelInfo?.hex ?? '#E84B8A' }}
                >
                  Level {journeyLevel} · {levelInfo?.name ?? ''}
                </span>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Link
                  to="/profile/parent-dashboard"
                  className="text-xs font-display font-extrabold text-white px-4 py-2 rounded-xl transition-all active:translate-y-[2px] whitespace-nowrap"
                  style={{ background: '#E84B8A', boxShadow: '0 3px 0 #BE1862, 0 10px 18px -8px #E84B8A80' }}
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

        {/* Landscape on laptop: three columns so everything fits without
            scrolling. Mobile: single stack. */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 lg:items-start">
          {/* Col 1 — For You + share the love */}
          <div className="space-y-4 lg:space-y-5">
            {forYouItems.length > 0 && (
              <Card pad>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">For You</p>
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
              </Card>
            )}

            {/* Share the love — review + Wall of Love */}
            <Card pad>
              <div className="flex items-center gap-3.5">
                <span
                  className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 rotate-3"
                  style={{ boxShadow: STICKER }}
                >
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-base font-extrabold text-foreground leading-tight">Loving the books?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your words help other families find us.</p>
                </div>
              </div>
              <button
                onClick={() => setFeedbackOpen(true)}
                className="mt-4 w-full h-11 rounded-2xl font-display font-extrabold text-sm text-white transition-all active:translate-y-[3px]"
                style={{ background: '#E84B8A', boxShadow: '0 4px 0 #BE1862, 0 12px 22px -10px #E84B8A80' }}
              >
                Leave a review
              </button>
              <Link
                to="/love"
                className="mt-2.5 w-full h-10 rounded-2xl font-display font-extrabold text-sm text-primary-ink bg-white flex items-center justify-center gap-1.5 press-scale"
                style={{ boxShadow: STICKER }}
              >
                <Heart className="w-4 h-4 fill-current" /> See the Wall of Love
              </Link>
            </Card>
          </div>

          {/* Col 2 — Parent controls */}
          <Card>
            <ProfileLink to="/assess" icon={ClipboardList} label="Assess" sub="Find your child's reading level" />
            <ProfileLink to="/profile/parent-dashboard" icon={LayoutDashboard} label="Parent View" sub="Go to parent dashboard" />
            <ProfileLink to="/profile/messages" icon={MessageSquare} label="Messages" sub="Rewards, tips & updates" badge={unreadMessages} />
            <ProfileLink to="/profile/messages?type=reward" icon={Trophy} label="My Rewards" sub="See your unlocked rewards" />
            <ProfileLink to="/profile/referrals" icon={Gift} label="Refer & Earn" sub="Earn 50% commission — share your link" />
          </Card>

          {/* Col 3 — Account */}
          <Card>
            <ProfileLink to="/profile/downloads" icon={Download} label="Download History" />
            <ProfileLink to="/profile/account" icon={Settings} label="Account Settings" />
            <ProfileLink to="/profile/help" icon={HelpCircle} label="Help & Support" />
            <ProfileLink to="/admin" icon={Shield} label="Admin" sub="CRM & analytics (staff only)" />
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Sign Out</span>
              </div>
            </button>
          </Card>
        </div>

        <p className="text-[10px] text-muted-foreground text-center pt-1">
          {profile?.email}
        </p>
      </div>

      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} source="profile" />
    </Layout>
  );
}

/** White sticker card. `pad` adds inner padding (link lists manage their own). */
function Card({ children, pad = false }: { children: React.ReactNode; pad?: boolean }) {
  return (
    <section
      className={`rounded-[2rem] bg-white overflow-hidden ${pad ? 'p-5' : 'divide-y divide-border'}`}
      style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.05)' }}
    >
      {children}
    </section>
  );
}

function ProfileLink({
  to, icon: Icon, label, sub, badge,
}: {
  to: string; icon: typeof Settings; label: string; sub?: string; badge?: number;
}) {
  return (
    <Link to={to} className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <span className="text-sm font-bold text-foreground block truncate">{label}</span>
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
