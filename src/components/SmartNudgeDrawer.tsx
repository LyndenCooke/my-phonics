/**
 * SmartNudgeDrawer — bottom-sheet style drawer triggered by the header's
 * smart-nudge icon. Deliberately NOT a chatbot: no input field, no thread.
 * It's a small "what's new for you" panel with at most 3 items and a link
 * to Messages for the full list.
 *
 * Data is local for now — wire to the messages table once that exists.
 * Spec rules:
 *  - Max 3 items
 *  - Big tap targets, short text
 *  - No typing field, no chatbot
 *  - Footer links to /profile/messages
 */
import { X, Sparkles, Gift, PlayCircle, ChevronRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Nudge } from '@/lib/nudges';

interface Props {
  open: boolean;
  onClose: () => void;
  nudges: Nudge[];
}

const ICON_MAP = {
  reading: BookOpen,
  reward: Gift,
  video: PlayCircle,
  sparkle: Sparkles,
} as const;

export default function SmartNudgeDrawer({ open, onClose, nudges }: Props) {
  if (!open) return null;

  const visible = nudges.slice(0, 3);

  return (
    <>
      {/* Scrim. Tap outside to close. */}
      <button
        aria-label="Close nudges"
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Drawer. Slides up from bottom on mobile; centered card on desktop. */}
      <div
        role="dialog"
        aria-label="What's new for you"
        className="fixed left-0 right-0 bottom-0 z-[61] mx-auto max-w-md bg-card rounded-t-3xl md:rounded-3xl md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-sm shadow-2xl border border-border animate-in slide-in-from-bottom duration-300 md:slide-in-from-top-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {/* Drag handle, mobile only */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <span className="w-10 h-1.5 rounded-full bg-muted" />
        </div>

        <div className="px-5 pt-3 pb-2 flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold text-foreground">
            Hi! Here's what's new <span aria-hidden>👋</span>
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-5 pb-4 space-y-2.5">
          {visible.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              All caught up. We'll let you know when there's something new.
            </p>
          ) : (
            visible.map((n) => {
              const Icon = ICON_MAP[n.icon] ?? Sparkles;
              const inner = (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-tint-pink border border-primary/15 active:scale-[0.98] transition-transform">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <Icon className="w-5 h-5 text-primary-ink" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground leading-snug">{n.title}</p>
                    {n.body && (
                      <p className="text-xs text-muted-foreground truncate">{n.body}</p>
                    )}
                  </div>
                  <span className="text-xs font-bold text-primary-ink shrink-0 flex items-center gap-0.5">
                    {n.ctaLabel}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              );
              return n.ctaHref ? (
                <Link key={n.id} to={n.ctaHref} onClick={onClose} className="block">
                  {inner}
                </Link>
              ) : (
                <button key={n.id} onClick={onClose} className="w-full text-left">
                  {inner}
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-border px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">More updates in Messages</span>
          <Link
            to="/profile/messages"
            onClick={onClose}
            className="text-xs font-bold text-primary-ink hover:underline flex items-center gap-1"
          >
            Go to Messages <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </>
  );
}
