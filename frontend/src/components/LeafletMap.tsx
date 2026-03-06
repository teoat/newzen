'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocationStore, CITIES, LocationData } from '../store/useLocationStore';

// Fix Leaflet marker icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Custom Highlight Icon with Pulse
const HighlightIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="pulse-marker-container">
           <div class="pulse-ring"></div>
           <div class="main-dot"></div>
         </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function MapController({ location }: { location: LocationData }) {
  const map = useMap();
  useEffect(() => {
    if (location.lat && location.lng) {
      map.panTo([location.lat, location.lng], { 
        animate: true,
        duration: 1.5
      });
    }
  }, [location, map]);
  return null;
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapReadySignaler({ onReady }: { onReady: () => void }) {
  const map = useMap();
  useEffect(() => {
    map.whenReady(onReady);
  }, [map, onReady]);
  return null;
}

export default function LeafletMap() {
  const { currentLocation, setLocation } = useLocationStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    const mountTimer = setTimeout(() => setIsMounted(true), 0);
    // Fallback: hide mask after 2 seconds regardless
    const readyTimer = setTimeout(() => setIsMapReady(true), 2000);
    
    // Add CSS for pulse animation dynamically
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes custom-pulse {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .pulse-marker-container {
          position: relative;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          background: #6366f1;
          border-radius: 50%;
          animation: custom-pulse 2s infinite;
        }
        .main-dot {
          position: relative;
          width: 12px;
          height: 12px;
          background: #4f46e5;
          border: 2px solid white;
          border-radius: 50%;
          z-index: 2;
          box-shadow: 0 0 10px rgba(79, 70, 229, 0.8);
        }
        .leaflet-container {
          background: #020617 !important;
        }
        .leaflet-tile-container {
          filter: grayscale(1) invert(1) contrast(1.2) brightness(0.8);
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
        clearTimeout(mountTimer);
        clearTimeout(readyTimer);
      };
    }
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    // Find nearest city or just update with coordinates
    const nearest = CITIES.reduce((prev, curr) => {
      const dPrev = Math.sqrt(Math.pow(prev.lat - lat, 2) + Math.pow(prev.lng - lng, 2));
      const dCurr = Math.sqrt(Math.pow(curr.lat - lat, 2) + Math.pow(curr.lng - lng, 2));
      return dCurr < dPrev ? curr : prev;
    });

    // If click is very close to a city, snap to it, otherwise just set generic location
    const dist = Math.sqrt(Math.pow(nearest.lat - lat, 2) + Math.pow(nearest.lng - lng, 2));
    if (dist < 0.5) {
      setLocation(nearest);
    } else {
      setLocation({
        name: `Custom Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        lat,
        lng,
        province: 'Unknown Region'
      });
    }
  };

  if (!isMounted) return <div className="h-[300px] w-full bg-slate-900 animate-pulse rounded-[2rem]" />;

  return (
    <div className="relative h-[300px] w-full rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl group">
      <MapContainer
        center={[currentLocation.lat, currentLocation.lng]}
        zoom={6}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController location={currentLocation} />
        <ClickHandler onMapClick={handleMapClick} />
        <MapReadySignaler onReady={() => setIsMapReady(true)} />
        
        {/* City Markers */}
        {CITIES.map((city) => (
          <Marker 
            key={city.name}
            position={[city.lat, city.lng]}
            icon={currentLocation.name === city.name ? HighlightIcon : DefaultIcon}
            eventHandlers={{
              click: () => setLocation(city)
            }}
          >
            <Popup className="custom-popup">
              <div className="p-2">
                <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{city.name}</div>
                <div className="text-[11px] text-slate-500 font-bold mt-0.5">{city.province}</div>
                <div className="mt-2 text-[11px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-mono">
                  {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Controls */}
      <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
        <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl pointer-events-auto">
          <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Selected Sector</div>
          <div className="text-lg font-black text-white uppercase tracking-tighter leading-none">
            {currentLocation.name}
          </div>
          <div className="text-[11px] text-indigo-400 font-bold mt-1 uppercase tracking-widest">
            {currentLocation.province}
          </div>
        </div>
      </div>

      {/* City Shortcuts */}
      <div className="absolute bottom-6 left-6 right-6 z-[1000] flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide pointer-events-none">
        <div className="flex gap-2 pointer-events-auto bg-slate-950/40 backdrop-blur-md p-2 rounded-2xl border border-white/5">
          {CITIES.map(city => (
            <button
              key={city.name}
              onClick={() => setLocation(city)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                currentLocation.name === city.name 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50 scale-105' 
                  : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      {/* Initialize Mask */}
      {!isMapReady && (
        <div className="absolute inset-0 z-[2000] bg-slate-950 flex flex-col items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-indigo-600/10 rounded-full flex items-center justify-center border border-indigo-500/30 animate-pulse mb-4">
             <div className="w-8 h-8 bg-indigo-500 rounded-full animate-ping" />
          </div>
          <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] animate-pulse">Initializing Sector Map...</span>
        </div>
      )}
    </div>
  );
}
