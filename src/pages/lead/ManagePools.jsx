import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ManagePools() {
  const { user } = useAuth();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    crop_name: 'Tomatoes',
    target_kg: '',
    price_per_kg: '',
    discount_percent: '',
    description: '',
    deadline: ''
  });

  const fetchPools = () => {
    if (!user?.society_id) return;
    fetch(`http://localhost:4000/api/pools/society/${user.society_id}`)
      .then(res => res.json())
      .then(data => {
        setPools(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch pools');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPools();
  }, [user]);

  const handleCreatePool = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          society_id: user.society_id,
          lead_id: user.id
        })
      });
      if (!res.ok) throw new Error('Failed to create pool');
      alert('Pool created successfully!');
      fetchPools();
      setFormData({ crop_name: 'Tomatoes', target_kg: '', price_per_kg: '', discount_percent: '', description: '', deadline: '' });
    } catch (err) {
      console.error(err);
      alert('Error creating pool');
    }
  };

  const handleLockPool = async (poolId) => {
    if (!confirm('Are you sure you want to lock this pool?')) return;
    try {
      const res = await fetch(`http://localhost:4000/api/pools/${poolId}/lock`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to lock pool');
      alert('Pool locked successfully!');
      fetchPools();
    } catch (err) {
      console.error(err);
      alert('Error locking pool');
    }
  };

  if (loading) return <div className="p-4">Loading pools...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-green-800">Manage Pools</h1>
      
      {/* Create Pool Form */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">Create New Pool</h2>
        <form onSubmit={handleCreatePool} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Crop Name</label>
            <select className="w-full border p-2 rounded" value={formData.crop_name} onChange={e => setFormData({...formData, crop_name: e.target.value})} required>
              <option value="Tomatoes">Tomatoes</option>
              <option value="Onions">Onions</option>
              <option value="Potatoes">Potatoes</option>
              <option value="Apples">Apples</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Target KG</label>
            <input type="number" className="w-full border p-2 rounded" value={formData.target_kg} onChange={e => setFormData({...formData, target_kg: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price per KG (₹)</label>
            <input type="number" step="0.01" className="w-full border p-2 rounded" value={formData.price_per_kg} onChange={e => setFormData({...formData, price_per_kg: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Discount (%)</label>
            <input type="number" step="0.01" className="w-full border p-2 rounded" value={formData.discount_percent} onChange={e => setFormData({...formData, discount_percent: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deadline</label>
            <input type="datetime-local" className="w-full border p-2 rounded" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="w-full border p-2 rounded" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="2"></textarea>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full">Create Pool</button>
          </div>
        </form>
      </div>

      {/* Existing Pools */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">Existing Pools</h2>
        <div className="space-y-4">
          {pools.map(pool => {
            const progress = Math.min(100, (pool.current_kg / pool.target_kg) * 100);
            const isTargetMet = pool.current_kg >= pool.target_kg;
            return (
              <div key={pool.id} className="border border-gray-200 p-4 rounded-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{pool.crop_name} - {pool.status}</h3>
                    <p className="text-sm text-gray-600">₹{pool.price_per_kg}/kg | Discount: {pool.discount_percent}%</p>
                  </div>
                  {pool.status === 'Open' && isTargetMet && (
                    <button onClick={() => handleLockPool(pool.id)} className="mt-2 md:mt-0 bg-blue-600 text-white px-4 py-1 rounded shadow text-sm hover:bg-blue-700">Lock Pool</button>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div className={`h-2 rounded-full ${isTargetMet ? 'bg-blue-500' : 'bg-green-500'}`} style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-sm text-gray-500">{pool.current_kg} / {pool.target_kg} kg collected</p>
                {/* Note: Expandable member list omitted for brevity, implement if needed */}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
