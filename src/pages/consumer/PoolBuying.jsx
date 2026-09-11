import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PoolCard from '../../components/PoolCard';

export default function PoolBuying() {
  const { user } = useAuth();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Join Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [joinQty, setJoinQty] = useState('');
  const [deliveryType, setDeliveryType] = useState('Hub Pickup'); // Default for pools

  useEffect(() => {
    fetchPools();
  }, [user]);

  const fetchPools = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/pools/society/${user.society_id}`);
      if (res.ok) setPools(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openJoinModal = (pool) => {
    setSelectedPool(pool);
    setJoinQty(1);
    setShowModal(true);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!selectedPool || !joinQty) return;
    
    try {
      const totalPrice = Math.round(joinQty * selectedPool.price_per_kg);
      
      // 1. Create Razorpay Order via escrow backend
      const orderRes = await fetch('http://localhost:4000/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice,
          farmerId: null, // No specific farmer mapped per pool right now
          driverId: 5, // Default driver for demo
          leadId: selectedPool.lead_id || 3
        })
      });
      if (!orderRes.ok) throw new Error('Failed to initialize payment');
      const orderData = await orderRes.json();

      // 2. Load Razorpay and open modal
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) throw new Error("Razorpay SDK failed to load");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: totalPrice * 100, // paise
        currency: "INR",
        name: "KisanDirect Community Pools",
        description: `Joining ${selectedPool.crop_name} Pool for ${joinQty}kg`,
        order_id: orderData.razorpayOrderId,
        handler: async function (response) {
          try {
            // 3. Verify Payment Signature
            const verifyRes = await fetch('http://localhost:4000/api/payment/verify-escrow', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: orderData.order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            if (!verifyRes.ok) throw new Error("Signature verification failed");
            
            // 4. Record the pool order
            const res = await fetch(`http://localhost:4000/api/pools/${selectedPool.id}/join`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                consumer_id: user.id,
                quantity_kg: joinQty,
                delivery_type: deliveryType
              })
            });
            if (!res.ok) throw new Error('Failed to join pool');
            
            alert('Successfully joined the pool!');
            setShowModal(false);
            fetchPools(); // refresh
          } catch (err) {
            alert(err.message);
          }
        },
        theme: { color: "#2563eb" } // blue-600
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function(response) {
        alert("Payment Failed: " + response.error.description);
      });
      rzp.open();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Community Group Buying</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Pool orders with your neighbors in <strong>{user.society_name}</strong> to unlock wholesale prices. 
          When the pool reaches its target, the order is locked and dispatched directly from the farm!
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading pools...</div>
      ) : pools.length === 0 ? (
        <div className="text-center py-12 bg-white rounded shadow text-gray-500 border border-dashed border-gray-300">
          <p className="mb-2">No active pools for {user.society_name}.</p>
          <p className="text-sm">Contact your community lead to request a new pool.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pools.map(pool => (
            <PoolCard 
              key={pool.id} 
              pool={pool} 
              onJoin={() => openJoinModal(pool)} 
            />
          ))}
        </div>
      )}

      {/* Join Modal */}
      {showModal && selectedPool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4 border-b pb-2">
              <h2 className="text-xl font-bold">Join {selectedPool.crop_name} Pool</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="bg-blue-50 text-blue-800 p-3 rounded text-sm mb-4">
                <p><strong>Discount: {selectedPool.discount_percent}% OFF</strong> retail price!</p>
                <p>Base price: ₹{selectedPool.price_per_kg}/kg</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity (kg)</label>
                <input 
                  type="number" required min="1" 
                  max={Math.max(1, selectedPool.target_kg - selectedPool.current_kg)}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  value={joinQty}
                  onChange={e => setJoinQty(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Remaining capacity: {selectedPool.target_kg - selectedPool.current_kg}kg
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Method</label>
                <select 
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  value={deliveryType}
                  onChange={e => setDeliveryType(e.target.value)}
                >
                  <option>Hub Pickup (Society Gate)</option>
                  <option>Doorstep Delivery (+₹20)</option>
                </select>
              </div>

              <div className="bg-gray-50 p-3 rounded text-right">
                <p className="text-sm text-gray-600">Total Price:</p>
                <p className="text-2xl font-bold text-blue-700">₹{(joinQty * selectedPool.price_per_kg).toFixed(2)}</p>
                <p className="text-xs text-green-600 font-medium mt-1">Pay securely via Escrow</p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold">Join Pool</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
