import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  
  // Note: We don't use NEXT_PUBLIC here because this is SERVER-SIDE
  const key = process.env.NEXT_PUBLIC_OCM_API_KEY;

  if (!key) {
    console.error("OCM API Key is missing in server environment!");
    return NextResponse.json({ error: "API Key missing" }, { status: 500 });
  }

  const url = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${lat}&longitude=${lng}&distance=25&distanceunit=KM&maxresults=50&key=${key}`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ChargeShare-App' } // Required by some APIs to avoid 403s
    });
    
    if (!response.ok) throw new Error(`OCM API responded with ${response.status}`);
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}