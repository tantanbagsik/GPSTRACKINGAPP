'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import '../globals.css';

const VEHICLE_TYPES = [
  { id: 'car', icon: '🚗', name: 'Car' },
  { id: 'truck', icon: '🚚', name: 'Truck' },
  { id: 'motorcycle', icon: '🏍️', name: 'Motorcycle' },
  { id: 'van', icon: '🚐', name: 'Van' },
];

export default function LiveTracking() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [vehicles, setVehicles] = useState([
    { id: 1, plate: 'ABC-1234', driver: 'John Doe', type: 'car', status: 'online', lastSeen: Date.now() },
    { id: 2, plate: 'XYZ-5678', driver: 'Jane Smith', type: 'truck', status: 'offline', lastSeen: Date.now() - 3600000 },
    { id: 3, plate: 'DEF-9012', driver: 'Mike Johnson', type: 'motorcycle', status: 'online', lastSeen: Date.now() },
    { id: 4, plate: 'GHI-3456', driver: 'Sarah Lee', type: 'van', status: 'online', lastSeen: Date.now() },
    { id: 5, plate: 'JKL-7890', driver: 'Tom Brown', type: 'car', status: 'offline', lastSeen: Date.now() - 7200000 },
  ]);
  const [gpsActive, setGpsActive] = useState({});
  const [trackingData, setTrackingData] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [filter, setFilter] = useState('all');
  const mapRef = useRef(null);
  const [mapZoom, setMapZoom] = useState(1);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('rp_tracking_token');
    if (!savedApiKey) {
      router.push('/login');
      return;
    }
    setApiKey(savedApiKey);
    setIsAuthenticated(true);
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Initialize GPS state
    const initialGps = {};
    vehicles.forEach(v => { initialGps[v.id] = v.status === 'online'; });
    setGpsActive(initialGps);
  }, [isAuthenticated, vehicles]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const newData = Object.keys(gpsActive)
        .filter(id => gpsActive[id])
        .map(id => {
          const vehicle = vehicles.find(v => v.id === parseInt(id));
          const existing = trackingData.find(t => t.id === parseInt(id));
          
          // Simulate realistic movement
          const baseLat = existing?.latitude || (14.5995 + Math.random() * 0.05);
          const baseLon = existing?.longitude || (120.9842 + Math.random() * 0.05);
          const speed = existing?.speed || (Math.random() * 60);
          
          // Add some realistic variation
          const newSpeed = Math.max(0, speed + (Math.random() - 0.5) * 10);
          const movementFactor = newSpeed / 100;
          
          return {
            id: parseInt(id),
            license_plate: vehicle?.plate || `VEH-${id}`,
            driver: vehicle?.driver || 'Unknown',
            type: vehicle?.type || 'car',
            latitude: baseLat + (Math.random() - 0.5) * 0.002 * movementFactor,
            longitude: baseLon + (Math.random() - 0.5) * 0.002 * movementFactor,
            speed: newSpeed,
            heading: existing?.heading || (Math.random() * 360),
            timestamp: Date.now(),
            battery: Math.min(100, (existing?.battery || 80) + (Math.random() - 0.6) * 2),
            signal: Math.random() > 0.1 ? 'Strong' : 'Weak',
            network: Math.random() > 0.2 ? '4G' : '3G',
            lastStop: existing?.lastStop || 'Downtown Manila',
            distance: (existing?.distance || 0) + newSpeed * 0.0005,
          };
        });
      setTrackingData(newData);
    }, 2000);

    return () => clearInterval(interval);
  }, [isAuthenticated, gpsActive, vehicles, trackingData]);

  useEffect(() => {
    if (!mapRef.current || trackingData.length === 0) return;
    
    const canvas = mapRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear and draw map background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#e8f5e9';
    ctx.fillRect(0, 0, width, height);
    
    // Draw road grid
    ctx.strokeStyle = '#c8e6c9';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
    
    // Draw roads
    ctx.strokeStyle = '#a5d6a7';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, height/2);
    ctx.lineTo(width, height/2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(width/2, 0);
    ctx.lineTo(width/2, height);
    ctx.stroke();
    
    // Draw vehicle markers
    trackingData.forEach(vehicle => {
      const x = 150 + ((vehicle.longitude - 120.9) * 2000) % (width - 100);
      const y = 150 + ((vehicle.latitude - 14.5) * 2000) % (height - 100);
      
      // Pulse effect for active vehicles
      if (vehicle.speed > 0) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
        ctx.arc(x, y, 25 + Math.sin(Date.now()/500) * 5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Vehicle dot
      ctx.beginPath();
      ctx.fillStyle = vehicle.speed > 0 ? '#22c55e' : '#6b7280';
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner circle
      ctx.beginPath();
      ctx.fillStyle = 'white';
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Center dot
      ctx.beginPath();
      ctx.fillStyle = vehicle.speed > 0 ? '#22c55e' : '#6b7280';
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Label
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(vehicle.license_plate, x - 30, y - 22);
      
      // Speed indicator
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`${vehicle.speed.toFixed(0)} km/h`, x - 20, y + 28);
    });
    
    // Draw compass
    ctx.fillStyle = '#374151';
    ctx.font = '14px Inter';
    ctx.fillText('N', width - 30, 30);
    ctx.fillText('S', width - 30, height - 15);
    ctx.fillText('E', width - 15, height/2);
    ctx.fillText('W', width - 45, height/2);
  }, [trackingData]);

  const toggleGPS = (vehicleId) => {
    const newState = !gpsActive[vehicleId];
    setGpsActive(prev => ({ ...prev, [vehicleId]: newState }));
  };

  const getVehicleIcon = (type) => {
    const vt = VEHICLE_TYPES.find(v => v.id === type);
    return vt ? vt.icon : '🚗';
  };

  const filteredVehicles = vehicles.filter(v => {
    if (filter === 'all') return true;
    if (filter === 'online') return gpsActive[v.id];
    if (filter === 'offline') return !gpsActive[v.id];
    return v.type === filter;
  });

  if (!isAuthenticated) {
    return (
      <main className="find-hub-page">
        <div className="auth-card">
          <div className="auth-icon">📍</div>
          <h1>Find My Vehicles</h1>
          <p>Sign in to locate and track your vehicles in real-time</p>
          <button className="btn-primary" onClick={() => router.push('/login')}>
            Sign In
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="find-hub-page">
      <header className="find-header">
        <div className="header-left">
          <h1>📍 Find My Vehicles</h1>
          <span className="vehicle-count">{Object.values(gpsActive).filter(Boolean).length} online</span>
        </div>
        <div className="header-right">
          <div className="api-key-badge">
            🔑 {apiKey.substring(0, 12)}...
          </div>
          <button className="btn-outline" onClick={() => {
            localStorage.removeItem('rp_tracking_token');
            localStorage.removeItem('rp_tracking_user');
            router.push('/login');
          }}>
            Sign Out
          </button>
        </div>
      </header>

      <div className="find-content">
        <aside className="vehicle-list-panel">
          <div className="filter-bar">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filter === 'online' ? 'active' : ''}`}
              onClick={() => setFilter('online')}
            >
              Online
            </button>
            <button 
              className={`filter-btn ${filter === 'offline' ? 'active' : ''}`}
              onClick={() => setFilter('offline')}
            >
              Offline
            </button>
          </div>
          
          <div className="vehicle-items">
            {filteredVehicles.map(vehicle => {
              const tracking = trackingData.find(t => t.id === vehicle.id);
              const isGpsOn = gpsActive[vehicle.id];
              const isSelected = selectedVehicle === vehicle.id;
              
              return (
                <div 
                  key={vehicle.id}
                  className={`vehicle-item ${isSelected ? 'selected' : ''} ${isGpsOn ? 'online' : ''}`}
                  onClick={() => setSelectedVehicle(vehicle.id)}
                >
                  <div className="vehicle-icon">
                    {getVehicleIcon(vehicle.type)}
                  </div>
                  <div className="vehicle-info">
                    <div className="vehicle-name">
                      <strong>{vehicle.plate}</strong>
                      <span className={`status-badge ${isGpsOn ? 'online' : 'offline'}`}>
                        {isGpsOn ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <div className="vehicle-meta">
                      <span>{vehicle.driver}</span>
                      {tracking && (
                        <span className="speed">
                          {tracking.speed.toFixed(0)} km/h
                        </span>
                      )}
                    </div>
                    <div className="last-seen">
                      {isGpsOn 
                        ? '● Live now'
                        : `Last seen ${new Date(vehicle.lastSeen).toLocaleTimeString()}`
                      }
                    </div>
                  </div>
                  <button 
                    className={`gps-toggle-btn ${isGpsOn ? 'on' : 'off'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGPS(vehicle.id);
                    }}
                  >
                    {isGpsOn ? '📍' : '📍'}
                    <span>{isGpsOn ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        <div className="map-panel">
          <div className="map-toolbar">
            <span>Map View</span>
            <div className="map-controls">
              <button className="map-btn" onClick={() => setMapZoom(z => Math.min(z + 0.2, 2))}>+</button>
              <button className="map-btn" onClick={() => setMapZoom(z => Math.max(z - 0.2, 0.5))}>-</button>
              <button className="map-btn" onClick={() => setMapZoom(1)}>⟳</button>
            </div>
          </div>
          <div className="map-container">
            <canvas 
              ref={mapRef} 
              width={800} 
              height={500}
              className="tracking-canvas"
              style={{ transform: `scale(${mapZoom})`, transformOrigin: 'center' }}
            />
            {trackingData.length === 0 && (
              <div className="map-empty">
                <div className="empty-icon">📍</div>
                <h3>No vehicles online</h3>
                <p>Turn on GPS tracking for a vehicle to see its location</p>
              </div>
            )}
          </div>
        </div>

        {selectedVehicle && (
          <aside className="detail-panel">
            <div className="detail-header">
              <h2>
                {getVehicleIcon(vehicles.find(v => v.id === selectedVehicle)?.type)}
                {vehicles.find(v => v.id === selectedVehicle)?.plate}
              </h2>
              <button className="close-btn" onClick={() => setSelectedVehicle(null)}>×</button>
            </div>
            
            {(() => {
              const t = trackingData.find(v => v.id === selectedVehicle);
              const vehicle = vehicles.find(v => v.id === selectedVehicle);
              
              if (!t) {
                return (
                  <div className="detail-empty">
                    <p>GPS is off. Turn on GPS to see live data.</p>
                    <button 
                      className="btn-primary"
                      onClick={() => toggleGPS(selectedVehicle)}
                    >
                      Turn On GPS
                    </button>
                  </div>
                );
              }
              
              return (
                <div className="detail-content">
                  <div className="detail-status">
                    <span className={`live-badge ${gpsActive[selectedVehicle] ? 'active' : ''}`}>
                      {gpsActive[selectedVehicle] ? '● LIVE' : '○ OFFLINE'}
                    </span>
                  </div>
                  
                  <div className="detail-grid">
                    <div className="detail-card">
                      <div className="card-icon">🚗</div>
                      <div className="card-content">
                        <label>Speed</label>
                        <span className="value">{t.speed.toFixed(1)} km/h</span>
                      </div>
                    </div>
                    
                    <div className="detail-card">
                      <div className="card-icon">🧭</div>
                      <div className="card-content">
                        <label>Heading</label>
                        <span className="value">{t.heading.toFixed(0)}°</span>
                      </div>
                    </div>
                    
                    <div className="detail-card">
                      <div className="card-icon">🔋</div>
                      <div className="card-content">
                        <label>Battery</label>
                        <span className={`value ${t.battery < 30 ? 'low' : ''}`}>{t.battery.toFixed(0)}%</span>
                      </div>
                    </div>
                    
                    <div className="detail-card">
                      <div className="card-icon">📡</div>
                      <div className="card-content">
                        <label>Signal</label>
                        <span className="value">{t.signal} ({t.network})</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="location-section">
                    <h3>Location</h3>
                    <div className="coordinates">
                      <span>📍 {t.latitude.toFixed(6)}, {t.longitude.toFixed(6)}</span>
                    </div>
                    <div className="last-stop">
                      <span>Last Stop: {t.lastStop}</span>
                    </div>
                    <div className="distance">
                      <span>Total Distance: {t.distance.toFixed(2)} km</span>
                    </div>
                  </div>
                  
                  <div className="actions-section">
                    <h3>Actions</h3>
                    <div className="action-buttons">
                      <button className="action-btn">
                        <span>🔊</span> Sound
                      </button>
                      <button className="action-btn">
                        <span>🔒</span> Lock
                      </button>
                      <button className="action-btn danger">
                        <span>🗑️</span> Erase
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </aside>
        )}
      </div>
    </main>
  );
}
