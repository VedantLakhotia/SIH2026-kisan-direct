import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const FarmerDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({ total: 0, active: 0, pendingPickups: 0, earnings: 0 });
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!user) return;
        
        // Fetch listings
        const listRes = await fetch(`http://localhost:4000/api/listings/farmer/${user.id}`);
        let listings = [];
        if (listRes.ok) {
          listings = await listRes.json();
          setRecentListings(listings.slice(0, 5));
        }

        let pendingPickupsCount = 0;
        try {
          const pickupRes = await fetch(`http://localhost:4000/api/pickups/farmer/${user.id}`);
          if (pickupRes.ok) {
            const pickups = await pickupRes.json();
            pendingPickupsCount = pickups.filter(p => p.status === 'Pending').length;
          }
        } catch (err) {
          console.error(err);
        }

        // Dummy stats calculation
        const activeListings = listings.filter(l => l.status === 'Available');
        const earnings = listings.filter(l => l.status === 'Sold').reduce((acc, curr) => acc + (curr.quantity_kg * curr.price_per_kg), 0);

        setStats({
          total: listings.length,
          active: activeListings.length,
          pendingPickups: pendingPickupsCount,
          earnings: earnings || 0
        });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center"><div className="animate-spin inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full"></div><p className="mt-2 text-gray-600">{t('dashboard.loadingDashboard')}</p></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.welcome', { name: user?.name })}</h1>
          <p className="mt-1 text-gray-500">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex space-x-3">
          <Link to="/farmer/create" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium shadow-sm">
            {t('dashboard.newListing')}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 border-l-4 border-l-green-500">
          <h3 className="text-sm font-medium text-gray-500 uppercase">{t('dashboard.totalEarnings')}</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">₹{stats.earnings.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 border-l-4 border-l-blue-500">
          <h3 className="text-sm font-medium text-gray-500 uppercase">{t('dashboard.activeListings')}</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 border-l-4 border-l-yellow-500">
          <h3 className="text-sm font-medium text-gray-500 uppercase">{t('dashboard.pendingPickups')}</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingPickups}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 border-l-4 border-l-purple-500">
          <h3 className="text-sm font-medium text-gray-500 uppercase">{t('dashboard.totalListings')}</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('dashboard.quickActions')}</h2>
            <div className="space-y-3">
              <Link to="/farmer/prices" className="block w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-green-50 hover:border-green-300 transition-colors">
                <div className="font-medium text-green-800">{t('dashboard.checkPrices')}</div>
                <div className="text-xs text-gray-500 mt-1">{t('dashboard.checkPricesDesc')}</div>
              </Link>
              <Link to="/farmer/pickups" className="block w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-green-50 hover:border-green-300 transition-colors">
                <div className="font-medium text-green-800">{t('dashboard.requestPickup')}</div>
                <div className="text-xs text-gray-500 mt-1">{t('dashboard.requestPickupDesc')}</div>
              </Link>
              <Link to="/farmer/listings" className="block w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-green-50 hover:border-green-300 transition-colors">
                <div className="font-medium text-green-800">{t('dashboard.manageInventory')}</div>
                <div className="text-xs text-gray-500 mt-1">{t('dashboard.manageInventoryDesc')}</div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Listings */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{t('dashboard.recentListings')}</h2>
              <Link to="/farmer/listings" className="text-sm text-green-600 hover:text-green-800 font-medium">{t('dashboard.viewAll')}</Link>
            </div>
            
            {recentListings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dashboard.crop')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dashboard.qtyPrice')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dashboard.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentListings.map((listing) => (
                      <tr key={listing.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{listing.crop_name}</div>
                            {listing.grade && <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{t('common.grade')} {listing.grade}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{listing.quantity_kg} {t('common.kg')}</div>
                          <div className="text-sm text-gray-500">₹{listing.price_per_kg}{t('common.perKg')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${listing.status === 'Available' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {listing.status || 'Available'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>{t('dashboard.noListings')}</p>
                <Link to="/farmer/create" className="mt-4 inline-block bg-green-100 text-green-800 px-4 py-2 rounded-md font-medium hover:bg-green-200 transition-colors">
                  {t('dashboard.newListing')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
