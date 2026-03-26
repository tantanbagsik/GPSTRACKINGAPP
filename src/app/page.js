import './globals.css';

export default function Home() {
  const vehicles = [
    { id: 1, plate: 'ABC-1234', driver: 'John Doe', status: 'Active', location: 'Downtown' },
    { id: 2, plate: 'XYZ-5678', driver: 'Jane Smith', status: 'Active', location: 'Airport' },
    { id: 3, plate: 'DEF-9012', driver: 'Mike Johnson', status: 'Idle', location: ' HQ' },
  ];

  return (
    <main className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="stats">
        <div className="stat-card">
          <h3>Total Vehicles</h3>
          <p className="stat-value">{vehicles.length}</p>
        </div>
        <div className="stat-card">
          <h3>Active</h3>
          <p className="stat-value">{vehicles.filter(v => v.status === 'Active').length}</p>
        </div>
        <div className="stat-card">
          <h3>Idle</h3>
          <p className="stat-value">{vehicles.filter(v => v.status === 'Idle').length}</p>
        </div>
      </div>

      <div className="vehicle-list">
        <h2>Vehicle Status</h2>
        <table>
          <thead>
            <tr>
              <th>License Plate</th>
              <th>Driver</th>
              <th>Status</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(vehicle => (
              <tr key={vehicle.id}>
                <td>{vehicle.plate}</td>
                <td>{vehicle.driver}</td>
                <td>
                  <span className={`status ${vehicle.status.toLowerCase()}`}>
                    {vehicle.status}
                  </span>
                </td>
                <td>{vehicle.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
