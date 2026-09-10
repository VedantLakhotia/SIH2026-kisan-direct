import React from 'react';
import { getCropDetails } from '../utils/cropData';

export default function PoolCard({ pool, onJoin, onViewMembers }) {
  const crop_name = pool.crop_name || 'Produce';
  const target_kg = Number(pool.target_kg || pool.target_quantity_kg || 100);
  const current_kg = Number(pool.current_kg || pool.current_quantity_kg || 0);
  const price_per_kg = Number(pool.price_per_kg || pool.base_price || 25);
  const discount_percent = Number(pool.discount_percent || pool.discount_percentage || 10);
  const status = pool.status || 'Open';
  const deadline = pool.deadline;

  const cropMeta = getCropDetails(crop_name);
  const retailPrice = Number(cropMeta.benchmarkMandiPrice || (price_per_kg / (1 - (discount_percent / 100)))).toFixed(0);
  const perKgSavings = Math.max(1, (retailPrice - price_per_kg)).toFixed(0);

  const rawProgress = (current_kg / target_kg) * 100;
  const progress = Math.min(100, Math.round(rawProgress));
  const remainingKg = Math.max(0, target_kg - current_kg);
  const isComplete = current_kg >= target_kg;
  const isLocked = status.toLowerCase() === 'locked';
  const isFulfilled = status.toLowerCase() === 'fulfilled';
  const isCancelled = status.toLowerCase() === 'cancelled';
  const isOpen = status.toLowerCase() === 'open' && !isComplete;

  // Countdown calculations
  let countdownText = 'Ongoing';
  let isUrgent = false;
  if (deadline) {
    const diff = new Date(deadline) - new Date();
    if (diff <= 0) {
      countdownText = 'Ended';
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      if (days > 0) {
        countdownText = `${days}d ${hours}h left`;
      } else if (hours > 0) {
        countdownText = `${hours}h ${minutes}m left`;
        isUrgent = true;
      } else {
        countdownText = `${minutes}m left`;
        isUrgent = true;
      }
    }
  }

  const getStatusBadge = () => {
    if (isFulfilled) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Fulfilled & Dispatched
        </span>
      );
    }
    if (isLocked || isComplete) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Locked (Target Met)
        </span>
      );
    }
    if (isCancelled) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800">
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        Active Pool
      </span>
    );
  };

  return (
    <div className="group bg-white rounded-2xl border border-emerald-100/80 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Top Banner Image with Visual Badges */}
      <div className="relative h-44 w-full overflow-hidden bg-emerald-950/5">
        <img
          src={cropMeta.image}
          alt={crop_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white/95 backdrop-blur-md text-emerald-800 shadow-sm flex items-center gap-1">
            <span className="text-base">{cropMeta.emoji}</span>
            <span>{cropMeta.category}</span>
          </span>

          <span className="px-3 py-1 text-xs font-extrabold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md">
            {discount_percent}% OFF RETAIL
          </span>
        </div>

        {/* Crop Title & Subtitle overlayed on image */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight drop-shadow-sm">
                {crop_name} Community Pool
              </h3>
              <p className="text-xs text-emerald-100/90 line-clamp-1">
                {pool.description || cropMeta.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Pricing comparison */}
        <div className="flex items-baseline justify-between bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-800">
                ₹{price_per_kg}
              </span>
              <span className="text-xs font-semibold text-emerald-700">/ kg</span>
              <span className="text-xs text-gray-400 line-through">
                ₹{retailPrice}/kg
              </span>
            </div>
            <p className="text-[11px] font-medium text-emerald-600">
              You save ₹{perKgSavings}/kg directly from farm
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-900 rounded-md">
              Target: {target_kg} kg
            </span>
          </div>
        </div>

        {/* Progress Section */}
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span className="text-gray-700 flex items-center gap-1">
              <span>Collected:</span>
              <strong className="text-emerald-700">{current_kg} kg</strong>
            </span>
            <span className="text-emerald-800 font-bold">{progress}% met</span>
          </div>

          {/* Progress bar with milestone indicators */}
          <div className="relative w-full bg-gray-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-gray-200/70">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isComplete
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(4, progress))}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-gray-500 mt-1.5">
            <span>
              {isComplete ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  ✓ Minimum bulk order unlocked!
                </span>
              ) : (
                <span>
                  Only <strong className="text-gray-700">{remainingKg} kg</strong> more needed
                </span>
              )}
            </span>

            <span className="text-gray-400">
              Goal: {target_kg} kg
            </span>
          </div>
        </div>

        {/* Info Strip: Timer & Status */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-sm">⏱️</span>
            <span
              className={`font-semibold ${
                isUrgent ? 'text-amber-700 animate-pulse' : 'text-gray-600'
              }`}
            >
              {countdownText}
            </span>
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-4 pt-0 bg-white">
        {isOpen ? (
          <button
            onClick={() => onJoin && onJoin(pool)}
            className="w-full py-3 px-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>Join Community Pool</span>
            <span className="text-base">🤝</span>
          </button>
        ) : isComplete || isLocked ? (
          <div className="flex gap-2">
            <button
              disabled
              className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs bg-amber-50 text-amber-800 border border-amber-200 cursor-not-allowed text-center"
            >
              🔒 Target Reached — Dispatching Soon
            </button>
            {onViewMembers && (
              <button
                onClick={() => onViewMembers(pool)}
                className="py-2.5 px-3 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                title="View Members"
              >
                Members
              </button>
            )}
          </div>
        ) : (
          <button
            disabled
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-gray-100 text-gray-400 cursor-not-allowed"
          >
            Pool Closed
          </button>
        )}
      </div>
    </div>
  );
}
