import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const PriceChecker = ({ crop: initialCrop = '' }) => {
  const { t } = useTranslation();
  const [crop, setCrop] = useState(initialCrop);
  const [prices, setPrices] = useState([]);
  const [recommended, setRecommended] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cropsList = [
    'Tomato', 'Onion', 'Potato', 'Cauliflower', 'Spinach', 
    'Cabbage', 'Wheat', 'Rice', 'Mango', 'Banana', 
    'Carrot', 'Brinjal', 'Okra', 'Peas'
  ];

  useEffect(() => {
    if (crop) {
      fetchPrices();
    }
  }, [crop]);

  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch market prices
      const priceRes = await fetch(`http://localhost:4000/api/prices/${crop}`);
      if (!priceRes.ok) throw new Error('Failed to fetch prices');
      const priceData = await priceRes.json();
      setPrices(priceData);

      // Fetch recommended price
      const recRes = await fetch(`http://localhost:4000/api/prices/recommend/${crop}?grade=A&quantity=100`);
      if (recRes.ok) {
        const recData = await recRes.json();
        setRecommended(recData);
      }
    } catch (err) {
      console.error(err);
      setError(t('priceChecker.errorFetch'));
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up': return <span className="text-green-500 font-bold">↑</span>;
      case 'down': return <span className="text-red-500 font-bold">↓</span>;
      default: return <span className="text-gray-500 font-bold">-</span>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('priceChecker.title')}</h2>
      
      <div className="mb-6">
        <label htmlFor="crop-select" className="block text-sm font-medium text-gray-700 mb-2">{t('priceChecker.selectCropLabel')}</label>
        <select
          id="crop-select"
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          className="w-full md:w-1/2 p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500 bg-white"
        >
          <option value="">{t('priceChecker.selectCropPlaceholder')}</option>
          {cropsList.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {!loading && crop && prices.length > 0 && (
        <div className="space-y-6">
          {recommended && (
            <div className="bg-green-50 border border-green-200 rounded p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-green-800 font-medium uppercase">{t('priceChecker.recommendedTitle')}</p>
                <p className="text-3xl font-bold text-green-700">₹{recommended.recommended_price || recommended.price}/kg</p>
<p className="text-sm text-green-600 mt-1">{recommended.reasoning || recommended.reason}</p>
</div>
              <div className="hidden sm:block">
                <span className="text-5xl">💡</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('priceChecker.marketCol')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('priceChecker.minCol')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('priceChecker.maxCol')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('priceChecker.modalCol')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('priceChecker.trendCol')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prices.map((p, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.market_name || p.market}</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.min_price || p.min}</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.max_price || p.max}</td>
<td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{p.modal_price || p.modal}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{getTrendIcon(p.trend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceChecker;
