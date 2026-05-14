import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GHL_API_KEY = Deno.env.get('GHL_API_KEY') ?? '';
const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID') ?? '';
const GHL_BASE = 'https://services.leadconnectorhq.com';

// GHL custom field IDs — set these in Supabase env once the fields are
// created in GHL (Settings → Custom Fields). Missing IDs are skipped so
// the integration degrades gracefully while fields are being set up.
const GHL_FIELD_BOOK_TITLE = Deno.env.get('GHL_FIELD_BOOK_TITLE') ?? '';
const GHL_FIELD_BOOK_PDF_URL = Deno.env.get('GHL_FIELD_BOOK_PDF_URL') ?? '';
const GHL_FIELD_LOGIN_URL = Deno.env.get('GHL_FIELD_LOGIN_URL') ?? '';
const GHL_FIELD_CHILD_NAME = Deno.env.get('GHL_FIELD_CHILD_NAME') ?? '';
const GHL_FIELD_BOOK_A4_URL = Deno.env.get('GHL_FIELD_BOOK_A4_URL') ?? '';

interface CustomFieldsPayload {
  book_title?: string;
  book_pdf_url?: string;
  book_a4_url?: string;
  login_url?: string;
  child_name?: string;
}

/** Map our payload keys → GHL custom field IDs, dropping missing ones. */
function buildCustomFields(cf?: CustomFieldsPayload): { id: string; value: string }[] {
  if (!cf) return [];
  const fields: { id: string; value: string }[] = [];
  if (cf.book_title && GHL_FIELD_BOOK_TITLE) {
    fields.push({ id: GHL_FIELD_BOOK_TITLE, value: cf.book_title });
  }
  if (cf.book_pdf_url && GHL_FIELD_BOOK_PDF_URL) {
    fields.push({ id: GHL_FIELD_BOOK_PDF_URL, value: cf.book_pdf_url });
  }
  if (cf.book_a4_url && GHL_FIELD_BOOK_A4_URL) {
    fields.push({ id: GHL_FIELD_BOOK_A4_URL, value: cf.book_a4_url });
  }
  if (cf.login_url && GHL_FIELD_LOGIN_URL) {
    fields.push({ id: GHL_FIELD_LOGIN_URL, value: cf.login_url });
  }
  if (cf.child_name && GHL_FIELD_CHILD_NAME) {
    fields.push({ id: GHL_FIELD_CHILD_NAME, value: cf.child_name });
  }
  return fields;
}

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

    // Resolve the buyer/learner identity from one of:
    //   1. Authenticated user (client-side calls — AuthContext → contact.created)
    //   2. data.email + data.full_name (service-to-service calls from
    //      stripe-webhook / save-assessment-result, where there's no user
    //      session and the payload carries the identity directly)
    // This is what was preventing every server-side sync from landing.
    let email = '';
    let fullName = '';

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
          email = user.email ?? '';
          fullName = user.user_metadata?.full_name ?? '';
        }
      } catch {
        // Swallow — fall through to data-payload identity
      }
    }

    // data payload wins when explicitly provided (e.g. server-side calls
    // where the buyer might be a guest with no Supabase user yet).
    if (data?.email) email = data.email as string;
    if (data?.full_name) fullName = data.full_name as string;

    if (!email) {
      console.error('ghl-sync: no email resolved from auth or data payload', { event, data });
      return new Response(JSON.stringify({ error: 'No email — provide data.email or call with auth' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
        // Create if missing — assessment can be taken by guests before
        // they've signed up (GuestAssessmentSignup flow).
        ghlContactId = await findContact(email);
        if (!ghlContactId) {
          ghlContactId = await createContact({
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            name: fullName || undefined,
            tags: ['myphonicsbooks', 'assessed'],
          });
        }
        if (ghlContactId) {
          // ORDER MATTERS: write custom fields + firstName BEFORE adding the
          // tag that triggers the GHL email workflow. If tags fire first, the
          // workflow renders the template with empty merge tags and the
          // parent receives a broken email. Custom fields must be on the
          // contact at the moment the trigger fires.
          const customFields = buildCustomFields(data?.custom_fields as CustomFieldsPayload);
          const updates: Partial<GHLContact> = {};
          if (customFields.length > 0) updates.customFields = customFields;
          if (firstName) updates.firstName = firstName;
          if (Object.keys(updates).length > 0) {
            await updateContact(ghlContactId, updates);
          }

          const lvl = data?.recommended_level ?? data?.level ?? 'unknown';
          const tags = ['assessed', `level:${lvl}`];
          // source lets the user scope GHL automation to a specific
          // funnel (e.g. only fire the free-book email for leads from
          // the /assessment funnel, not the existing /assess flow).
          if (typeof data?.source === 'string' && data.source) {
            tags.push(`source:${data.source}`);
          }
          await addTags(ghlContactId, tags);
        }
        break;
      }

      case 'contact.free_trial': {
        ghlContactId = await findContact(email);
        if (!ghlContactId) {
          ghlContactId = await createContact({
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            name: fullName || undefined,
            tags: ['myphonicsbooks', 'free-trial'],
          });
        }
        if (ghlContactId) {
          await addTags(ghlContactId, ['free-trial']);
        }
        break;
      }

      case 'contact.purchased': {
        // Guest checkouts may not have a Supabase profile yet — create the
        // GHL contact on the fly so we don't lose the buyer.
        ghlContactId = await findContact(email);
        if (!ghlContactId) {
          ghlContactId = await createContact({
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            name: fullName || undefined,
            tags: ['myphonicsbooks', 'purchased'],
          });
        }
        if (ghlContactId) {
          const productName = data?.product_name ?? data?.product ?? null;
          const productType = data?.product_type ?? null;
          await addTags(ghlContactId, [
            'purchased',
            ...(productType ? [`product-type:${productType}`] : []),
            ...(productName ? [`product:${String(productName).toLowerCase().replace(/\s+/g, '-')}`] : []),
          ]);
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
