import { useState } from 'react';
import { getStaticMapUrl } from '../services/maps';

export interface AppState {
  imageSrc: string | null;
  locationName: string;
  address: string;
  lat: string;
  lng: string;
  date: Date;
  timezone: string;
  mapUrl: string;
  logoUrl?: string;
  showLogo: boolean;
  showWeather: boolean;
  weather: string;
  showCompass: boolean;
  compass: string;
  showAltitude: boolean;
  altitude: string;
  opacity: number;
  cornerRadius: number;
  apiKey: string;
  exportQuality: number;
  exportFormat: 'image/jpeg' | 'image/png';
}

export function useGeoTagState() {
  const [state, setState] = useState<AppState>({
    imageSrc: null,
    locationName: '',
    address: '',
    lat: '',
    lng: '',
    date: new Date(),
    timezone: 'GMT +00:00',
    mapUrl: '',
    showLogo: true,
    showWeather: false,
    weather: '32°C Sunny',
    showCompass: false,
    compass: 'NW',
    showAltitude: false,
    altitude: '340 m',
    opacity: 75,
    cornerRadius: 20,
    apiKey: '',
    exportQuality: 100,
    exportFormat: 'image/jpeg'
  });

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      
      // Update map URL if coordinates or API key change
      if (updates.lat !== undefined || updates.lng !== undefined || updates.apiKey !== undefined) {
        const latNum = parseFloat(newState.lat);
        const lngNum = parseFloat(newState.lng);
        if (!isNaN(latNum) && !isNaN(lngNum)) {
          newState.mapUrl = getStaticMapUrl(latNum, lngNum, newState.apiKey);
        }
      }
      
      return newState;
    });
  };

  return { state, updateState };
}
