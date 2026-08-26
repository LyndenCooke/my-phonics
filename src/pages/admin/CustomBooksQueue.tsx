import { useEffect, useState } from "react";
import { BookHeart, Check, ChevronDown, Loader2, X } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { forgeApi, type AdminBookRow, type CustomBook } from "@/lib/forgeApi";

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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [ledger, setLedger] = useState<AdminBookRow[]>([]);
  // Collapsed by default — the ledger is the long tail, the queue is the work
  // (Lynden 2026-08-26, "make the every book ever made a drop down").
  const [ledgerOpen, setLedgerOpen] = useState(false);

  const load = () => {
    setLoading(true);
    forgeApi.adminBooks().then((r) => { setLedger(r.books); setCosts(r.costs); }).catch(() => {});
    forgeApi
      .adminQueue()
      .then((r) => { setQueue(r.queue); setDecided(r.decided); setError(null); })
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

  // The full typeset PDF is what the customer actually receives — it is THE
  // review artifact, shown embedded right under the book row (Lynden
  // 2026-08-26: "I need the actual PDF so I can review it"). Render-if-missing
  // first, then embed the browser's native PDF viewer inline.
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState<Record<string, string>>({});
  const togglePdf = async (bookId: string) => {
    if (pdfOpen[bookId]) {
      setPdfOpen((m) => { const n = { ...m }; delete n[bookId]; return n; });
      return;
    }
    setPdfBusyId(bookId);
    try {
      const { url } = await forgeApi.pdf(bookId);
      setPdfOpen((m) => ({ ...m, [bookId]: url }));
    } catch (e) {
      alert(`PDF render failed: ${e instanceof Error ? e.message : e}`);
    } finally {
      setPdfBusyId(null);
    }
  };
  // The ledger still opens in a new tab — quick spot checks, many rows.
  const openPdf = async (bookId: string) => {
    const tab = window.open("about:blank", "_blank");
    setPdfBusyId(bookId);
    try {
      const { url } = await forgeApi.pdf(bookId);
      if (tab) tab.location.href = url; else window.open(url, "_blank");
    } catch (e) {
      tab?.close();
      alert(`PDF render failed: ${e instanceof Error ? e.message : e}`);
    } finally {
      setPdfBusyId(null);
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
              <div className="font-bold">
                {costs.books_generated} delivered · ${Number(costs.avg_cost_usd || 0).toFixed(2)} each
              </div>
              <div className="text-muted-foreground">
                ${Number(costs.total_cost_usd || 0).toFixed(2)} spent on {costs.books_with_spend} books
                {Number(costs.wasted_cost_usd || 0) > 0 && (
                  <> · <span className="font-semibold text-amber-700">${Number(costs.wasted_cost_usd).toFixed(2)} on books never delivered</span></>
                )}
              </div>
              <div className="text-xs text-muted-foreground">today: ${Number(costs.today_cost_usd || 0).toFixed(2)}</div>
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
                <div key={b.id} className="space-y-2">
                  <BookRow book={b} busy={busyId === b.id} pdfBusy={pdfBusyId === b.id} pdfShown={Boolean(pdfOpen[b.id])}
                    onPdf={() => togglePdf(b.id)}
                    onApprove={() => decide(b, true)} onReject={() => decide(b, false)} />
                  {pdfOpen[b.id] && (
                    <iframe src={pdfOpen[b.id]} title={`${b.title || "book"} PDF`}
                      className="h-[80vh] w-full rounded-xl border bg-white shadow-inner" />
                  )}
                </div>
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
                      <button onClick={() => openPdf(b.id)} disabled={pdfBusyId === b.id} title="Open the real PDF"
                        className="text-muted-foreground hover:text-foreground disabled:opacity-50">
                        {pdfBusyId === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookHeart className="h-4 w-4" />}
                      </button>
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

      {/* EVERY book made, with what it cost and a link to the PDF — the admin
          ledger. The approval queue above only shows books asking to go public;
          this shows the lot, including the ones that stopped and still spent. */}
      {ledger.length > 0 && (
        <section className="rounded-2xl border bg-card">
          <button
            type="button"
            onClick={() => setLedgerOpen((v) => !v)}
            aria-expanded={ledgerOpen}
            className={`flex w-full items-baseline justify-between px-4 py-3 text-left ${ledgerOpen ? "border-b" : ""}`}
          >
            <h2 className="flex items-center gap-2 font-bold">
              <ChevronDown className={`h-4 w-4 transition-transform ${ledgerOpen ? "" : "-rotate-90"}`} />
              Every book made ({ledger.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              {ledgerOpen ? "newest first · click a title for the PDF" : "click to expand"}
            </span>
          </button>
          {ledgerOpen && (
          <div className="divide-y">
            {ledger.map((b) => (
              <div key={b.id} className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm ${b.needs_attention ? "bg-amber-50" : ""}`}>
                <button onClick={() => openPdf(b.id)} disabled={pdfBusyId === b.id}
                  className="min-w-[13rem] flex-1 truncate text-left font-semibold text-violet-700 hover:underline disabled:opacity-50">
                  {pdfBusyId === b.id ? "Rendering PDF..." : (b.title || "Untitled")}
                </button>
                <span className="text-muted-foreground">
                  {b.child_name} · L{b.level} “{b.focus_sound}”{b.country ? ` · ${b.country}` : ""}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${b.needs_attention ? "bg-amber-200 text-amber-900" : "bg-slate-100 text-slate-600"}`}>
                  {b.status}
                </span>
                <span className="ml-auto whitespace-nowrap font-bold">
                  ${b.cost_usd.toFixed(2)}
                </span>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  text ${b.text_usd.toFixed(2)} · art ${b.images_usd.toFixed(2)}
                </span>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(b.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
                {b.review_note && (
                  <p className="w-full text-xs text-amber-800">{b.review_note.slice(0, 200)}</p>
                )}
              </div>
            ))}
          </div>
          )}
        </section>
      )}

    </div>
  );
}

function BookRow({ book, busy, pdfBusy, pdfShown, onPdf, onApprove, onReject }: {
  book: CustomBook; busy: boolean; pdfBusy: boolean; pdfShown?: boolean; onPdf: () => void; onApprove: () => void; onReject: () => void;
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
        {/* The PDF IS the product — review that and nothing else (Lynden
            2026-08-26: the screen reader "is not what our books actually
            look like", so it has no place in admin). */}
        <button onClick={onPdf} disabled={pdfBusy}
          className="rounded-full bg-violet-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">
          {pdfBusy ? <Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> : <BookHeart className="mr-1 inline h-4 w-4" />}
          {pdfBusy ? " Rendering..." : pdfShown ? " Hide PDF" : " Review PDF"}
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
