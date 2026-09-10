import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CROP_PRESETS, getCropDetails } from '../../utils/cropData';
import Toast from '../../components/Toast';
import PoolCard from '../../components/PoolCard';

export default function ManagePools() {
  const { user } = useAuth();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Form state
  const defaultCrop = CROP_PRESETS[0];
  const [formData, setFormData] = useState({
    crop_name: defaultCrop.name,
    target_kg: defaultCrop.defaultTargetKg,
    price_per_kg: defaultCrop.suggestedPoolPrice,
    discount_percent: 15,
    description: defaultCrop.description,
    deadline: getDefaultDeadline(3) // 3 days ahead
  });

  // Manifest modal state
  const [selectedPoolForManifest, setSelectedPoolForManifest] = useState(null);
  const [manifestMembers, setManifestMembers] = useState([]);
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  function getDefaultDeadline(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 16);
  }

  const fetchPools = async () => {
    if (!user?.society_id) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`http://localhost:4000/api/pools/society/${user.society_id}`);
      if (res.ok) {
        const data = await res.json();
        setPools(data);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error fetching pools', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, [user]);

  // Apply preset
  const applyPreset = (preset) => {
    const discount = Math.round(((preset.benchmarkMandiPrice - preset.suggestedPoolPrice) / preset.benchmarkMandiPrice) * 100);
    setFormData({
      crop_name: preset.name,
      target_kg: preset.defaultTargetKg,
      price_per_kg: preset.suggestedPoolPrice,
      discount_percent: Math.max(5, discount),
      description: preset.description,
      deadline: formData.deadline || getDefaultDeadline(3)
    });
    setToast({ message: `Applied ${preset.name} preset!`, type: 'info' });
  };

  const handleCreatePool = async (e) => {
    e.preventDefault();
    if (!formData.crop_name || !formData.target_kg || !formData.price_per_kg) {
      setToast({ message: 'Please complete all required fields', type: 'error' });
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/api/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          society_id: user.society_id || 1,
          lead_id: user.id
        })
      });

      if (!res.ok) throw new Error('Failed to create pool');
      setToast({ message: `🎉 Pool for ${formData.crop_name} created successfully!`, type: 'success' });
      fetchPools();

      // Reset to next default
      applyPreset(CROP_PRESETS[1] || defaultCrop);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error creating pool', type: 'error' });
    }
  };

  const handleUpdateStatus = async (poolId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:4000/api/pools/${poolId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update pool status');
      setToast({ message: `Pool status updated to ${newStatus}`, type: 'success' });
      fetchPools();
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error updating pool status', type: 'error' });
    }
  };

  const openManifestModal = async (pool) => {
    setSelectedPoolForManifest(pool);
    setLoadingManifest(true);
    setCopySuccess(false);
    try {
      const res = await fetch(`http://localhost:4000/api/pools/${pool.id}/members`);
      if (res.ok) {
        setManifestMembers(await res.json());
      } else {
        setManifestMembers([]);
      }
    } catch (err) {
      console.error(err);
      setManifestMembers([]);
    } finally {
      setLoadingManifest(false);
    }
  };

  const copyManifestText = () => {
    if (!selectedPoolForManifest || manifestMembers.length === 0) return;
    const lines = [
      `📦 KISANDIRECT GATE PICKUP MANIFEST`,
      `Society: ${user?.society_name || 'Society Hub'}`,
      `Crop: ${selectedPoolForManifest.crop_name} (Total: ${selectedPoolForManifest.current_kg} kg)`,
      `Status: ${selectedPoolForManifest.status}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `----------------------------------------`,
      ...manifestMembers.map((m, i) => `${i + 1}. ${m.consumer_name} (${m.consumer_phone || 'No phone'}) - ${m.quantity_kg}kg [${m.delivery_type}] - ₹${m.total_price || (m.quantity_kg * selectedPoolForManifest.price_per_kg).toFixed(0)}`),
      `----------------------------------------`,
      `Total Participants: ${manifestMembers.length}`
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // Filter pools
  const filteredPools = pools.filter(p => {
    if (activeTab === 'open') return p.status === 'Open';
    if (activeTab === 'locked') return p.status === 'Locked';
    if (activeTab === 'fulfilled') return p.status === 'Fulfilled';
    return true;
  });

  const previewPoolObject = {
    id: 9999,
    crop_name: formData.crop_name,
    target_kg: Number(formData.target_kg) || 100,
    current_kg: 0,
    price_per_kg: Number(formData.price_per_kg) || 20,
    discount_percent: Number(formData.discount_percent) || 10,
    description: formData.description,
    deadline: formData.deadline,
    status: 'Open'
  };

  const activeCropMeta = getCropDetails(formData.crop_name);
  const calculatedSavings = Math.max(0, ((activeCropMeta.benchmarkMandiPrice - formData.price_per_kg) * formData.target_kg));

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 md:p-8 rounded-3xl shadow-lg border border-emerald-700/50">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold mb-2">
            <span>👑</span>
            <span>Community Lead Portal • {user?.society_name || 'Society Hub'}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Society Group Pool Creator & Management
          </h1>
          <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
            Launch bulk wholesale harvest pools for your residents, track aggregate weight in real-time, generate gate pickup manifests, and lock orders for refrigerated farm dispatch.
          </p>
        </div>

        <div className="flex gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
            <span className="block text-2xl font-black text-white">{pools.filter(p => p.status === 'Open').length}</span>
            <span className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">Active Pools</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
            <span className="block text-2xl font-black text-amber-300">
              {pools.reduce((acc, p) => acc + Number(p.current_kg || 0), 0).toFixed(0)} kg
            </span>
            <span className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">Total Volume</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: CREATE NEW POOL WITH LIVE PREVIEW */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <span>🚀</span> Create New Community Pool
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Pick a produce preset below or customize the target volume and wholesale rate.
            </p>
          </div>

          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            Estimated Society Savings: ~₹{calculatedSavings.toFixed(0)}
          </span>
        </div>

        {/* Quick Produce Presets */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
            Quick Harvest Presets (1-Click Fill)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {CROP_PRESETS.slice(0, 6).map(preset => {
              const isSelected = formData.crop_name.toLowerCase() === preset.name.toLowerCase();
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-gray-200 bg-gray-50/50 hover:bg-emerald-50/30 hover:border-emerald-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">{preset.emoji}</span>
                  <p className="text-xs font-bold text-gray-900">{preset.name}</p>
                  <p className="text-[11px] text-emerald-700 font-semibold">₹{preset.suggestedPoolPrice}/kg</p>
                  <span className="text-[10px] text-gray-400">Target: {preset.defaultTargetKg}kg</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Split screen: Form on left, Live Card Preview on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
          {/* Form */}
          <form onSubmit={handleCreatePool} className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Crop Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.crop_name}
                  onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                  placeholder="e.g. Tomato, Onion, Mango"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Target Weight (KG) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="10"
                    step="1"
                    value={formData.target_kg}
                    onChange={(e) => setFormData({ ...formData, target_kg: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">
                    KG
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Pool Price per KG (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    step="0.5"
                    min="1"
                    value={formData.price_per_kg}
                    onChange={(e) => setFormData({ ...formData, price_per_kg: Number(e.target.value) })}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Benchmark retail mandi rate: ₹{activeCropMeta.benchmarkMandiPrice}/kg
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Discount vs Retail (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="90"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Deadline Presets */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Pool Deadline / Closing Time *
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  { label: '24h Flash', days: 1 },
                  { label: '48h Weekend', days: 2 },
                  { label: '3 Days', days: 3 },
                  { label: '1 Week', days: 7 }
                ].map(d => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => setFormData({ ...formData, deadline: getDefaultDeadline(d.days) })}
                    className="px-3 py-1 text-xs font-semibold rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <input
                type="datetime-local"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Description / Farm Origin Notes
              </label>
              <textarea
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Directly harvested from organic certified farm in Meerut. Gate pickup on Saturday."
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl font-extrabold text-white text-base bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/25 active:scale-[0.99] transition-all"
            >
              Publish Community Pool to {user?.society_name || 'Society'}
            </button>
          </form>

          {/* Right Column: Live Consumer Preview */}
          <div className="lg:col-span-5 bg-gradient-to-br from-gray-50 to-emerald-50/40 p-5 rounded-3xl border border-emerald-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Member View Preview
              </span>
              <span className="text-[11px] text-gray-500 font-medium">How buyers see it</span>
            </div>

            <div className="max-w-sm mx-auto shadow-md rounded-2xl">
              <PoolCard pool={previewPoolObject} onJoin={() => {}} />
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs text-emerald-800 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <span>💡</span> Lead Advisory Tip
              </p>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                Wholesale bulk dispatch unlocks when 100% target is reserved. Once met, you can lock the pool and generate the Gate Delivery Manifest.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: EXISTING POOLS MANAGEMENT */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <span>📋</span> Society Pools Roster & Control
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Inspect orders, lock target-met pools, and download security gate manifests.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {[
              { id: 'all', label: 'All Pools' },
              { id: 'open', label: '⚡ Active' },
              { id: 'locked', label: '🔒 Locked' },
              { id: 'fulfilled', label: '✅ Fulfilled' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading society pools...</div>
        ) : filteredPools.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl">
            No pools found for this filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPools.map(pool => {
              const currentKg = Number(pool.current_kg || 0);
              const targetKg = Number(pool.target_kg || 100);
              const progress = Math.min(100, Math.round((currentKg / targetKg) * 100));
              const isTargetMet = currentKg >= targetKg;
              const cropMeta = getCropDetails(pool.crop_name);

              return (
                <div
                  key={pool.id}
                  className="p-5 rounded-2xl border border-gray-200/90 bg-white hover:border-emerald-300 transition-all space-y-4 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl shrink-0">
                        {cropMeta.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {pool.crop_name}
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                            pool.status === 'Open'
                              ? 'bg-emerald-100 text-emerald-800'
                              : pool.status === 'Locked'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {pool.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          ₹{pool.price_per_kg}/kg wholesale rate • {pool.discount_percent}% discount • Closes: {new Date(pool.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => openManifestModal(pool)}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                      >
                        <span>📋</span>
                        <span>Manifest & Members</span>
                      </button>

                      {pool.status === 'Open' && (
                        <button
                          onClick={() => handleUpdateStatus(pool.id, 'Locked')}
                          className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors"
                        >
                          🔒 Lock Pool
                        </button>
                      )}

                      {pool.status === 'Locked' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(pool.id, 'Fulfilled')}
                            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                          >
                            ✅ Mark Fulfilled & Delivered
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(pool.id, 'Open')}
                            className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            Re-Open
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-gray-700">
                        {currentKg} / {targetKg} kg collected
                      </span>
                      <span className="text-emerald-700 font-bold">{progress}% Target</span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden p-0.5 border border-gray-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isTargetMet ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(3, progress))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MANIFEST & MEMBERS MODAL */}
      {selectedPoolForManifest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-emerald-100">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 flex justify-between items-start">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                  Society Security Gate & Clubhouse Pickup Pass
                </span>
                <h3 className="text-xl font-extrabold mt-1">
                  {selectedPoolForManifest.crop_name} Delivery Manifest
                </h3>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  Total Collected: {selectedPoolForManifest.current_kg} kg • Wholesale Rate: ₹{selectedPoolForManifest.price_per_kg}/kg
                </p>
              </div>
              <button
                onClick={() => setSelectedPoolForManifest(null)}
                className="text-white/80 hover:text-white text-2xl font-light w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase">
                  Joined Residents ({manifestMembers.length})
                </span>
                <button
                  onClick={copyManifestText}
                  disabled={manifestMembers.length === 0}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-xl hover:bg-emerald-200 transition-colors flex items-center gap-1"
                >
                  {copySuccess ? '✓ Copied to Clipboard!' : '📋 Copy Gate Manifest Text'}
                </button>
              </div>

              {loadingManifest ? (
                <div className="py-12 text-center text-xs text-gray-500">Loading society member orders...</div>
              ) : manifestMembers.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  No residents have joined this pool yet.
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2 border border-gray-100 rounded-2xl p-2 bg-gray-50/50">
                  {manifestMembers.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-white border border-gray-200/80 gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <strong className="text-gray-900">{m.consumer_name}</strong>
                          <span className="text-[10px] text-gray-500">
                            📞 {m.consumer_phone || '9812345670'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 ml-7">
                          Method: <strong>{m.delivery_type}</strong> • {m.consumer_address || 'Flat in society'}
                        </p>
                      </div>

                      <div className="text-right ml-7 sm:ml-0">
                        <span className="font-extrabold text-sm text-emerald-800">
                          {m.quantity_kg} kg
                        </span>
                        <p className="text-[11px] text-gray-600 font-semibold">
                          ₹{m.total_price || (m.quantity_kg * selectedPoolForManifest.price_per_kg).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={() => setSelectedPoolForManifest(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100"
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
