import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Sparkles, Mail, User } from 'lucide-react';

const STATUSES = ['new', 'in_review', 'designing', 'preview_sent', 'paid', 'delivered', 'cancelled'] as const;
type Status = typeof STATUSES[number];

interface Request {
  id: string;
  user_id: string | null;
  email: string;
  child_name: string;
  child_age: string | null;
  skin_tone: string | null;
  hair_colour: string | null;
  hair_style: string | null;
  interests: string | null;
  culture: string | null;
  level: string | null;
  notes: string | null;
  status: Status;
  preview_url: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_COLOUR: Record<Status, string> = {
  new:            'bg-indigo-100 text-indigo-700',
  in_review:      'bg-amber-100 text-amber-700',
  designing:      'bg-blue-100 text-blue-700',
  preview_sent:   'bg-purple-100 text-purple-700',
  paid:           'bg-emerald-100 text-emerald-700',
  delivered:      'bg-green-100 text-green-700',
  cancelled:      'bg-gray-200 text-gray-600',
};

function useRequests(filter: 'all' | Status) {
  return useQuery<Request[]>({
    queryKey: ['personalised-book-requests', filter],
    queryFn: async () => {
      // Cast to any to bypass generated types (table not yet in types.ts)
      const anySupabase = supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            order: (col: string, opts: object) => Promise<{ data: unknown; error: unknown }> & {
              eq: (col: string, val: string) => Promise<{ data: unknown; error: unknown }>;
            };
          };
        };
      };
      let q = anySupabase
        .from('personalised_book_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (filter !== 'all') q = q.eq('status', filter) as typeof q;
      const { data, error } = await q;
      if (error) throw error as Error;
      return ((data ?? []) as unknown) as Request[];
    },
  });
}

function useUpdateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Request> }) => {
      const anySupabase = supabase as unknown as {
        from: (t: string) => {
          update: (p: object) => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
        };
      };
      const { error } = await anySupabase
        .from('personalised_book_requests')
        .update(patch)
        .eq('id', id);
      if (error) throw error as Error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personalised-book-requests'] });
    },
  });
}

export default function PersonalisedBookRequests() {
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: requests, isLoading } = useRequests(filter);
  const update = useUpdateRequest();
  const { toast } = useToast();

  const detail = requests?.find((r) => r.id === detailId) ?? null;

  const handleStatus = async (id: string, status: Status) => {
    try {
      await update.mutateAsync({ id, patch: { status } });
      toast({ title: 'Status updated' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Update failed', description: msg, variant: 'destructive' });
    }
  };

  const handleSaveDetails = async (id: string, patch: Partial<Request>) => {
    try {
      await update.mutateAsync({ id, patch });
      toast({ title: 'Saved' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Save failed', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Personalised Book Requests</h1>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s}>{s.replace('_', ' ')}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : !requests?.length ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No requests in this view.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Child</TableHead>
                  <TableHead>Parent email</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setDetailId(r.id)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {r.child_name} {r.child_age ? <span className="text-muted-foreground">({r.child_age})</span> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {r.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.level ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(r.created_at), 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLOUR[r.status]}>{r.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Select value={r.status} onValueChange={(v) => handleStatus(r.id, v as Status)}>
                        <SelectTrigger className="w-40 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-w-2xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {detail.child_name}'s Personalised Book
                </DialogTitle>
              </DialogHeader>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <Info label="Parent email">{detail.email}</Info>
                <Info label="Age">{detail.child_age ?? '—'}</Info>
                <Info label="Skin tone">{detail.skin_tone ?? '—'}</Info>
                <Info label="Hair">{[detail.hair_colour, detail.hair_style].filter(Boolean).join(' · ') || '—'}</Info>
                <Info label="Interests" wide>{detail.interests ?? '—'}</Info>
                <Info label="Culture / setting">{detail.culture ?? '—'}</Info>
                <Info label="Level">{detail.level ?? '—'}</Info>
                <Info label="Notes" wide>{detail.notes ?? '—'}</Info>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <Label>Preview URL (once generated)</Label>
                  <Input
                    defaultValue={detail.preview_url ?? ''}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (detail.preview_url ?? '')) handleSaveDetails(detail.id, { preview_url: v || null });
                    }}
                    placeholder="https://…/preview.pdf"
                  />
                </div>
                <div>
                  <Label>Internal notes</Label>
                  <Textarea
                    defaultValue={detail.internal_notes ?? ''}
                    rows={3}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (detail.internal_notes ?? '')) handleSaveDetails(detail.id, { internal_notes: v || null });
                    }}
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" onClick={() => setDetailId(null)}>Close</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <div className="text-xs font-semibold text-muted-foreground mb-0.5">{label}</div>
      <div className="text-foreground">{children}</div>
    </div>
  );
}
