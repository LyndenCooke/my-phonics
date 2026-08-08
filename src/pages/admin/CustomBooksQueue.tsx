import { useEffect, useState } from "react";
import { BookHeart, Check, Eye, Loader2, X } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CustomBookReader from "@/components/CustomBookReader";
import { forgeApi, type CustomBook } from "@/lib/forgeApi";

/**
 * Approval queue for family-made custom books. A book only ever becomes
 * public in the World of Books after an explicit approve here.
 * Runs against the local forge API (dev server only).
 */
export default function CustomBooksQueue() {
  const [queue, setQueue] = useState<CustomBook[]>([]);
  const [decided, setDecided] = useState<CustomBook[]>([]);
  const [costs, setCosts] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<CustomBook | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    forgeApi
      .adminQueue()
      .then((r) => { setQueue(r.queue); setDecided(r.decided); setCosts(r.costs); setError(null); })
      .catch(() => setError("The forge API isn't available. This queue only works on the localhost dev server (npm run dev)."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const decide = async (book: CustomBook, approve: boolean) => {
    setBusyId(book.id);
    try {
      await forgeApi.adminDecision({ book_id: book.id, approve });
      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Custom Books"
        subtitle="Family-made books waiting for approval before going public in the World of Books"
        action={
          costs && (
            <div className="rounded-xl border bg-card px-4 py-2 text-right text-sm">
              <div className="font-bold">{costs.books_generated} generated</div>
              <div className="text-muted-foreground">
                avg ${Number(costs.avg_cost_usd || 0).toFixed(2)} / book · ${Number(costs.total_cost_usd || 0).toFixed(2)} total API cost
              </div>
            </div>
          )
        }
      />

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading && <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>}

      {!loading && !error && (
        <>
          <section>
            <h2 className="mb-3 font-semibold">Awaiting review ({queue.length})</h2>
            {queue.length === 0 && (
              <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
                <BookHeart className="mx-auto mb-2 h-8 w-8 opacity-40" /> Nothing waiting. Lovely.
              </div>
            )}
            <div className="space-y-3">
              {queue.map((b) => (
                <BookRow key={b.id} book={b} busy={busyId === b.id}
                  onRead={() => setReading(b)} onApprove={() => decide(b, true)} onReject={() => decide(b, false)} />
              ))}
            </div>
          </section>

          {decided.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold">Decided</h2>
              <div className="space-y-2">
                {decided.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-2 text-sm">
                    <span>
                      {b.country_flag} <b>{b.title || "Untitled"}</b> — {b.child_name}, L{b.level} "{b.focus_sound}"
                    </span>
                    <span className="flex items-center gap-3">
                      <button onClick={() => setReading(b)} className="text-muted-foreground hover:text-foreground"><Eye className="h-4 w-4" /></button>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${b.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {b.status}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {reading?.pages && <CustomBookReader pages={reading.pages} onClose={() => setReading(null)} />}
    </div>
  );
}

function BookRow({ book, busy, onRead, onApprove, onReject }: {
  book: CustomBook; busy: boolean; onRead: () => void; onApprove: () => void; onReject: () => void;
}) {
  const cover = book.pages?.[0]?.imageUrl;
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-3">
      {cover && <img src={cover} alt="" className="h-20 w-16 rounded-lg object-cover" />}
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{book.title || "Untitled"}</div>
        <div className="text-sm text-muted-foreground">
          {book.country_flag} {book.child_name} · Level {book.level} · sound "{book.focus_sound}"
          {typeof book.cost_usd === "number" && <> · API cost ${Number(book.cost_usd).toFixed(2)}</>}
        </div>
        <div className="text-xs text-muted-foreground">
          {book.wall_of_love_opt_in ? "Wall of Love: yes" : "Wall of Love: no"} · {book.email || "no email"}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button onClick={onRead} className="rounded-full border px-4 py-1.5 text-sm font-semibold hover:bg-accent">
          <Eye className="mr-1 inline h-4 w-4" /> Read
        </button>
        <button onClick={onApprove} disabled={busy}
          className="rounded-full bg-green-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">
          <Check className="mr-1 inline h-4 w-4" /> Approve
        </button>
        <button onClick={onReject} disabled={busy}
          className="rounded-full bg-red-100 px-4 py-1.5 text-sm font-bold text-red-600 hover:bg-red-200 disabled:opacity-50">
          <X className="mr-1 inline h-4 w-4" /> Reject
        </button>
      </div>
    </div>
  );
}
