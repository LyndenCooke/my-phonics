-- Create (or normalise) the public `book-pdfs` bucket used by the
-- post-assessment marketing email. Idempotent — safe to re-run.
--
-- Why public: the email links to the free first book PDF. There's no
-- meaningful gate on this asset (it's literally the marketing hook —
-- we WANT parents to share it). Public bucket = clean direct URLs, no
-- signed-URL expiry to manage server-side.

INSERT INTO storage.buckets (id, name, public)
VALUES ('book-pdfs', 'book-pdfs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read book pdfs" ON storage.objects;
CREATE POLICY "Public read book pdfs" ON storage.objects
  FOR SELECT USING (bucket_id = 'book-pdfs');
