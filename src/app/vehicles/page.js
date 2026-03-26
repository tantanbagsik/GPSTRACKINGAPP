import '../globals.css';

export default function Vehicles() {
  const vehicles = [
    { id: 1, plate: 'ABC-1234', driver: 'John Doe', status: 'Active', location: 'Downtown', speed: 45, lastUpdate: '10:30 AM' },
    { id: 2, plate: 'XYZ-5678', driver: 'Jane Smith', status: 'Active', location: 'Airport', speed: 60, lastUpdate: '10:25 AM' },
    { id: 3, plate: 'DEF-9012', driver: 'Mike Johnson', status: 'Idle', location: 'HQ', speed: 0, lastUpdate: '09:00 AM' },
    { id: 4, plate: 'GHI-3456', driver: 'Sarah Lee', status: 'Maintenance', location: 'Workshop', speed: 0, lastUpdate: 'Jan 14' },
    { id: 5, plate: 'JKL-7890', driver: 'Tom Brown', status: 'Active', location: 'Harbor', speed: 30, lastUpdate: '10:28 AM' },
  ];

  return (
    <main className="vehicles-page">
      <h1>Vehicles</h1>
      
      <div className="filters">
        <input type="text" placeholder="Search by plate or driver..." className="search-input" />
        <select className="filter-select">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="idle">Idle</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <button className="btn-primary">Search</button>
      </div>

      <div className="vehicle-grid">
        {vehicles.map(vehicle => (
          <div key={vehicle.id} className="vehicle-card">
            <div className="vehicle-header">
              <h3>{vehicle.plate}</h3>
              <span className={`status ${vehicle.status.toLowerCase()}`}>
                {vehicle.status}
              </span>
            </div>
            <div className="vehicle-details">
              <p><strong>Driver:</strong> {vehicle.driver}</p>
              <p><strong>Location:</strong> {vehicle.location}</p>
              <p><strong>Speed:</strong> {vehicle.speed} km/h</p>
              <p><strong>Last Update:</strong> {vehicle.lastUpdate}</p>
            </div>
            <div className="vehicle-actions">
              <button className="btn-small">View Details</button>
              <button className="btn-small">Track</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
