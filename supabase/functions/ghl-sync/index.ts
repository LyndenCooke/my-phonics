import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GHL_API_KEY = Deno.env.get('GHL_API_KEY') ?? '';
const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID') ?? '';
const GHL_BASE = 'https://services.leadconnectorhq.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GHLContact {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  tags?: string[];
  customFields?: { id: string; value: string }[];
}

/** Find an existing GHL contact by email */
async function findContact(email: string): Promise<string | null> {
  const res = await fetch(
    `${GHL_BASE}/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        Version: '2021-07-28',
      },
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.contact?.id ?? null;
}

/** Create a new contact in GHL */
async function createContact(contact: GHLContact): Promise<string | null> {
  const res = await fetch(`${GHL_BASE}/contacts/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GHL_API_KEY}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      locationId: GHL_LOCATION_ID,
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      name: contact.name,
      tags: contact.tags ?? [],
    }),
  });
  if (!res.ok) {
    console.error('GHL create failed:', await res.text());
    return null;
  }
  const data = await res.json();
  return data?.contact?.id ?? null;
}

/** Update an existing GHL contact */
async function updateContact(contactId: string, updates: Partial<GHLContact>): Promise<boolean> {
  const res = await fetch(`${GHL_BASE}/contacts/${contactId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GHL_API_KEY}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    console.error('GHL update failed:', await res.text());
    return false;
  }
  return true;
}

/** Add tags to a GHL contact */
async function addTags(contactId: string, tags: string[]): Promise<boolean> {
  const res = await fetch(`${GHL_BASE}/contacts/${contactId}/tags`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GHL_API_KEY}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tags }),
  });
  return res.ok;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      return new Response(JSON.stringify({ error: 'GHL not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { event, data } = await req.json();

    // Get the authenticated user from the request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const email = user.email ?? '';
    const fullName = user.user_metadata?.full_name ?? '';
    const [firstName, ...lastParts] = fullName.split(' ');
    const lastName = lastParts.join(' ');

    let ghlContactId: string | null = null;

    switch (event) {
      case 'contact.created': {
        // Try to find existing, create if not found
        ghlContactId = await findContact(email);
        if (!ghlContactId) {
          ghlContactId = await createContact({
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            name: fullName || undefined,
            tags: ['myphonicsbooks', 'new-lead', ...(data?.tags ?? [])],
          });
        }
        if (ghlContactId && data?.source) {
          await addTags(ghlContactId, [`source:${data.source}`]);
        }
        break;
      }

      case 'contact.assessed': {
        ghlContactId = await findContact(email);
        if (ghlContactId) {
          await addTags(ghlContactId, ['assessed', `level:${data?.level ?? 'unknown'}`]);
        }
        break;
      }

      case 'contact.free_trial': {
        ghlContactId = await findContact(email);
        if (ghlContactId) {
          await addTags(ghlContactId, ['free-trial']);
        }
        break;
      }

      case 'contact.purchased': {
        ghlContactId = await findContact(email);
        if (ghlContactId) {
          await addTags(ghlContactId, [
            'purchased',
            ...(data?.product ? [`product:${data.product}`] : []),
          ]);
          await updateContact(ghlContactId, {
            tags: ['purchased'],
          });
        }
        break;
      }

      case 'contact.stage_changed': {
        ghlContactId = await findContact(email);
        if (ghlContactId && data?.stage) {
          await addTags(ghlContactId, [`stage:${data.stage}`]);
        }
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown event: ${event}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(
      JSON.stringify({ success: true, ghlContactId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('GHL sync error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
