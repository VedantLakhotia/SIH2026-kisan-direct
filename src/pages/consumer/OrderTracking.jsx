import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import TrackingMap from '../../components/TrackingMap';

export default function OrderTracking() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const orderType = searchParams.get('type') || 'Direct';

  const [orderInfo, setOrderInfo] = useState(null);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchTrackingData = async () => {
    try {
      const orderRes = await fetch(`http://localhost:4000/api/orders/${orderId}?type=${orderType}`);
      if (!orderRes.ok) throw new Error('Order not found');
      const orderData = await orderRes.json();
      setOrderInfo(orderData);

      if (orderData.delivery_id) {
        const trackRes = await fetch(`http://localhost:4000/api/deliveries/${orderData.delivery_id}/track`);
        if (trackRes.ok) {
          setTrackingInfo(await trackRes.json());
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status) => {
    switch (status) {
      case 'Pending': return 1;
      case 'Confirmed': return 2;
      case 'Shipped':
      case 'PickedUp': return 3;
      case 'InTransit': return 4;
      case 'Delivered': return 5;
      default: return 1;
    }
  };

  if (loading && !orderInfo) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-500 font-medium text-sm">Connecting to live dispatch GPS...</p>
      </div>
    );
  }

  if (error || !orderInfo) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-rose-200 text-center space-y-4">
        <span className="text-4xl block">⚠️</span>
        <h2 className="text-xl font-bold text-gray-900">Order Tracking Unavailable</h2>
        <p className="text-sm text-gray-600">{error || 'Order details could not be retrieved.'}</p>
        <Link
          to="/consumer/orders"
          className="inline-block px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 text-white"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  const currentStep = getStatusStep(orderInfo.status);
  const trackingPoints = trackingInfo?.tracking || [];
  const deliveryMeta = trackingInfo?.delivery || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/consumer/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200"
        >
          <span>&larr;</span> Back to Orders
        </Link>

        <span className="text-xs font-semibold text-gray-500">
          Order ID: #{orderId} • {orderType} Order
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Timeline & Order Meta */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
                {orderInfo.delivery_type || 'Hub Pickup'}
              </span>
              <h2 className="text-2xl font-black text-gray-900 mt-1">
                {orderInfo.crop_name} Dispatch
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Quantity: {orderInfo.quantity_kg} kg • Total: ₹{orderInfo.total_price}
              </p>
            </div>

            {/* Estimated Arrival Banner */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider block">
                  Estimated Gate Arrival
                </span>
                <p className="text-lg font-black text-emerald-900 mt-0.5">
                  {deliveryMeta.estimated_arrival
                    ? new Date(deliveryMeta.estimated_arrival).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
                    : 'Within 24 - 48 Hours'}
                </p>
              </div>
              <span className="text-2xl">⏱️</span>
            </div>

            {/* Vertical Milestone Progress */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Dispatch Milestones
              </h3>

              <div className="space-y-5 pl-2 relative border-l-2 border-emerald-100 ml-4">
                {[
                  { step: 1, title: 'Order Reserved', desc: 'Added to aggregate community batch' },
                  { step: 2, title: 'Batch Confirmed', desc: 'Wholesale farm order finalized' },
                  { step: 3, title: 'Harvested & Loaded', desc: 'Produce collected from regional farm' },
                  { step: 4, title: 'In Transit (Live)', desc: 'Direct refrigerated delivery truck' },
                  { step: 5, title: 'Delivered to Society', desc: 'Ready for resident gate collection' }
                ].map(item => {
                  const isDone = currentStep >= item.step;
                  const isCurrent = currentStep === item.step;

                  return (
                    <div key={item.step} className="relative pl-6">
                      <span
                        className={`absolute -left-[25px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                        } ${isCurrent ? 'ring-4 ring-emerald-100 animate-pulse' : ''}`}
                      >
                        {isDone ? '✓' : item.step}
                      </span>
                      <p className={`text-xs font-extrabold ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                        {item.title}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Driver Profile Card */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-lg">
                  🚚
                </div>
                <div>
                  <strong className="text-gray-900 block">Suresh Pal (Freight Driver)</strong>
                  <span className="text-[11px] text-gray-500">Tata Ace EV • DL-1L-4492</span>
                </div>
              </div>

              <a
                href="tel:9911223344"
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-100 shadow-sm"
              >
                📞 Call
              </a>
            </div>
          </div>
        </div>

        {/* Right: GPS Map View */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm flex flex-col h-[640px]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <span>📍</span> Live Delivery Route Map
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Real-time GPS telemetry from farm to society</p>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live GPS Signal
            </span>
          </div>

          {!orderInfo.delivery_id && trackingPoints.length === 0 ? (
            <div className="flex-1 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 rounded-2xl flex flex-col items-center justify-center p-8 border-2 border-dashed border-emerald-200 text-center space-y-3">
              <span className="text-5xl block animate-bounce">🚜</span>
              <h4 className="font-extrabold text-base text-gray-800">
                Awaiting Vehicle Assignment
              </h4>
              <p className="text-xs text-gray-500 max-w-sm">
                The driver route and live satellite tracking will activate automatically when produce is loaded at the farm.
              </p>
              <div className="text-[11px] font-bold text-emerald-700 bg-white px-4 py-2 rounded-xl shadow-sm border border-emerald-100">
                Destination: {deliveryMeta.destination_address || 'Society Gate Hub (Amrapali Sector 62)'}
              </div>
            </div>
          ) : (
            <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
              <TrackingMap
                trackingPoints={trackingPoints.length > 0 ? trackingPoints : [
                  { lat: 28.9845, lng: 77.7064, recorded_at: new Date() },
                  { lat: 28.8500, lng: 77.5500, recorded_at: new Date() },
                  { lat: 28.6270, lng: 77.3653, recorded_at: new Date() }
                ]}
                destination={{
                  lat: deliveryMeta.destination_lat || 28.6270,
                  lng: deliveryMeta.destination_lng || 77.3653
                }}
                start={{
                  lat: deliveryMeta.pickup_lat || 28.9845,
                  lng: deliveryMeta.pickup_lng || 77.7064
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
