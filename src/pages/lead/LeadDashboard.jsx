import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function LeadDashboard() {
  const { user } = useAuth();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
  }, [user]);

  if (loading) return <div className="text-center p-4">Loading dashboard...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  const activePools = pools.filter(p => p.status === 'Open');
  const totalKg = pools.reduce((sum, p) => sum + parseFloat(p.current_kg || 0), 0);   
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-green-800">Lead Dashboard</h1>
      <p className="text-gray-600">Welcome back, {user?.name}</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow border border-green-100">
          <h3 className="text-gray-500 text-sm">Active Pools</h3>
          <p className="text-2xl font-bold text-green-600">{activePools.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-green-100">
          <h3 className="text-gray-500 text-sm">Total Members Participated</h3>
          <p className="text-2xl font-bold text-green-600">-</p> {/* Need member count endpoint for total */}
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-green-100">
          <h3 className="text-gray-500 text-sm">Total KG Ordered</h3>
          <p className="text-2xl font-bold text-green-600">{totalKg.toFixed(2)} kg</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-green-100">
          <h3 className="text-gray-500 text-sm">Avg Discount</h3>
          <p className="text-2xl font-bold text-green-600">~15%</p> {/* Placeholder for avg discount */}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link to="/lead/pools" className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700">Manage Pools</Link>
        <Link to="/lead/analytics" className="bg-white text-green-600 border border-green-600 px-4 py-2 rounded shadow hover:bg-green-50">View Analytics</Link>
      </div>

      {/* Active Pools List */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Active Pools Overview</h2>
        {activePools.length === 0 ? (
          <p className="text-gray-500">No active pools right now.</p>
        ) : (
          <div className="space-y-4">
            {activePools.map(pool => {
              const progress = Math.min(100, (pool.current_kg / pool.target_kg) * 100);
              return (
                <div key={pool.id} className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-lg">{pool.crop_name}</span>
                    <span className="text-green-600 font-bold">₹{pool.price_per_kg}/kg</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{pool.current_kg} / {pool.target_kg} kg</span>
                    <span>Deadline: {new Date(pool.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
