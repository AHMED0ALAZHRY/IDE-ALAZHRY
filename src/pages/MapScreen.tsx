import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { useMonuments } from '../hooks/useMonuments';
import { Navigation as NavIcon, MapPin, ArrowLeft, LocateFixed } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for user location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for monuments
const monumentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to center map on user location
function LocationMarker({ position }: { position: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 13);
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position} icon={userIcon}>
      <Popup>موقعك الحالي</Popup>
    </Marker>
  );
}

export default function MapScreen() {
  const navigate = useNavigate();
  const { monuments, loading } = useMonuments();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [nearestMonument, setNearestMonument] = useState<any>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Default center (Cairo)
  const defaultCenter: [number, number] = [30.0444, 31.2357];

  // Haversine formula to calculate true distance in km
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const findNearestMonument = (location: [number, number]) => {
    if (monuments.length > 0) {
      let minDistance = Infinity;
      let nearest = null;

      monuments.forEach(monument => {
        const lat = monument.coordinates?.lat ?? monument.latitude;
        const lng = monument.coordinates?.lng ?? monument.longitude;
        
        if (lat !== undefined && lng !== undefined) {
          const distanceInKm = getDistanceFromLatLonInKm(lat, lng, location[0], location[1]);
          
          if (distanceInKm < minDistance) {
            minDistance = distanceInKm;
            nearest = monument;
          }
        }
      });

      if (nearest) {
        setNearestMonument(nearest);
        setDistance(Math.round(minDistance * 1000)); // Convert km to meters
      }
    }
  };

  const locateUser = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newLocation);
          findNearestMonument(newLocation);
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("تعذر تحديد موقعك. يرجى التأكد من تشغيل الـ GPS ومنح التطبيق صلاحية الوصول للموقع.");
          setUserLocation(defaultCenter);
          findNearestMonument(defaultCenter);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      alert("متصفحك لا يدعم خاصية تحديد الموقع.");
      setUserLocation(defaultCenter);
      findNearestMonument(defaultCenter);
      setIsLocating(false);
    }
  };

  // Initial setup (try to get real location immediately)
  useEffect(() => {
    if (monuments.length > 0) {
      if (!userLocation) {
        setIsLocating(true);
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
              setUserLocation(newLocation);
              findNearestMonument(newLocation);
              setIsLocating(false);
            },
            (error) => {
              console.error("Error getting initial location:", error);
              setUserLocation(defaultCenter);
              findNearestMonument(defaultCenter);
              setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        } else {
          setUserLocation(defaultCenter);
          findNearestMonument(defaultCenter);
          setIsLocating(false);
        }
      } else {
        findNearestMonument(userLocation); // Recalculate if monuments change
      }
    }
  }, [monuments]);

  return (
    <div className="h-screen w-full relative flex flex-col pb-16">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-md p-4 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-nile-blue">الخريطة التفاعلية</h1>
        <div className="w-8 h-8 bg-royal-gold/20 rounded-full flex items-center justify-center">
          <MapPin size={18} className="text-royal-gold" />
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 z-0 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-[1000]">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-royal-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-bold">جاري تحميل الخريطة والمعالم...</p>
            </div>
          </div>
        ) : (
          <MapContainer 
            center={defaultCenter} 
            zoom={11} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
            dragging={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <LocationMarker position={userLocation} />

            {monuments.map(monument => {
              const lat = monument.coordinates?.lat ?? monument.latitude;
              const lng = monument.coordinates?.lng ?? monument.longitude;
              
              if (lat === undefined || lng === undefined) return null;

              return (
                <Marker 
                  key={monument.id} 
                  position={[lat, lng]}
                  icon={monumentIcon}
                >
                  <Popup>
                    <div className="text-right" dir="rtl">
                      <h3 className="font-bold text-nile-blue mb-1">{monument.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">{monument.type}</p>
                      <button 
                        onClick={() => navigate(`/monument/${monument.id}`)}
                        className="bg-royal-gold text-white px-3 py-1 rounded text-xs font-bold"
                      >
                        التفاصيل
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* Nearest Monument Card */}
      {nearestMonument && distance !== null && !loading && (
        <div className="absolute bottom-20 left-4 right-4 z-50 flex flex-col items-end gap-3 pointer-events-none">
          
          {/* Action button container */}
          <div className="pointer-events-auto">
            <button 
              onClick={locateUser}
              disabled={isLocating}
              className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-nile-blue hover:text-royal-gold transition-colors disabled:opacity-50 border border-gray-100"
              title="تحديد موقعي"
            >
              {isLocating ? (
                <div className="w-5 h-5 border-2 border-nile-blue border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <LocateFixed size={22} />
              )}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 flex items-center gap-4 w-full pointer-events-auto">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <img src={nearestMonument.imageUrl} alt={nearestMonument.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-royal-gold font-bold mb-1 flex items-center gap-1">
                <NavIcon size={12} />
                أقرب معلم إليك
              </div>
              <h3 className="font-bold text-nile-blue text-sm">{nearestMonument.name}</h3>
              <p className="text-xs text-gray-500 mt-1">على بعد {distance} متر</p>
            </div>
            <button 
              onClick={() => navigate(`/monument/${nearestMonument.id}`)}
              className="w-10 h-10 bg-nile-blue text-white rounded-full flex items-center justify-center hover:bg-nile-blue-light transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
