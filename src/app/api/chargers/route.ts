import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // IMPORTANT: Ensure this matches the name in your .env.local file
  const ocmKey = process.env.NEXT_PUBLIC_OCM_API_KEY;

  try {
    // 1. Fetch from YOUR Database (Supabase)
    const { data: localChargers, error: dbError } = await supabase
      .from('chargers') 
      .select('*');

    if (dbError) {
      console.error("Supabase Error:", dbError.message);
    }

    // 2. Fetch from Open Charge Map
    // We use a try-catch specifically for the fetch to prevent the whole API from crashing if OCM is down
    let ocmData = [];
    try {
      const ocmUrl = `https://api.openchargemap.io/v3/poi/?output=json&countrycode=IN&maxresults=100&compact=true&verbose=false&key=${ocmKey}`;
      const ocmRes = await fetch(ocmUrl, {
        next: { revalidate: 0 } // Ensures Next.js doesn't cache a failed/empty response
      });

      if (ocmRes.ok) {
        ocmData = await ocmRes.json();
      } else {
        console.error("OpenChargeMap API responded with error status:", ocmRes.status);
      }
    } catch (apiErr) {
      console.error("External API Fetch Failed:", apiErr);
    }

    // 3. Return combined data
    return NextResponse.json({
      local: localChargers || [],
      external: ocmData || []
    });

  } catch (error: any) {
    console.error("Internal Server Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}