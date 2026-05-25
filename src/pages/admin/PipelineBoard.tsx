/**
 * Pipeline board — read-only view derived from purchases + assessments.
 * Drag-and-drop and "Add Contact" were removed because the state now
 * comes from real customer activity rather than manual entry. See
 * useAdminPipeline for the classification rules.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminPipeline, type PipelineContact } from '@/hooks/useAdminPipeline';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Mail, Gift, Banknote, Users, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

// Visual treatment per acquisition type — distinct colours so cards in
// the same column can be skimmed by funding source at a glance.
const ACQUISITION = {
  paid:     { label: 'Paid',     icon: Banknote, className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  voucher:  { label: 'Voucher',  icon: Gift,     className: 'bg-amber-100 text-amber-800 border-amber-200' },
  referral: { label: 'Referral', icon: Users,    className: 'bg-blue-100 text-blue-800 border-blue-200' },
  trial:    { label: 'Trial',    icon: Sparkles, className: 'bg-violet-100 text-violet-800 border-violet-200' },
  none:     null,
} as const;

type AcquisitionFilter = 'all' | 'paid' | 'voucher' | 'referral' | 'trial';

export default function PipelineBoard() {
  const { data, isLoading, isFetching } = useAdminPipeline();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<AcquisitionFilter>('all');

  // Counts by acquisition for the summary strip — computed before the
  // filter is applied so the chip labels stay honest even after click.
  const totals = useMemo(() => {
    const t = { all: 0, paid: 0, voucher: 0, referral: 0, trial: 0 };
    if (!data) return t;
    for (const c of data.contacts) {
      t.all++;
      if (c.acquisition !== 'none') t[c.acquisition]++;
    }
    return t;
  }, [data]);

  // Sum revenue from paid contacts only (excludes vouchers / trials).
  const paidRevenuePence = useMemo(() => {
    if (!data) return 0;
    return data.contacts
      .filter(c => c.acquisition === 'paid' || c.acquisition === 'referral')
      .reduce((s, c) => s + c.lifetime_value_pence, 0);
  }, [data]);

  const filteredContacts = useMemo(() => {
    if (!data) return [];
    if (filter === 'all') return data.contacts;
    return data.contacts.filter(c => c.acquisition === filter);
  }, [data, filter]);

  const contactsByStage = useMemo(() => {
    const map = new Map<string, PipelineContact[]>();
    if (!data) return map;
    data.stages.forEach(s => map.set(s.id, []));
    // Sort contacts within each column by last activity desc — most recent
    // movers at the top so churn / new trials are immediately visible.
    const sorted = [...filteredContacts].sort((a, b) => {
      const ta = a.last_activity_at ?? '';
      const tb = b.last_activity_at ?? '';
      return tb.localeCompare(ta);
    });
    for (const c of sorted) {
      if (c.stage_id && map.has(c.stage_id)) {
        map.get(c.stage_id)!.push(c);
      }
    }
    return map;
  }, [data, filteredContacts]);

  if (isLoading || !data) {
    return <div className="text-muted-foreground">Loading pipeline...</div>;
  }

  const { stages } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Auto-derived from purchases &amp; assessments. Updates the moment a customer moves.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-pipeline'] })}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Segmentation strip — click a chip to filter the board. Makes
          revenue vs comp immediately visible without scanning every card. */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
        <FilterChip label="All" count={totals.all} active={filter === 'all'} onClick={() => setFilter('all')} />
        <FilterChip
          label="Paid"
          count={totals.paid}
          active={filter === 'paid'}
          onClick={() => setFilter('paid')}
          tone="emerald"
        />
        <FilterChip
          label="Voucher"
          count={totals.voucher}
          active={filter === 'voucher'}
          onClick={() => setFilter('voucher')}
          tone="amber"
        />
        <FilterChip
          label="Referral"
          count={totals.referral}
          active={filter === 'referral'}
          onClick={() => setFilter('referral')}
          tone="blue"
        />
        <FilterChip
          label="Trial"
          count={totals.trial}
          active={filter === 'trial'}
          onClick={() => setFilter('trial')}
          tone="violet"
        />
        <div className="ml-auto text-sm text-muted-foreground">
          Revenue (paid + referral):{' '}
          <span className="font-semibold text-foreground">
            £{(paidRevenuePence / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map(stage => {
          const stageContacts = contactsByStage.get(stage.id) ?? [];
          return (
            <div key={stage.id} className="min-w-[280px] flex-shrink-0">
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: stage.colour ?? '#6366f1' }}
                />
                <h3 className="text-sm font-semibold">{stage.name}</h3>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {stageContacts.length}
                </Badge>
              </div>
              <div className="min-h-[200px] space-y-2 rounded-lg bg-muted/40 p-2">
                {stageContacts.length === 0 ? (
                  <p className="px-2 py-4 text-center text-xs text-muted-foreground">No contacts</p>
                ) : (
                  stageContacts.map(contact => (
                    <ContactCard key={contact.id} contact={contact} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContactCard({ contact }: { contact: PipelineContact }) {
  const name = contact.profile?.full_name || contact.profile?.email || 'Unknown';
  const email = contact.profile?.email ?? '';
  const acq = ACQUISITION[contact.acquisition];
  const AcqIcon = acq?.icon;
  return (
    <Link
      to={`/admin/customers/${contact.profile_id}`}
      className="block hover:opacity-90 transition-opacity"
    >
      <Card>
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-medium">{name}</p>
            {acq && AcqIcon && (
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${acq.className}`}
                title={`Acquisition: ${acq.label}`}
              >
                <AcqIcon className="h-2.5 w-2.5" />
                {acq.label}
              </span>
            )}
          </div>
          {email && email !== name && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{email}</span>
            </p>
          )}
          {contact.lifetime_value_pence > 0 ? (
            <p className="mt-1 text-xs font-medium text-green-600">
              £{(contact.lifetime_value_pence / 100).toFixed(2)}
            </p>
          ) : contact.acquisition === 'voucher' ? (
            <p className="mt-1 text-xs italic text-muted-foreground">£0 — voucher</p>
          ) : null}
          {contact.last_activity_at && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              {new Date(contact.last_activity_at).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function FilterChip({
  label,
  count,
  active,
  tone,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  tone?: 'emerald' | 'amber' | 'blue' | 'violet';
  onClick: () => void;
}) {
  const toneClasses: Record<string, string> = {
    emerald: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-300 bg-amber-50 text-amber-900',
    blue: 'border-blue-300 bg-blue-50 text-blue-900',
    violet: 'border-violet-300 bg-violet-50 text-violet-900',
  };
  const base = tone ? toneClasses[tone] : 'border-border bg-muted text-foreground';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${base} ${
        active ? 'ring-2 ring-offset-1 ring-foreground/30' : 'opacity-70 hover:opacity-100'
      }`}
    >
      {label}
      <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{count}</Badge>
    </button>
  );
}
