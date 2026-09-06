import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import VoiceRecorder from '../../components/VoiceRecorder';
import PriceChecker from '../../components/PriceChecker';
import Toast from '../../components/Toast';

const CreateListing = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('form'); // form or voice
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPriceCheck, setShowPriceCheck] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [formData, setFormData] = useState({
    crop_name: '',
    quantity_kg: '',
    price_per_kg: '',
    grade: 'A',
    harvest_date: new Date().toISOString().split('T')[0],
    organic_cert: false,
    description: ''
  });

  const crops = [
    'Tomato', 'Onion', 'Potato', 'Cauliflower', 'Spinach', 
    'Cabbage', 'Wheat', 'Rice', 'Mango', 'Banana',
    'Garlic', 'Peas', 'Chilli', 'Brinjal', 'Okra', 'Carrot', 'Sugarcane'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleVoiceResult = (parsedData) => {
    setFormData(prev => ({
      ...prev,
      crop_name: parsedData.crop || prev.crop_name,
      quantity_kg: parsedData.quantity || prev.quantity_kg,
      price_per_kg: parsedData.price || prev.price_per_kg,
      grade: parsedData.grade || prev.grade
    }));
    setMode('form'); // switch to form to review
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create FormData if we had file uploads, but we'll use JSON for simplicity here
      const submitData = {
        ...formData,
        farmer_id: user?.id || 1,
        status: 'Available'
      };

      const response = await fetch('http://localhost:4000/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) throw new Error('Failed to create listing');
      
      setSuccess(true);
      setShowPriceCheck(true);
      
    } catch (err) {
      console.error(err);
      setToast({ message: t('createListing.createError') + ' ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (success && !showPriceCheck) {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-md text-center border-t-4 border-green-500">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('createListing.successTitle')}</h2>
        <p className="text-gray-600 mb-6">{t('createListing.successSubtitle')}</p>
        <div className="space-x-4">
          <button onClick={() => navigate('/farmer/listings')} className="bg-green-600 text-white px-6 py-2 rounded-md font-medium hover:bg-green-700">
            {t('createListing.viewListings')}
          </button>
          <button onClick={() => { setSuccess(false); setFormData({...formData, crop_name: '', quantity_kg: '', price_per_kg: ''}) }} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md font-medium hover:bg-gray-300">
            {t('createListing.addAnother')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('createListing.title')}</h1>

      {showPriceCheck ? (
        <div className="space-y-6">
          <div className="bg-green-50 p-4 rounded border border-green-200 mb-6">
            <h3 className="font-bold text-green-800 flex items-center"><span className="mr-2">✅</span> {t('createListing.savedBanner')}</h3>
            <p className="text-green-700 text-sm mt-1">{t('createListing.priceTip')} ₹{formData.price_per_kg}/kg {t('createListing.priceTipEnd')}</p>
          </div>
          <PriceChecker crop={formData.crop_name} />
          <div className="flex justify-end space-x-4">
            <button onClick={() => setShowPriceCheck(false)} className="text-green-600 hover:underline">{t('createListing.editListing')}</button>
            <button onClick={() => navigate('/farmer/listings')} className="bg-green-600 text-white px-6 py-2 rounded font-medium">{t('createListing.continueToListings')}</button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button 
              className={`flex-1 py-4 text-center font-medium ${mode === 'form' ? 'bg-green-50 text-green-700 border-b-2 border-green-500' : 'text-gray-500 hover:bg-gray-50'}`}
              onClick={() => setMode('form')}
            >
              📝 {t('createListing.tabForm')}
            </button>
            <button 
              className={`flex-1 py-4 text-center font-medium ${mode === 'voice' ? 'bg-green-50 text-green-700 border-b-2 border-green-500' : 'text-gray-500 hover:bg-gray-50'}`}
              onClick={() => setMode('voice')}
            >
              🎤 {t('createListing.tabVoice')}
            </button>
          </div>

          <div className="p-6">
            {mode === 'voice' ? (
              <div className="py-8">
                <VoiceRecorder onResult={handleVoiceResult} />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('createListing.cropName')} *</label>
                    <select 
                      name="crop_name" 
                      required
                      value={formData.crop_name} 
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">{t('createListing.selectCrop')}</option>
                      {crops.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('createListing.quantity')} *</label>
                    <input 
                      type="number" 
                      name="quantity_kg"
                      required
                      min="1"
                      value={formData.quantity_kg}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                      placeholder={t('createListing.quantityPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('createListing.pricePerKg')} *</label>
                    <input 
                      type="number" 
                      name="price_per_kg"
                      required
                      min="1"
                      value={formData.price_per_kg}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                      placeholder={t('createListing.pricePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('createListing.harvestDate')} *</label>
                    <input 
                      type="date" 
                      name="harvest_date"
                      required
                      value={formData.harvest_date}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('createListing.qualityGrade')} *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`border rounded p-3 cursor-pointer flex flex-col ${formData.grade === 'A' ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-gray-200'}`}>
                      <div className="flex items-center">
                        <input type="radio" name="grade" value="A" checked={formData.grade === 'A'} onChange={handleInputChange} className="text-green-600 focus:ring-green-500 h-4 w-4" />
                        <span className="ml-2 font-bold text-green-800">{t('createListing.gradeA')}</span>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 ml-6">{t('createListing.gradeADesc')}</span>
                    </label>
                    <label className={`border rounded p-3 cursor-pointer flex flex-col ${formData.grade === 'B' ? 'border-yellow-500 bg-yellow-50 ring-1 ring-yellow-500' : 'border-gray-200'}`}>
                      <div className="flex items-center">
                        <input type="radio" name="grade" value="B" checked={formData.grade === 'B'} onChange={handleInputChange} className="text-yellow-600 focus:ring-yellow-500 h-4 w-4" />
                        <span className="ml-2 font-bold text-yellow-800">{t('createListing.gradeB')}</span>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 ml-6">{t('createListing.gradeBDesc')}</span>
                    </label>
                    <label className={`border rounded p-3 cursor-pointer flex flex-col ${formData.grade === 'C' ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-gray-200'}`}>
                      <div className="flex items-center">
                        <input type="radio" name="grade" value="C" checked={formData.grade === 'C'} onChange={handleInputChange} className="text-red-600 focus:ring-red-500 h-4 w-4" />
                        <span className="ml-2 font-bold text-red-800">{t('createListing.gradeC')}</span>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 ml-6">{t('createListing.gradeCDesc')}</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center">
                  <input 
                    id="organic" 
                    type="checkbox" 
                    name="organic_cert"
                    checked={formData.organic_cert}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="organic" className="ml-2 block text-sm text-gray-900">
                    {t('createListing.organicCert')}
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('createListing.descriptionLabel')}</label>
                  <textarea 
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                    placeholder={t('createListing.descriptionPlaceholder')}
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {loading ? t('createListing.publishing') : t('createListing.publish')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateListing;
