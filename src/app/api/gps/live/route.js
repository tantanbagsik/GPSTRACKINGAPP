export async function GET() {
  const devices = [
    { id: 1, name: 'iPhone 15 Pro', type: 'phone', icon: '📱', battery: 85, signal: 4, gpsOn: true, lat: 14.5995, lng: 120.9842, address: 'Makati City, Metro Manila' },
    { id: 2, name: 'Toyota Vios - ABC-1234', type: 'vehicle', icon: '🚗', battery: 72, signal: 3, gpsOn: true, lat: 14.5547, lng: 121.0244, address: 'EDSA, Quezon City' },
    { id: 3, name: 'Samsung Galaxy S24', type: 'phone', icon: '📱', battery: 45, signal: 2, gpsOn: true, lat: 14.4792, lng: 121.0271, address: 'BGC, Taguig' },
    { id: 4, name: 'Honda Civic - XYZ-5678', type: 'vehicle', icon: '🚗', battery: 91, signal: 4, gpsOn: false, lat: 14.6500, lng: 121.0728, address: 'North EDSA, Quezon City' },
    { id: 5, name: 'iPad Pro', type: 'tablet', icon: '📱', battery: 100, signal: 3, gpsOn: true, lat: 14.5641, lng: 121.0632, address: 'Ayala Center, Makati' },
  ];

  return Response.json(devices);
}