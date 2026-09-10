import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { getCropDetails } from '../../utils/cropData';

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
        fetch(`http://localhost:4000/api/pools/society/${user?.society_id || 1}`),
        fetch(`http://localhost:4000/api/orders/consumer/${user?.id || 1}`)
      ]);
      if (poolRes.ok) setPools(await poolRes.json());
      if (orderRes.ok) setOrders(await orderRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders.filter(o => ['Pending', 'Confirmed', 'Shipped', 'InTransit', 'PickedUp'].includes(o.status));
  const openPools = pools.filter(p => p.status === 'Open');
  const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
  const totalKg = orders.reduce((sum, o) => sum + (Number(o.quantity_kg) || 0), 0);
  const estimatedSavings = totalSpent * 0.22; // ~22% average farm-to-consumer savings

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-500 font-medium text-sm">Loading your buyer dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-8 md:p-10 shadow-xl border border-emerald-700/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-md">
              <span>📍</span>
              <span>{user?.society_name || 'Amrapali Society, Sector 62'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Welcome back, {user?.name || 'Neighbor'}!
            </h1>
            <p className="text-emerald-100/90 text-sm max-w-xl">
              Here is your fresh farm harvest summary. Pool orders with your neighbors in <strong>{user?.society_name || 'your society'}</strong> or buy directly from local farmers.
            </p>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/consumer/pools"
              className="px-5 py-3 rounded-2xl font-bold text-sm bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-md transition-all flex items-center gap-2"
            >
              <span>🏘️ Join Society Pools</span>
            </Link>
            <Link
              to="/consumer/marketplace"
              className="px-5 py-3 rounded-2xl font-bold text-sm bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 transition-all flex items-center gap-2"
            >
              <span>🛒 Farm Market</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl shrink-0">
            📦
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Deliveries</p>
            <p className="text-2xl font-black text-gray-900">{activeOrders.length}</p>
            <span className="text-[11px] text-emerald-600 font-semibold">In progress</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center text-2xl shrink-0">
            🤝
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Open Society Pools</p>
            <p className="text-2xl font-black text-gray-900">{openPools.length}</p>
            <span className="text-[11px] text-teal-600 font-semibold">Wholesale rates</span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-2xl shrink-0">
            💰
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Est. Rupee Savings</p>
            <p className="text-2xl font-black text-emerald-700">₹{estimatedSavings.toFixed(0)}</p>
            <span className="text-[11px] text-gray-500 font-medium">vs retail mandi</span>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center text-2xl shrink-0">
            ⚖️
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Harvest Bought</p>
            <p className="text-2xl font-black text-gray-900">{totalKg.toFixed(0)} kg</p>
            <span className="text-[11px] text-blue-600 font-semibold">Clean farm produce</span>
          </div>
        </div>
      </div>

      {/* Main Content Split: Ongoing Pools & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Active Society Pools */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-7 border border-emerald-100 shadow-sm space-y-5">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <span>🏘️</span> Active Community Group Pools
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Join with neighbors in {user?.society_name} before targets close.
              </p>
            </div>
            <Link
              to="/consumer/pools"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              View All Pools &rarr;
            </Link>
          </div>

          {openPools.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-xs border border-dashed border-gray-200 rounded-2xl p-6">
              No active open pools right now. Check back soon or contact your society lead!
            </div>
          ) : (
            <div className="space-y-4">
              {openPools.slice(0, 3).map(pool => {
                const currentKg = Number(pool.current_kg || 0);
                const targetKg = Number(pool.target_kg || 100);
                const progress = Math.min(100, Math.round((currentKg / targetKg) * 100));
                const cropMeta = getCropDetails(pool.crop_name);

                return (
                  <div
                    key={pool.id}
                    className="p-4 rounded-2xl border border-gray-100 bg-emerald-50/20 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{cropMeta.emoji}</span>
                        <div>
                          <h4 className="font-extrabold text-base text-gray-900">
                            {pool.crop_name} Pool
                          </h4>
                          <span className="text-xs text-emerald-700 font-bold">
                            ₹{pool.price_per_kg}/kg ({pool.discount_percent}% OFF)
                          </span>
                        </div>
                      </div>

                      <Link
                        to="/consumer/pools"
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        Join Pool
                      </Link>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-gray-600">
                          {currentKg} / {targetKg} kg collected
                        </span>
                        <span className="text-emerald-700 font-bold">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent Orders & Status */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 md:p-7 border border-emerald-100 shadow-sm space-y-5">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <span>📦</span> Recent Orders
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Your produce reservations & tracking</p>
            </div>
            <Link
              to="/consumer/orders"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              All Orders &rarr;
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-xs border border-dashed border-gray-200 rounded-2xl p-6">
              You have no orders yet. Explore our fresh harvest marketplace!
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 4).map(o => {
                const isPool = o.order_type === 'Pool';
                const orderId = o.order_id || o.id;

                return (
                  <div
                    key={`${o.order_type}-${orderId}`}
                    className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-gray-200 transition-all flex justify-between items-center gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          isPool ? 'bg-teal-100 text-teal-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {o.order_type || 'Direct'}
                        </span>
                        <strong className="text-gray-900 text-sm">{o.crop_name}</strong>
                      </div>
                      <p className="text-gray-500 text-[11px] mt-1">
                        {o.quantity_kg}kg • ₹{o.total_price} • {o.delivery_type}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        o.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : o.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {o.status}
                      </span>
                      {['Shipped', 'InTransit', 'PickedUp'].includes(o.status) && (
                        <Link
                          to={`/consumer/tracking/${orderId}?type=${o.order_type}`}
                          className="block text-[11px] font-bold text-emerald-600 hover:underline mt-1"
                        >
                          Track 🚚
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
