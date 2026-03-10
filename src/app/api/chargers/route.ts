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
  const lat    = parseFloat(searchParams.get('lat')    ?? '30.7333');
  const lng    = parseFloat(searchParams.get('lng')    ?? '76.7794');
  const radius = parseFloat(searchParams.get('radius') ?? '25');

  // ── 1. Supabase local chargers via bbox RPC ──
  let localChargers: any[] = [];
  try {
    const { data, error } = await supabase.rpc('nearby_chargers_bbox', {
      lat,
      lng,
      radius_km: radius,
    });
    if (error) {
      console.error('RPC error, falling back to plain select:', error.message);
      // Fallback: direct query with only safe columns (no is_available risk)
      const { data: fallback, error: fbErr } = await supabase
        .from('chargers')
        .select('id, name, address, latitude, longitude, plug_types, power_kw, price_per_kwh, is_free, description')
        .gte('latitude',  lat - radius / 111)
        .lte('latitude',  lat + radius / 111)
        .gte('longitude', lng - radius / 111)
        .lte('longitude', lng + radius / 111);
      if (fbErr) console.error('Fallback error:', fbErr.message);
      else localChargers = fallback ?? [];
    } else {
      localChargers = data ?? [];
    }
  } catch (e: any) {
    console.error('Supabase fetch threw:', e.message);
  }

  // ── 2. Open Charge Map — scoped, fast timeout ──
  let ocmData: any[] = [];
  const ocmKey = process.env.NEXT_PUBLIC_OCM_API_KEY;
  if (ocmKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const url = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${lat}&longitude=${lng}&distance=${radius}&distanceunit=KM&maxresults=60&compact=true&verbose=false&key=${ocmKey}`;
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