import '../globals.css';

export default function Admin() {
  const users = [
    { id: 1, username: 'admin_grab', role: 'Admin', status: 'Active' },
    { id: 2, username: 'driver_jojo', role: 'Driver', status: 'Active' },
    { id: 3, username: 'driver_siti', role: 'Driver', status: 'Active' },
  ];

  const vehicles = [
    { id: 1, plate: 'ABC-1234', driver: 'John Doe', status: 'Active', lastUpdate: '2024-01-15 10:30' },
    { id: 2, plate: 'XYZ-5678', driver: 'Jane Smith', status: 'Active', lastUpdate: '2024-01-15 10:25' },
    { id: 3, plate: 'DEF-9012', driver: 'Mike Johnson', status: 'Idle', lastUpdate: '2024-01-15 09:00' },
    { id: 4, plate: 'GHI-3456', driver: 'Sarah Lee', status: 'Maintenance', lastUpdate: '2024-01-14 16:00' },
  ];

  return (
    <main className="admin-page">
      <h1>Admin Panel</h1>
      
      <div className="admin-tabs">
        <button className="tab active">Users</button>
        <button className="tab">Vehicles</button>
        <button className="tab">Settings</button>
      </div>

      <div className="admin-section">
        <div className="section-header">
          <h2>User Management</h2>
          <button className="btn-primary">Add User</button>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`status ${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <button className="btn-small">Edit</button>
                  <button className="btn-small btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-section">
        <div className="section-header">
          <h2>Vehicle Management</h2>
          <button className="btn-primary">Add Vehicle</button>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>License Plate</th>
              <th>Driver</th>
              <th>Status</th>
              <th>Last Update</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(vehicle => (
              <tr key={vehicle.id}>
                <td>{vehicle.id}</td>
                <td>{vehicle.plate}</td>
                <td>{vehicle.driver}</td>
                <td>
                  <span className={`status ${vehicle.status.toLowerCase()}`}>
                    {vehicle.status}
                  </span>
                </td>
                <td>{vehicle.lastUpdate}</td>
                <td>
                  <button className="btn-small">Edit</button>
                  <button className="btn-small btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
