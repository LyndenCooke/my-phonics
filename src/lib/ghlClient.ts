import { supabase } from '@/integrations/supabase/client';

/**
 * Sync an event to Go High Level via our Supabase edge function.
 * Events: 'contact.created', 'contact.stage_changed', 'contact.purchased', 'contact.assessed'
 *
 * Completely non-blocking: if the edge function isn't deployed or the
 * network call fails, the app keeps working and we stay quiet in the
 * console. Only genuinely unexpected shapes log a warning.
 */
export async function syncToGHL(event: string, data: Record<string, unknown>) {
  try {
    const { error } = await supabase.functions.invoke('ghl-sync', {
      body: { event, data },
    });
    if (error && import.meta.env.DEV) {
      // Dev-only debug so production consoles stay silent
      console.debug('[ghl-sync] non-fatal:', error.message ?? error);
    }
  } catch {
    // Swallow — function may not be deployed in this environment
  }
}
