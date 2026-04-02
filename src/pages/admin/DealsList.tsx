import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminDeals, useCreateDeal, useUpdateDeal } from '@/hooks/useAdminDeals';
import { useAdminPipeline } from '@/hooks/useAdminPipeline';
import { Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function DealsList() {
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const { data: deals, isLoading } = useAdminDeals({ status: statusFilter || undefined });
  const { data: pipeline } = useAdminPipeline();
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const [createOpen, setCreateOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({ contact_id: '', title: '', value_pence: 0, stage_id: '' });

  const contacts = pipeline?.contacts ?? [];
  const stages = pipeline?.stages ?? [];

  const handleCreate = async () => {
    if (!newDeal.contact_id || !newDeal.title) return;
    await createDeal.mutateAsync({
      contact_id: newDeal.contact_id,
      title: newDeal.title,
      value_pence: newDeal.value_pence,
      stage_id: newDeal.stage_id || undefined,
    });
    setNewDeal({ contact_id: '', title: '', value_pence: 0, stage_id: '' });
    setCreateOpen(false);
  };

  const statusColour = (s: string) => {
    if (s === 'won') return 'default';
    if (s === 'lost') return 'destructive';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Deals</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Deal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Deal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Contact</Label>
                <Select value={newDeal.contact_id} onValueChange={v => setNewDeal(d => ({ ...d, contact_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select contact..." /></SelectTrigger>
                  <SelectContent>
                    {contacts.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.profile?.full_name || c.profile?.email || c.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title</Label>
                <Input value={newDeal.title} onChange={e => setNewDeal(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Full Bundle Sale" />
              </div>
              <div>
                <Label>Value (pence)</Label>
                <Input type="number" value={newDeal.value_pence} onChange={e => setNewDeal(d => ({ ...d, value_pence: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Stage</Label>
                <Select value={newDeal.stage_id} onValueChange={v => setNewDeal(d => ({ ...d, stage_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select stage..." /></SelectTrigger>
                  <SelectContent>
                    {stages.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={!newDeal.contact_id || !newDeal.title || createDeal.isPending}>
                {createDeal.isPending ? 'Creating...' : 'Create Deal'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="won">Won</TabsTrigger>
          <TabsTrigger value="lost">Lost</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="text-muted-foreground">Loading deals...</div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(deals ?? []).map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell>{d.contact?.profiles?.full_name || d.contact?.profiles?.email || '-'}</TableCell>
                    <TableCell>
                      {d.stage && (
                        <Badge style={{ backgroundColor: d.stage.colour ?? undefined }} className="text-white text-xs">
                          {d.stage.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">£{(d.value_pence / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={statusColour(d.status)}>{d.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.created_at ? format(parseISO(d.created_at), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {d.status === 'open' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateDeal.mutate({ id: d.id, status: 'won', closed_at: new Date().toISOString() })}
                          >
                            Won
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateDeal.mutate({ id: d.id, status: 'lost', closed_at: new Date().toISOString() })}
                          >
                            Lost
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(deals ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No {statusFilter} deals
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
