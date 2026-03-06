import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LocationData {
  name: string;
  lat: number;
  lng: number;
  province: string;
}

export const CITIES: LocationData[] = [
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456, province: 'DKI Jakarta' },
  { name: 'Surabaya', lat: -7.2575, lng: 112.7521, province: 'East Java' },
  { name: 'Bali', lat: -8.3405, lng: 115.092, province: 'Bali' },
  { name: 'Makassar', lat: -5.1476, lng: 119.4149, province: 'South Sulawesi' },
  { name: 'Ambon', lat: -3.6954, lng: 128.1814, province: 'Maluku' },
  { name: 'Masohi', lat: -3.3333, lng: 128.9414, province: 'Maluku Tengah' },
  { name: 'Kobisonta', lat: -2.9972, lng: 130.1219, province: 'Maluku Tengah' },
];

interface LocationStore {
  currentLocation: LocationData;
  setLocation: (location: LocationData) => void;
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      currentLocation: CITIES[0], // Default to Jakarta
      setLocation: (location) => {
        set({ currentLocation: location });
        console.log(`System-wide location updated to: ${location.name}`);
        
        // Custom event for cross-feature synchronization if they don't use the store directly
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('onLocationChange', { detail: location });
          window.dispatchEvent(event);
        }
      },
    }),
    {
      name: 'zenith-location-storage',
    }
  )
);
