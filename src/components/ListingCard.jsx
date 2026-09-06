import React from 'react';

const ListingCard = ({ listing, onBuy }) => {
  const { 
    id,
    crop_name, 
    quantity_kg, 
    price_per_kg, 
    grade, 
    organic_cert, 
    harvest_date, 
    farmer_name,
    photo_url
  } = listing;

  const getGradeBadge = (g) => {
    switch(g?.toUpperCase()) {
      case 'A': return <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">Grade A</span>;
      case 'B': return <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">Grade B</span>;
      case 'C': return <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">Grade C</span>;
      default: return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded">Grade {g}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-gray-200">
        {photo_url ? (
          <img src={photo_url} alt={crop_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-green-50 text-green-800 text-4xl">
            🌾
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          {getGradeBadge(grade)}
          {organic_cert && (
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm text-center">
              Organic
            </span>
          )}
        </div>
      </div>
      
      <div className="p-4 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-800">{crop_name}</h3>
          <span className="text-xl font-extrabold text-green-700">₹{price_per_kg}/kg</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 font-medium">Available: {quantity_kg} kg</p>
        
        <div className="mt-auto space-y-2 text-sm text-gray-500">
          <div className="flex items-center">
            <span className="mr-2">📅</span> Harvested: {formatDate(harvest_date)}
          </div>
          <div className="flex items-center">
            <span className="mr-2">🧑‍🌾</span> Farmer: {farmer_name || 'KisanDirect Farmer'}
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={() => onBuy && onBuy(listing)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default ListingCard;
