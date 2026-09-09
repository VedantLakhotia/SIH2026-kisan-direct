import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function PoolAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.society_id) return;
    
    const fetchAnalyticsAndForecast = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/pools/analytics/${user.society_id}`);
        if (res.ok) {
          const data = await res.ok ? await res.json() : null;
          if (data) {
            setStats({
              totalCreated: data.total_pools || 0,
              fulfilled: data.total_pools - data.active_pools || 0,
              cancelled: 0,
              totalKg: data.total_kg || 0,
              avgDiscount: data.avg_discount ? parseFloat(data.avg_discount).toFixed(1) : 0,
              topCrops: data.top_crops?.map(c => ({ name: c.crop_name, kg: parseInt(c.count) * 100 })) || []
            });
            // Fetch AI demand forecast for top crop
            if (data.top_crops && data.top_crops.length > 0) {
              const crop = data.top_crops[0].crop_name;
              const forecastRes = await fetch(`http://localhost:4000/api/demand/forecast/${crop}`);
              if (forecastRes.ok) {
                const forecastData = await forecastRes.json();
                setForecast({ crop, text: forecastData.forecast });
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsAndForecast();
  }, [user]);

  if (loading) return <div className="p-4">Loading analytics...</div>;
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

      {forecast && (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl shadow mt-6">
          <div className="flex items-center space-x-2 mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            <h2 className="text-xl font-bold text-blue-900">AI Demand Forecast ({forecast.crop})</h2>
          </div>
          <p className="text-blue-800 italic">{forecast.text}</p>
        </div>
      )}
    </div>
  );
}
