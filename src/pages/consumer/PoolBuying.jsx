import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PoolCard from '../../components/PoolCard';
import Toast from '../../components/Toast';
import { Link } from 'react-router-dom';
import { getCropDetails, CROP_PRESETS } from '../../utils/cropData';

export default function PoolBuying() {
  const { user } = useAuth();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Join Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [joinQty, setJoinQty] = useState(2);
  const [deliveryType, setDeliveryType] = useState('Hub Pickup');
  const [submitting, setSubmitting] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  // Members Modal state
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [membersPool, setMembersPool] = useState(null);
  const [poolMembers, setPoolMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    fetchPools();
  }, [user]);

  const fetchPools = async () => {
    if (!user?.society_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/pools/society/${user.society_id}`);
      if (res.ok) {
        const data = await res.json();
        setPools(data);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Unable to connect to server. Showing local data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openJoinModal = (pool) => {
    setSelectedPool(pool);
    setJoinQty(2);
    setDeliveryType('Hub Pickup');
    setJoinSuccess(false);
    setShowModal(true);
  };

  const openMembersModal = async (pool) => {
    setMembersPool(pool);
    setShowMembersModal(true);
    setLoadingMembers(true);
    try {
      const res = await fetch(`http://localhost:4000/api/pools/${pool.id}/members`);
      if (res.ok) {
        setPoolMembers(await res.json());
      } else {
        setPoolMembers([]);
      }
    } catch (err) {
      console.error(err);
      setPoolMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!selectedPool || !joinQty || joinQty <= 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:4000/api/pools/${selectedPool.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumer_id: user.id,
          quantity_kg: Number(joinQty),
          delivery_type: deliveryType
        })
      });

      if (!res.ok) throw new Error('Failed to join pool');

      setJoinSuccess(true);
      setToast({
        message: `Successfully reserved ${joinQty}kg of ${selectedPool.crop_name}!`,
        type: 'success'
      });
      fetchPools();
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Error joining pool', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter calculations
  const filteredPools = pools.filter(p => {
    const cropName = p.crop_name || '';
    const matchesSearch = cropName.toLowerCase().includes(searchTerm.toLowerCase());
    const progress = (Number(p.current_kg || 0) / Number(p.target_kg || 1)) * 100;
    
    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = p.status === 'Open' && progress < 100;
    if (statusFilter === 'almostFull') matchesStatus = p.status === 'Open' && progress >= 60 && progress < 100;
    if (statusFilter === 'locked') matchesStatus = p.status === 'Locked' || progress >= 100;

    let matchesCategory = true;
    if (categoryFilter !== 'all') {
      const meta = getCropDetails(cropName);
      matchesCategory = meta.category.toLowerCase().includes(categoryFilter.toLowerCase());
    }

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const selectedCropMeta = selectedPool ? getCropDetails(selectedPool.crop_name) : null;
  const retailBenchmark = selectedCropMeta?.benchmarkMandiPrice || (selectedPool ? selectedPool.price_per_kg * 1.25 : 30);
  const poolPrice = selectedPool?.price_per_kg || 0;
  const deliveryFee = deliveryType === 'Doorstep Delivery (+₹20)' ? 20 : 0;
  const produceTotal = Number(joinQty || 0) * poolPrice;
  const finalTotal = produceTotal + deliveryFee;
  const estimatedSavings = Math.max(0, (Number(joinQty || 0) * retailBenchmark) - produceTotal);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Hero Banner with Society Context */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-900 text-white p-8 md:p-10 shadow-xl border border-emerald-700/50">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold border border-white/10">
            <span className="text-base">🏘️</span>
            <span>{user?.society_name || 'Amrapali Society'} Group Buying Hub</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Order Together. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
              Unlock Farm Wholesale Rates.
            </span>
          </h1>

          <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
            By pooling crop orders with your neighbors in <strong>{user?.society_name || 'your society'}</strong>, we aggregate bulk harvest demand directly to farmers, cutting out mandi middlemen and saving you up to 35% on fresh produce.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl text-xs border border-white/10">
              <span className="text-emerald-300 font-bold text-sm">🚚 Direct Farm Freight</span>
              <span className="text-emerald-200/80">Bulk refrigerated dispatch</span>
            </div>
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl text-xs border border-white/10">
              <span className="text-emerald-300 font-bold text-sm">🛡️ Gate Hub Pickup</span>
              <span className="text-emerald-200/80">Zero delivery fee</span>
            </div>
          </div>
        </div>

        {/* Decorative background art */}
        <div className="absolute right-0 bottom-0 opacity-15 translate-x-12 translate-y-12 select-none pointer-events-none text-9xl">
          🌾
        </div>
      </div>

      {/* How it works 4-step Ribbon */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-4">
          How Community Group Buying Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100/60">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              1
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Lead Opens Pool</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Society lead sets harvest target and bulk rate.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100/60">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              2
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Neighbors Reserve</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Society members join with 1kg, 5kg or more.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100/60">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              3
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Wholesale Locked</p>
              <p className="text-[11px] text-gray-500 mt-0.5">When 100% target is reached, price is locked in.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100/60">
            <div className="w-8 h-8 rounded-lg bg-green-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              4
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Society Delivery</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Single delivery arrives directly at your gate hub.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search crops in your society (e.g. Tomato, Onion)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50/50"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl">
          {[
            { id: 'all', label: 'All Pools' },
            { id: 'active', label: '⚡ Active' },
            { id: 'almostFull', label: '🔥 Almost Full' },
            { id: 'locked', label: '🔒 Locked' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === tab.id
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pools Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 text-sm font-medium">Fetching community pools for {user?.society_name}...</p>
        </div>
      ) : filteredPools.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200 p-8 space-y-4">
          <span className="text-5xl block">🌱</span>
          <h3 className="text-lg font-bold text-gray-800">No pools matching your criteria</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Try adjusting your search filters, or suggest a new pool to your society community lead.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCategoryFilter('all'); }}
            className="px-4 py-2 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-xl hover:bg-emerald-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPools.map(pool => (
            <PoolCard
              key={pool.id}
              pool={pool}
              onJoin={openJoinModal}
              onViewMembers={openMembersModal}
            />
          ))}
        </div>
      )}

      {/* JOIN POOL INTERACTIVE MODAL */}
      {showModal && selectedPool && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-emerald-100 animate-scaleUp">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-emerald-700 to-teal-700 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-emerald-100 text-xs font-bold uppercase tracking-wider">
                    {user?.society_name || 'Society'} Group Order
                  </span>
                  <h2 className="text-2xl font-extrabold mt-1">
                    Join {selectedPool.crop_name} Pool
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white text-2xl font-light w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
                >
                  &times;
                </button>
              </div>

              {/* Wholesale banner */}
              <div className="mt-4 flex items-center justify-between bg-white/15 backdrop-blur-md p-3 rounded-xl border border-white/10 text-xs">
                <div>
                  <span className="text-emerald-200">Wholesale Pool Rate:</span>
                  <strong className="text-white text-base ml-1">₹{selectedPool.price_per_kg}/kg</strong>
                </div>
                <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded font-extrabold text-[11px]">
                  {selectedPool.discount_percent}% OFF Mandi
                </span>
              </div>
            </div>

            {/* Modal Form */}
            {joinSuccess ? (
              <div className="p-8 text-center space-y-5">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
                  ✓
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-gray-900">Order Confirmed!</h3>
                  <p className="text-sm text-gray-600">
                    You have reserved <strong>{joinQty} kg</strong> of {selectedPool.crop_name}.
                  </p>
                  <div className="bg-emerald-50 p-3 rounded-xl text-xs text-emerald-800 font-medium">
                    🎉 You saved approximately <strong>₹{estimatedSavings.toFixed(0)}</strong> compared to local market retail!
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Link
                    to="/consumer/orders"
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-emerald-600 text-white text-center hover:bg-emerald-700 shadow-md"
                  >
                    View My Orders & Passes
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
              <form onSubmit={handleJoin} className="p-6 space-y-5">
                {/* Quantity Input with Quick Selector Chips */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Select Quantity (Kilograms)
                  </label>
                  
                  {/* Quick Chips */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[1, 2, 5, 10].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setJoinQty(val)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          joinQty === val
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'border-gray-200 hover:border-emerald-300 text-gray-700'
                        }`}
                      >
                        +{val} kg
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0.5"
                      step="0.5"
                      max={Math.max(1, selectedPool.target_kg - selectedPool.current_kg)}
                      value={joinQty}
                      onChange={(e) => setJoinQty(Number(e.target.value))}
                      className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-gray-300 text-base font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                      KG
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-500 mt-1">
                    Remaining capacity before target is met: <strong>{Math.max(0, selectedPool.target_kg - selectedPool.current_kg)} kg</strong>
                  </p>
                </div>

                {/* Delivery Option */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Delivery Method
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('Hub Pickup')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        deliveryType === 'Hub Pickup'
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-800">Gate Hub Pickup</span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-1.5 py-0.5 rounded">
                          FREE
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">Collect at society security gate or clubhouse.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('Doorstep Delivery (+₹20)')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        deliveryType !== 'Hub Pickup'
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-800">Doorstep Delivery</span>
                        <span className="text-[10px] text-gray-600 font-bold">+₹20</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">Direct to your flat door upon arrival.</p>
                    </button>
                  </div>
                </div>

                {/* Pricing & Savings Summary Card */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 rounded-2xl border border-emerald-100 space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Produce ({joinQty} kg @ ₹{poolPrice}/kg)</span>
                    <span className="font-semibold text-gray-800">₹{produceTotal.toFixed(2)}</span>
                  </div>

                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Doorstep Delivery Fee</span>
                      <span className="font-semibold text-gray-800">₹{deliveryFee.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-2 border-t border-emerald-200/60">
                    <div>
                      <span className="text-xs font-bold text-emerald-900">Total Payable:</span>
                      <p className="text-[10px] text-emerald-600">Pay on pickup/delivery (Cash/UPI)</p>
                    </div>
                    <span className="text-2xl font-black text-emerald-800">
                      ₹{finalTotal.toFixed(2)}
                    </span>
                  </div>

                  {estimatedSavings > 0 && (
                    <div className="pt-1 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <span>✨</span>
                      <span>You save ~₹{estimatedSavings.toFixed(0)} vs local retail mandi price!</span>
                    </div>
                  )}
                </div>

                {/* Form Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || joinQty <= 0}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    {submitting ? 'Reserving...' : `Confirm (${joinQty} kg)`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* VIEW MEMBERS MODAL */}
      {showMembersModal && membersPool && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-emerald-100">
            <div className="bg-emerald-800 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{membersPool.crop_name} Pool Members</h3>
                <p className="text-xs text-emerald-200">
                  {membersPool.current_kg} of {membersPool.target_kg} kg collected
                </p>
              </div>
              <button
                onClick={() => setShowMembersModal(false)}
                className="text-white text-xl font-light w-8 h-8 flex items-center justify-center"
              >
                &times;
              </button>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              {loadingMembers ? (
                <div className="py-8 text-center text-xs text-gray-500">Loading society participants...</div>
              ) : poolMembers.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500">No members have joined this pool yet.</div>
              ) : (
                poolMembers.map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                    <div>
                      <span className="font-bold text-gray-800">{m.consumer_name}</span>
                      <p className="text-[11px] text-gray-400">{m.delivery_type}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-700 text-sm">{m.quantity_kg} kg</span>
                      <p className="text-[11px] text-gray-500">₹{m.total_price || (m.quantity_kg * membersPool.price_per_kg).toFixed(0)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t text-right">
              <button
                onClick={() => setShowMembersModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
