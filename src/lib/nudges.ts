/**
 * Nudges + parent-message data layer.
 *
 * Local-only stub for the new mobile-app shell. The real backing store
 * (a `parent_messages` Supabase table) is future work — for now the UI
 * hook returns hard-coded examples and a 0 unread count so badges stay
 * silent until real data lands. Once the table exists, swap the hooks
 * here without touching the components.
 */

export type NudgeIcon = 'reading' | 'reward' | 'video' | 'sparkle';

export interface Nudge {
  id: string;
  icon: NudgeIcon;
  title: string;
  body?: string;
  ctaLabel: string;
  ctaHref?: string;
  read: boolean;
}

export type ParentMessageType = 'reward' | 'video' | 'referral' | 'progress' | 'offer' | 'update';

export interface ParentMessage {
  id: string;
  type: ParentMessageType;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  read: boolean;
  createdAt: string; // ISO
}

/** Stubs — replace with Supabase reads once the schema lands. */
export function getNudges(): Nudge[] {
  return [];
}

export function getUnreadNudgeCount(): number {
  return 0;
}

export function getParentMessages(): ParentMessage[] {
  return [];
}

export function getUnreadMessageCount(): number {
  return 0;
}
