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
import { RefreshCw, Mail } from 'lucide-react';
import { useMemo } from 'react';

export default function PipelineBoard() {
  const { data, isLoading, isFetching } = useAdminPipeline();
  const queryClient = useQueryClient();

  const contactsByStage = useMemo(() => {
    const map = new Map<string, PipelineContact[]>();
    if (!data) return map;
    data.stages.forEach(s => map.set(s.id, []));
    // Sort contacts within each column by last activity desc — most recent
    // movers at the top so churn / new trials are immediately visible.
    const sorted = [...data.contacts].sort((a, b) => {
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
  }, [data]);

  if (isLoading || !data) {
    return <div className="text-muted-foreground">Loading pipeline...</div>;
  }

  const { stages } = data;
  const totalContacts = data.contacts.length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Auto-derived from purchases &amp; assessments — {totalContacts} contacts. Updates the moment a customer moves.
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
  return (
    <Card>
      <CardContent className="p-3">
        <p className="truncate text-sm font-medium">{name}</p>
        {email && email !== name && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{email}</span>
          </p>
        )}
        {contact.lifetime_value_pence > 0 && (
          <p className="mt-1 text-xs font-medium text-green-600">
            £{(contact.lifetime_value_pence / 100).toFixed(2)}
          </p>
        )}
        {contact.last_activity_at && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            {new Date(contact.last_activity_at).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
