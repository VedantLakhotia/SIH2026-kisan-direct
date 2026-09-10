import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { getCropDetails } from '../../utils/cropData';

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [activePassOrder, setActivePassOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/orders/consumer/${user?.id || 1}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-900 border border-amber-200';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-900 border border-blue-200';
      case 'Shipped':
      case 'PickedUp':
      case 'InTransit':
        return 'bg-purple-100 text-purple-900 border border-purple-200 animate-pulse';
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-900 border border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-900 border border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'Pool Orders') return o.order_type === 'Pool';
    if (filter === 'Direct Orders') return o.order_type === 'Direct';
    if (filter === 'Active') return ['Pending', 'Confirmed', 'Shipped', 'InTransit', 'PickedUp'].includes(o.status);
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            My Orders & Pickup Passes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track farm dispatch status and access your digital gate collection passes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/consumer/pools"
            className="px-4 py-2 text-xs font-bold bg-emerald-50 text-emerald-800 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-200"
          >
            + Join More Pools
          </Link>
          <Link
            to="/consumer/marketplace"
            className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200/80 shadow-sm w-fit">
        {['All', 'Active', 'Pool Orders', 'Direct Orders'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === f
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {f} {f === 'All' ? `(${orders.length})` : ''}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 text-xs font-medium">Loading your orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 space-y-4">
          <span className="text-5xl block">🛍️</span>
          <h3 className="text-lg font-bold text-gray-800">No {filter !== 'All' ? filter.toLowerCase() : ''} found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            You haven't placed any orders in this category yet. Explore community pools to save together with your neighbors!
          </p>
          <Link
            to="/consumer/pools"
            className="inline-block px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 shadow-md transition-colors"
          >
            Join Society Pools
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const cropMeta = getCropDetails(order.crop_name);
            const orderId = order.order_id || order.id;
            const isPool = order.order_type === 'Pool';
            const isHubPickup = (order.delivery_type || '').toLowerCase().includes('hub') || (order.delivery_type || '').toLowerCase().includes('gate');
            const isInTransit = ['Shipped', 'InTransit', 'PickedUp'].includes(order.status);
            const passCode = `KD-${String(orderId).padStart(4, '0')}`;

            return (
              <div
                key={`${order.order_type}-${orderId}`}
                className="bg-white rounded-3xl border border-gray-200/80 p-5 md:p-6 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left: Item info & thumbnail */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                    <img
                      src={cropMeta.image}
                      alt={order.crop_name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${
                        isPool ? 'bg-teal-100 text-teal-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isPool ? '🏘️ Society Pool Order' : '🚜 Direct Farm Order'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-gray-900">
                      {order.crop_name}
                    </h3>

                    <p className="text-xs text-gray-500">
                      Order #{orderId} • Placed on {new Date(order.created_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 pt-1">
                      <span>Weight: <strong className="text-gray-900">{order.quantity_kg} kg</strong></span>
                      <span>•</span>
                      <span>Delivery: <strong className="text-gray-900">{order.delivery_type || 'Gate Hub'}</strong></span>
                      <span>•</span>
                      <span>Total: <strong className="text-emerald-700 text-sm font-extrabold">₹{order.total_price}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                  {/* Gate Pickup Pass Trigger */}
                  {isHubPickup && (
                    <button
                      onClick={() => setActivePassOrder({ ...order, passCode })}
                      className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                    >
                      <span>🎟️</span>
                      <span>Gate Pickup Pass</span>
                    </button>
                  )}

                  {/* Tracking Button */}
                  {isInTransit ? (
                    <Link
                      to={`/consumer/tracking/${orderId}?type=${order.order_type}`}
                      className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md transition-all flex items-center gap-1.5"
                    >
                      <span>🚚</span>
                      <span>Track Live Dispatch</span>
                    </Link>
                  ) : order.status === 'Delivered' ? (
                    <span className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 flex items-center gap-1">
                      <span>✓</span> Delivered
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 font-semibold px-2 py-1">
                      Awaiting batch dispatch
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DIGITAL GATE PICKUP PASS MODAL */}
      {activePassOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-emerald-200 animate-scaleUp">
            {/* Ticket Header */}
            <div className="bg-gradient-to-br from-emerald-800 to-teal-800 text-white p-6 text-center relative">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200 block mb-1">
                KisanDirect Digital Gate Pass
              </span>
              <h3 className="text-2xl font-black">
                {user?.society_name || 'Society Hub'}
              </h3>
              <p className="text-xs text-emerald-100/80 mt-1">
                Security Gate & Clubhouse Collection Token
              </p>

              <button
                onClick={() => setActivePassOrder(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>

            {/* Ticket Body */}
            <div className="p-6 space-y-4 text-center">
              <div className="p-4 bg-emerald-50/70 border-2 border-dashed border-emerald-300 rounded-2xl space-y-1">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Pickup Verification Code
                </span>
                <p className="text-3xl font-black tracking-widest text-emerald-900 font-mono">
                  {activePassOrder.passCode}
                </p>
                <p className="text-[11px] text-gray-500">Show this to society security guard upon collection</p>
              </div>

              <div className="space-y-2 text-left bg-gray-50 p-4 rounded-2xl text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Resident:</span>
                  <strong className="text-gray-900">{user?.name || 'Society Resident'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Produce:</span>
                  <strong className="text-gray-900">{activePassOrder.crop_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quantity:</span>
                  <strong className="text-gray-900">{activePassOrder.quantity_kg} kg</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Payable:</span>
                  <strong className="text-emerald-700 text-sm">₹{activePassOrder.total_price}</strong>
                </div>
              </div>

              <button
                onClick={() => setActivePassOrder(null)}
                className="w-full py-3 bg-emerald-600 text-white font-extrabold text-xs rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
