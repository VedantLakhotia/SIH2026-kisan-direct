import { useState, useEffect } from 'react';

export default function RouteOptimization() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');

  useEffect(() => {
    // Fetch planned batches
    fetch('http://localhost:4000/api/batches')
      .then(res => res.json())
      .then(data => {
        const planned = Array.isArray(data) ? data.filter(b => b.status === 'Planned') : [];
        setBatches(planned);
      });
      
    // Mock drivers fetch
    setDrivers([
      { id: 101, name: 'Ramesh Driver' },
      { id: 102, name: 'Suresh Driver' }
    ]);
  }, []);

  const handleCreateDelivery = async () => {
    if (!selectedBatch || !selectedDriver) return alert('Select batch and driver');
    try {
      // In a real app, POST to deliveries.
      alert('Delivery created and assigned to driver!');
    } catch (err) {
      console.error(err);
      alert('Error creating delivery');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Route Optimization & Dispatch</h1>
      
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Select Batch</label>
          <select className="w-full border p-2 rounded" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
            <option value="">-- Choose Batch --</option>
            {batches.map(b => <option key={b.id} value={b.id}>Batch {b.id} ({b.total_kg} kg)</option>)}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Assign Driver</label>
          <select className="w-full border p-2 rounded" value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)}>
            <option value="">-- Choose Driver --</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <button onClick={handleCreateDelivery} className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 w-full font-bold">
          Create Delivery
        </button>
      </div>
    </div>
  );
}
