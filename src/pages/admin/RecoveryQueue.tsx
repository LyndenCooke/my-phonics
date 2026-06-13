/**
 * Recovery queue — stale Stripe checkouts that the buyer started but
 * never completed. Each row exposes:
 *   - Send recovery (fires contact.abandoned_checkout in GHL)
 *   - Dismiss     (hide from queue with optional reason)
 *   - Notes       (add/view per-purchase notes via crm_notes.purchase_id)
 *   - Stripe link (open the session in Stripe Dashboard)
 *
 * The "Dismissed" toggle shows the last 50 dismissed rows with an Undo
 * button — nothing is destroyed, just hidden.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  useAbandonedCheckouts,
  useDismissedCheckouts,
  useDismissRecovery,
  useSendRecoveryEmail,
  useUndoDismiss,
  type AbandonedCheckout,
} from '@/hooks/useAbandonedCheckouts';
import { useCreateNote, useNotesForPurchase, useDeleteNote } from '@/hooks/useAdminNotes';
import { useQueryClient } from '@tanstack/react-query';
import {
  RefreshCw,
  MailX,
  Send,
  AlertCircle,
  ExternalLink,
  X,
  Undo2,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { format, parseISO } from 'date-fns';

export default function RecoveryQueue() {
  const [view, setView] = useState<'active' | 'dismissed'>('active');
  const active = useAbandonedCheckouts();
  const dismissed = useDismissedCheckouts();
  const queryClient = useQueryClient();

  const isLoading = view === 'active' ? active.isLoading : dismissed.isLoading;
  const isFetching = view === 'active' ? active.isFetching : dismissed.isFetching;
  const rows = view === 'active' ? active.data ?? [] : [];
  const dismissedRows = view === 'dismissed' ? dismissed.data ?? [] : [];

  if (isLoading) {
    return <div className="text-muted-foreground">Loading recovery queue...</div>;
  }

  const totalPotentialPence =
    view === 'active'
      ? rows.reduce((s, r) => s + r.amount_pence, 0)
      : dismissedRows.reduce((s, r) => s + r.amount_pence, 0);

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: view === 'active' ? ['admin-abandoned-checkouts'] : ['admin-dismissed-checkouts'],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Recovery</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stripe checkouts started &gt;30 min ago without completing. Fire a recovery email to tag the
            contact in GHL — your GHL workflow sends the actual message.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {view === 'active' ? 'Potential recovery' : 'Dismissed value'}
            </p>
            <p className="text-lg font-semibold">£{(totalPotentialPence / 100).toFixed(2)}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <Button
          variant={view === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('active')}
        >
          Active ({active.data?.length ?? 0})
        </Button>
        <Button
          variant={view === 'dismissed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('dismissed')}
        >
          Dismissed ({dismissed.data?.length ?? 0})
        </Button>
      </div>

      {view === 'active' ? (
        rows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <MailX className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No abandoned checkouts</p>
              <p className="text-xs text-muted-foreground">
                Anyone who started Stripe checkout in the last 30 min isn't shown — they're still in flight.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {rows.map(row => (
              <RecoveryRow key={row.id} row={row} />
            ))}
          </div>
        )
      ) : dismissedRows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nothing dismissed yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {dismissedRows.map(row => (
            <DismissedRow key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecoveryRow({ row }: { row: AbandonedCheckout }) {
  const { toast } = useToast();
  const send = useSendRecoveryEmail();
  const dismiss = useDismissRecovery();
  const [showNotes, setShowNotes] = useState(false);
  const [dismissOpen, setDismissOpen] = useState(false);
  const [dismissReason, setDismissReason] = useState('');

  const handleSend = async () => {
    try {
      await send.mutateAsync(row);
      toast({
        title: 'Recovery fired',
        description: `Tagged ${row.email} in GHL with abandoned-checkout`,
      });
    } catch (err) {
      toast({
        title: 'Could not send recovery',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleDismiss = async () => {
    try {
      await dismiss.mutateAsync({ purchaseId: row.id, reason: dismissReason.trim() || undefined });
      setDismissOpen(false);
      setDismissReason('');
      toast({ title: 'Dismissed', description: `Hidden from queue${dismissReason ? ` — ${dismissReason}` : ''}` });
    } catch (err) {
      toast({ title: 'Could not dismiss', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const ageHours = (Date.now() - new Date(row.created_at).getTime()) / 3_600_000;
  const ageBadge =
    ageHours < 1
      ? `${Math.round(ageHours * 60)}m ago`
      : ageHours < 24
      ? `${ageHours.toFixed(1)}h ago`
      : `${Math.round(ageHours / 24)}d ago`;

  const stripeWillGiveUpSoon = ageHours > 22;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">
                {row.full_name || row.email || 'Unknown'}
              </p>
              <Badge variant="secondary" className="text-xs">{ageBadge}</Badge>
              {stripeWillGiveUpSoon && (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  Expires soon
                </Badge>
              )}
            </div>
            {row.email && row.email !== row.full_name && (
              <p className="truncate text-xs text-muted-foreground">{row.email}</p>
            )}
            <p className="mt-1 text-xs">
              <span className="font-medium">{row.product_name ?? 'Unknown product'}</span>
              {row.amount_pence > 0 && (
                <span className="ml-2 text-green-600">£{(row.amount_pence / 100).toFixed(2)}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://dashboard.stripe.com/sessions/${row.stripe_session_id}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              title="Open in Stripe Dashboard"
            >
              Stripe <ExternalLink className="h-3 w-3" />
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotes(v => !v)}
              className="gap-1"
              title="Notes"
            >
              <StickyNote className="h-3.5 w-3.5" />
            </Button>
            <Dialog open={dismissOpen} onOpenChange={setDismissOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1" title="Dismiss">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dismiss this row?</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Hides from the active queue. You can undo from the "Dismissed" tab.
                  </p>
                  <Textarea
                    placeholder="Reason (optional) — e.g. 'paid via bank transfer', 'unresponsive', 'duplicate'"
                    value={dismissReason}
                    onChange={e => setDismissReason(e.target.value)}
                    rows={2}
                  />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setDismissOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDismiss} disabled={dismiss.isPending}>
                    {dismiss.isPending ? 'Dismissing…' : 'Dismiss'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={send.isPending || !row.email}
              className="gap-1"
            >
              <Send className="h-3.5 w-3.5" />
              {send.isPending ? 'Sending…' : 'Send recovery'}
            </Button>
          </div>
        </div>

        {showNotes && <NotesSection purchaseId={row.id} />}
      </CardContent>
    </Card>
  );
}

function DismissedRow({
  row,
}: {
  row: {
    id: string;
    email: string | null;
    full_name: string | null;
    product_name: string | null;
    amount_pence: number;
    stripe_session_id: string;
    dismissed_at: string | null;
    dismissed_reason: string | null;
  };
}) {
  const { toast } = useToast();
  const undo = useUndoDismiss();
  const handleUndo = async () => {
    try {
      await undo.mutateAsync(row.id);
      toast({ title: 'Restored to active queue' });
    } catch (err) {
      toast({ title: 'Could not undo', description: (err as Error).message, variant: 'destructive' });
    }
  };
  return (
    <Card className="bg-muted/30">
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {row.full_name || row.email || 'Unknown'}
          </p>
          <p className="truncate text-xs text-muted-foreground">{row.email}</p>
          <p className="mt-1 text-xs">
            {row.product_name ?? 'Unknown product'}
            {row.amount_pence > 0 && (
              <span className="ml-2 text-green-600">£{(row.amount_pence / 100).toFixed(2)}</span>
            )}
          </p>
          {row.dismissed_reason && (
            <p className="mt-1 text-xs italic text-muted-foreground">"{row.dismissed_reason}"</p>
          )}
          {row.dismissed_at && (
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Dismissed {format(parseISO(row.dismissed_at), 'dd/MM/yyyy HH:mm')}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleUndo} disabled={undo.isPending} className="gap-1">
          <Undo2 className="h-3.5 w-3.5" />
          Restore
        </Button>
      </CardContent>
    </Card>
  );
}

function NotesSection({ purchaseId }: { purchaseId: string }) {
  const { data: notes } = useNotesForPurchase(purchaseId);
  const create = useCreateNote();
  const del = useDeleteNote();
  const [draft, setDraft] = useState('');

  const handleAdd = async () => {
    if (!draft.trim()) return;
    await create.mutateAsync({ purchase_id: purchaseId, content: draft.trim() });
    setDraft('');
  };

  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a note (e.g. 'called Tuesday — left voicemail')"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={1}
          className="text-xs"
        />
        <Button size="sm" onClick={handleAdd} disabled={!draft.trim() || create.isPending}>
          Save
        </Button>
      </div>
      {notes && notes.length > 0 && (
        <div className="space-y-1.5">
          {notes.map(n => (
            <div key={n.id} className="flex items-start gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-xs">
              <p className="flex-1">{n.content}</p>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {n.created_at ? format(parseISO(n.created_at), 'dd/MM HH:mm') : ''}
              </span>
              <button
                onClick={() => del.mutate(n.id)}
                className="text-muted-foreground hover:text-destructive"
                title="Delete note"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
