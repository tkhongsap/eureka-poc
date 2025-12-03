import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, X, Search, Crosshair, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

// Leaflet imports
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet with Vite/Webpack
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  googleMapsUrl: string;
}

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData | null;
  isOpen: boolean;
  onClose: () => void;
}

// Component to handle map click events
const MapClickHandler: React.FC<{
  onLocationSelect: (lat: number, lng: number) => void;
}> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to recenter map
const RecenterMap: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  // Default to Bangkok, Thailand
  const defaultLat = 13.7563;
  const defaultLng = 100.5018;

  const [selectedLat, setSelectedLat] = useState<number>(
    initialLocation?.latitude || defaultLat
  );
  const [selectedLng, setSelectedLng] = useState<number>(
    initialLocation?.longitude || defaultLng
  );
  const [address, setAddress] = useState<string>(initialLocation?.address || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Generate Google Maps URL
  const generateGoogleMapsUrl = (lat: number, lng: number): string => {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  // Generate Google Maps navigation URL
  const generateNavigationUrl = (lat: number, lng: number): string => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  // Reverse geocoding using Nominatim (FREE)
  const fetchAddress = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'th,en',
          },
        }
      );
      const data = await response.json();
      if (data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Failed to fetch address:', error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Handle location selection on map
  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    fetchAddress(lat, lng);
  };

  // Search for location using Nominatim (FREE)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'Accept-Language': 'th,en',
          },
        }
      );
      const data = await response.json();
      if (data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setSelectedLat(lat);
        setSelectedLng(lng);
        setAddress(result.display_name);
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Get current location
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setSelectedLat(lat);
          setSelectedLng(lng);
          fetchAddress(lat, lng);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your current location. Please allow location access.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Confirm location selection
  const handleConfirm = () => {
    const locationData: LocationData = {
      latitude: selectedLat,
      longitude: selectedLng,
      address: address || `${selectedLat.toFixed(6)}, ${selectedLng.toFixed(6)}`,
      googleMapsUrl: generateGoogleMapsUrl(selectedLat, selectedLng),
    };
    onLocationSelect(locationData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-stone-200 flex justify-between items-center bg-gradient-to-r from-teal-500 to-teal-600 flex-shrink-0">
          <div className="flex items-center gap-2 text-white">
            <MapPin size={24} />
            <h3 className="font-semibold text-lg">Select Location</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl text-white transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 sm:p-4 bg-stone-50 border-b border-stone-200 flex-shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-stone-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('gps.searchLocation')}
                className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-base"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-3 sm:px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-stone-300 text-white font-medium rounded-xl transition-colors"
            >
              {isSearching ? '...' : t('gps.search')}
            </button>
            <button
              onClick={handleGetCurrentLocation}
              className="px-3 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl transition-colors"
              title={t('gps.useCurrentLocation')}
            >
              <Crosshair size={20} />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="h-[250px] sm:h-[350px] relative flex-shrink-0 z-0">
          <MapContainer
            center={[selectedLat, selectedLng]}
            zoom={15}
            style={{ height: '100%', width: '100%', zIndex: 1 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[selectedLat, selectedLng]} />
            <MapClickHandler onLocationSelect={handleMapClick} />
            <RecenterMap lat={selectedLat} lng={selectedLng} />
          </MapContainer>

          {/* Loading overlay */}
          {isLoadingAddress && (
            <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-lg text-sm text-stone-600 z-10">
              Loading address...
            </div>
          )}
        </div>

        {/* Selected Location Info - Scrollable */}
        <div className="p-3 sm:p-4 bg-stone-50 border-t border-stone-200 overflow-y-auto flex-1">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">
                Selected Address
              </label>
              <p className="text-stone-800 text-sm bg-white p-3 rounded-xl border border-stone-200 break-words">
                {address || 'Click on the map to select a location'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm">
              <div className="bg-white p-2 sm:p-3 rounded-xl border border-stone-200">
                <span className="text-stone-500 text-xs sm:text-sm">Lat:</span>
                <span className="ml-1 sm:ml-2 font-mono text-stone-800 text-xs sm:text-sm">
                  {selectedLat.toFixed(6)}
                </span>
              </div>
              <div className="bg-white p-2 sm:p-3 rounded-xl border border-stone-200">
                <span className="text-stone-500 text-xs sm:text-sm">Lng:</span>
                <span className="ml-1 sm:ml-2 font-mono text-stone-800 text-xs sm:text-sm">
                  {selectedLng.toFixed(6)}
                </span>
              </div>
            </div>

            {/* Preview Google Maps Link */}
            <div className="flex items-center gap-2">
              <a
                href={generateNavigationUrl(selectedLat, selectedLng)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 hover:underline"
              >
                <Navigation size={16} />
                Preview in Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-stone-200 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 sm:py-3 bg-stone-200 hover:bg-stone-300 text-stone-700 font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!address}
            className="flex-1 py-2.5 sm:py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <MapPin size={18} />
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;

// Inline Location Picker - Shows map directly without modal
export const InlineLocationPicker: React.FC<{
  onLocationSelect: (location: LocationData | null) => void;
  selectedLocation: LocationData | null;
}> = ({ onLocationSelect, selectedLocation }) => {
  const { t } = useLanguage();
  // Default to Bangkok, Thailand
  const defaultLat = 13.7563;
  const defaultLng = 100.5018;

  const [selectedLat, setSelectedLat] = useState<number>(
    selectedLocation?.latitude || defaultLat
  );
  const [selectedLng, setSelectedLng] = useState<number>(
    selectedLocation?.longitude || defaultLng
  );
  const [address, setAddress] = useState<string>(selectedLocation?.address || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [hasSelected, setHasSelected] = useState(!!selectedLocation);

  // Auto-save location to parent whenever address is ready
  useEffect(() => {
    if (hasSelected && address && !isLoadingAddress) {
      const locationData: LocationData = {
        latitude: selectedLat,
        longitude: selectedLng,
        address: address,
        googleMapsUrl: `https://www.google.com/maps?q=${selectedLat},${selectedLng}`,
      };
      onLocationSelect(locationData);
    }
  }, [selectedLat, selectedLng, address, hasSelected, isLoadingAddress]);

  // Reverse geocoding using Nominatim (FREE)
  const fetchAddress = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'th,en',
          },
        }
      );
      const data = await response.json();
      if (data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Failed to fetch address:', error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Handle location selection on map
  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    setHasSelected(true);
    fetchAddress(lat, lng);
  };

  // Search for location using Nominatim (FREE)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'Accept-Language': 'th,en',
          },
        }
      );
      const data = await response.json();
      if (data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setSelectedLat(lat);
        setSelectedLng(lng);
        setAddress(result.display_name);
        setHasSelected(true);
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Get current location with best accuracy
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsGettingLocation(true);

    // Options for better accuracy
    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,   // Request GPS/high accuracy
      timeout: 30000,             // Wait up to 30 seconds
      maximumAge: 0               // Always get fresh position
    };

    // Try to get position multiple times for better accuracy
    let bestPosition: GeolocationPosition | null = null;
    let attempts = 0;
    const maxAttempts = 3;

    const tryGetPosition = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          attempts++;
          
          // Keep the position with best accuracy
          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
          }

          // If we have good accuracy (< 50m) or max attempts reached, use it
          if (position.coords.accuracy < 50 || attempts >= maxAttempts) {
            const lat = bestPosition!.coords.latitude;
            const lng = bestPosition!.coords.longitude;
            
            console.log(`Final accuracy: ${bestPosition!.coords.accuracy}m after ${attempts} attempts`);
            
            setSelectedLat(lat);
            setSelectedLng(lng);
            setHasSelected(true);
            fetchAddress(lat, lng);
            setIsGettingLocation(false);
          } else {
            // Try again for better accuracy
            setTimeout(tryGetPosition, 500);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          
          // If we have any position, use it
          if (bestPosition) {
            const lat = bestPosition.coords.latitude;
            const lng = bestPosition.coords.longitude;
            setSelectedLat(lat);
            setSelectedLng(lng);
            setHasSelected(true);
            fetchAddress(lat, lng);
          } else {
            alert('ไม่สามารถหาตำแหน่งได้ กรุณาเปิด GPS และอนุญาตการเข้าถึงตำแหน่ง');
          }
          setIsGettingLocation(false);
        },
        geoOptions
      );
    };

    tryGetPosition();
  };

  // Clear location
  const handleClear = () => {
    setSelectedLat(defaultLat);
    setSelectedLng(defaultLng);
    setAddress('');
    setHasSelected(false);
    onLocationSelect(null);
  };

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
      {/* Search Bar */}
      <div className="p-3 bg-stone-50 border-b border-stone-200">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('gps.searchLocation')}
              className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-stone-300 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isSearching ? '...' : t('gps.search')}
          </button>
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors flex items-center gap-1"
            title={t('gps.useCurrentLocation')}
          >
            {isGettingLocation ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Crosshair size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="h-[200px] relative z-0">
        <MapContainer
          center={[selectedLat, selectedLng]}
          zoom={15}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasSelected && <Marker position={[selectedLat, selectedLng]} />}
          <MapClickHandler onLocationSelect={handleMapClick} />
          <RecenterMap lat={selectedLat} lng={selectedLng} />
        </MapContainer>

        {/* Loading overlay */}
        {isLoadingAddress && (
          <div className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded text-xs text-stone-600 z-10 shadow">
            {t('gps.loading')}
          </div>
        )}

        {/* Getting GPS location overlay */}
        {isGettingLocation && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
            <div className="bg-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <Loader2 size={20} className="animate-spin text-blue-500" />
              <span className="text-sm text-stone-700">{t('gps.gettingGps')}</span>
            </div>
          </div>
        )}

        {/* Instruction overlay when not selected */}
        {!hasSelected && !isGettingLocation && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10 pointer-events-none">
            <div className="bg-white/95 px-4 py-2 rounded-lg shadow text-sm text-stone-600">
              👆 {t('gps.clickMapOrGps')}
            </div>
          </div>
        )}
      </div>

      {/* Selected Location Info - Auto-saved */}
      {hasSelected && address && (
        <div className="p-3 border-t border-stone-200 bg-green-50">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg flex-shrink-0 bg-green-100 text-green-600">
              <MapPin size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-stone-800 line-clamp-2">{address}</p>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
              </p>
              <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                <Check size={12} /> {t('gps.locationSaved')}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLat},${selectedLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-teal-100 hover:bg-teal-200 text-teal-600 rounded-lg transition-colors"
                title={t('gps.viewInMaps')}
              >
                <Navigation size={16} />
              </a>
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                title="Clear location"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator while fetching address */}
      {hasSelected && isLoadingAddress && (
        <div className="p-3 border-t border-stone-200 bg-amber-50">
          <div className="flex items-center gap-2 text-amber-700">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">กำลังหาที่อยู่...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component to display location with navigation button
export const LocationDisplay: React.FC<{
  location: LocationData;
  compact?: boolean;
}> = ({ location, compact = false }) => {
  const handleNavigate = () => {
    const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
    window.open(navUrl, '_blank');
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <MapPin size={14} className="text-teal-500 flex-shrink-0" />
        <span className="text-sm text-stone-600 truncate flex-1">
          {location.address}
        </span>
        <button
          onClick={handleNavigate}
          className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-lg transition-colors"
          title="Navigate with Google Maps"
        >
          <Navigation size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
          <MapPin size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-stone-800 mb-1">{location.address}</p>
          <p className="text-xs text-stone-400 font-mono">
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </p>
        </div>
        <button
          onClick={handleNavigate}
          className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
          title="Navigate with Google Maps"
        >
          <Navigation size={16} />
          Navigate
        </button>
      </div>
    </div>
  );
};
