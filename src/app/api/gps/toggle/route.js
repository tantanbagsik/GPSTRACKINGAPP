export async function POST(request) {
  const body = await request.json();
  const { deviceId, gpsOn } = body;

  return Response.json({ 
    success: true, 
    deviceId, 
    gpsOn,
    message: gpsOn ? 'GPS enabled successfully' : 'GPS disabled successfully'
  });
}