import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat    = parseFloat(searchParams.get('lat')    ?? '20.5937'); // India centre
  const lng    = parseFloat(searchParams.get('lng')    ?? '78.9629');
  const radius = parseFloat(searchParams.get('radius') ?? '500');     // 500km default

  // ── 1. All local DB chargers ─────────────────────────────────────────
  let localChargers: any[] = [];
  try {
    const { data, error } = await supabase.rpc('nearby_chargers_bbox', {
      lat, lng, radius_km: radius,
    });
    if (error) {
      // Fallback: direct select
      const { data: fallback } = await supabase
        .from('chargers')
        .select('id, name, address, latitude, longitude, plug_types, power_kw, price_per_kwh, is_free, description, host_id, is_available');
      localChargers = fallback ?? [];
    } else {
      localChargers = data ?? [];
    }
  } catch (e: any) {
    console.error('Supabase fetch threw:', e.message);
  }

  // ── 2. OCM — all India public chargers ───────────────────────────────
  let ocmData: any[] = [];
  const ocmKey = process.env.NEXT_PUBLIC_OCM_API_KEY || process.env.NEXT_PUBLIC_OPENCHARGE_API_KEY;
  if (ocmKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const url = `https://api.openchargemap.io/v3/poi/?output=json&countrycode=IN&latitude=${lat}&longitude=${lng}&distance=${radius}&distanceunit=KM&maxresults=500&compact=true&verbose=false&key=${ocmKey}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) ocmData = await res.json();
      else console.error('OCM status:', res.status);
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error('OCM fetch error:', e.message);
      else console.warn('OCM timed out — skipping');
    }
  }

  return NextResponse.json({ local: localChargers, external: ocmData });
}