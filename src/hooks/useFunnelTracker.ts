import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'mpb_funnel_source';

interface FunnelSource {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  ref?: string;
  via?: string;
  landed_at: string;
  landing_url: string;
}

/** Capture UTM / ref params on first visit and persist to localStorage */
function captureSource(): FunnelSource | null {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return JSON.parse(existing) as FunnelSource;

  const params = new URLSearchParams(window.location.search);
  const source: FunnelSource = {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    ref: params.get('ref') || undefined,
    via: params.get('via') || undefined,
    landed_at: new Date().toISOString(),
    landing_url: window.location.pathname,
  };

  // Only save if we have at least one tracking param
  const hasParam = source.utm_source || source.utm_medium || source.utm_campaign || source.ref || source.via;
  if (hasParam) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(source));
    return source;
  }

  // Save landing URL even without params
  localStorage.setItem(STORAGE_KEY, JSON.stringify(source));
  return source;
}

/** Get the stored funnel source */
export function getFunnelSource(): FunnelSource | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as FunnelSource) : null;
}

/** Clear stored source (after it's been sent to the backend) */
export function clearFunnelSource() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Push the stored funnel source to the CRM contact record.
 * Called after signup to tag the new contact with acquisition info.
 */
export async function syncSourceToCRM() {
  const source = getFunnelSource();
  if (!source) return;

  const sourceName = source.utm_source || source.ref || source.via || source.landing_url || 'direct';
  const tags: string[] = [];
  if (source.utm_campaign) tags.push(`campaign:${source.utm_campaign}`);
  if (source.utm_medium) tags.push(`medium:${source.utm_medium}`);
  if (source.ref) tags.push(`ref:${source.ref}`);

  try {
    await (supabase.rpc as any)('crm_set_source', {
      _source: sourceName,
      _tags: tags,
    });
    clearFunnelSource();
  } catch (err) {
    console.error('Failed to sync funnel source to CRM:', err);
  }
}

/**
 * Hook: captures UTM/ref params on mount.
 * Call syncSourceToCRM() after signup completes.
 */
export function useFunnelTracker() {
  useEffect(() => {
    captureSource();
  }, []);

  const syncSource = useCallback(syncSourceToCRM, []);

  return { syncSource, getFunnelSource };
}
