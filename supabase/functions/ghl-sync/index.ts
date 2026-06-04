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

/** Add a free-text note to a GHL contact's timeline. */
async function addNote(contactId: string, body: string): Promise<boolean> {
  const res = await fetch(`${GHL_BASE}/contacts/${contactId}/notes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GHL_API_KEY}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    console.error('GHL note failed:', await res.text());
    return false;
  }
  return true;
}

// Pipeline stage names — must match public.crm_pipeline_stages.name and
// the STAGES constant in ghl-opportunity-sync. One per lifecycle event.
type PipelineStage = 'New Lead' | 'Assessed' | 'Free Trial' | 'Purchased' | 'Subscribed' | 'Churned';

/**
 * Fire opportunity sync to mirror the contact lifecycle into the GHL
 * pipeline. Best-effort: pipeline sync failures are logged but don't fail
 * the contact sync. The opportunity function is self-bootstrapping
 * (discovers + caches pipeline IDs on first call).
 */
async function fireOpportunitySync(args: {
  email: string;
  fullName: string;
  stage: PipelineStage;
  monetaryValue?: number;
  source?: string | null;
}): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { error } = await supabase.functions.invoke('ghl-opportunity-sync', {
      body: {
        email: args.email,
        full_name: args.fullName,
        stage: args.stage,
        monetary_value: args.monetaryValue,
        source: args.source ?? null,
      },
    });
    if (error) console.error('opportunity sync failed:', error.message);
  } catch (err) {
    console.error('opportunity sync threw:', (err as Error).message);
  }
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
        // Try to find existing, create if not found. We track whether the
        // contact was genuinely new so we only fire the New Lead opportunity
        // sync for first-time signups — otherwise every login (AuthContext
        // re-fires contact.created on each session) would drag an existing
        // opportunity back to New Lead, overwriting Free Trial / Purchased.
        ghlContactId = await findContact(email);
        const wasNewContact = !ghlContactId;
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
        if (ghlContactId && wasNewContact) {
          await fireOpportunitySync({ email, fullName, stage: 'New Lead', source: data?.source ?? null });
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
          await fireOpportunitySync({ email, fullName, stage: 'Assessed', source: data?.source ?? null });
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
          await fireOpportunitySync({ email, fullName, stage: 'Free Trial' });
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
          // amount_paid_pence comes through on Stripe-driven calls; convert
          // to GBP for the opportunity card. Voucher rows pass 0 / null and
          // the opportunity is created without a monetary value.
          const pence = typeof data?.amount_paid_pence === 'number' ? data.amount_paid_pence : null;
          await fireOpportunitySync({
            email,
            fullName,
            stage: 'Purchased',
            monetaryValue: pence !== null ? pence / 100 : undefined,
            source: productName ? `product:${productName}` : null,
          });
        }
        break;
      }

      case 'contact.trial_converted': {
        // Trial ended and Stripe collected the first charge. Replace the
        // free-trial tag with a paid one so GHL automation can switch
        // from trial-nurture to onboarding/retention flows.
        ghlContactId = await findContact(email);
        if (!ghlContactId) {
          ghlContactId = await createContact({
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            name: fullName || undefined,
            tags: ['myphonicsbooks', 'trial-converted', 'purchased'],
          });
        }
        if (ghlContactId) {
          const productName = data?.product_name ?? null;
          const productType = data?.product_type ?? null;
          await addTags(ghlContactId, [
            'trial-converted',
            'purchased',
            ...(productType ? [`product-type:${productType}`] : []),
            ...(productName ? [`product:${String(productName).toLowerCase().replace(/\s+/g, '-')}`] : []),
          ]);
          const pence = typeof data?.amount_paid_pence === 'number' ? data.amount_paid_pence : null;
          await fireOpportunitySync({
            email,
            fullName,
            stage: 'Subscribed',
            monetaryValue: pence !== null ? pence / 100 : undefined,
            source: productName ? `product:${productName}` : null,
          });
        }
        break;
      }

      case 'contact.cancelled': {
        // Subscription cancelled — either during trial (didn't convert) or
        // after one or more paid cycles. We tag both states so GHL workflows
        // can branch (e.g. only send a win-back to paid-then-cancelled, not
        // to trial-bouncers who are usually wrong-fit).
        ghlContactId = await findContact(email);
        if (!ghlContactId) {
          // Edge case — we shouldn't be cancelling a contact we've never
          // seen, but create defensively rather than dropping the event.
          ghlContactId = await createContact({
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            name: fullName || undefined,
            tags: ['myphonicsbooks', 'cancelled'],
          });
        }
        if (ghlContactId) {
          const cancelledDuringTrial = Boolean(data?.cancelled_during_trial);
          const tags = [
            'cancelled',
            cancelledDuringTrial ? 'cancelled-during-trial' : 'cancelled-after-paid',
          ];
          if (typeof data?.cancellation_reason === 'string' && data.cancellation_reason) {
            tags.push(`cancel-reason:${data.cancellation_reason}`);
          }
          await addTags(ghlContactId, tags);
          await fireOpportunitySync({ email, fullName, stage: 'Churned' });
        }
        break;
      }

      case 'contact.abandoned_checkout': {
        // Someone started Stripe checkout but never completed. Tag them so
        // the user's GHL workflow can fire a 'Did you forget something?'
        // email. abandoned-product:<type> lets the workflow vary copy by
        // what they nearly bought.
        ghlContactId = await findContact(email);
        if (!ghlContactId) {
          ghlContactId = await createContact({
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            name: fullName || undefined,
            tags: ['myphonicsbooks', 'abandoned-checkout'],
          });
        }
        if (ghlContactId) {
          const productName = data?.product_name ?? null;
          const productType = data?.product_type ?? null;
          await addTags(ghlContactId, [
            'abandoned-checkout',
            ...(productType ? [`abandoned-product:${productType}`] : []),
            ...(productName ? [`abandoned:${String(productName).toLowerCase().replace(/\s+/g, '-')}`] : []),
          ]);
        }
        break;
      }

      case 'contact.feedback': {
        // A parent submitted a star rating + written feedback (from the
        // Profile feedback card or the returning-user pop-up). We attach a
        // note to their GHL timeline and tag them so the user can triage:
        //   - testimonial-candidate → consented, good rating → website
        //   - feedback-negative → an issue to address
        ghlContactId = await findContact(email);
        if (!ghlContactId) {
          ghlContactId = await createContact({
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            name: fullName || undefined,
            tags: ['myphonicsbooks', 'gave-feedback'],
          });
        }
        if (ghlContactId) {
          const rating = Number(data?.rating) || 0;
          const text = typeof data?.feedback === 'string' ? data.feedback.trim() : '';
          const consentMarketing = Boolean(data?.consent_marketing);
          const consentNamed = Boolean(data?.consent_named);
          const stars = rating > 0 ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : '(no rating)';

          const noteLines = [
            `App feedback ${stars} (${rating}/5)`,
            text ? `\n"${text}"` : '\n(no written feedback)',
            '',
            `Use as testimonial: ${consentMarketing ? 'YES' : 'no'}`,
            `Use first name: ${consentNamed ? 'YES' : 'no'}`,
            data?.source ? `Source: ${data.source}` : null,
          ].filter((l) => l !== null);
          await addNote(ghlContactId, noteLines.join('\n'));

          const tags = ['gave-feedback', `rating:${rating}`];
          if (consentMarketing && rating >= 4) tags.push('testimonial-candidate');
          if (consentMarketing) tags.push('marketing-consent');
          if (rating > 0 && rating <= 2) tags.push('feedback-negative');
          else if (rating >= 4) tags.push('feedback-positive');
          await addTags(ghlContactId, tags);
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
