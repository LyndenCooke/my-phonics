/**
 * Messages — parent inbox living inside Profile.
 *
 * Stored rewards, video tips, referral nudges, progress updates, offers,
 * and product news. Deliberately NOT a chat interface.
 *
 * Data: stub from lib/nudges today; once a parent_messages Supabase table
 * exists, swap getParentMessages() to a real query and the component is
 * unchanged.
 */
import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Gift, PlayCircle, Users, TrendingUp, Tag, BookOpen, ArrowLeft, ChevronRight, Inbox } from 'lucide-react';
import { getParentMessages, type ParentMessage, type ParentMessageType } from '@/lib/nudges';

const ICON_BY_TYPE: Record<ParentMessageType, typeof Gift> = {
  reward: Gift,
  video: PlayCircle,
  referral: Users,
  progress: TrendingUp,
  offer: Tag,
  update: BookOpen,
};

const TONE_BY_TYPE: Record<ParentMessageType, string> = {
  reward: 'bg-amber-50 border-amber-200 text-amber-700',
  video: 'bg-blue-50 border-blue-200 text-blue-700',
  referral: 'bg-violet-50 border-violet-200 text-violet-700',
  progress: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  offer: 'bg-rose-50 border-rose-200 text-rose-700',
  update: 'bg-slate-50 border-slate-200 text-slate-700',
};

type Filter = 'all' | 'unread';

function MessageCard({ m }: { m: ParentMessage }) {
  const Icon = ICON_BY_TYPE[m.type];
  const tone = TONE_BY_TYPE[m.type];

  return (
    <article className="bg-card rounded-2xl border border-border p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${tone}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-foreground leading-snug">{m.title}</p>
            {!m.read && (
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-rose-500 text-white px-1.5 py-0.5 rounded-full shrink-0">
                New
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{m.body}</p>
          {m.ctaLabel && m.ctaHref && (
            <Link
              to={m.ctaHref}
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary-ink hover:underline"
            >
              {m.ctaLabel} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Messages() {
  const [filter, setFilter] = useState<Filter>('all');
  const [searchParams] = useSearchParams();
  // Optional ?type=reward filter so /profile/messages?type=reward shows
  // only rewards (used by the "My Rewards" entry on Profile).
  const typeFilter = searchParams.get('type') as ParentMessageType | null;

  const all = useMemo(() => {
    let list = getParentMessages();
    if (typeFilter) list = list.filter(m => m.type === typeFilter);
    return list;
  }, [typeFilter]);
  const visible = filter === 'unread' ? all.filter(m => !m.read) : all;
  const unreadCount = all.filter(m => !m.read).length;
  const titleSuffix = typeFilter ? ` · ${typeFilter[0].toUpperCase()}${typeFilter.slice(1)}s` : '';

  return (
    <Layout>
      <div className="px-4 pt-5 pb-8 max-w-lg mx-auto">
        {/* Sub-page header — back to Profile + filter slot */}
        <div className="flex items-center gap-3 mb-4">
          <Link
            to="/profile"
            aria-label="Back to Profile"
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <h1 className="font-display text-xl font-extrabold text-foreground">Messages{titleSuffix}</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 p-1 bg-muted rounded-2xl">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
              filter === 'all' ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
              filter === 'unread' ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center px-1">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {visible.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === 'unread' ? "You're all caught up." : 'Updates and rewards will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(m => <MessageCard key={m.id} m={m} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}
