import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function ActiveDelivery() {
  const { deliveryId } = useParams();
  const [position, setPosition] = useState([19.0760, 72.8777]);
  const [status, setStatus] = useState('Pending');
  const [stops, setStops] = useState([
    { id: 1, address: 'Farm A, Nashik', crop: 'Tomatoes', qty: '50kg', done: false },
    { id: 2, address: 'Society B, Mumbai', crop: 'Tomatoes', qty: '50kg', done: false }
  ]);

  useEffect(() => {
    // Simulate auto location updates
    const interval = setInterval(() => {
      setPosition(prev => [prev[0] + 0.001, prev[1] + 0.001]);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (newStatus) => {
    // Mock PUT /api/deliveries/:id/status
    setStatus(newStatus);
    alert(`Status updated to ${newStatus}`);
  };

  const toggleStop = (id) => {
    setStops(stops.map(s => s.id === id ? { ...s, done: !s.done } : s));
  };

  const handleUpdateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        alert('Location updated from GPS!');
        // Mock PUT /api/deliveries/:id/location
      });
    } else {
      alert('Geolocation not supported');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Active Delivery #{deliveryId}</h1>
          <p className="text-lg font-semibold text-blue-600">Status: {status}</p>
        </div>
        <div className="space-x-2 mt-4 md:mt-0">
          <button onClick={() => updateStatus('PickedUp')} className="bg-yellow-500 text-white px-3 py-1 rounded shadow">Mark Picked Up</button>
          <button onClick={() => updateStatus('InTransit')} className="bg-blue-500 text-white px-3 py-1 rounded shadow">Mark In Transit</button>
          <button onClick={() => updateStatus('Delivered')} className="bg-green-600 text-white px-3 py-1 rounded shadow">Mark Delivered</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 h-[60vh]">
        <div className="w-full md:w-1/3 bg-white p-4 rounded-xl shadow overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Stops Checklist</h2>
          <div className="space-y-3">
            {stops.map(stop => (
              <label key={stop.id} className="flex items-start space-x-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={stop.done} onChange={() => toggleStop(stop.id)} className="mt-1 w-5 h-5 text-green-600" />
                <div className={stop.done ? 'line-through text-gray-400' : ''}>
                  <p className="font-bold">{stop.address}</p>
                  <p className="text-sm">{stop.crop} - {stop.qty}</p>
                </div>
              </label>
            ))}
          </div>
          <button onClick={handleUpdateLocation} className="mt-6 w-full bg-gray-800 text-white py-2 rounded shadow hover:bg-gray-900">
            Force Update Location
          </button>
        </div>

        <div className="w-full md:w-2/3 bg-gray-200 rounded-xl shadow overflow-hidden h-full border">
          <MapContainer center={position} zoom={12} scrollWheelZoom={true}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={position}>
              <Popup>Current Location</Popup>
            </Marker>
            <Polyline positions={[[19.0760, 72.8777], [19.1, 72.9]]} color="blue" />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
