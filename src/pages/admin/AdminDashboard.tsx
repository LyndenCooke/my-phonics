import { Users, PoundSterling, BookOpen, ClipboardCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/admin/StatCard';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function AdminDashboard() {
  const { data, isLoading } = useAdminAnalytics();

  if (isLoading || !data) {
    return <div className="text-muted-foreground">Loading dashboard...</div>;
  }

  const signupsLast30 = data.dailySignups.slice(-30);
  const revenueLast30 = data.dailyRevenue.slice(-30).map(d => ({
    ...d,
    total_pounds: d.total_pence / 100,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">How MyPhonicsBooks is doing today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Customers" value={data.totalCustomers} icon={Users} />
        <StatCard
          label="Total Revenue"
          value={`£${(data.totalRevenuePence / 100).toFixed(2)}`}
          icon={PoundSterling}
        />
        <StatCard label="Active Readers (7d)" value={data.activeReaders7d} icon={BookOpen} />
        <StatCard label="Assessments" value={data.totalAssessments} icon={ClipboardCheck} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sign-ups (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={signupsLast30}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tickFormatter={v => v ? format(parseISO(v), 'dd/MM') : ''} fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip labelFormatter={v => v ? format(parseISO(v as string), 'dd/MM/yyyy') : ''} />
                <Bar dataKey="signup_count" fill="#E84B8A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueLast30}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tickFormatter={v => v ? format(parseISO(v), 'dd/MM') : ''} fontSize={12} />
                <YAxis tickFormatter={v => `£${v}`} fontSize={12} />
                <Tooltip labelFormatter={v => v ? format(parseISO(v as string), 'dd/MM/yyyy') : ''} formatter={(v: number) => [`£${v.toFixed(2)}`, 'Revenue']} />
                <Area type="monotone" dataKey="total_pounds" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentActivity.map((a, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Badge variant={a.type === 'purchase' ? 'default' : 'secondary'}>
                      {a.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{a.email}</TableCell>
                  <TableCell>{a.detail}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.date ? format(parseISO(a.date), 'dd/MM/yyyy HH:mm') : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {data.recentActivity.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No recent activity
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
