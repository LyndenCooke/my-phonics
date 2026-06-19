import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminPartners, useCreatePartner, useMarkPartnerPaid } from '@/hooks/useAdminPartners';
import { Plus, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

const gbp = (pence: number) => `£${(pence / 100).toFixed(2)}`;

export default function PartnersList() {
  const { data: partners, isLoading } = useAdminPartners();
  const createPartner = useCreatePartner();
  const markPaid = useMarkPartnerPaid();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ code: '', email: '', partner_name: '' });

  const handleCreate = async () => {
    const code = form.code.trim().toUpperCase();
    const email = form.email.trim().toLowerCase();
    if (!/^[A-Z0-9]{4,12}$/.test(code)) { toast.error('Code must be 4–12 letters/numbers'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { toast.error('Enter a valid email'); return; }
    try {
      await createPartner.mutateAsync({ code, email, partner_name: form.partner_name.trim() || undefined });
      toast.success(`Partner code ${code} created — 20% off, 40% commission`);
      setForm({ code: '', email: '', partner_name: '' });
      setCreateOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleMarkPaid = async (id: string, code: string) => {
    try {
      const n = await markPaid.mutateAsync(id);
      toast.success(n > 0 ? `${code}: marked ${n} commission${n === 1 ? '' : 's'} paid` : `${code}: nothing outstanding`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => toast.success(`Copied ${code}`), () => {});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Partners</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Shops, libraries &amp; clubs. Their code gives customers 20% off and earns them 40% of every sale.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Partner</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a partner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Code</Label>
                <Input
                  placeholder="BOLTON20"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) })}
                  className="font-mono tracking-wide"
                />
                <p className="text-xs text-muted-foreground mt-1">4–12 letters/numbers. This is what you hand the partner.</p>
              </div>
              <div>
                <Label>Payout email</Label>
                <Input
                  type="email"
                  placeholder="hello@boltonlibrary.org"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Where their earnings are owed.</p>
              </div>
              <div>
                <Label>Partner name <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                  placeholder="Bolton Library"
                  value={form.partner_name}
                  onChange={(e) => setForm({ ...form, partner_name: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createPartner.isPending}>
                {createPartner.isPending ? 'Creating…' : 'Create partner'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All partners</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
          ) : !partners?.length ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No partners yet. Add one to mint a code.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Owed</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <button onClick={() => copyCode(p.code)} className="inline-flex items-center gap-1.5 font-mono font-semibold hover:text-primary-ink">
                        {p.code} <Copy className="h-3 w-3 opacity-50" />
                      </button>
                      <div className="text-[11px] text-muted-foreground">
                        {Math.round(p.discount_rate * 100)}% off · {Math.round(p.commission_rate * 100)}% comm
                      </div>
                    </TableCell>
                    <TableCell>{p.partner_name || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-muted-foreground">{p.email}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.sales_count}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {p.owed_pence > 0 ? <Badge variant="secondary">{gbp(p.owed_pence)}</Badge> : gbp(0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{gbp(p.paid_pence)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={p.owed_pence <= 0 || markPaid.isPending}
                        onClick={() => handleMarkPaid(p.id, p.code)}
                      >
                        <Check className="h-3.5 w-3.5" /> Mark paid
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
