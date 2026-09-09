import { useState, useEffect } from 'react';

export default function RouteOptimization() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');

  useEffect(() => {
    if (selectedBatch) {
      setAiAnalysis('Loading AI analysis...');
      fetch(`http://localhost:4000/api/batches/ai-route-analysis/${selectedBatch}`)
        .then(res => res.json())
        .then(data => setAiAnalysis(data.analysis || 'Analysis failed.'))
        .catch(() => setAiAnalysis('AI Analysis unavailable.'));
    } else {
      setAiAnalysis('');
    }
  }, [selectedBatch]);

  useEffect(() => {
    // Fetch planned batches
    fetch('http://localhost:4000/api/batches')
      .then(res => res.json())
      .then(data => {
        const planned = Array.isArray(data) ? data.filter(b => b.status === 'Planned' || b.status === 'Created') : [];
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

        {aiAnalysis && (
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
            <h3 className="font-bold text-indigo-800 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              <span>AI Route Optimization Insights</span>
            </h3>
            <p className="text-sm text-indigo-900 mt-2 italic">{aiAnalysis}</p>
          </div>
        )}

        <button onClick={handleCreateDelivery} className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 w-full font-bold">
          Create Delivery
        </button>
      </div>
    </div>
  );
}
