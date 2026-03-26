export async function GET() {
  const users = [
    { id: 1, username: 'admin_grab', role: 'Admin', status: 'Active', createdAt: '2024-01-01' },
    { id: 2, username: 'driver_jojo', role: 'Driver', status: 'Active', createdAt: '2024-01-05' },
    { id: 3, username: 'driver_siti', role: 'Driver', status: 'Active', createdAt: '2024-01-10' },
    { id: 4, username: 'driver_budi', role: 'Driver', status: 'Inactive', createdAt: '2024-01-12' },
  ];

  return Response.json(users);
}

export async function POST(request) {
  const body = await request.json();
  
  const newUser = {
    id: Math.floor(Math.random() * 1000),
    ...body,
    status: 'Active',
    createdAt: new Date().toISOString().split('T')[0],
  };

  return Response.json({ success: true, user: newUser });
}

export async function PUT(request) {
  const body = await request.json();
  
  return Response.json({ success: true, message: 'User updated', user: body });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('id');
  
  return Response.json({ success: true, message: `User ${userId} deleted` });
}
