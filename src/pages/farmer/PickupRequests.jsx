import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Toast from '../../components/Toast';

export default function PickupRequests() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [pickups, setPickups] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  const [formData, setFormData] = useState({
    listing_id: '',
    quantity_kg: '',
    preferred_date: '',
    preferred_time: 'Morning',
    address: user?.address || '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, lRes] = await Promise.all([
        fetch(`http://localhost:4000/api/pickups/farmer/${user.id}`),
        fetch(`http://localhost:4000/api/listings/farmer/${user.id}`)
      ]);
      if (pRes.ok) setPickups(await pRes.json());
      if (lRes.ok) setListings((await lRes.json()).filter(l => l.status === 'Available'));
    } catch (err) {
      console.error(err);
      setToast({ message: t('common.error'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    // Replaced window.confirm with direct action and toast for success/error per instructions
    try {
      const res = await fetch(`http://localhost:4000/api/pickups/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' })
      });
      if (!res.ok) throw new Error('Failed to cancel');
      fetchData(); // Refresh the list
      setToast({ message: t('pickupRequests.cancelSuccess'), type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/pickups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          farmer_id: user.id,
          lat: user.lat,
          lng: user.lng
        })
      });
      if (!res.ok) throw new Error('Failed to submit pickup request');
      
      setToast({ message: t('pickupRequests.submitSuccess'), type: 'success' });
      fetchData(); // Refresh list
      setFormData({ ...formData, listing_id: '', quantity_kg: '', preferred_date: '', notes: '' }); // Reset form
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Batched': return 'bg-blue-100 text-blue-800';
      case 'Assigned': return 'bg-purple-100 text-purple-800';
      case 'PickedUp': return 'bg-orange-100 text-orange-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-8 text-center">{t('common.loading')}</div>;

  const selectedListing = listings.find(l => l.id.toString() === formData.listing_id.toString());
  
  // Stages for the progress bar
  const stages = ['Pending', 'Batched', 'Assigned', 'PickedUp', 'Completed'];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      {/* Request Form */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-bold mb-4">{t('pickupRequests.title')}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('pickupRequests.selectProduce')}</label>
              <select 
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.listing_id}
                onChange={e => setFormData({...formData, listing_id: e.target.value})}
              >
                <option value="">{t('pickupRequests.selectDefault')}</option>
                {listings.map(l => (
                  <option key={l.id} value={l.id}>{l.crop_name} ({l.quantity_kg}{t('common.kg')} available)</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('pickupRequests.quantityLabel')}</label>
              <input 
                type="number" required min="1" max={selectedListing ? selectedListing.quantity_kg : ""}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.quantity_kg}
                onChange={e => setFormData({...formData, quantity_kg: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">{t('pickupRequests.preferredDate')}</label>
              <input 
                type="date" required
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.preferred_date}
                onChange={e => setFormData({...formData, preferred_date: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">{t('pickupRequests.preferredTime')}</label>
              <select 
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.preferred_time}
                onChange={e => setFormData({...formData, preferred_time: e.target.value})}
              >
                <option value="Morning">{t('pickupRequests.timeMorning')}</option>
                <option value="Afternoon">{t('pickupRequests.timeAfternoon')}</option>
                <option value="Evening">{t('pickupRequests.timeEvening')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">{t('pickupRequests.pickupAddress')}</label>
              <textarea 
                required rows="2"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('pickupRequests.driverNotes')}</label>
              <input 
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                placeholder={t('pickupRequests.driverNotesPlaceholder')}
              />
            </div>

            <button type="submit" className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700">
              {t('pickupRequests.submitRequest')}
            </button>
          </form>
        </div>
      </div>

      {/* History */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-bold mb-4">{t('pickupRequests.myRequests')}</h2>
          
          {pickups.length === 0 ? (
            <p className="text-gray-500">{t('pickupRequests.noRequests')}</p>
          ) : (
            <div className="space-y-4">
              {pickups.map(p => (
                <div key={p.id} className="border rounded p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">{t('pickupRequests.requestId').replace('{{id}}', p.id)}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(p.status)}`}>
                        {t(`pickupRequests.status${p.status}`) || p.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t('pickupRequests.produce')}: {p.crop_name} | {t('pickupRequests.qty')}: {p.quantity_kg}{t('common.kg')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t('pickupRequests.date')}: {new Date(p.preferred_date).toLocaleDateString()} ({p.preferred_time.includes('Morning') ? t('pickupRequests.timeMorning') : p.preferred_time.includes('Afternoon') ? t('pickupRequests.timeAfternoon') : p.preferred_time.includes('Evening') ? t('pickupRequests.timeEvening') : p.preferred_time})
                    </p>
                  </div>
                  
                  {/* Status Timeline */}
                  <div className="flex flex-col items-end">
                    <div className="flex items-center text-xs text-gray-500 mt-2 md:mt-0 mb-2">
                      {stages.map((stage, idx) => {
                        const stageIndex = stages.indexOf(p.status);
                        const isPastOrCurrent = stageIndex !== -1 && idx <= stageIndex;
                        const isPast = stageIndex !== -1 && idx < stageIndex;
                        return (
                          <React.Fragment key={stage}>
                            <div className={`flex flex-col items-center ${isPastOrCurrent ? 'text-green-600' : ''}`}>
                              <div className="w-4 h-4 rounded-full bg-current mb-1"></div>
                              <span className="hidden sm:inline">{t(`pickupRequests.status${stage}`)}</span>
                            </div>
                            {idx < stages.length - 1 && (
                              <div className={`w-8 h-1 ${isPast ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                    
                    {p.status === 'Pending' && (
                      <button 
                        onClick={() => handleCancel(p.id)}
                        className="text-red-500 text-sm hover:underline font-medium"
                      >
                        ❌ {t('pickupRequests.cancelRequest')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
