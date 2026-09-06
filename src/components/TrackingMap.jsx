import React, { useEffect } from 'react';
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

const createCustomIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const TrackingMap = ({ trackingPoints = [], destination }) => {
  const startIcon = createCustomIcon('green');
  const destIcon = createCustomIcon('red');
  const driverIcon = createCustomIcon('blue');

  // Default to Delhi center if no points
  const defaultCenter = [28.6139, 77.2090];
  
  const hasPoints = trackingPoints && trackingPoints.length > 0;
  const latestPoint = hasPoints ? trackingPoints[trackingPoints.length - 1] : null;
  const startPoint = hasPoints ? trackingPoints[0] : null;
  
  const center = latestPoint ? [latestPoint.lat, latestPoint.lng] : defaultCenter;
  
  const polylinePositions = hasPoints 
    ? trackingPoints.map(p => [p.lat, p.lng]) 
    : [];

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300 shadow-inner">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {hasPoints && (
          <Polyline positions={polylinePositions} color="blue" weight={4} opacity={0.7} />
        )}

        {startPoint && (
          <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon}>
            <Popup>Origin / Pickup</Popup>
          </Marker>
        )}

        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
            <Popup>Destination</Popup>
          </Marker>
        )}

        {latestPoint && (
          <Marker position={[latestPoint.lat, latestPoint.lng]} icon={driverIcon}>
            <Popup>
              <div className="font-medium text-center">
                Driver Current Location<br/>
                <span className="text-xs text-gray-500">
                  Updated: {new Date(latestPoint.recorded_at || Date.now()).toLocaleTimeString()}
                </span>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default TrackingMap;
