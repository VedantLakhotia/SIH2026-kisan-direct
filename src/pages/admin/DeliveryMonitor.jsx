import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function DeliveryMonitor() {
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    // Mock active deliveries
    setDeliveries([
      { id: 1, driver: 'Ramesh', status: 'InTransit', lat: 19.0760, lng: 72.8777, eta: '10 mins' },
      { id: 2, driver: 'Suresh', status: 'PickedUp', lat: 19.1000, lng: 72.9000, eta: '25 mins' }
    ]);
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[80vh]">
      <div className="w-full md:w-1/3 bg-white p-4 rounded-xl shadow overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Active Deliveries</h2>
        <div className="space-y-3">
          {deliveries.map(d => (
            <div key={d.id} className="p-3 border rounded">
              <p className="font-bold">Delivery #{d.id}</p>
              <p className="text-sm">Driver: {d.driver}</p>
              <p className="text-sm">Status: <span className="text-green-600 font-semibold">{d.status}</span></p>
              <p className="text-xs text-gray-500">ETA: {d.eta}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="w-full md:w-2/3 bg-gray-200 rounded-xl shadow overflow-hidden h-full border">
        <MapContainer center={[19.08, 72.88]} zoom={11} scrollWheelZoom={true}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {deliveries.map(d => (
            <Marker key={d.id} position={[d.lat, d.lng]}>
              <Popup>
                <b>Driver:</b> {d.driver}<br/>
                <b>Status:</b> {d.status}<br/>
                <b>ETA:</b> {d.eta}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
