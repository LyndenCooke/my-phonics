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
        <h1 className="text-3xl font-bold">Customers</h1>
        <span className="text-sm text-muted-foreground">
          {customers?.length ?? 0} total
        </span>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading customers...</div>
      ) : (
        <div className="rounded-md border">
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
