'use client';

import { useState, useEffect, useRef } from 'react';
import '../globals.css';

const DEVICES = [
  { id: 1, name: 'iPhone 15 Pro', type: 'phone', icon: '📱', battery: 85, signal: 4 },
  { id: 2, name: 'Toyota Vios - ABC-1234', type: 'vehicle', icon: '🚗', battery: 72, signal: 3 },
  { id: 3, name: 'Samsung Galaxy S24', type: 'phone', icon: '📱', battery: 45, signal: 2 },
  { id: 4, name: 'Honda Civic - XYZ-5678', type: 'vehicle', icon: '🚗', battery: 91, signal: 4 },
  { id: 5, name: 'iPad Pro', type: 'tablet', icon: '📱', battery: 100, signal: 3 },
];

const LOCATIONS = {
  1: { lat: 14.5995, lng: 120.9842, address: 'Makati City, Metro Manila' },
  2: { lat: 14.5547, lng: 121.0244, address: 'EDSA, Quezon City' },
  3: { lat: 14.4792, lng: 121.0271, address: 'BGC, Taguig' },
  4: { lat: 14.6500, lng: 121.0728, address: 'North EDSA, Quezon City' },
  5: { lat: 14.5641, lng: 121.0632, address: 'Ayala Center, Makati' },
};

export default function LiveTracking() {
  const [devices, setDevices] = useState(DEVICES.map(d => ({ ...d, gpsOn: true, ...LOCATIONS[d.id] })));
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [animateId, setAnimateId] = useState(0);
  const mapRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setDevices(prev => prev.map(device => {
        if (!device.gpsOn) return device;
        return {
          ...device,
          lat: device.lat + (Math.random() - 0.5) * 0.001,
          lng: device.lng + (Math.random() - 0.5) * 0.001,
        };
      }));
      setAnimateId(id => id + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleGPS = (id) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, gpsOn: !d.gpsOn } : d));
  };

  const getBatteryColor = (level) => {
    if (level > 50) return 'bg-green-500';
    if (level > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Find My Device</h1>
                <p className="text-slate-400 text-sm">Live GPS Tracking</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-cyan-500 text-white' : 'bg-white/10 text-slate-400 hover:text-white'}`}
              >
                List View
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-cyan-500 text-white' : 'bg-white/10 text-slate-400 hover:text-white'}`}
              >
                Map View
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* GPS Status Bar */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 mb-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-slate-300">GPS Status: Active</span>
            </div>
            <div className="text-slate-400 text-sm">
              {devices.filter(d => d.gpsOn).length} / {devices.length} devices online
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          /* List View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map(device => (
              <div 
                key={device.id}
                onClick={() => setSelectedDevice(device)}
                className={`group relative bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl ${selectedDevice?.id === device.id ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' : 'border-white/10 hover:border-white/20'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{device.icon}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleGPS(device.id); }}
                    className={`relative w-12 h-6 rounded-full transition-colors ${device.gpsOn ? 'bg-green-500' : 'bg-slate-600'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${device.gpsOn ? 'left-7' : 'left-1'}`}></span>
                  </button>
                </div>
                
                <h3 className="text-white font-semibold text-lg mb-2">{device.name}</h3>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getBatteryColor(device.battery)}`}></div>
                      <span className="text-slate-400">{device.battery}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={`w-1 h-3 rounded-full ${i < device.signal ? 'bg-cyan-500' : 'bg-slate-600'}`}></div>
                      ))}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${device.gpsOn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {device.gpsOn ? 'Online' : 'Offline'}
                  </span>
                </div>

                {device.gpsOn && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-slate-400 text-sm">{device.address}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Map View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden" style={{ height: '600px' }}>
              <div className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-900">
                {/* Simulated Map Grid */}
                <div className="absolute inset-0" style={{ 
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                  backgroundSize: '30px 30px'
                }}></div>
                
                {/* Map Markers */}
                {devices.map(device => device.gpsOn && (
                  <div
                    key={device.id}
                    onClick={() => setSelectedDevice(device)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500"
                    style={{
                      left: `${((device.lng - 121.0) / 0.1) * 100}%`,
                      top: `${((14.7 - device.lat) / 0.2) * 100}%`,
                    }}
                  >
                    <div className={`relative ${selectedDevice?.id === device.id ? 'scale-125' : ''} transition-transform`}>
                      <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-xl shadow-lg shadow-cyan-500/50 animate-pulse">
                        {device.icon}
                      </div>
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-cyan-500"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device List in Map Mode */}
            <div className="space-y-4">
              {devices.map(device => (
                <div 
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedDevice?.id === device.id ? 'bg-cyan-500/20 border-cyan-500' : 'bg-slate-800/30 border-white/10 hover:border-white/20'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{device.icon}</span>
                    <div className="flex-1">
                      <p className="text-white font-medium">{device.name}</p>
                      <p className="text-slate-400 text-sm">{device.address}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${device.gpsOn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {device.gpsOn ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Device Detail Panel */}
        {selectedDevice && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedDevice(null)}>
            <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl p-8 max-w-lg w-full border border-white/20 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{selectedDevice.icon}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedDevice.name}</h2>
                    <p className="text-slate-400">{selectedDevice.address}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedDevice(null)} className="text-slate-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Battery Level</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                      <div className={`h-full ${getBatteryColor(selectedDevice.battery)} transition-all`} style={{ width: `${selectedDevice.battery}%` }}></div>
                    </div>
                    <span className="text-white font-medium">{selectedDevice.battery}%</span>
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Signal Strength</p>
                  <div className="flex items-center gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`w-3 h-6 rounded-sm ${i < selectedDevice.signal ? 'bg-cyan-500' : 'bg-slate-600'}`}></div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                  <span className="text-slate-400">GPS Status</span>
                  <button
                    onClick={() => toggleGPS(selectedDevice.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDevice.gpsOn ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                  >
                    {selectedDevice.gpsOn ? 'Turn Off' : 'Turn On'}
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                  <span className="text-slate-400">Last Updated</span>
                  <span className="text-white">Just now</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                  <span className="text-slate-400">Coordinates</span>
                  <span className="text-white font-mono text-sm">{selectedDevice.lat.toFixed(4)}, {selectedDevice.lng.toFixed(4)}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
                  Play Sound
                </button>
                <button className="flex-1 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-semibold hover:bg-white/20 transition-all">
                  Directions
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}