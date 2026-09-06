import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ConsumerDashboard() {
  const { user } = useAuth();
  const [pools, setPools] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [poolRes, orderRes] = await Promise.all([
        fetch(`http://localhost:4000/api/pools/society/${user.society_id}`),
        fetch(`http://localhost:4000/api/orders/consumer/${user.id}`)
      ]);
      if(poolRes.ok) setPools(await poolRes.json());
      if(orderRes.ok) setOrders(await orderRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders.filter(o => ['Pending', 'Confirmed', 'Shipped', 'InTransit'].includes(o.status));

  if (loading) return <div className="p-8 text-center">Loading Dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {user.name}</h1>
          <p className="text-gray-600">Your community: {user.society_name || 'Not assigned'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
          <p className="text-gray-500 text-sm font-semibold uppercase">Active Orders</p>
          <p className="text-3xl font-bold">{activeOrders.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm font-semibold uppercase">Society Pools</p>
          <p className="text-3xl font-bold">{pools.filter(p => p.status === 'Open').length} Open</p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-purple-500">
          <p className="text-gray-500 text-sm font-semibold uppercase">Total Spent</p>
          <p className="text-3xl font-bold">₹{orders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Link to="/consumer/marketplace" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium shadow text-center flex-1">
          🛒 Browse Marketplace
        </Link>
        <Link to="/consumer/pools" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow text-center flex-1">
          🏘️ Join Society Pools
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Recent Orders</h2>
            <Link to="/consumer/orders" className="text-green-600 text-sm hover:underline">View All</Link>
          </div>
          {orders.slice(0,5).length === 0 ? (
             <p className="text-gray-500 text-sm">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0,5).map(o => (
                <div key={o.order_id} className="flex justify-between items-center p-3 border rounded bg-gray-50">
                  <div>
                    <p className="font-semibold">{o.crop_name} <span className="text-gray-500 text-sm font-normal">({o.quantity_kg}kg)</span></p>
                    <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString()} - {o.order_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{o.total_price}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${o.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Active Community Pools</h2>
            <Link to="/consumer/pools" className="text-blue-600 text-sm hover:underline">Join More</Link>
          </div>
          {pools.filter(p => p.status === 'Open').slice(0,3).length === 0 ? (
            <p className="text-gray-500 text-sm">No open pools in your society.</p>
          ) : (
            <div className="space-y-4">
              {pools.filter(p => p.status === 'Open').slice(0,3).map(pool => (
                <div key={pool.id} className="border rounded p-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">{pool.crop_name}</span>
                    <span className="text-blue-600 font-bold">{pool.discount_percent}% OFF</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min((pool.current_kg / pool.target_kg) * 100, 100)}%` }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{pool.current_kg} / {pool.target_kg} kg</span>
                    <span>₹{pool.price_per_kg}/kg</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
