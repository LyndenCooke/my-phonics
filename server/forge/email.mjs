// Transactional email for Create-A-Book — same Resend REST pattern already
// used by supabase/functions/stripe-webhook for print-ops alerts (see that
// file's notifyPrintOpsFailure). Kept dependency-free (plain fetch) rather
// than pulling in the Resend SDK for one call site.
import { cfg } from "./env.mjs";

export async function sendBookReadyEmail({ to, childName, title, pdfBuf, pdfUrl, a4Url }) {
  if (!cfg.RESEND_API_KEY) {
    console.warn("[forge] RESEND_API_KEY not configured — skipping book-ready email");
    return { sent: false, reason: "no_key" };
  }
  if (!to) {
    console.warn("[forge] no recipient email on book row — skipping book-ready email");
    return { sent: false, reason: "no_recipient" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "MyPhonicsBooks <books@myphonicsbooks.co.uk>",
      to: [to],
      subject: `"${title}" is ready to read!`,
      text: `${childName}'s book "${title}" is finished and attached as a PDF.\n\nRead on screen or print page-by-page (A4 sheets):\n${pdfUrl}${a4Url ? `\n\nMake the real thing — the A5 Booklet: print double-sided on A4 (flip on the long edge), fold the stack in half, and staple the middle. It becomes a proper little A5 book:\n${a4Url}` : ""}\n\nHappy reading!\nThe MyPhonicsBooks team`,
      // Attached so the family has the real file even if they never revisit
      // the site — the same link is also in the email body as a fallback for
      // mail clients that strip large attachments.
      attachments: pdfBuf
        ? [{ filename: `${title.replace(/[^a-z0-9]+/gi, "_")}.pdf`, content: pdfBuf.toString("base64") }]
        : undefined,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[forge] book-ready email failed to send:", res.status, text.slice(0, 300));
    return { sent: false, reason: `resend_${res.status}` };
  }
  return { sent: true };
}
