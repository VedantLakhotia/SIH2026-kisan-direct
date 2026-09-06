import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function BatchPooling() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = () => {
    fetch('http://localhost:4000/api/batches')
      .then(res => res.json())
      .then(data => {
        setBatches(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleRunAlgorithm = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:4000/api/batches/auto-pool', { method: 'POST' });
      if (res.ok) {
        alert('Auto-pooling completed!');
        fetchBatches();
      } else {
        throw new Error('Auto-pooling failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error running algorithm');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Batch Pooling</h1>
        <button onClick={handleRunAlgorithm} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 font-bold">
          Run Auto-Pool Algorithm
        </button>
      </div>

      {loading ? (
        <div className="p-4">Processing...</div>
      ) : (
        <div className="grid gap-6">
          {batches.map(batch => (
            <div key={batch.id} className="bg-white p-6 rounded-xl shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Batch {batch.id}</h3>
                  <p className="text-sm text-gray-500">Status: <span className="font-semibold text-blue-600">{batch.status}</span></p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{batch.total_kg} kg</p>
                  <p className="text-sm text-gray-500">Utilization: {batch.utilization_percent || 0}%</p>
                </div>
              </div>
              
              <div className="h-64 mb-4 rounded overflow-hidden border">
                <MapContainer center={[19.0760, 72.8777]} zoom={10} scrollWheelZoom={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {/* Mocked route for visualization */}
                  <Polyline positions={[[19.0760, 72.8777], [19.1, 72.9]]} color="blue" />
                  <Marker position={[19.0760, 72.8777]}><Popup>Start</Popup></Marker>
                  <Marker position={[19.1, 72.9]}><Popup>End</Popup></Marker>
                </MapContainer>
              </div>
            </div>
          ))}
          {batches.length === 0 && <p className="text-gray-500">No batches planned yet.</p>}
        </div>
      )}
    </div>
  );
}
