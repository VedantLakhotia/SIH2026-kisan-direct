import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Toast from '../../components/Toast';

export default function MyListings() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [editingListing, setEditingListing] = useState(null);
  const [editForm, setEditForm] = useState({ crop_name: '', quantity_kg: '', price_per_kg: '', description: '' });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/listings/farmer/${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch listings');
      const data = await res.json();
      setListings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('myListings.deleteConfirm'))) return;
    try {
      const res = await fetch(`http://localhost:4000/api/listings/${id}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmer_id: user.id })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete');
      }
      
      // Remove the listing from the array
      setListings(prevListings => 
        prevListings.filter(l => l.id !== id)
      );
      setToast({ message: t('myListings.deleteSuccess'), type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleEdit = (listing) => {
    setEditingListing(listing);
    setEditForm({
      crop_name: listing.crop_name,
      quantity_kg: listing.quantity_kg,
      price_per_kg: listing.price_per_kg,
      description: listing.description || ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/listings/${editingListing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Failed to update listing');
      
      const updated = await res.json();
      setListings(listings.map(l => l.id === updated.id ? updated : l));
      setEditingListing(null);
      setToast({ message: t('myListings.updateSuccess'), type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const filteredListings = filter === 'All' ? listings : listings.filter(l => l.status === filter);

  if (loading) return <div className="p-8 text-center text-green-700">{t('myListings.loading')}</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  const filterOptions = [
    { key: 'All', label: t('myListings.filterAll') },
    { key: 'Available', label: t('myListings.filterAvailable') },
    { key: 'Sold', label: t('myListings.filterSold') },
    { key: 'Expired', label: t('myListings.filterExpired') }
  ];

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

  const getImageUrl = (crop_name) => {
    return CROP_IMAGES[crop_name] || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500&q=80';
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-800">{t('myListings.title')}</h1>
        <Link to="/farmer/create" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition">
          {t('myListings.createNew')}
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded shadow">
        <div className="flex space-x-2">
          {filterOptions.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded ${filter === f.key ? 'bg-green-100 text-green-800 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'bg-transparent'}`}>{t('myListings.grid')}</button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'bg-transparent'}`}>{t('myListings.list')}</button>
        </div>
      </div>

      {filteredListings.length === 0 ? (
        <div className="bg-white p-8 rounded shadow text-center">
          <p className="text-gray-500 mb-4">{t('myListings.noListingsMessage', { status: filter !== 'All' ? filterOptions.find(o => o.key === filter).label.toLowerCase() : '' })}</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredListings.map(listing => (
            <div key={listing.id} className={`bg-white rounded-lg shadow overflow-hidden ${viewMode === 'list' ? 'flex items-center' : 'flex flex-col'}`}>
              <div className={`${viewMode === 'list' ? 'w-48 h-32' : 'w-full h-48'} shrink-0`}>
                <img src={getImageUrl(listing.crop_name)} alt={listing.crop_name} className="w-full h-full object-cover" />
              </div>
              <div className={`p-4 flex-grow ${viewMode === 'list' ? 'flex justify-between items-center' : ''}`}>
                <div>
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <h3 className="text-lg font-bold">{listing.crop_name}</h3>
                    {viewMode === 'grid' && (
                      <span className={`px-2 py-1 text-xs rounded-full ${listing.status === 'Available' ? 'bg-green-100 text-green-800' : listing.status === 'Sold' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {filterOptions.find(o => o.key === listing.status)?.label || listing.status}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{t('myListings.quantity')} {listing.quantity_kg} kg</p>
                    <p>{t('myListings.price')} ₹{listing.price_per_kg}/kg</p>
                    {viewMode === 'list' && <p>{t('myListings.grade')} {listing.grade}</p>}
                    <p>{t('myListings.listed')} {new Date(listing.created_at).toLocaleDateString()}</p>
                  </div>
                  {viewMode === 'list' && (
                      <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${listing.status === 'Available' ? 'bg-green-100 text-green-800' : listing.status === 'Sold' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {filterOptions.find(o => o.key === listing.status)?.label || listing.status}
                      </span>
                  )}
                </div>
                <div className={`flex gap-2 ${viewMode === 'grid' ? 'mt-4' : 'ml-4'}`}>
                  <button onClick={() => handleEdit(listing)} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200">{t('myListings.edit')}</button>
                  {listing.status === 'Available' && (
                    <button onClick={() => handleDelete(listing.id)} className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200">{t('myListings.delete')}</button>
                  )}
              </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">{t('myListings.editListing')}</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('myListings.cropName')}</label>
                <input 
                  type="text"
                  className="w-full border border-gray-300 rounded p-2"
                  value={editForm.crop_name}
                  onChange={e => setEditForm({...editForm, crop_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('myListings.quantityKg')}</label>
                <input 
                  type="number"
                  className="w-full border border-gray-300 rounded p-2"
                  value={editForm.quantity_kg}
                  onChange={e => setEditForm({...editForm, quantity_kg: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('myListings.priceRsKg')}</label>
                <input 
                  type="number"
                  className="w-full border border-gray-300 rounded p-2"
                  value={editForm.price_per_kg}
                  onChange={e => setEditForm({...editForm, price_per_kg: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('myListings.description')}</label>
                <textarea 
                  className="w-full border border-gray-300 rounded p-2"
                  rows="2"
                  value={editForm.description}
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button 
                onClick={handleSaveEdit}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium"
              >
                {t('myListings.saveChanges')}
              </button>
              <button 
                onClick={() => setEditingListing(null)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 font-medium"
              >
                {t('myListings.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
