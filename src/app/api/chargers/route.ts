import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  
  // Use the secret server-side environment variable
  const key = process.env.NEXT_PUBLIC_OCM_API_KEY;

  if (!key) {
    console.error("OCM API Key is missing in server environment!");
    return NextResponse.json({ error: "API Key missing" }, { status: 500 });
  }

  // 🚀 OPTIMIZED URL: 
  // 1. Expanded distance to 100KM
  // 2. Increased maxresults to 250
  // 3. Added compact=true & verbose=false to minimize data size
  const url = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${lat}&longitude=${lng}&distance=100&distanceunit=KM&maxresults=250&compact=true&verbose=false&key=${key}`;

  try {
    const response = await fetch(url, {
      headers: { 
        'User-Agent': 'ChargeShare-App',
        'Accept': 'application/json' 
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OCM API responded with ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    // Log for debugging: See how many results were actually found
    console.log(`Successfully fetched ${data.length} chargers from OCM.`);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Proxy Fetch Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}