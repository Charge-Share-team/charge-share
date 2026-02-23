import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // Ensure you have this installed

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const ocmKey = process.env.NEXT_PUBLIC_OCM_API_KEY;

  try {
    // 1. Fetch from YOUR Database
    const { data: localChargers, error: dbError } = await supabase
      .from('chargers') // Matches your provided CSV table name
      .select('*');

    if (dbError) throw dbError;

    // 2. Fetch from Open Charge Map
    const ocmUrl = `https://api.openchargemap.io/v3/poi/?output=json&countrycode=IN&maxresults=100&compact=true&key=${ocmKey}`;
    const ocmRes = await fetch(ocmUrl);
    const ocmData = await ocmRes.json();

    // 3. Merge both datasets into one array
    return NextResponse.json({
      local: localChargers || [],
      external: ocmData || []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}