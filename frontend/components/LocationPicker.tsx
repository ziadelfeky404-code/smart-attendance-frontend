'use client';
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  lat: number;
  lon: number;
  radius: number;
  onLocationChange: (lat: number, lon: number) => void;
  onRadiusChange: (radius: number) => void;
}

function LocationMarker({ lat, lon, onLocationChange }: { lat: number; lon: number; onLocationChange: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return lat && lon ? <Marker position={[lat, lon]} /> : null;
}

export default function LocationPicker({ lat, lon, radius, onLocationChange, onRadiusChange }: LocationPickerProps) {
  const defaultCenter: [number, number] = lat && lon ? [lat, lon] : [24.7136, 46.6753];

  useEffect(() => {
    if (navigator.geolocation && !lat && !lon) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationChange(position.coords.latitude, position.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-dark-400">
          {lat && lon ? `${lat.toFixed(6)}, ${lon.toFixed(6)}` : 'اضغط على الخريطة لتحديد الموقع'}
        </span>
        {lat && lon && (
          <button
            type="button"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    onLocationChange(position.coords.latitude, position.coords.longitude);
                  },
                  () => {},
                  { enableHighAccuracy: true }
                );
              }
            }}
            className="text-primary text-sm hover:underline"
          >
            تحديد موقعي الحالي
          </button>
        )}
      </div>
      
      <div className="rounded-xl overflow-hidden border border-dark-300" style={{ height: '300px' }}>
        <MapContainer
          center={defaultCenter}
          zoom={17}
          style={{ height: '100%', width: '100%' }}
          dragging={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {lat && lon && (
            <>
              <Circle
                center={[lat, lon]}
                radius={radius}
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }}
              />
              <Marker position={[lat, lon]} />
            </>
          )}
          <LocationMarker lat={lat} lon={lon} onLocationChange={onLocationChange} />
        </MapContainer>
      </div>

      <div>
        <label className="label">نصف القطر (متر)</label>
        <input
          type="range"
          min="50"
          max="500"
          value={radius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-dark-400 mt-1">
          <span>50 م</span>
          <span className="text-primary font-bold">{radius} م</span>
          <span>500 م</span>
        </div>
      </div>
    </div>
  );
}
