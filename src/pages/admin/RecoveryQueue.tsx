/**
 * Recovery queue — stale Stripe checkouts that the buyer started but
 * never completed. Each row fires a contact.abandoned_checkout event to
 * GHL on click; the user's GHL workflow is what actually sends the
 * recovery email. Auto-fires also happen on checkout.session.expired
 * (~24h post-abandon); this page is for in-the-moment recovery before
 * Stripe gives up on the session.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  useAbandonedCheckouts,
  useSendRecoveryEmail,
  type AbandonedCheckout,
} from '@/hooks/useAbandonedCheckouts';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, MailX, Send, AlertCircle, ExternalLink } from 'lucide-react';

export default function RecoveryQueue() {
  const { data, isLoading, isFetching } = useAbandonedCheckouts();
  const queryClient = useQueryClient();

  if (isLoading) {
    return <div className="text-muted-foreground">Loading recovery queue...</div>;
  }

  const rows = data ?? [];
  const totalPotentialPence = rows.reduce((s, r) => s + r.amount_pence, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Recovery</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stripe checkouts started &gt;30 min ago without completing. Fire a recovery email to tag the
            contact in GHL — your GHL workflow sends the actual message.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Potential recovery</p>
            <p className="text-lg font-semibold">£{(totalPotentialPence / 100).toFixed(2)}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-abandoned-checkouts'] })}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
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
      )}
    </div>
  );
}

function RecoveryRow({ row }: { row: AbandonedCheckout }) {
  const { toast } = useToast();
  const send = useSendRecoveryEmail();

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

  const ageBadge =
    row.age_hours < 1
      ? `${Math.round(row.age_hours * 60)}m ago`
      : row.age_hours < 24
      ? `${row.age_hours.toFixed(1)}h ago`
      : `${Math.round(row.age_hours / 24)}d ago`;

  // Older than ~22h = Stripe will auto-expire imminently; nudge user.
  const stripeWillGiveUpSoon = row.age_hours > 22;

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
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
          >
            Stripe <ExternalLink className="h-3 w-3" />
          </a>
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
      </CardContent>
    </Card>
  );
}
