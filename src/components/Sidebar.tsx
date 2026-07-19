import React, { useState } from 'react';
import { Search, MapPin, Map, Navigation, Thermometer, Info, Key } from 'lucide-react';
import { AppState } from '../hooks/useGeoTagState';
import { searchLocation, reverseGeocode } from '../services/geocode';
import { LocationPickerMap } from './LocationPickerMap';

interface SidebarProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export function Sidebar({ state, updateState }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    
    // We split into locationName and the rest for address if we have commas
    const result = await searchLocation(searchQuery);
    if (result) {
      const parts = result.address.split(', ');
      const locationName = parts.length > 1 ? `${parts[0]}, ${parts[1]}` : parts[0];
      
      updateState({
        locationName,
        address: result.address,
        lat: result.lat.toFixed(6),
        lng: result.lng.toFixed(6)
      });
    } else {
      alert("Location not found.");
    }
    setIsSearching(false);
  };

  const handleFetchAddress = async () => {
    const lat = parseFloat(state.lat);
    const lng = parseFloat(state.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setIsSearching(true);
      const address = await reverseGeocode(lat, lng);
      if (address) {
        const parts = address.split(', ');
        const locationName = parts.length > 1 ? `${parts[0]}, ${parts[1]}` : parts[0];
        updateState({ locationName, address });
      }
      setIsSearching(false);
    }
  };

  const handleMapSelect = async (lat: number, lng: number) => {
    updateState({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
    setIsSearching(true);
    const address = await reverseGeocode(lat, lng);
    if (address) {
      const parts = address.split(', ');
      const locationName = parts.length > 1 ? `${parts[0]}, ${parts[1]}` : parts[0];
      updateState({ locationName, address });
    }
    setIsSearching(false);
  };

  return (
    <div className="w-full lg:w-96 bg-white border-r border-gray-200 h-full overflow-y-auto flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-2">
          <MapPin className="text-blue-600" />
          GeoTag Photo
        </h1>
        <p className="text-sm text-gray-500 mt-1">Generate realistic GPS overlays</p>
      </div>

      <div className="p-6 space-y-6 flex-1">
        {/* API Key */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Key size={16} /> Google Maps API Key (Optional)
          </label>
          <input 
            type="password"
            value={state.apiKey}
            onChange={(e) => updateState({ apiKey: e.target.value })}
            placeholder="For accurate map thumbnails..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Location Search */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Search Location</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. Jaggaur, Lucknow"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Search size={18} />
            </button>
          </div>
        </div>

        <div className="h-px bg-gray-200 my-4" />

        {/* Interactive Map Picker */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
            <span>Interactive Map</span>
            {isSearching && <span className="text-xs text-blue-600 font-normal">Updating address...</span>}
          </label>
          <LocationPickerMap 
            lat={parseFloat(state.lat) || 0} 
            lng={parseFloat(state.lng) || 0} 
            onLocationSelect={handleMapSelect} 
          />
          <p className="text-xs text-gray-500">Drag the pin or click anywhere on the map to set location.</p>
        </div>

        <div className="h-px bg-gray-200 my-4" />

        {/* Editable Details */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Location Name</label>
            <input 
              type="text" 
              value={state.locationName}
              onChange={(e) => updateState({ locationName: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Full Address</label>
            <textarea 
              value={state.address}
              onChange={(e) => updateState({ address: e.target.value })}
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Latitude</label>
              <input 
                type="text" 
                value={state.lat}
                onChange={(e) => updateState({ lat: e.target.value })}
                onBlur={handleFetchAddress}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Longitude</label>
              <input 
                type="text" 
                value={state.lng}
                onChange={(e) => updateState({ lng: e.target.value })}
                onBlur={handleFetchAddress}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200 my-4" />

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Date</label>
            <input 
              type="date" 
              value={state.date.toISOString().split('T')[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                newDate.setHours(state.date.getHours(), state.date.getMinutes());
                updateState({ date: newDate });
              }}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Time</label>
            <input 
              type="time" 
              value={`${state.date.getHours().toString().padStart(2, '0')}:${state.date.getMinutes().toString().padStart(2, '0')}`}
              onChange={(e) => {
                const [hours, mins] = e.target.value.split(':');
                const newDate = new Date(state.date);
                newDate.setHours(parseInt(hours, 10), parseInt(mins, 10));
                updateState({ date: newDate });
              }}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div>
            <label className="text-sm font-semibold text-gray-700">Timezone</label>
            <input 
              type="text" 
              value={state.timezone}
              onChange={(e) => updateState({ timezone: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
        </div>

      </div>
    </div>
  );
}
