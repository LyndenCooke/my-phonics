import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// resource_type → bucket + path builder. Buckets stay PRIVATE; the only way
// to read them is a short-lived signed URL minted here after the caller is
// confirmed to be a member of a school.
function resolvePath(resourceType: string, key: string, format: string | null): { bucket: string; path: string } | null {
  const safeKey = String(key).replace(/[^a-zA-Z0-9_]/g, ''); // keys are like '1_1'
  if (!safeKey) return null;
  switch (resourceType) {
    case 'storybook':
      if (format !== 'a4' && format !== 'a5') return null;
      return { bucket: 'book-pdfs', path: `${format}/${safeKey}.pdf` };
    case 'worksheet_pack':
      return { bucket: 'worksheet-pdfs', path: `${safeKey}.pdf` };
    case 'sound_book':
      return { bucket: 'sound-book-pdfs', path: `${safeKey}.pdf` };
    default:
      return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) return json({ error: 'Not signed in' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Identify the caller from their JWT.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Not signed in' }, 401);

    const { resource_type, resource_key, format } = await req.json();
    const resolved = resolvePath(resource_type, resource_key, format ?? null);
    if (!resolved) return json({ error: 'Unknown resource' }, 400);

    // Service-role client for the membership check, signed URL, and log.
    const admin = createClient(supabaseUrl, serviceKey);

    // Authorise: caller must belong to at least one school. We log against
    // that school. (Most staff are in exactly one.)
    const { data: memberships } = await admin
      .from('school_memberships')
      .select('school_id')
      .eq('user_id', user.id)
      .limit(1);
    const schoolId = memberships?.[0]?.school_id ?? null;
    if (!schoolId) return json({ error: 'No school membership' }, 403);

    // Mint a short-lived signed URL from the private bucket.
    const { data: signed, error: signErr } = await admin
      .storage.from(resolved.bucket)
      .createSignedUrl(resolved.path, 120);
    if (signErr || !signed?.signedUrl) {
      return json({ error: `File unavailable (${signErr?.message ?? 'not found'})` }, 404);
    }

    // Best-effort log (never block the download on a logging failure).
    try {
      await admin.from('school_download_log').insert({
        school_id: schoolId,
        user_id: user.id,
        resource_type,
        resource_key: String(resource_key),
        format: format ?? null,
      });
    } catch (_) { /* swallow */ }

    return json({ signed_url: signed.signedUrl });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
