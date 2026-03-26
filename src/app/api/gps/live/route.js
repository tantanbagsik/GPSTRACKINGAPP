import { NextResponse } from 'next/server';

let gpsData = [];

export async function GET() {
  return NextResponse.json(gpsData);
}

export async function POST(request) {
  const body = await request.json();
  
  const { vehicle_id, latitude, longitude, speed, heading } = body;
  
  const trackingPoint = {
    id: vehicle_id,
    latitude: latitude || (14.5995 + Math.random() * 0.01),
    longitude: longitude || (120.9842 + Math.random() * 0.01),
    speed: speed || (Math.random() * 60),
    heading: heading || (Math.random() * 360),
    timestamp: Date.now(),
    license_plate: `VEH-${vehicle_id}`,
  };
  
  const existingIndex = gpsData.findIndex(v => v.id === vehicle_id);
  if (existingIndex >= 0) {
    gpsData[existingIndex] = trackingPoint;
  } else {
    gpsData.push(trackingPoint);
  }
  
  return NextResponse.json({ success: true, data: trackingPoint });
}
