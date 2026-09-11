import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ListingCard from '../../components/ListingCard';

export default function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [gradeFilter, setGradeFilter] = useState('');

  // Purchase Form
  const [buyQty, setBuyQty] = useState('');
  const [deliveryType, setDeliveryType] = useState('Doorstep');

  useEffect(() => {
    fetchListings();
  }, [search, organicOnly, gradeFilter]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if(search) query.append('search', search);
      if(organicOnly) query.append('organic', 'true');
      if(gradeFilter) query.append('grade', gradeFilter);
      
      const res = await fetch(`http://localhost:4000/api/listings?${query.toString()}`);
      if (res.ok) setListings(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openBuyModal = (listing) => {
    setSelectedListing(listing);
    setBuyQty(1);
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

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!selectedListing || !buyQty) return;
    
    try {
      const totalPrice = Math.round(buyQty * selectedListing.price_per_kg);
      
      // 1. Create Razorpay Order via escrow backend
      const orderRes = await fetch('http://localhost:4000/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice,
          farmerId: selectedListing.farmer_id,
          driverId: 5, // Default driver for demo
          leadId: 3 // Default lead for demo
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
        name: "KisanDirect Marketplace",
        description: `Buying ${buyQty}kg of ${selectedListing.crop_name}`,
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
            
            // 4. Record the direct marketplace order
            const res = await fetch('http://localhost:4000/api/orders/direct', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                consumer_id: user.id,
                listing_id: selectedListing.id,
                quantity_kg: buyQty,
                delivery_type: deliveryType
              })
            });
            if (!res.ok) throw new Error('Failed to record order details in DB');
            
            alert('Payment Successful & Order placed securely!');
            setShowModal(false);
            fetchListings(); // refresh available quantities
          } catch (err) {
            alert(err.message);
          }
        },
        theme: { color: "#27ae60" }
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
    <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
      {/* Sidebar Filters */}
      <div className="w-full md:w-64 shrink-0 space-y-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">Filters</h2>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Search Crop</label>
            <input 
              type="text" 
              placeholder="e.g. Tomato, Potato..." 
              className="w-full border rounded p-2 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                className="rounded text-green-600"
                checked={organicOnly}
                onChange={e => setOrganicOnly(e.target.checked)}
              />
              <span className="text-sm text-gray-700">Organic Certified Only</span>
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Grade</label>
            <select 
              className="w-full border rounded p-2 text-sm"
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
            >
              <option value="">All Grades</option>
              <option value="A">Grade A (Premium)</option>
              <option value="B">Grade B (Standard)</option>
              <option value="C">Grade C (Economy)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Direct Farm Marketplace</h1>
          <span className="text-gray-500">{listings.length} items found</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading produce...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded shadow text-gray-500">
            No produce found matching your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(listing => (
              <ListingCard 
                key={listing.id} 
                listing={listing} 
                onBuy={() => openBuyModal(listing)} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Buy Modal */}
      {showModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4 border-b pb-2">
              <h2 className="text-xl font-bold">Buy {selectedListing.crop_name}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 font-bold">&times;</button>
            </div>
            
            <form onSubmit={handlePurchase} className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Price: ₹{selectedListing.price_per_kg}/kg</span>
                <span>Available: {selectedListing.quantity_kg} kg</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity (kg)</label>
                <input 
                  type="number" required min="1" max={Math.max(1, selectedListing.quantity_kg)}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  value={buyQty}
                  onChange={e => setBuyQty(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Method</label>
                <select 
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  value={deliveryType}
                  onChange={e => setDeliveryType(e.target.value)}
                >
                  <option>Doorstep</option>
                  <option>Hub Pickup (Save 5%)</option>
                </select>
              </div>

              <div className="bg-gray-50 p-3 rounded text-right">
                <p className="text-sm text-gray-600">Total Price:</p>
                <p className="text-2xl font-bold text-green-700">₹{(buyQty * selectedListing.price_per_kg).toFixed(2)}</p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-bold">Confirm Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
