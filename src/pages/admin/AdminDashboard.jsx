import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    farmers: 0,
    consumers: 0,
    listings: 0,
    pools: 0,
    pendingPickups: 0,
    activeDeliveries: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd fetch these from the API. Mocking for demonstration.
    setTimeout(() => {
      setStats({
        farmers: 120,
        consumers: 450,
        listings: 34,
        pools: 12,
        pendingPickups: 8,
        activeDeliveries: 5
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) return <div className="p-4">Loading Admin Dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="bg-white p-4 rounded-xl shadow border-l-4 border-gray-800">
            <h3 className="text-gray-500 text-sm uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/admin/batches" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Run Batch Pooling</Link>
          <Link to="/admin/routes" className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700">Manage Routes</Link>
          <Link to="/admin/monitor" className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700">Monitor Deliveries</Link>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <ul className="space-y-3 text-sm">
          <li className="p-2 bg-gray-50 rounded">Driver John assigned to Batch #4</li>
          <li className="p-2 bg-gray-50 rounded">Pool #12 automatically locked</li>
          <li className="p-2 bg-gray-50 rounded">New farmer registration: Farm Fresh Co.</li>
        </ul>
      </div>
    </div>
  );
}
