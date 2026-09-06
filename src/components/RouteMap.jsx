import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createIcon = (number, color = 'blue') => {
  const markerHtmlStyles = `
    background-color: ${color};
    width: 2rem;
    height: 2rem;
    display: block;
    left: -1rem;
    top: -1rem;
    position: relative;
    border-radius: 2rem 2rem 0;
    transform: rotate(45deg);
    border: 2px solid #FFFFFF;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  `;
  
  return L.divIcon({
    className: "custom-pin",
    iconAnchor: [0, 24],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${markerHtmlStyles}"><span style="transform: rotate(-45deg); display: block; width: 2rem; height: 2rem; line-height: 2rem; text-align: center; color: white; font-weight: bold; font-size: 14px;">${number}</span></span>`
  });
};

const truckIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const RouteMap = ({ waypoints = [], driverLocation }) => {
  const defaultCenter = [28.6139, 77.2090];
  
  const center = waypoints.length > 0 
    ? [waypoints[0].lat, waypoints[0].lng] 
    : defaultCenter;
    
  const polylinePositions = waypoints.map(w => [w.lat, w.lng]);

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300 shadow-inner">
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {waypoints.length > 1 && (
          <Polyline positions={polylinePositions} color="indigo" weight={3} dashArray="5, 10" />
        )}

        {waypoints.map((wp, idx) => {
          const color = wp.type === 'pickup' ? 'green' : (wp.type === 'dropoff' ? 'red' : 'blue');
          return (
            <Marker key={idx} position={[wp.lat, wp.lng]} icon={createIcon(idx + 1, color)}>
              <Popup>
                <div className="font-semibold">{wp.label}</div>
                <div className="text-sm text-gray-500 capitalize">{wp.type}</div>
              </Popup>
            </Marker>
          );
        })}

        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={truckIcon}>
            <Popup>
              <strong>Driver's Live Location</strong>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default RouteMap;
