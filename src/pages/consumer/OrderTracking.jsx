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
    // Poll for updates every 15 seconds
    const interval = setInterval(fetchTrackingData, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchTrackingData = async () => {
    try {
      // First get the order details to find the delivery_id
      const orderRes = await fetch(`http://localhost:4000/api/orders/${orderId}?type=${orderType}`);
      if (!orderRes.ok) throw new Error('Order not found');
      const orderData = await orderRes.json();
      setOrderInfo(orderData);

      if (orderData.delivery_id) {
        // Fetch full tracking trail
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
    switch(status) {
      case 'Pending': return 1;
      case 'Confirmed': return 2;
      case 'Shipped': 
      case 'PickedUp': return 3;
      case 'InTransit': return 4;
      case 'Delivered': return 5;
      default: return 0;
    }
  };

  if (loading && !orderInfo) return <div className="p-8 text-center">Loading tracking info...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  const currentStep = getStatusStep(orderInfo?.status);
  
  // Extract tracking points array and delivery metadata
  const trackingPoints = trackingInfo?.tracking || [];
  const deliveryMeta = trackingInfo?.delivery || {};

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Details Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded shadow p-5 border-t-4 border-green-500">
          <Link to="/consumer/orders" className="text-sm text-green-600 hover:underline mb-4 inline-block">&larr; Back to Orders</Link>
          
          <h2 className="text-xl font-bold mb-1">Order #{orderId}</h2>
          <p className="text-gray-500 text-sm mb-4">{orderType} Order</p>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Item</span>
              <span className="font-semibold">{orderInfo.crop_name}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Quantity</span>
              <span className="font-semibold">{orderInfo.quantity_kg} kg</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Delivery</span>
              <span className="font-semibold">{orderInfo.delivery_type}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Status</span>
              <span className="font-bold text-green-700">{orderInfo.status}</span>
            </div>
            {deliveryMeta.estimated_arrival && (
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-xs text-blue-600 uppercase font-bold">Estimated Arrival</p>
                <p className="text-lg font-bold text-blue-900">
                  {new Date(deliveryMeta.estimated_arrival).toLocaleString([], {hour: '2-digit', minute:'2-digit', month: 'short', day: 'numeric'})}
                </p>
              </div>
            )}
          </div>

          {/* Vertical Timeline */}
          <div className="relative border-l-2 border-gray-200 ml-3 pl-6 space-y-6">
            <div className={`relative ${currentStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
              <span className="absolute -left-[31px] bg-white p-1 rounded-full"><div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-green-500' : 'bg-gray-300'}`}></div></span>
              <h3 className="font-bold text-sm">Order Placed</h3>
            </div>
            <div className={`relative ${currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
              <span className="absolute -left-[31px] bg-white p-1 rounded-full"><div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-green-500' : 'bg-gray-300'}`}></div></span>
              <h3 className="font-bold text-sm">Confirmed</h3>
            </div>
            <div className={`relative ${currentStep >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
              <span className="absolute -left-[31px] bg-white p-1 rounded-full"><div className={`w-3 h-3 rounded-full ${currentStep >= 3 ? 'bg-green-500' : 'bg-gray-300'}`}></div></span>
              <h3 className="font-bold text-sm">Picked up from Farm</h3>
            </div>
            <div className={`relative ${currentStep >= 4 ? 'text-green-600' : 'text-gray-400'}`}>
              <span className="absolute -left-[31px] bg-white p-1 rounded-full"><div className={`w-3 h-3 rounded-full ${currentStep >= 4 ? 'bg-green-500' : 'bg-gray-300'}`}></div></span>
              <h3 className="font-bold text-sm">In Transit (Live)</h3>
            </div>
            <div className={`relative ${currentStep >= 5 ? 'text-green-600' : 'text-gray-400'}`}>
              <span className="absolute -left-[31px] bg-white p-1 rounded-full"><div className={`w-3 h-3 rounded-full ${currentStep >= 5 ? 'bg-green-500' : 'bg-gray-300'}`}></div></span>
              <h3 className="font-bold text-sm">Delivered</h3>
            </div>
          </div>

        </div>
      </div>

      {/* Map View */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded shadow p-4 h-[600px] flex flex-col">
          <h2 className="text-lg font-bold mb-4">Live GPS Tracking</h2>
          
          {!orderInfo.delivery_id ? (
            <div className="flex-1 bg-gray-100 flex items-center justify-center rounded border-2 border-dashed border-gray-300">
              <div className="text-center">
                <span className="text-4xl mb-2 block">🚚</span>
                <p className="text-gray-500">Awaiting driver assignment...</p>
                <p className="text-sm text-gray-400 mt-1">Map will appear once the order is picked up.</p>
              </div>
            </div>
          ) : !trackingPoints || trackingPoints.length === 0 ? (
            <div className="flex-1 bg-gray-100 flex items-center justify-center rounded">
              <p className="text-gray-500">Connecting to driver GPS...</p>
            </div>
          ) : (
            <div className="flex-1 border rounded overflow-hidden">
              <TrackingMap 
                trackingPoints={trackingPoints} 
                destination={{lat: deliveryMeta.destination_lat, lng: deliveryMeta.destination_lng}}
                start={{lat: deliveryMeta.pickup_lat, lng: deliveryMeta.pickup_lng}}
              />
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
