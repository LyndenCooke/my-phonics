import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAdminCustomers } from '@/hooks/useAdminCustomers';
import { format, parseISO } from 'date-fns';

export default function CustomerList() {
  const [search, setSearch] = useState('');
  const { data: customers, isLoading } = useAdminCustomers(search || undefined);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Customers</h1>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary-ink tabular-nums">
          {customers?.length ?? 0} total
        </span>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 rounded-xl bg-white"
        />
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading customers...</div>
      ) : (
        <div
          className="overflow-hidden rounded-2xl bg-white"
          style={{ boxShadow: '0 1px 2px rgba(40,30,40,0.08), 0 8px 20px rgba(40,30,40,0.08)', border: '1px solid rgba(40,30,40,0.05)' }}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Children</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead className="text-center">Assessed</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(customers ?? []).map(c => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/admin/customers/${c.id}`)}
                >
                  <TableCell className="font-medium">
                    {c.full_name || 'Unnamed'}
                  </TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell className="text-center">{c.children_count}</TableCell>
                  <TableCell className="text-right">
                    {c.total_spent_pence > 0
                      ? `£${(c.total_spent_pence / 100).toFixed(2)}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {c.has_assessment ? (
                      <Badge variant="default" className="text-xs">Yes</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.created_at ? format(parseISO(c.created_at), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {(customers ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
