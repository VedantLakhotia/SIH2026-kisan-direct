import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function PoolAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.society_id) return;
    
    // In a real app, this endpoint would exist. For now we will mock the analytics data.
    // fetch(`http://localhost:4000/api/pools/analytics/${user.society_id}`)
    
    setTimeout(() => {
      setStats({
        totalCreated: 42,
        fulfilled: 35,
        cancelled: 2,
        totalKg: 4500,
        avgDiscount: 18.5,
        topCrops: [
          { name: 'Tomatoes', kg: 1500 },
          { name: 'Onions', kg: 1200 },
          { name: 'Potatoes', kg: 900 },
          { name: 'Apples', kg: 500 }
        ]
      });
      setLoading(false);
    }, 500);
  }, [user]);

  if (loading) return <div className="p-4">Loading analytics...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!stats) return <div className="p-4">No data available.</div>;

  const completionRate = ((stats.fulfilled / stats.totalCreated) * 100).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-green-800">Pool Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <p className="text-gray-500">Total KG Distributed</p>
          <p className="text-4xl font-bold text-green-600">{stats.totalKg}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <p className="text-gray-500">Average Discount</p>
          <p className="text-4xl font-bold text-green-600">{stats.avgDiscount}%</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <p className="text-gray-500">Pool Success Rate</p>
          <div className="flex items-center justify-center mt-2">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center border-4 border-green-500">
              <span className="text-xl font-bold text-green-700">{completionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">Top Crops by Volume</h2>
        <div className="space-y-4">
          {stats.topCrops.map(crop => {
            const maxKg = Math.max(...stats.topCrops.map(c => c.kg));
            const width = (crop.kg / maxKg) * 100;
            return (
              <div key={crop.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{crop.name}</span>
                  <span className="font-medium">{crop.kg} kg</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4">
                  <div className="bg-green-500 h-4 rounded-full" style={{ width: `${width}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
