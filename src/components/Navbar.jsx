import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
const Navbar = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

const changeLanguage = (e) => {
  i18n.changeLanguage(e.target.value);
};
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      fetch(`http://localhost:4000/api/users/notifications/${user.id}`)
        .then(res => res.json())
        .then(data => {
          const notifs = Array.isArray(data) ? data : [];
          setNotifications(notifs);
          setUnreadCount(notifs.length);
        })
        .catch(err => console.error(err));
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderLinks = () => {
    if (!user) return null;
    
    const role = user.role.toLowerCase();
    
    if (role === 'farmer') {
      return (
        <>
          <Link to="/farmer" className="hover:text-green-200">{t('navbar.dashboard')}</Link>
          <Link to="/farmer/create" className="hover:text-green-200">{t('navbar.createListing')}</Link>
          <Link to="/farmer/listings" className="hover:text-green-200">{t('navbar.myListings')}</Link>
          <Link to="/farmer/prices" className="hover:text-green-200">{t('navbar.priceCheck')}</Link>
          <Link to="/farmer/pickups" className="hover:text-green-200">{t('navbar.pickupRequests')}</Link>
        </>
      );
    } else if (role === 'consumer') {
      return (
        <>
          <Link to="/consumer" className="hover:text-green-200">{t('navbar.dashboard')}</Link>
          <Link to="/consumer/marketplace" className="hover:text-green-200">{t('navbar.marketplace')}</Link>
          <Link to="/consumer/pools" className="hover:text-green-200">{t('navbar.poolBuying')}</Link>
          <Link to="/consumer/orders" className="hover:text-green-200">{t('navbar.myOrders')}</Link>
        </>
      );
    } else if (role === 'lead') {
      return (
        <>
          <Link to="/lead" className="hover:text-green-200">{t('navbar.dashboard')}</Link>
          <Link to="/lead/pools" className="hover:text-green-200">{t('navbar.managePools')}</Link>
          <Link to="/lead/analytics" className="hover:text-green-200">{t('navbar.analytics')}</Link>
        </>
      );
    } else if (role === 'admin') {
      return (
        <>
          <Link to="/admin" className="hover:text-green-200">{t('navbar.dashboard')}</Link>
          <Link to="/admin/batches" className="hover:text-green-200">{t('navbar.batchPooling')}</Link>
          <Link to="/admin/routes" className="hover:text-green-200">{t('navbar.routes')}</Link>
          <Link to="/admin/monitor" className="hover:text-green-200">{t('navbar.deliveryMonitor')}</Link>
        </>
      );
    } else if (role === 'driver') {
      return (
        <>
          <Link to="/driver" className="hover:text-green-200">{t('navbar.dashboard')}</Link>
          <Link to="/driver/delivery/1" className="hover:text-green-200">{t('navbar.activeDelivery')}</Link>
        </>
      );
    }
  };

  return (
    <nav className="bg-green-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 font-bold text-2xl tracking-tight">
              KisanDirect 🌾
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {renderLinks()}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {user && (
                <>
                  <div className="relative">
                    <button 
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="p-1 rounded-full text-green-200 hover:text-white focus:outline-none relative"
                    >
                      🔔
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-xs flex items-center justify-center font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border z-50">
                        <div className="p-3 border-b font-bold text-gray-800">{t('navbar.notifications')}</div>
                        <div className="max-h-60 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">{t('navbar.noNotifications')}</div>
                          ) : (
                            notifications.map(n => (
                              <div key={n.id} className="p-3 border-b hover:bg-gray-50 text-sm">
                                <div className="font-medium text-gray-800">{n.title}</div>
                                <div className="text-gray-500 text-xs mt-1">{n.message}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium">{user.name} ({user.role})</span>
                  <select 
                    onChange={changeLanguage} 
                    defaultValue={i18n.language}
                    className="bg-green-800 text-white border border-green-500 rounded p-1 text-sm cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी</option>
                  </select>
                  <button onClick={handleLogout} className="bg-green-800 hover:bg-green-600 px-3 py-1 rounded text-sm font-medium">
                    {t('navbar.logout')}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-green-200 hover:text-white hover:bg-green-800 focus:outline-none">
              <span className="sr-only">Open main menu</span>
              {isOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col">
            {renderLinks()}
          </div>
          <div className="pt-4 pb-3 border-t border-green-800">
            {user && (
              <div className="flex items-center px-5 justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-base font-medium leading-none text-white">{user.name}</div>
                  <div className="text-sm font-medium leading-none text-green-300">{user.role}</div>
                </div>
                <div className="flex items-center space-x-4">
                  <select 
                    onChange={changeLanguage} 
                    defaultValue={i18n.language}
                    className="bg-green-800 text-white border border-green-500 rounded p-1 text-sm cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी</option>
                  </select>

                  <button className="flex-shrink-0 p-1 rounded-full text-green-200 hover:text-white focus:outline-none relative">
                    🔔
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-xs flex items-center justify-center font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <button onClick={handleLogout} className="bg-green-800 hover:bg-green-600 px-3 py-1 rounded text-sm font-medium">
                    {t('navbar.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
