'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import './globals.css';

export default function LiveTracking() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [gpsActive, setGpsActive] = useState({});
  const [trackingData, setTrackingData] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [apiKey, setApiKey] = useState('');
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
          const movementFactor = newSpeed / 100;
          
          return {
            id: parseInt(id),
            license_plate: vehicle?.plate || `VEH-${id}`,
            driver: vehicle?.driver || 'Unknown',
            latitude: baseLat + (Math.random() - 0.5) * 0.002 * movementFactor,
            longitude: baseLon + (Math.random() - 0.5) * 0.002 * movementFactor,
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
    
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Grid lines
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
    
    // Roads
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, height/2);
    ctx.lineTo(width, height/2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(width/2, 0);
    ctx.lineTo(width/2, height);
    ctx.stroke();
    
    // Vehicle markers
    trackingData.forEach(vehicle => {
      const x = 150 + ((vehicle.longitude - 120.9) * 2000) % (width - 100);
      const y = 150 + ((vehicle.latitude - 14.5) * 2000) % (height - 100);
      
      // Pulse effect
      if (vehicle.speed > 0) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
        ctx.arc(x, y, 30 + Math.sin(Date.now()/500) * 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
        ctx.arc(x, y, 45 + Math.sin(Date.now()/500) * 8, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Outer ring
      ctx.beginPath();
      ctx.strokeStyle = vehicle.speed > 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(100, 116, 139, 0.5)';
      ctx.lineWidth = 2;
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.stroke();
      
      // Main dot
      const dotGradient = ctx.createRadialGradient(x, y, 0, x, y, 14);
      if (vehicle.speed > 0) {
        dotGradient.addColorStop(0, '#4ade80');
        dotGradient.addColorStop(1, '#22c55e');
      } else {
        dotGradient.addColorStop(0, '#9ca3af');
        dotGradient.addColorStop(1, '#6b7280');
      }
      ctx.beginPath();
      ctx.fillStyle = dotGradient;
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner highlight
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.arc(x - 3, y - 3, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Label background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.beginPath();
      ctx.roundRect(x - 35, y - 35, 70, 20, 4);
      ctx.fill();
      
      // Label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(vehicle.license_plate, x, y - 21);
      
      // Speed badge
      ctx.fillStyle = vehicle.speed > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)';
      ctx.beginPath();
      ctx.roundRect(x - 25, y + 20, 50, 18, 4);
      ctx.fill();
      
      ctx.fillStyle = vehicle.speed > 0 ? '#4ade80' : '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(`${vehicle.speed.toFixed(0)} km/h`, x, y + 33);
    });
    
    // Compass
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('N', width - 25, 25);
    ctx.fillText('S', width - 25, height - 10);
    ctx.fillText('E', width - 10, height/2);
    ctx.fillText('W', width - 40, height/2);
    
  }, [trackingData]);

  const toggleGPS = (vehicleId) => {
    const newState = !gpsActive[vehicleId];
    setGpsActive(prev => ({ ...prev, [vehicleId]: newState }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Find My Vehicles</h1>
          <p className="text-slate-400 mb-6">Sign in to locate and track your vehicles in real-time</p>
          <button onClick={() => router.push('/login')} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300">
            Sign In
          </button>
        </div>
      </div>
    );
  }

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
              localStorage.removeItem('rp_tracking_user');
              router.push('/login');
            }} className="px-4 py-2 bg-white/10 rounded-lg text-white text-sm hover:bg-white/20 transition-colors border border-white/10">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
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
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isGpsOn ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-slate-700'
                        }`}>
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
                          </svg>
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
              <div className="flex gap-2">
                <button onClick={() => setMapZoom(z => Math.min(z + 0.2, 2))} className="w-8 h-8 bg-slate-700 rounded-lg text-white hover:bg-slate-600 transition-colors">+</button>
                <button onClick={() => setMapZoom(z => Math.max(z - 0.2, 0.5))} className="w-8 h-8 bg-slate-700 rounded-lg text-white hover:bg-slate-600 transition-colors">−</button>
                <button onClick={() => setMapZoom(1)} className="w-8 h-8 bg-slate-700 rounded-lg text-white hover:bg-slate-600 transition-colors">⟳</button>
              </div>
            </div>
            <div className="relative">
              <canvas 
                ref={mapRef} 
                width={800} 
                height={600}
                className="w-full h-auto"
                style={{ transform: `scale(${mapZoom})`, transformOrigin: 'center' }}
              />
              {trackingData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      </svg>
                    </div>
                    <p className="text-slate-400">Turn on GPS to see vehicles</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div className="col-span-3">
          {selectedVehicle ? (
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-white font-semibold">
                  {vehicles.find(v => v.id === selectedVehicle)?.plate}
                </h2>
                <button onClick={() => setSelectedVehicle(null)} className="text-slate-400 hover:text-white transition-colors">×</button>
              </div>
              {(() => {
                const t = trackingData.find(v => v.id === selectedVehicle);
                
                if (!t) {
                  return (
                    <div className="p-6 text-center">
                      <p className="text-slate-400 mb-4">GPS is off</p>
                      <button 
                        onClick={() => toggleGPS(selectedVehicle)}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                      >
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
                        <p className="text-slate-500 text-xs">direction</p>
                      </div>
                      <div className="bg-slate-700/30 rounded-xl p-3">
                        <p className="text-slate-400 text-xs mb-1">Battery</p>
                        <p className={`font-bold text-lg ${t.battery < 30 ? 'text-red-400' : 'text-white'}`}>{t.battery.toFixed(0)}%</p>
                        <p className="text-slate-500 text-xs">remaining</p>
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
                      <button className="flex-1 py-2 bg-slate-700/50 rounded-lg text-white text-sm hover:bg-slate-600 transition-colors">
                        🔊 Sound
                      </button>
                      <button className="flex-1 py-2 bg-slate-700/50 rounded-lg text-white text-sm hover:bg-slate-600 transition-colors">
                        🔒 Lock
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6 text-center">
              <div className="w-16 h-16 bg-slate-700/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/>
                </svg>
              </div>
              <p className="text-slate-400 text-sm">Select a vehicle to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
