-- Create the public `worksheet-pdfs` bucket used by the TPT teacher
-- portal. One bundled PDF per book (5 worksheets) at
-- {SUPABASE_URL}/storage/v1/object/public/worksheet-pdfs/{level}_{n}.pdf.
-- Mirrors the book-pdfs bucket pattern (public read, no entitlement
-- edge function — the worksheets ship as part of the free TPT pass and
-- are already promoted as such on the marketing material).

INSERT INTO storage.buckets (id, name, public)
VALUES ('worksheet-pdfs', 'worksheet-pdfs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read worksheet pdfs" ON storage.objects;
CREATE POLICY "Public read worksheet pdfs" ON storage.objects
  FOR SELECT USING (bucket_id = 'worksheet-pdfs');
