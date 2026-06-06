import { useState } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useManualTestimonials, useCreateTestimonial, useDeleteTestimonial, useToggleTestimonial,
} from '@/hooks/useAdminTestimonials';

/**
 * Admin-curated testimonials that didn't come from in-app feedback. Added
 * here flow straight onto the public landing-page wall (when featured).
 */
export default function ManualTestimonialsManager() {
  const { data: items } = useManualTestimonials();
  const create = useCreateTestimonial();
  const del = useDeleteTestimonial();
  const toggle = useToggleTestimonial();

  const [quote, setQuote] = useState('');
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);

  const add = async () => {
    if (!quote.trim()) return;
    await create.mutateAsync({ quote: quote.trim(), author_name: name.trim() || undefined, rating });
    setQuote(''); setName(''); setRating(5);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add a testimonial (manual)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground -mt-2">
          For quotes from email, TPT, socials etc. Featured ones appear on the landing page wall.
        </p>
        <Textarea placeholder="“What the parent / teacher said…”" value={quote} onChange={e => setQuote(e.target.value)} rows={2} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input placeholder="Name (optional)" value={name} onChange={e => setName(e.target.value)} className="flex-1" />
          <select
            value={rating}
            onChange={e => setRating(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-32"
            title="Rating"
          >
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ★</option>)}
          </select>
          <Button onClick={add} disabled={!quote.trim() || create.isPending} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        {(items ?? []).length > 0 && (
          <div className="space-y-2 pt-2">
            {(items ?? []).map(t => (
              <div key={t.id} className="flex items-start gap-3 rounded-md border p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className={`h-3 w-3 ${t.rating >= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>
                  <p className="text-sm">“{t.quote}”</p>
                  <p className="text-xs text-muted-foreground mt-0.5">— {t.author_name || 'Anonymous'}</p>
                </div>
                <button
                  onClick={() => toggle.mutate({ id: t.id, featured: !t.featured })}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors shrink-0 ${
                    t.featured ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200' : 'bg-background border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t.featured ? '★ On site' : 'Off site'}
                </button>
                <button onClick={() => del.mutate(t.id)} title="Delete" className="text-muted-foreground hover:text-destructive shrink-0 mt-0.5">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
