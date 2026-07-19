import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { generateExportImage } from './utils/canvasExport';
import { getStaticMapUrl } from './services/maps';
import { searchLocation, reverseGeocode } from './services/geocode';
import { LocationPickerMap } from './components/LocationPickerMap';

export default function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [locationName, setLocationName] = useState('C Block, Indra Nagar, Lucknow, Uttar Pradesh, India');
  const [address, setAddress] = useState('C Block, Indra Nagar, Lucknow, Uttar Pradesh 226016, India');
  const [lat, setLat] = useState('26.87285');
  const [lng, setLng] = useState('80.94632');
  const [dateStr, setDateStr] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setImageSrc(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    const res = await searchLocation(searchQuery);
    if (res) {
      setLocationName(res.address.split(',').slice(0, 3).join(','));
      setAddress(res.address);
      setLat(res.lat.toFixed(5));
      setLng(res.lng.toFixed(5));
    } else {
      alert("Location not found");
    }
  };

  const handleExport = async () => {
    if (!imageSrc) return;
    setIsExporting(true);
    try {
      const dateObj = new Date(dateStr);
      const dataUrl = await generateExportImage({
        imageSrc,
        overlayState: {
          locationName,
          address,
          lat,
          lng,
          date: dateObj,
          timezone: 'GMT +05:30',
          mapUrl: getStaticMapUrl(parseFloat(lat), parseFloat(lng), ''), // no key for now, uses maptiler
          showLogo: true,
          showWeather: false,
          weather: '',
          showCompass: false,
          compass: '',
          showAltitude: false,
          altitude: ''
        },
        position: { x: 0, y: 1 }, // Bottom
        scale: 1,
        quality: 1,
        format: 'image/jpeg'
      });

      const link = document.createElement('a');
      link.download = `geotag-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert('Error exporting image');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-900 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold mb-2">GeoTag Photo</h1>
        
        {!imageSrc ? (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer relative hover:bg-gray-50">
            <input type="file" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" accept="image/*" />
            <p className="font-medium">Click or Drag to Upload Photo</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <img src={imageSrc} className="max-h-[300px] object-contain rounded bg-gray-200" alt="Preview" />
            <button onClick={() => setImageSrc(null)} className="text-sm text-red-500 font-medium w-fit">Remove Photo</button>
          </div>
        )}

        <div className="flex gap-2">
          <input 
            type="text" placeholder="Search a location..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 border p-2 rounded" 
          />
          <button onClick={handleSearch} className="bg-blue-600 text-white px-4 py-2 rounded">Search</button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold">Interactive Map</label>
          <LocationPickerMap 
            lat={parseFloat(lat) || 0} 
            lng={parseFloat(lng) || 0} 
            onLocationSelect={async (newLat, newLng) => {
              setLat(newLat.toFixed(5));
              setLng(newLng.toFixed(5));
              const addr = await reverseGeocode(newLat, newLng);
              if (addr) {
                const parts = addr.split(', ');
                const locName = parts.length > 1 ? `${parts[0]}, ${parts[1]}` : parts[0];
                setLocationName(locName);
                setAddress(addr);
              }
            }}
          />
          <p className="text-xs text-gray-500 mb-2">Drag the pin or click anywhere on the map to set location.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold">Location Name</label>
          <input type="text" value={locationName} onChange={e => setLocationName(e.target.value)} className="border p-2 rounded" />
          
          <label className="text-sm font-bold">Address</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="border p-2 rounded" />
          
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-bold">Latitude</label>
              <input type="text" value={lat} onChange={e => setLat(e.target.value)} className="border p-2 rounded" />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-bold">Longitude</label>
              <input type="text" value={lng} onChange={e => setLng(e.target.value)} className="border p-2 rounded" />
            </div>
          </div>
          
          <label className="text-sm font-bold">Date & Time</label>
          <input type="datetime-local" value={dateStr} onChange={e => setDateStr(e.target.value)} className="border p-2 rounded" />
        </div>

        <button 
          onClick={handleExport} 
          disabled={!imageSrc || isExporting}
          className="mt-4 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isExporting ? 'Generating...' : 'Generate & Download'}
        </button>
      </div>
    </div>
  );
}
