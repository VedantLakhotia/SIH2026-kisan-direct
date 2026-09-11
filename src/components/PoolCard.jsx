import React from 'react';

const PoolCard = ({ pool, onJoin }) => {
  const { 
    crop_name, 
    target_quantity_kg, 
    current_quantity_kg, 
    discount_percentage, 
    deadline, 
    status,
    base_price
  } = pool;

  const progress = Math.min(100, Math.round((current_quantity_kg / target_quantity_kg) * 100));
  const isComplete = current_quantity_kg >= target_quantity_kg;
  const isOpen = status.toLowerCase() === 'open' && !isComplete;
  
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const timeDiff = deadlineDate - now;
  
  let countdownText = "Expired";
  if (timeDiff > 0) {
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
    if (days > 0) {
      countdownText = `${days}d ${hours}h left`;
    } else {
      countdownText = `${hours}h left`;
    }
  }

  const getStatusBadge = () => {
    if (status.toLowerCase() === 'completed' || isComplete) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completed</span>;
    }
    if (status.toLowerCase() === 'open') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Open</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
  };

  const CROP_IMAGES = {
    'Tomato': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80',
    'Tomatoes': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80',
    'Potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80',
    'Onion': 'https://images.unsplash.com/photo-1620574387735-3624d75b2dbc?w=500&q=80',
    'Cauliflower': 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=500&q=80',
    'Banana': 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=500&q=80',
    'Spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80',
    'Cabbage': 'https://images.unsplash.com/photo-1596199050105-6d5d32222916?w=500&q=80',
    'Rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80'
  };

  const getImageUrl = () => {
    return CROP_IMAGES[crop_name] || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500&q=80';
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col h-full">
      <div className="relative h-32 bg-gray-200">
        <img src={getImageUrl()} alt={crop_name} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2">
          <span className="inline-block bg-orange-500 text-white shadow text-sm font-bold px-3 py-1 rounded-full">
            {discount_percentage}% OFF
          </span>
        </div>
      </div>
      <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{crop_name} Pool</h3>
          <p className="text-sm text-gray-500 mt-1">₹{base_price}/kg Base Price</p>
        </div>
      </div>
      
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">Progress</span>
            <span className="font-medium text-green-700">{current_quantity_kg} / {target_quantity_kg} kg</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${isComplete ? 'bg-green-600' : 'bg-blue-600'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex justify-between">
            <span>{target_quantity_kg - current_quantity_kg > 0 ? `${target_quantity_kg - current_quantity_kg}kg more needed` : 'Target reached!'}</span>
            <span className="font-medium">{progress}%</span>
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center space-x-2">
            <span className="text-xl">⏱️</span>
            <span className={`text-sm font-medium ${timeDiff > 0 && timeDiff < 86400000 ? 'text-red-600' : 'text-gray-600'}`}>
              {countdownText}
            </span>
          </div>
          {getStatusBadge()}
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        {isOpen ? (
          <button 
            onClick={() => onJoin && onJoin(pool)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Join Pool
          </button>
        ) : (
          <button 
            disabled
            className="w-full bg-gray-300 text-gray-500 font-bold py-2 px-4 rounded cursor-not-allowed"
          >
            {isComplete ? 'Pool Full' : 'Pool Closed'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PoolCard;
