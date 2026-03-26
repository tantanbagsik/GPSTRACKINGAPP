'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import '../globals.css';

export default function LiveTracking() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [vehicles, setVehicles] = useState([
    { id: 1, plate: 'ABC-1234', driver: 'John Doe', type: 'car', status: 'Active' },
    { id: 2, plate: 'XYZ-5678', driver: 'Jane Smith', type: 'truck', status: 'Active' },
    { id: 3, plate: 'DEF-9012', driver: 'Mike Johnson', type: 'motorcycle', status: 'Idle' },
    { id: 4, plate: 'GHI-3456', driver: 'Sarah Lee', type: 'van', status: 'Active' },
    { id: 5, plate: 'JKL-7890', driver: 'Tom Brown', type: 'car', status: 'Idle' },
  ]);
  const [gpsActive, setGpsActive] = useState({});
  const [trackingData, setTrackingData] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const mapRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    const initialGps = {};
    vehicles.forEach(v => { initialGps[v.id] = v.status === 'Active'; });
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
          
          const baseLat = existing?.latitude || (14.5995 + Math.random() * 0.05);
          const baseLon = existing?.longitude || (120.9842 + Math.random() * 0.05);
          const speed = existing?.speed || (Math.random() * 60);
          const newSpeed = Math.max(0, speed + (Math.random() - 0.5) * 10);
          
          return {
            id: parseInt(id),
            license_plate: vehicle?.plate,
            driver: vehicle?.driver,
            type: vehicle?.type,
            latitude: baseLat + (Math.random() - 0.5) * 0.002,
            longitude: baseLon + (Math.random() - 0.5) * 0.002,
            speed: newSpeed,
            heading: existing?.heading || (Math.random() * 360),
            timestamp: Date.now(),
            battery: Math.min(100, (existing?.battery || 80) + (Math.random() - 0.6) * 2),
            signal: Math.random() > 0.1 ? 'Strong' : 'Weak',
            network: Math.random() > 0.2 ? '4G' : '3G',
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
    
    ctx.clearRect(0, 0, width, height);
    
    // Background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Grid
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.15)';
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
    
    // Roads
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, height/2);
    ctx.lineTo(width, height/2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width/2, 0);
    ctx.lineTo(width/2, height);
    ctx.stroke();
    
    // Diagonal roads
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);
    ctx.stroke();

    // Vehicles
    trackingData.forEach(vehicle => {
      const x = 100 + ((vehicle.longitude - 120.9) * 2000) % (width - 150);
      const y = 80 + ((vehicle.latitude - 14.5) * 2000) % (height - 120);
      
      // Pulse rings
      if (vehicle.speed > 0) {
        for (let i = 3; i >= 1; i--) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(34, 197, 94, ${0.05 * i})`;
          ctx.arc(x, y, 20 + i * 12 + Math.sin(Date.now()/400 + i) * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Shadow
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.ellipse(x + 2, y + 16, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Outer ring
      ctx.beginPath();
      ctx.strokeStyle = vehicle.speed > 0 ? 'rgba(74, 222, 128, 0.6)' : 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 3;
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.stroke();
      
      // Main dot
      const dotGradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, 12);
      if (vehicle.speed > 0) {
        dotGradient.addColorStop(0, '#86efac');
        dotGradient.addColorStop(0.5, '#4ade80');
        dotGradient.addColorStop(1, '#22c55e');
      } else {
        dotGradient.addColorStop(0, '#d1d5db');
        dotGradient.addColorStop(0.5, '#9ca3af');
        dotGradient.addColorStop(1, '#6b7280');
      }
      ctx.beginPath();
      ctx.fillStyle = dotGradient;
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Highlight
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.arc(x - 4, y - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Label background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(x - 38, y - 38, 76, 22, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(vehicle.license_plate, x, y - 23);
      
      // Speed badge
      ctx.fillStyle = vehicle.speed > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)';
      ctx.beginPath();
      ctx.roundRect(x - 28, y + 22, 56, 20, 6);
      ctx.fill();
      
      ctx.fillStyle = vehicle.speed > 0 ? '#4ade80' : '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(`${vehicle.speed.toFixed(0)} km/h`, x, y + 36);
    });
    
    // Compass
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('N', width - 30, 30);
    ctx.fillText('S', width - 30, height - 15);
    ctx.fillText('E', width - 15, height/2 + 5);
    ctx.fillText('W', width - 50, height/2 + 5);
    
  }, [trackingData]);

  const toggleGPS = (vehicleId) => {
    setGpsActive(prev => ({ ...prev, [vehicleId]: !prev[vehicleId] }));
  };

  const getVehicleIcon = (type) => {
    const icons = { car: '🚗', truck: '🚚', motorcycle: '🏍️', van: '🚐' };
    return icons[type] || '🚗';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10 text-center max-w-md w-full">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30">
            <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            </svg>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Find My Vehicles</h1>
          <p className="text-slate-400 mb-6 text-sm md:text-base">Sign in to track your vehicles</p>
          <button onClick={() => router.push('/login')} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
        {/* Mobile Header */}
        <header className="bg-slate-800/50 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-sm">GPS Tracker</h1>
              <p className="text-slate-400 text-xs">{Object.values(gpsActive).filter(Boolean).length} online</p>
            </div>
          </div>
          <button onClick={() => {
            localStorage.removeItem('rp_tracking_token');
            router.push('/login');
          }} className="text-slate-400 text-xs">
            Logout
          </button>
        </header>

        {/* Mobile Tab Bar */}
        <div className="flex bg-slate-800/30 border-b border-white/10">
          <button 
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'map' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}
          >
            📍 Map
          </button>
          <button 
            onClick={() => setActiveTab('vehicles')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'vehicles' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}
          >
            🚗 Vehicles
          </button>
          <button 
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'details' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}
          >
            📊 Details
          </button>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'map' && (
            <div className="h-full relative">
              <canvas 
                ref={mapRef} 
                width={window.innerWidth} 
                height={window.innerHeight - 140}
                className="w-full h-full"
              />
              {trackingData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-slate-400 text-sm">Turn on GPS to track vehicles</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="h-full overflow-y-auto p-4 space-y-3">
              {vehicles.map(vehicle => {
                const tracking = trackingData.find(t => t.id === vehicle.id);
                const isGpsOn = gpsActive[vehicle.id];
                
                return (
                  <div 
                    key={vehicle.id}
                    className={`bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border transition-all ${
                      isGpsOn ? 'border-green-500/30' : 'border-white/10'
                    }`}
                    onClick={() => {
                      setSelectedVehicle(vehicle.id);
                      setActiveTab('details');
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                          isGpsOn ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-slate-700'
                        }`}>
                          {getVehicleIcon(vehicle.type)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{vehicle.plate}</p>
                          <p className="text-slate-400 text-xs">{vehicle.driver}</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGPS(vehicle.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          isGpsOn ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {isGpsOn ? '📍 ON' : '📍 OFF'}
                      </button>
                    </div>
                    {tracking && (
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">{tracking.speed.toFixed(0)} km/h</span>
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">🔋 {tracking.battery.toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="h-full overflow-y-auto p-4">
              {selectedVehicle ? (
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <h2 className="text-white font-bold">{vehicles.find(v => v.id === selectedVehicle)?.plate}</h2>
                    <p className="text-slate-400 text-sm">{vehicles.find(v => v.id === selectedVehicle)?.driver}</p>
                  </div>
                  {(() => {
                    const t = trackingData.find(v => v.id === selectedVehicle);
                    if (!t) {
                      return (
                        <div className="p-6 text-center">
                          <p className="text-slate-400 mb-4">GPS is off</p>
                          <button onClick={() => toggleGPS(selectedVehicle)} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white text-sm">
                            Turn On GPS
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-700/30 rounded-xl p-3">
                            <p className="text-slate-400 text-xs">Speed</p>
                            <p className="text-white font-bold text-lg">{t.speed.toFixed(1)} <span className="text-xs text-slate-400">km/h</span></p>
                          </div>
                          <div className="bg-slate-700/30 rounded-xl p-3">
                            <p className="text-slate-400 text-xs">Heading</p>
                            <p className="text-white font-bold text-lg">{t.heading.toFixed(0)}°</p>
                          </div>
                          <div className="bg-slate-700/30 rounded-xl p-3">
                            <p className="text-slate-400 text-xs">Battery</p>
                            <p className={`font-bold text-lg ${t.battery < 30 ? 'text-red-400' : 'text-white'}`}>{t.battery.toFixed(0)}%</p>
                          </div>
                          <div className="bg-slate-700/30 rounded-xl p-3">
                            <p className="text-slate-400 text-xs">Signal</p>
                            <p className="text-white font-bold text-lg">{t.signal}</p>
                          </div>
                        </div>
                        <div className="bg-slate-700/30 rounded-xl p-3">
                          <p className="text-slate-400 text-xs mb-1">Location</p>
                          <p className="text-white font-mono text-xs">{t.latitude.toFixed(6)}, {t.longitude.toFixed(6)}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400">Select a vehicle from the Vehicles tab</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/30 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Live Tracking</h1>
              <p className="text-slate-400 text-sm">{Object.values(gpsActive).filter(Boolean).length} vehicles online</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-slate-700/50 rounded-lg border border-white/10">
              <span className="text-slate-400 text-sm">API: </span>
              <span className="text-cyan-400 font-mono text-sm">{apiKey.substring(0, 15)}...</span>
            </div>
            <button onClick={() => {
              localStorage.removeItem('rp_tracking_token');
              router.push('/login');
            }} className="px-4 py-2 bg-white/10 rounded-lg text-white text-sm hover:bg-white/20 transition-colors border border-white/10">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Grid */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-12 gap-6">
        {/* Vehicle List */}
        <div className="col-span-3">
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-white font-semibold">Your Vehicles</h2>
            </div>
            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
              {vehicles.map(vehicle => {
                const tracking = trackingData.find(t => t.id === vehicle.id);
                const isGpsOn = gpsActive[vehicle.id];
                
                return (
                  <div 
                    key={vehicle.id}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:bg-white/5 ${
                      selectedVehicle === vehicle.id ? 'bg-white/10 border-l-2 border-cyan-400' : ''
                    }`}
                    onClick={() => setSelectedVehicle(vehicle.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                          isGpsOn ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-slate-700'
                        }`}>
                          {getVehicleIcon(vehicle.type)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{vehicle.plate}</p>
                          <p className="text-slate-400 text-sm">{vehicle.driver}</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGPS(vehicle.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                          isGpsOn 
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        {isGpsOn ? '📍 ON' : '📍 OFF'}
                      </button>
                    </div>
                    {tracking && (
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">
                          {tracking.speed.toFixed(0)} km/h
                        </span>
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                          🔋 {tracking.battery.toFixed(0)}%
                        </span>
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
                          {tracking.signal}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="col-span-6">
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-white font-semibold">Live Map</span>
              </div>
            </div>
            <div className="relative">
              <canvas 
                ref={mapRef} 
                width={800} 
                height={600}
                className="w-full h-auto"
              />
              {trackingData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-slate-400">Turn on GPS to see vehicles</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="col-span-3">
          {selectedVehicle ? (
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-white font-semibold">
                  {vehicles.find(v => v.id === selectedVehicle)?.plate}
                </h2>
                <button onClick={() => setSelectedVehicle(null)} className="text-slate-400 hover:text-white">×</button>
              </div>
              {(() => {
                const t = trackingData.find(v => v.id === selectedVehicle);
                if (!t) {
                  return (
                    <div className="p-6 text-center">
                      <p className="text-slate-400 mb-4">GPS is off</p>
                      <button onClick={() => toggleGPS(selectedVehicle)} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white text-sm">
                        Turn On GPS
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="p-4 space-y-4">
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-block ${
                      gpsActive[selectedVehicle] ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {gpsActive[selectedVehicle] ? '● LIVE' : '○ OFFLINE'}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-700/30 rounded-xl p-3">
                        <p className="text-slate-400 text-xs mb-1">Speed</p>
                        <p className="text-white font-bold text-lg">{t.speed.toFixed(1)}</p>
                        <p className="text-slate-500 text-xs">km/h</p>
                      </div>
                      <div className="bg-slate-700/30 rounded-xl p-3">
                        <p className="text-slate-400 text-xs mb-1">Heading</p>
                        <p className="text-white font-bold text-lg">{t.heading.toFixed(0)}°</p>
                      </div>
                      <div className="bg-slate-700/30 rounded-xl p-3">
                        <p className="text-slate-400 text-xs mb-1">Battery</p>
                        <p className={`font-bold text-lg ${t.battery < 30 ? 'text-red-400' : 'text-white'}`}>{t.battery.toFixed(0)}%</p>
                      </div>
                      <div className="bg-slate-700/30 rounded-xl p-3">
                        <p className="text-slate-400 text-xs mb-1">Signal</p>
                        <p className="text-white font-bold text-lg">{t.signal}</p>
                        <p className="text-slate-500 text-xs">{t.network}</p>
                      </div>
                    </div>
                    <div className="bg-slate-700/30 rounded-xl p-3">
                      <p className="text-slate-400 text-xs mb-1">Location</p>
                      <p className="text-white font-mono text-sm">{t.latitude.toFixed(6)}, {t.longitude.toFixed(6)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-slate-700/50 rounded-lg text-white text-sm hover:bg-slate-600 transition-colors">🔊 Sound</button>
                      <button className="flex-1 py-2 bg-slate-700/50 rounded-lg text-white text-sm hover:bg-slate-600 transition-colors">🔒 Lock</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6 text-center">
              <p className="text-slate-400 text-sm">Select a vehicle to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
