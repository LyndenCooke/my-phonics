/**
 * useNotifications — reactive view over the localStorage notification
 * store in @/lib/nudges.
 *
 * Subscribes once on mount via the store's custom-event emitter, then
 * recomputes the in-tab snapshot on each change. Components get live
 * unread counts + the list itself without needing to poll or pass props.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  addNotification as storeAdd,
  dismissNotification as storeDismiss,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead as storeMarkRead,
  subscribeToNotifications,
  type AppNotification,
} from '@/lib/nudges';

export interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  add: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  dismiss: (id: string) => void;
  markRead: (id: string) => void;
}

export function useNotifications(): UseNotificationsResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  // Plain counter that increments on each store change. Cheap and
  // sufficient to invalidate the memos below — we don't need the snapshot
  // itself to be referentially-stable because re-derivation is O(n) for
  // tiny n.
  const [revision, setRevision] = useState(0);

  useEffect(() => subscribeToNotifications(() => setRevision(r => r + 1)), []);

  // `revision` is intentionally a dep: the store reads localStorage and
  // these memos must rerun on every store change. eslint can't see that
  // dependency because the read functions don't take `revision`.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const notifications = useMemo(() => getNotifications(userId), [userId, revision]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const unreadCount = useMemo(() => getUnreadNotificationCount(userId), [userId, revision]);

  const add = useCallback(
    (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => storeAdd(userId, n),
    [userId],
  );
  const dismiss = useCallback((id: string) => storeDismiss(userId, id), [userId]);
  const markRead = useCallback((id: string) => storeMarkRead(userId, id), [userId]);

  return { notifications, unreadCount, add, dismiss, markRead };
}
