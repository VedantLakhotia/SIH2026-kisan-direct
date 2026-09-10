import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ListingCard from '../../components/ListingCard';
import Toast from '../../components/Toast';
import { Link } from 'react-router-dom';
import { getCropDetails } from '../../utils/cropData';

export default function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [gradeFilter, setGradeFilter] = useState('');
  const [sortBy, setSortBy] = useState('default');

  // Buy Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [buyQty, setBuyQty] = useState(2);
  const [deliveryType, setDeliveryType] = useState('Hub Pickup');
  const [submitting, setSubmitting] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [search, organicOnly, gradeFilter]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (organicOnly) query.append('organic', 'true');
      if (gradeFilter) query.append('grade', gradeFilter);

      const res = await fetch(`http://localhost:4000/api/listings?${query.toString()}`);
      if (res.ok) {
        setListings(await res.json());
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error loading farm produce', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openBuyModal = (listing) => {
    setSelectedListing(listing);
    setBuyQty(2);
    setDeliveryType('Hub Pickup');
    setPurchaseSuccess(false);
    setShowModal(true);
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!selectedListing || !buyQty || buyQty <= 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:4000/api/orders/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumer_id: user.id,
          listing_id: selectedListing.id,
          quantity_kg: Number(buyQty),
          delivery_type: deliveryType
        })
      });

      if (!res.ok) throw new Error('Failed to place direct farm order');

      setPurchaseSuccess(true);
      setToast({
        message: `Order placed for ${buyQty}kg of fresh ${selectedListing.crop_name}!`,
        type: 'success'
      });
      fetchListings();
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Error placing order', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & sort
  let processedListings = listings.filter(l => {
    if (categoryFilter === 'all') return true;
    const meta = getCropDetails(l.crop_name);
    return meta.category.toLowerCase().includes(categoryFilter.toLowerCase());
  });

  if (sortBy === 'priceAsc') {
    processedListings.sort((a, b) => Number(a.price_per_kg) - Number(b.price_per_kg));
  } else if (sortBy === 'priceDesc') {
    processedListings.sort((a, b) => Number(b.price_per_kg) - Number(a.price_per_kg));
  } else if (sortBy === 'qtyDesc') {
    processedListings.sort((a, b) => Number(b.quantity_kg) - Number(a.quantity_kg));
  }

  const selectedCropMeta = selectedListing ? getCropDetails(selectedListing.crop_name) : null;
  const unitPrice = selectedListing ? Number(selectedListing.price_per_kg) : 0;
  const rawTotal = buyQty * unitPrice;
  const hubDiscount = deliveryType === 'Hub Pickup' ? rawTotal * 0.05 : 0;
  const deliveryFee = deliveryType === 'Doorstep' ? 20 : 0;
  const grandTotal = Math.max(0, rawTotal - hubDiscount + deliveryFee);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-green-900 text-white rounded-3xl p-8 md:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-md">
            <span>🚜</span>
            <span>Direct Farm to Consumer Marketplace</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Fresh Produce Harvested Straight From Local Farms
          </h1>
          <p className="text-emerald-100/90 text-sm leading-relaxed">
            Support regional farmers in Meerut, Hapur, and NCR. Guaranteed fresh harvests delivered directly to your society with zero middleman markup.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search produce (e.g. Tomato, Potato, Mango)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50/50"
            />
          </div>

          {/* Quick Grade & Organic Toggles */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-emerald-50/80 px-3 py-2 rounded-xl border border-emerald-200/80 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition-colors">
              <input
                type="checkbox"
                checked={organicOnly}
                onChange={(e) => setOrganicOnly(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>🍃 100% Organic Only</span>
            </label>

            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-gray-50 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Quality Grades</option>
              <option value="A">Grade A (Premium)</option>
              <option value="B">Grade B (Standard)</option>
              <option value="C">Grade C (Economy)</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-gray-50 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="default">Default Sorting</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="qtyDesc">Stock: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <span className="text-xs font-bold text-gray-400 mr-2 uppercase">Category:</span>
          {[
            { id: 'all', label: 'All Items' },
            { id: 'vegetable', label: '🥕 Vegetables' },
            { id: 'fruit', label: '🥭 Fruits' },
            { id: 'grain', label: '🌾 Grains' },
            { id: 'leafy', label: '🥬 Leafy Greens' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                categoryFilter === cat.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Produce Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
            Available Produce ({processedListings.length})
          </span>
          <span className="text-xs text-gray-400">Direct Farm Source</span>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 text-sm font-medium">Loading fresh farm produce...</p>
          </div>
        ) : processedListings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200 p-8 space-y-4">
            <span className="text-5xl block">🚜</span>
            <h3 className="text-lg font-bold text-gray-800">No produce matching your filters</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Try clearing some search terms or resetting the organic/grade toggles.
            </p>
            <button
              onClick={() => { setSearch(''); setOrganicOnly(false); setGradeFilter(''); setCategoryFilter('all'); }}
              className="px-4 py-2 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-xl hover:bg-emerald-200 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedListings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onBuy={() => openBuyModal(listing)}
              />
            ))}
          </div>
        )}
      </div>

      {/* BUY MODAL */}
      {showModal && selectedListing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-emerald-100 animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white p-6 flex justify-between items-start">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                  Direct Farm Order
                </span>
                <h2 className="text-2xl font-black mt-1">
                  Buy {selectedListing.crop_name}
                </h2>
                <p className="text-xs text-emerald-100/90 mt-0.5">
                  ₹{selectedListing.price_per_kg}/kg • {selectedListing.quantity_kg}kg available in stock
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white text-2xl font-light w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            {purchaseSuccess ? (
              <div className="p-8 text-center space-y-5">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
                  ✓
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-gray-900">Purchase Placed!</h3>
                  <p className="text-sm text-gray-600">
                    Your order for <strong>{buyQty}kg</strong> of {selectedListing.crop_name} has been sent to the farmer for harvest and dispatch.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Link
                    to="/consumer/orders"
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-emerald-600 text-white text-center hover:bg-emerald-700 shadow-md"
                  >
                    View Orders & Tracking
                  </Link>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePurchase} className="p-6 space-y-5">
                {/* Quantity Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Quantity Needed (KG)
                  </label>

                  {/* Counter and Chips */}
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      type="button"
                      onClick={() => setBuyQty(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 rounded-xl border border-gray-200 text-gray-700 font-bold text-lg hover:bg-gray-100 flex items-center justify-center"
                    >
                      -
                    </button>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        required
                        min="1"
                        max={selectedListing.quantity_kg}
                        value={buyQty}
                        onChange={(e) => setBuyQty(Number(e.target.value))}
                        className="w-full text-center py-2 rounded-xl border border-gray-300 font-black text-lg text-emerald-800"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                        KG
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBuyQty(prev => Math.min(selectedListing.quantity_kg, prev + 1))}
                      className="w-10 h-10 rounded-xl border border-gray-200 text-gray-700 font-bold text-lg hover:bg-gray-100 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {[1, 2, 5, 10].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBuyQty(val)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          buyQty === val
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {val} kg
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delivery Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Delivery Location
                  </label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('Hub Pickup')}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        deliveryType === 'Hub Pickup'
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-xs text-gray-800 block">Society Gate Hub Pickup</span>
                        <span className="text-[11px] text-gray-500">Collect at society security entrance</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded">
                        Save 5% (Eco)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('Doorstep')}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        deliveryType === 'Doorstep'
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-xs text-gray-800 block">Doorstep Delivery</span>
                        <span className="text-[11px] text-gray-500">Direct to your apartment door</span>
                      </div>
                      <span className="text-xs font-bold text-gray-600">+₹20</span>
                    </button>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-gradient-to-br from-gray-50 to-emerald-50/40 p-4 rounded-2xl border border-emerald-100 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Produce ({buyQty} kg @ ₹{unitPrice}/kg)</span>
                    <span className="font-semibold text-gray-800">₹{rawTotal.toFixed(2)}</span>
                  </div>

                  {hubDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Gate Hub Eco-Discount (5%)</span>
                      <span>-₹{hubDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Doorstep Handling</span>
                      <span>+₹{deliveryFee.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
                    <span className="font-extrabold text-gray-900 text-sm">Total:</span>
                    <span className="text-2xl font-black text-emerald-800">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || buyQty <= 0}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    {submitting ? 'Placing Order...' : 'Confirm Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
