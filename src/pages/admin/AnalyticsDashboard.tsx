import { Users, PoundSterling, ShoppingCart, ClipboardCheck, BookOpen, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/admin/StatCard';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const COLOURS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#3b82f6'];

export default function AnalyticsDashboard() {
  const { data, isLoading } = useAdminAnalytics();

  if (isLoading || !data) {
    return <div className="text-muted-foreground">Loading analytics...</div>;
  }

  const signupsData = data.dailySignups.slice(-30);
  const revenueData = data.dailyRevenue.slice(-30).map(d => ({
    ...d,
    total_pounds: d.total_pence / 100,
  }));

  const avgOrderPence = data.totalPurchases > 0
    ? Math.round(data.totalRevenuePence / data.totalPurchases)
    : 0;

  // Conversion funnel
  const funnelData = [
    { name: 'Signed Up', value: data.totalCustomers },
    { name: 'Assessed', value: data.totalAssessments },
    { name: 'Purchased', value: data.totalPurchases },
  ];

  const conversionRate = data.totalCustomers > 0
    ? ((data.totalPurchases / data.totalCustomers) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Customers" value={data.totalCustomers} icon={Users} />
        <StatCard label="Revenue" value={`£${(data.totalRevenuePence / 100).toFixed(2)}`} icon={PoundSterling} />
        <StatCard label="Purchases" value={data.totalPurchases} icon={ShoppingCart} />
        <StatCard label="Avg Order" value={`£${(avgOrderPence / 100).toFixed(2)}`} icon={TrendingUp} />
        <StatCard label="Active (7d)" value={data.activeReaders7d} icon={BookOpen} />
        <StatCard label="Conversion" value={`${conversionRate}%`} icon={ClipboardCheck} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Sign-ups (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={signupsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tickFormatter={v => v ? format(parseISO(v), 'dd/MM') : ''} fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip labelFormatter={v => v ? format(parseISO(v as string), 'dd/MM/yyyy') : ''} />
                <Bar dataKey="signup_count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Sign-ups" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Revenue (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tickFormatter={v => v ? format(parseISO(v), 'dd/MM') : ''} fontSize={11} />
                <YAxis tickFormatter={v => `£${v}`} fontSize={11} />
                <Tooltip
                  labelFormatter={v => v ? format(parseISO(v as string), 'dd/MM/yyyy') : ''}
                  formatter={(v: number) => [`£${v.toFixed(2)}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="total_pounds" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funnelData.map((item, i) => {
                const maxVal = funnelData[0].value || 1;
                const pct = Math.round((item.value / maxVal) * 100);
                return (
                  <div key={item.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="font-medium">{item.value} ({pct}%)</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted">
                      <div
                        className="h-3 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: COLOURS[i] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completed', value: data.totalPurchases },
                    { name: 'No Purchase', value: Math.max(0, data.totalCustomers - data.totalPurchases) },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#e5e7eb" />
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
