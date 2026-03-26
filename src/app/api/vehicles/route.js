export async function GET() {
  const vehicles = [
    { id: 1, plate: 'ABC-1234', driver: 'John Doe', status: 'Active', location: 'Downtown', speed: 45 },
    { id: 2, plate: 'XYZ-5678', driver: 'Jane Smith', status: 'Active', location: 'Airport', speed: 60 },
    { id: 3, plate: 'DEF-9012', driver: 'Mike Johnson', status: 'Idle', location: 'HQ', speed: 0 },
    { id: 4, plate: 'GHI-3456', driver: 'Sarah Lee', status: 'Maintenance', location: 'Workshop', speed: 0 },
    { id: 5, plate: 'JKL-7890', driver: 'Tom Brown', status: 'Active', location: 'Harbor', speed: 30 },
  ];

  return Response.json(vehicles);
}

export async function POST(request) {
  const body = await request.json();
  
  const newVehicle = {
    id: Math.floor(Math.random() * 1000),
    ...body,
    status: 'Active',
  };

  return Response.json({ success: true, vehicle: newVehicle });
}
