import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatCard from '@/components/admin/StatCard';
import { useAdminFeedback } from '@/hooks/useAdminFeedback';
import { MessageSquare, ThumbsUp, Quote, Mail, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import ManualTestimonialsManager from '@/components/admin/ManualTestimonialsManager';
import { syncToGHL } from '@/lib/ghlClient';
import type { AdminFeedback } from '@/hooks/useAdminFeedback';

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

  // Manually grant/withdraw consent — for parents who gave permission in
  // person (or by message) but never ticked the box in the app. Same
  // admin-update RLS path as toggleFeatured.
  const toggleConsent = async (r: AdminFeedback, field: 'consent_marketing' | 'consent_named', next: boolean) => {
    const { error } = await (supabase as unknown as {
      from: (t: string) => { update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> } };
    }).from('reviews').update({ [field]: next }).eq('id', r.id);
    if (error) { toast({ title: 'Could not update', description: error.message, variant: 'destructive' }); return; }
    const label = field === 'consent_marketing' ? 'testimonial permission' : 'permission to use their name';
    toast({
      title: next ? `Marked ${label} as given` : `${label[0].toUpperCase()}${label.slice(1)} withdrawn`,
      description: next ? 'Only grant this when the parent has told you directly.' : undefined,
    });
    queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    // Mirror onto the GHL contact (note + marketing-consent tag) so the
    // GHL CRM doesn't go stale. Best-effort and non-blocking.
    if (r.email) {
      void syncToGHL('contact.consent_updated', {
        email: r.email,
        full_name: r.full_name ?? '',
        consent_marketing: field === 'consent_marketing' ? next : r.consent_marketing,
        consent_named: field === 'consent_named' ? next : r.consent_named,
        rating: r.rating ?? 0,
      });
    }
  };

  // Permanently delete a review (spam, test rows, retired quotes).
  const deleteReview = async (id: string) => {
    if (!window.confirm('Delete this feedback permanently? This cannot be undone.')) return;
    const { error } = await (supabase as unknown as {
      from: (t: string) => { delete: () => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> } };
    }).from('reviews').delete().eq('id', id);
    if (error) { toast({ title: 'Could not delete', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Feedback deleted' });
    queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
  };

  // Reply by email — opens the user's mail client, prefilled.
  const replyTo = (email: string | null, firstName: string | null, loved: string | null) => {
    if (!email) { toast({ title: 'No email on file for this parent' }); return; }
    const subject = encodeURIComponent('Thanks for your MyPhonicsBooks feedback');
    const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
    const ref = loved ? `\n\nYou said: “${loved}”` : '';
    const body = encodeURIComponent(`${greeting}\n\nThank you so much for taking the time to share your feedback — it really helps us.${ref}\n\n`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
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
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Feedback</h1>

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

      <ManualTestimonialsManager />

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
                  <TableHead className="text-right">Actions</TableHead>
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
                      {/* Consent chips are TOGGLES: click to grant/withdraw
                          manually when a parent gave permission in person
                          but never ticked the box in the app. */}
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleConsent(r, 'consent_marketing', !r.consent_marketing); }}
                          title={r.consent_marketing ? 'Withdraw testimonial permission' : 'Mark testimonial permission as given (in person / by message)'}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                            r.consent_marketing
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-background border-dashed border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {r.consent_marketing ? '✓ Testimonial' : '+ Testimonial'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleConsent(r, 'consent_named', !r.consent_named); }}
                          title={r.consent_named ? 'Withdraw permission to use their name' : 'Mark name permission as given (in person / by message)'}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                            r.consent_named
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-background border-dashed border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {r.consent_named ? '✓ Name' : '+ Name'}
                        </button>
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
                        <span className="text-[10px] text-muted-foreground">
                          {r.loved ? 'grant ✓ Testimonial first' : 'no quote to feature'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {r.submitted_at ? format(parseISO(r.submitted_at), 'dd/MM/yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); replyTo(r.email, r.full_name, r.loved); }}
                          title="Reply by email"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteReview(r.id); }}
                          title="Delete feedback"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
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
