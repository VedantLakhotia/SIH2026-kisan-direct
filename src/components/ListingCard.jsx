import React from 'react';
import { getCropDetails } from '../utils/cropData';

export default function ListingCard({ listing, onBuy }) {
  const {
    crop_name,
    quantity_kg,
    price_per_kg,
    grade,
    organic_cert,
    harvest_date,
    farmer_name,
    photo_url,
    description
  } = listing;

  const cropMeta = getCropDetails(crop_name);
  const imageSrc = photo_url || cropMeta.image;

  const getGradeBadge = (g) => {
    switch (g?.toUpperCase()) {
      case 'A':
        return (
          <span className="bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
            <span>⭐ Grade A</span>
          </span>
        );
      case 'B':
        return (
          <span className="bg-amber-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm">
            Grade B (Standard)
          </span>
        );
      case 'C':
        return (
          <span className="bg-orange-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm">
            Grade C (Economy)
          </span>
        );
      default:
        return (
          <span className="bg-emerald-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm">
            Grade {g || 'A'}
          </span>
        );
    }
  };

  const formatHarvestDate = (dateString) => {
    if (!dateString) return 'Fresh Harvest';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Harvested Today 🌱';
    if (diffDays === 1) return 'Harvested Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Produce Image with Tags */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        <img
          src={imageSrc}
          alt={crop_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <div className="flex flex-col gap-1.5">
            {getGradeBadge(grade)}
            {organic_cert && (
              <span className="bg-green-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1 w-fit">
                <span>🍃</span>
                <span>100% Organic</span>
              </span>
            )}
          </div>

          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white/95 backdrop-blur-md text-gray-800 shadow-sm">
            {cropMeta.emoji} {cropMeta.category}
          </span>
        </div>

        {/* Harvest Date Tag at bottom of photo */}
        <div className="absolute bottom-2.5 left-3 right-3 flex justify-between items-center text-white text-xs">
          <span className="font-semibold text-emerald-200 bg-black/40 backdrop-blur-sm px-2.5 py-0.5 rounded-md">
            {formatHarvestDate(harvest_date)}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
              {crop_name}
            </h3>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-700">
                ₹{price_per_kg}
              </span>
              <span className="text-xs font-bold text-gray-500">/kg</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
            {description || cropMeta.description}
          </p>
        </div>

        {/* Farmer info and stock bar */}
        <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
          <div className="flex items-center justify-between text-gray-600">
            <span className="flex items-center gap-1.5 font-medium">
              <span>🧑‍🌾</span>
              <span>{farmer_name || 'KisanDirect Farm Partner'}</span>
            </span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
              {quantity_kg} kg available
            </span>
          </div>
        </div>
      </div>

      {/* Buy Action Button */}
      <div className="p-4 pt-0 bg-white">
        <button
          onClick={() => onBuy && onBuy(listing)}
          className="w-full py-3 px-4 rounded-xl font-extrabold text-white text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <span>Buy Direct from Farm</span>
          <span>🛒</span>
        </button>
      </div>
    </div>
  );
}
