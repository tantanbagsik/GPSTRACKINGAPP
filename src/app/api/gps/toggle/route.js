import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();
  const { vehicle_id, activate } = body;
  
  console.log(`[API] GPS ${activate ? 'activated' : 'deactivated'} for vehicle ${vehicle_id}`);
  
  return NextResponse.json({ 
    success: true, 
    vehicle_id, 
    gps_active: activate 
  });
}
