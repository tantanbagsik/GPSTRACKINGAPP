'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import '../globals.css';

// Vehicle icons
const VEHICLE_ICONS = {
  car: '🚗',
  truck: '🚚',
  motorcycle: '🏍️',
  van: '🚐',
  bus: '🚌',
};

export default function LiveTracking() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [vehicles, setVehicles] = useState([
    { id: 1, plate: 'ABC-1234', driver: 'John Doe', type: 'car' },
    { id: 2, plate: 'XYZ-5678', driver: 'Jane Smith', type: 'truck' },
    { id: 3, plate: 'DEF-9012', driver: 'Mike Johnson', type: 'motorcycle' },
    { id: 4, plate: 'GHI-3456', driver: 'Sarah Lee', type: 'van' },
    { id: 5, plate: 'JKL-7890', driver: 'Tom Brown', type: 'car' },
  ]);
  const [gpsActive, setGpsActive] = useState({});
  const [trackingData, setTrackingData] = useState({});
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('devices');
  const mapCanvasRef = useRef(null);
  const animationRef = useRef(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check authentication
  useEffect(() => {
    const savedApiKey = localStorage.getItem('rp_tracking_token');
    if (!savedApiKey) {
      router.push('/login');
      return;
    }
    setApiKey(savedApiKey);
    setIsAuthenticated(true);
  }, [router]);

  // Initialize GPS state
  useEffect(() => {
    if (!isAuthenticated) return;
    const initial = {};
    vehicles.forEach(v => { initial[v.id] = false; });
    setGpsActive(initial);
  }, [isAuthenticated, vehicles]);

  // Simulate GPS tracking data
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const newData = { ...trackingData };
      
      Object.keys(gpsActive).forEach(id => {
        if (gpsActive[id]) {
          const existing = newData[id];
          const baseLat = existing?.latitude || (14.5995 + Math.random() * 0.05);
          const baseLon = existing?.longitude || (120.9842 + Math.random() * 0.05);
          const speed = existing?.speed || (Math.random() * 60);
          
          newData[id] = {
            id: parseInt(id),
            latitude: baseLat + (Math.random() - 0.5) * 0.001,
            longitude: baseLon + (Math.random() - 0.5) * 0.001,
            speed: Math.max(0, speed + (Math.random() - 0.5) * 10),
            heading: existing?.heading || (Math.random() * 360),
            battery: Math.max(0, Math.min(100, (existing?.battery || 85) + (Math.random() - 0.55) * 2)),
            signal: Math.random() > 0.1 ? 'Strong' : 'Weak',
            network: Math.random() > 0.2 ? '4G' : '3G',
            lastUpdate: Date.now(),
            accuracy: 5 + Math.random() * 10,
          };
        }
      });
      
      setTrackingData(newData);
    }, 2000);

    return () => clearInterval(interval);
  }, [isAuthenticated, gpsActive, trackingData]);

  // Draw map
  useEffect(() => {
    if (!mapCanvasRef.current) return;
    
    const canvas = mapCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const drawMap = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, '#0f172a');
      bg.addColorStop(1, '#1e293b');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      
      // Grid pattern
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i <= height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }
      
      // Roads
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
      ctx.lineWidth = 6;
      
      // Main roads
      ctx.beginPath();
      ctx.moveTo(0, height * 0.3);
      ctx.lineTo(width, height * 0.3);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, height * 0.7);
      ctx.lineTo(width, height * 0.7);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(width * 0.3, 0);
      ctx.lineTo(width * 0.3, height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(width * 0.7, 0);
      ctx.lineTo(width * 0.7, height);
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
      
      // Draw vehicles
      const activeVehicles = Object.keys(trackingData).filter(id => gpsActive[id]);
      
      activeVehicles.forEach((id, index) => {
        const data = trackingData[id];
        const vehicle = vehicles.find(v => v.id === parseInt(id));
        if (!data || !vehicle) return;
        
        // Calculate position on canvas
        const x = 80 + ((data.longitude - 120.95) * 3000) % (width - 160);
        const y = 60 + ((data.latitude - 14.55) * 3000) % (height - 120);
        
        const time = Date.now() / 1000;
        
        // Pulse rings (animated)
        if (data.speed > 0) {
          for (let i = 3; i >= 1; i--) {
            const radius = 15 + i * 10 + Math.sin(time * 2 + i) * 3;
            ctx.beginPath();
            ctx.fillStyle = `rgba(34, 197, 94, ${0.08 / i})`;
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        // Shadow
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.ellipse(x + 2, y + 14, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Outer ring
        ctx.beginPath();
        ctx.strokeStyle = data.speed > 0 ? 'rgba(74, 222, 128, 0.6)' : 'rgba(148, 163, 184, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.stroke();
        
        // Main dot with gradient
        const dotGrad = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, 10);
        if (data.speed > 0) {
          dotGrad.addColorStop(0, '#86efac');
          dotGrad.addColorStop(0.5, '#4ade80');
          dotGrad.addColorStop(1, '#22c55e');
        } else {
          dotGrad.addColorStop(0, '#d1d5db');
          dotGrad.addColorStop(0.5, '#9ca3af');
          dotGrad.addColorStop(1, '#6b7280');
        }
        ctx.beginPath();
        ctx.fillStyle = dotGrad;
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.arc(x - 3, y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Label background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(x - 32, y - 32, 64, 18, 4);
        ctx.fill();
        
        // Label text
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(vehicle.plate, x, y - 19);
        
        // Speed badge
        ctx.fillStyle = data.speed > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)';
        ctx.beginPath();
        ctx.roundRect(x - 22, y + 18, 44, 16, 4);
        ctx.fill();
        
        ctx.fillStyle = data.speed > 0 ? '#4ade80' : '#94a3b8';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(`${data.speed.toFixed(0)} km/h`, x, y + 30);
      });
      
      // Compass
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('N', width - 20, 20);
      ctx.fillText('S', width - 20, height - 8);
      ctx.fillText('E', width - 8, height / 2 + 4);
      ctx.fillText('W', width - 35, height / 2 + 4);
      
      animationRef.current = requestAnimationFrame(drawMap);
    };
    
    drawMap();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [trackingData, gpsActive, vehicles]);

  const toggleGPS = (vehicleId) => {
    setGpsActive(prev => ({ ...prev, [vehicleId]: !prev[vehicleId] }));
  };

  const getVehicleIcon = (type) => VEHICLE_ICONS[type] || '🚗';

  const getOnlineCount = () => Object.values(gpsActive).filter(Boolean).length;

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  // Not authenticated view
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 md:p-12 text-center max-w-md w-full shadow-2xl">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Find My Vehicles</h1>
          <p className="text-gray-500 mb-8">Find, lock, or track any of your vehicles. Locate your lost or stolen vehicles and manage them remotely.</p>
          <button 
            onClick={() => router.push('/login')}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => router.push('/login')}
            className="w-full py-3 mt-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Use Remote Lock
          </button>
        </div>
      </div>
    );
  }

  // Mobile view
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
            </div>
            <span className="font-semibold text-gray-800">Find My Vehicles</span>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('rp_tracking_token');
              router.push('/login');
            }}
            className="text-blue-500 text-sm font-medium"
          >
            Logout
          </button>
        </header>

        {/* Mobile Tabs */}
        <div className="bg-white border-b flex">
          {[
            { id: 'devices', label: 'Devices', icon: '📍' },
            { id: 'map', label: 'Map', icon: '🗺️' },
            { id: 'details', label: 'Details', icon: 'ℹ️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === tab.id 
                  ? 'text-blue-500 border-b-2 border-blue-500' 
                  : 'text-gray-500'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'devices' && (
            <div className="h-full overflow-y-auto p-4 space-y-3">
              <p className="text-gray-500 text-sm mb-2">{getOnlineCount()} devices online</p>
              {vehicles.map(vehicle => {
                const data = trackingData[vehicle.id];
                const isOnline = gpsActive[vehicle.id];
                
                return (
                  <div
                    key={vehicle.id}
                    onClick={() => {
                      setSelectedVehicle(vehicle.id);
                      setActiveTab('details');
                    }}
                    className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
                      isOnline ? 'border-l-green-500' : 'border-l-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getVehicleIcon(vehicle.type)}</div>
                        <div>
                          <p className="font-semibold text-gray-800">{vehicle.plate}</p>
                          <p className="text-gray-500 text-sm">{vehicle.driver}</p>
                          {isOnline && data && (
                            <p className="text-green-500 text-xs mt-1">
                              ● {data.speed.toFixed(0)} km/h • {data.battery.toFixed(0)}%
                            </p>
                          )}
                          {!isOnline && (
                            <p className="text-gray-400 text-xs mt-1">Last seen: Never</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGPS(vehicle.id);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          isOnline
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {isOnline ? 'GPS ON' : 'GPS OFF'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'map' && (
            <div className="h-full relative">
              <canvas
                ref={mapCanvasRef}
                width={window.innerWidth}
                height={window.innerHeight - 140}
                className="w-full h-full"
              />
              {getOnlineCount() === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                  <div className="text-center text-white">
                    <p className="text-lg font-medium">No devices online</p>
                    <p className="text-sm text-gray-400">Turn on GPS to track vehicles</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="h-full overflow-y-auto p-4">
              {selectedVehicle ? (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{getVehicleIcon(vehicles.find(v => v.id === selectedVehicle)?.type)}</div>
                        <div>
                          <h2 className="font-bold text-gray-800">{vehicles.find(v => v.id === selectedVehicle)?.plate}</h2>
                          <p className="text-gray-500 text-sm">{vehicles.find(v => v.id === selectedVehicle)?.driver}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleGPS(selectedVehicle)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          gpsActive[selectedVehicle]
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {gpsActive[selectedVehicle] ? 'GPS ON' : 'GPS OFF'}
                      </button>
                    </div>
                  </div>
                  
                  {gpsActive[selectedVehicle] && trackingData[selectedVehicle] ? (
                    <>
                      <div className="p-4 border-b">
                        <p className="text-green-500 font-medium flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Device is online
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          Last updated: {formatTime(trackingData[selectedVehicle].lastUpdate)}
                        </p>
                      </div>
                      
                      <div className="p-4 border-b">
                        <h3 className="font-medium text-gray-800 mb-3">Location</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Coordinates</span>
                            <span className="text-gray-800 font-mono">
                              {trackingData[selectedVehicle].latitude.toFixed(6)}, {trackingData[selectedVehicle].longitude.toFixed(6)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Speed</span>
                            <span className="text-gray-800">{trackingData[selectedVehicle].speed.toFixed(1)} km/h</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Accuracy</span>
                            <span className="text-gray-800">{trackingData[selectedVehicle].accuracy.toFixed(0)}m</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border-b">
                        <h3 className="font-medium text-gray-800 mb-3">Status</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Battery</span>
                            <span className={`font-medium ${trackingData[selectedVehicle].battery < 20 ? 'text-red-500' : 'text-gray-800'}`}>
                              {trackingData[selectedVehicle].battery.toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Network</span>
                            <span className="text-gray-800">{trackingData[selectedVehicle].network}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Signal</span>
                            <span className="text-gray-800">{trackingData[selectedVehicle].signal}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-medium text-gray-800 mb-3">Actions</h3>
                        <div className="grid grid-cols-3 gap-2">
                          <button className="p-3 bg-gray-100 rounded-lg text-center hover:bg-gray-200 transition-colors">
                            <div className="text-xl mb-1">🔊</div>
                            <div className="text-xs text-gray-600">Sound</div>
                          </button>
                          <button className="p-3 bg-gray-100 rounded-lg text-center hover:bg-gray-200 transition-colors">
                            <div className="text-xl mb-1">🔒</div>
                            <div className="text-xs text-gray-600">Lock</div>
                          </button>
                          <button className="p-3 bg-red-100 rounded-lg text-center hover:bg-red-200 transition-colors">
                            <div className="text-xl mb-1">🗑️</div>
                            <div className="text-xs text-red-600">Erase</div>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">GPS is off</p>
                      <button
                        onClick={() => toggleGPS(selectedVehicle)}
                        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg font-medium"
                      >
                        Turn On GPS
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Select a device from the Devices tab</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop view
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Desktop Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Find My Vehicles</h1>
              <p className="text-gray-500 text-sm">{getOnlineCount()} devices online</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm">API: {apiKey.substring(0, 12)}...</span>
            <button
              onClick={() => {
                localStorage.removeItem('rp_tracking_token');
                router.push('/login');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 flex gap-6">
        {/* Device List */}
        <div className="w-80 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-800">Devices</h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y">
            {vehicles.map(vehicle => {
              const data = trackingData[vehicle.id];
              const isOnline = gpsActive[vehicle.id];
              const isSelected = selectedVehicle === vehicle.id;
              
              return (
                <div
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isOnline ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <span className="text-lg">{getVehicleIcon(vehicle.type)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{vehicle.plate}</p>
                        <p className="text-gray-500 text-xs">{vehicle.driver}</p>
                        {isOnline && data ? (
                          <p className="text-green-500 text-xs">
                            {data.speed.toFixed(0)} km/h • {data.battery.toFixed(0)}%
                          </p>
                        ) : (
                          <p className="text-gray-400 text-xs">Offline</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGPS(vehicle.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        isOnline
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isOnline ? 'GPS ON' : 'GPS OFF'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="font-medium text-gray-800">Live Map</span>
            </div>
          </div>
          <div className="relative">
            <canvas
              ref={mapCanvasRef}
              width={800}
              height={500}
              className="w-full h-auto"
            />
            {getOnlineCount() === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 font-medium">No devices online</p>
                  <p className="text-gray-400 text-sm">Turn on GPS to track vehicles</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className="w-80 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          {selectedVehicle ? (
            <>
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getVehicleIcon(vehicles.find(v => v.id === selectedVehicle)?.type)}</span>
                  <div>
                    <h2 className="font-semibold text-gray-800">{vehicles.find(v => v.id === selectedVehicle)?.plate}</h2>
                    <p className="text-gray-500 text-sm">{vehicles.find(v => v.id === selectedVehicle)?.driver}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              {gpsActive[selectedVehicle] && trackingData[selectedVehicle] ? (
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 border-b">
                    <p className="text-green-500 font-medium flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Online
                    </p>
                    <p className="text-gray-400 text-sm">{formatTime(trackingData[selectedVehicle].lastUpdate)}</p>
                  </div>
                  
                  <div className="p-4 border-b">
                    <h3 className="font-medium text-gray-800 mb-2">Location</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Speed</span>
                        <span className="text-gray-800">{trackingData[selectedVehicle].speed.toFixed(1)} km/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Accuracy</span>
                        <span className="text-gray-800">{trackingData[selectedVehicle].accuracy.toFixed(0)}m</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border-b">
                    <h3 className="font-medium text-gray-800 mb-2">Status</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Battery</span>
                        <span className={trackingData[selectedVehicle].battery < 20 ? 'text-red-500' : 'text-gray-800'}>
                          {trackingData[selectedVehicle].battery.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Signal</span>
                        <span className="text-gray-800">{trackingData[selectedVehicle].signal}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-medium text-gray-800 mb-2">Actions</h3>
                    <div className="space-y-2">
                      <button className="w-full py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                        <span>🔊</span> Play Sound
                      </button>
                      <button className="w-full py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                        <span>🔒</span> Lock
                      </button>
                      <button className="w-full py-2 bg-red-100 rounded-lg text-red-600 hover:bg-red-200 transition-colors flex items-center justify-center gap-2">
                        <span>🗑️</span> Erase
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <p className="text-gray-500 mb-4">GPS is off</p>
                    <button
                      onClick={() => toggleGPS(selectedVehicle)}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium"
                    >
                      Turn On GPS
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <p className="text-gray-400">Select a device to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
