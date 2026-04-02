import { supabase } from '@/integrations/supabase/client';

/**
 * Sync an event to Go High Level via our Supabase edge function.
 * Events: 'contact.created', 'contact.stage_changed', 'contact.purchased', 'contact.assessed'
 */
export async function syncToGHL(event: string, data: Record<string, unknown>) {
  try {
    const { error } = await supabase.functions.invoke('ghl-sync', {
      body: { event, data },
    });
    if (error) console.error('GHL sync error:', error);
  } catch (err) {
    // Non-blocking — GHL sync failure should never break the app
    console.error('GHL sync failed:', err);
  }
}
