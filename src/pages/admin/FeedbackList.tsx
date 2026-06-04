import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatCard from '@/components/admin/StatCard';
import { useAdminFeedback } from '@/hooks/useAdminFeedback';
import { MessageSquare, ThumbsUp, Quote } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

function Stars({ rating }: { rating: number | null }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${(rating ?? 0) >= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

type Filter = 'all' | 'testimonials' | 'needs_attention';

export default function FeedbackList() {
  const { data: feedback, isLoading } = useAdminFeedback();
  const [filter, setFilter] = useState<Filter>('all');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Promote/retire a review on the public testimonials wall. Only consented
  // reviews actually surface (the public view also checks consent_marketing).
  const toggleFeatured = async (id: string, next: boolean) => {
    const { error } = await (supabase as unknown as {
      from: (t: string) => { update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> } };
    }).from('reviews').update({ featured: next }).eq('id', id);
    if (error) { toast({ title: 'Could not update', description: error.message, variant: 'destructive' }); return; }
    toast({ title: next ? 'Featured on the site 💛' : 'Removed from the site' });
    queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
  };

  const stats = useMemo(() => {
    const rows = feedback ?? [];
    const rated = rows.filter(r => r.rating != null);
    const avg = rated.length ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length : 0;
    const testimonials = rows.filter(r => r.consent_marketing && (r.rating ?? 0) >= 4 && r.loved).length;
    const needsAttention = rows.filter(r => (r.rating ?? 0) > 0 && (r.rating ?? 0) <= 2).length;
    return { total: rows.length, avg, testimonials, needsAttention };
  }, [feedback]);

  const rows = useMemo(() => {
    const all = feedback ?? [];
    if (filter === 'testimonials') return all.filter(r => r.consent_marketing && (r.rating ?? 0) >= 4 && r.loved);
    if (filter === 'needs_attention') return all.filter(r => (r.rating ?? 0) > 0 && (r.rating ?? 0) <= 2);
    return all;
  }, [feedback, filter]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Feedback</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total reviews" value={stats.total} icon={MessageSquare} />
        <StatCard label="Average rating" value={stats.avg ? `${stats.avg.toFixed(1)}★` : '—'} icon={Star} />
        <StatCard label="Testimonial-ready" value={stats.testimonials} icon={Quote} />
        <StatCard label="Needs attention (≤2★)" value={stats.needsAttention} icon={ThumbsUp} />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {([
          ['all', 'All'],
          ['testimonials', 'Testimonial-ready'],
          ['needs_attention', 'Needs attention'],
        ] as [Filter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading feedback...</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Rating</TableHead>
                  <TableHead>Loved 💛</TableHead>
                  <TableHead>Could be better</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Consent</TableHead>
                  <TableHead>On site</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow
                    key={r.id}
                    className={r.user_id ? 'cursor-pointer hover:bg-muted/50' : ''}
                    onClick={() => r.user_id && navigate(`/admin/customers/${r.user_id}`)}
                  >
                    <TableCell>
                      <Stars rating={r.rating} />
                    </TableCell>
                    <TableCell className="max-w-[260px] text-sm">
                      {r.loved || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="max-w-[220px] text-sm text-muted-foreground">
                      {r.improvement || '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{r.full_name || 'Unnamed'}</div>
                      <div className="text-xs text-muted-foreground">{r.email || '—'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.consent_marketing && <Badge variant="default" className="text-[10px]">Testimonial</Badge>}
                        {r.consent_named && <Badge variant="secondary" className="text-[10px]">Name</Badge>}
                        {r.source && <Badge variant="outline" className="text-[10px]">{r.source}</Badge>}
                        {r.kind && r.kind !== 'general' && <Badge variant="outline" className="text-[10px]">{r.kind}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {r.consent_marketing && r.loved ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFeatured(r.id, !r.featured); }}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                            r.featured
                              ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
                              : 'bg-background border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {r.featured ? '★ Featured' : 'Feature'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">needs consent</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {r.submitted_at ? format(parseISO(r.submitted_at), 'dd/MM/yyyy') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No feedback yet
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
