import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const PriceChecker = ({ crop: initialCrop = '' }) => {
  const { t } = useTranslation();
  const [crop, setCrop] = useState(initialCrop);
  const [prices, setPrices] = useState([]);
  const [recommended, setRecommended] = useState(null);
  const [forecast, setForecast] = useState(null);
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
      const priceRes = await fetch(`http://localhost:4000/api/prices/${crop}`);
      if (!priceRes.ok) throw new Error('Failed to fetch prices');
      const priceData = await priceRes.json();
      setPrices(priceData);

      const recRes = await fetch(`http://localhost:4000/api/prices/recommend/${crop}?grade=A&quantity=100`);
      if (recRes.ok) {
        const recData = await recRes.json();
        setRecommended(recData);
      }

      const forecastRes = await fetch(`http://localhost:4000/api/demand/forecast/${crop}`);
      if (forecastRes.ok) {
        const forecastData = await forecastRes.json();
        setForecast(forecastData);
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
      default: return <span className="text-gray-500 font-bold">—</span>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('priceChecker.title')}</h2>
      
      <div className="mb-6">
        <label htmlFor="crop-select" className="block text-sm font-medium text-gray-700 mb-2">{t('priceChecker.selectCrop')}</label>
        <select
          id="crop-select"
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          className="w-full md:w-1/2 p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500 bg-white"
        >
          <option value="">{t('priceChecker.selectDefault')}</option>
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

      {error && (
        <div className="text-center py-6">
          <p className="text-red-500 mb-3">{error}</p>
          <button onClick={fetchPrices} className="text-green-600 hover:underline font-medium">{t('common.retry')}</button>
        </div>
      )}

      {!loading && !error && crop && prices.length === 0 && (
        <p className="text-gray-500 text-center py-6">{t('priceChecker.noData')}</p>
      )}

      {!loading && crop && prices.length > 0 && (
        <div className="space-y-6">
          {recommended && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-green-800 font-medium uppercase">{t('priceChecker.recommendedPrice')}</p>
                <p className="text-3xl font-bold text-green-700">₹{recommended.recommended_price || recommended.price}/kg</p>
                <p className="text-sm text-green-600 mt-1">{recommended.reasoning || recommended.reason}</p>
              </div>
            </div>
          )}

          {forecast && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <h3 className="font-bold text-blue-800 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                <span>AI Demand Forecast</span>
              </h3>
              <p className="text-sm text-blue-900 mt-2">{forecast.forecast}</p>
            </div>
          )}

          <div className="overflow-x-auto mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('priceChecker.market')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('priceChecker.min')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('priceChecker.max')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('priceChecker.modal')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('priceChecker.trend')}</th>
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
