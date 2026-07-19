import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Vite/Webpack
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

// Helper component to recenter map when lat/lng props change from outside
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export function LocationPickerMap({ lat, lng, onLocationSelect }: LocationPickerMapProps) {
  const [position, setPosition] = useState<L.LatLng>(new L.LatLng(lat, lng));
  const markerRef = useRef<L.Marker>(null);

  // Sync internal state if external props change
  useEffect(() => {
    setPosition(new L.LatLng(lat, lng));
  }, [lat, lng]);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setPosition(newPos);
          onLocationSelect(newPos.lat, newPos.lng);
        }
      },
    }),
    [onLocationSelect]
  );

  // Component to handle map clicks
  function MapClickHandler() {
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-300 relative z-0">
      <MapContainer 
        center={[lat, lng]} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={[lat, lng]} />
        <MapClickHandler />
        <Marker 
          draggable={true}
          eventHandlers={eventHandlers}
          position={position}
          ref={markerRef}
        />
      </MapContainer>
    </div>
  );
}
