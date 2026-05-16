/**
 * Notifications store.
 *
 * Local-only by design: notifications are device-scoped events (download
 * complete, etc.) that don't need to follow the user across devices. The
 * data lives in localStorage keyed by user id; events are emitted via a
 * custom window event so cross-component subscribers update without
 * polling.
 *
 * Once a parent_messages Supabase table lands, the *messages* feature
 * (server-pushed nudges) can sit alongside this one — they're different
 * shapes, different sources. For now this file owns both names so the
 * existing imports (getUnreadMessageCount, getNudges, ParentMessage)
 * keep compiling.
 */

export type NotificationIcon = 'gift' | 'video' | 'users' | 'download' | 'reward' | 'sparkle';

export interface AppNotification {
  id: string;
  icon: NotificationIcon;
  title: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  read: boolean;
  createdAt: string; // ISO timestamp
}

const STORAGE_KEY_PREFIX = 'mpb_notifications_';
const CHANGE_EVENT = 'mpb-notifications-changed';
const MAX_STORED = 50;

function storageKey(userId: string | null | undefined): string {
  return STORAGE_KEY_PREFIX + (userId ?? 'guest');
}

function readAll(userId: string | null | undefined): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(userId: string | null | undefined, notifs: AppNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(notifs));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // Quota exceeded or private-mode — silent fail. The notification is
    // ephemeral by design, no recovery path needed.
  }
}

export function getNotifications(userId: string | null | undefined): AppNotification[] {
  return readAll(userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUnreadNotificationCount(userId: string | null | undefined): number {
  return readAll(userId).filter(n => !n.read).length;
}

export function addNotification(
  userId: string | null | undefined,
  input: Omit<AppNotification, 'id' | 'read' | 'createdAt'>,
): void {
  const current = readAll(userId);
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `n_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const next: AppNotification = {
    ...input,
    id,
    read: false,
    createdAt: new Date().toISOString(),
  };
  // Newest first, capped so the store doesn't grow unbounded.
  writeAll(userId, [next, ...current].slice(0, MAX_STORED));
}

export function dismissNotification(userId: string | null | undefined, id: string): void {
  writeAll(userId, readAll(userId).filter(n => n.id !== id));
}

export function markNotificationRead(userId: string | null | undefined, id: string): void {
  writeAll(
    userId,
    readAll(userId).map(n => (n.id === id ? { ...n, read: true } : n)),
  );
}

export function markAllNotificationsRead(userId: string | null | undefined): void {
  writeAll(userId, readAll(userId).map(n => ({ ...n, read: true })));
}

/** Subscribe to in-tab and cross-tab notification changes. Returns an
 *  unsubscribe function. */
export function subscribeToNotifications(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

// ─── Legacy compat shims ────────────────────────────────────────────────
// Existing call-sites import these. Keeping them as thin wrappers means
// no churn in unrelated files until each is migrated to the hook.

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
  createdAt: string;
}

export function getNudges(): Nudge[] {
  return [];
}

export function getUnreadNudgeCount(): number {
  return 0;
}

export function getParentMessages(): ParentMessage[] {
  return [];
}

/** @deprecated — call useNotifications().unreadCount inside components,
 *  or getUnreadNotificationCount(userId) at call-sites that can plumb a
 *  user. Kept for back-compat; always returns 0 because it has no user. */
export function getUnreadMessageCount(): number {
  return 0;
}
