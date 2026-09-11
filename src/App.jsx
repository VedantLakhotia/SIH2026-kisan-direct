import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import DemoEscrow from './pages/DemoEscrow';

//Header and Footer
import GovtHeader from './components/GovtHeader';
import GovtFooter from './components/GovtFooter';

// Farmer Pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import CreateListing from './pages/farmer/CreateListing';
import MyListings from './pages/farmer/MyListings';
import PriceDiscovery from './pages/farmer/PriceDiscovery';
import PickupRequests from './pages/farmer/PickupRequests';

// Consumer Pages
import ConsumerDashboard from './pages/consumer/ConsumerDashboard';
import Marketplace from './pages/consumer/Marketplace';
import PoolBuying from './pages/consumer/PoolBuying';
import MyOrders from './pages/consumer/MyOrders';
import OrderTracking from './pages/consumer/OrderTracking';

// Lead Pages
import LeadDashboard from './pages/lead/LeadDashboard';
import ManagePools from './pages/lead/ManagePools';
import PoolAnalytics from './pages/lead/PoolAnalytics';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import BatchPooling from './pages/admin/BatchPooling';
import RouteOptimization from './pages/admin/RouteOptimization';
import DeliveryMonitor from './pages/admin/DeliveryMonitor';

// Driver Pages
import DriverDashboard from './pages/driver/DriverDashboard';
import ActiveDelivery from './pages/driver/ActiveDelivery';

const ProtectedRoute = ({ children, roleRequired }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roleRequired && user.role.toLowerCase() !== roleRequired.toLowerCase() && user.role.toLowerCase() !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  
  switch (user.role.toLowerCase()) {
    case 'farmer': return <Navigate to="/farmer" replace />;
    case 'consumer': return <Navigate to="/consumer" replace />;
    case 'lead': return <Navigate to="/lead" replace />;
    case 'admin': return <Navigate to="/admin" replace />;
    case 'driver': return <Navigate to="/driver" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

export default function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {user && <Navbar />}
        <main className="flex-grow">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Farmer Routes */}
            <Route path="/farmer" element={<ProtectedRoute roleRequired="farmer"><FarmerDashboard /></ProtectedRoute>} />
            <Route path="/farmer/create" element={<ProtectedRoute roleRequired="farmer"><CreateListing /></ProtectedRoute>} />
            <Route path="/farmer/listings" element={<ProtectedRoute roleRequired="farmer"><MyListings /></ProtectedRoute>} />
            <Route path="/farmer/prices" element={<ProtectedRoute roleRequired="farmer"><PriceDiscovery /></ProtectedRoute>} />
            <Route path="/farmer/pickups" element={<ProtectedRoute roleRequired="farmer"><PickupRequests /></ProtectedRoute>} />

            {/* Consumer Routes */}
            <Route path="/consumer" element={<ProtectedRoute roleRequired="consumer"><ConsumerDashboard /></ProtectedRoute>} />
            <Route path="/consumer/marketplace" element={<ProtectedRoute roleRequired="consumer"><Marketplace /></ProtectedRoute>} />
            <Route path="/consumer/pools" element={<ProtectedRoute roleRequired="consumer"><PoolBuying /></ProtectedRoute>} />
            <Route path="/consumer/orders" element={<ProtectedRoute roleRequired="consumer"><MyOrders /></ProtectedRoute>} />
            <Route path="/consumer/tracking/:orderId" element={<ProtectedRoute roleRequired="consumer"><OrderTracking /></ProtectedRoute>} />

            {/* Lead Routes */}
            <Route path="/lead" element={<ProtectedRoute roleRequired="lead"><LeadDashboard /></ProtectedRoute>} />
            <Route path="/lead/pools" element={<ProtectedRoute roleRequired="lead"><ManagePools /></ProtectedRoute>} />
            <Route path="/lead/analytics" element={<ProtectedRoute roleRequired="lead"><PoolAnalytics /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute roleRequired="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/batches" element={<ProtectedRoute roleRequired="admin"><BatchPooling /></ProtectedRoute>} />
            <Route path="/admin/routes" element={<ProtectedRoute roleRequired="admin"><RouteOptimization /></ProtectedRoute>} />
            <Route path="/admin/monitor" element={<ProtectedRoute roleRequired="admin"><DeliveryMonitor /></ProtectedRoute>} />

            {/* Driver Routes */}
            <Route path="/driver" element={<ProtectedRoute roleRequired="driver"><DriverDashboard /></ProtectedRoute>} />
            <Route path="/driver/delivery/:deliveryId" element={<ProtectedRoute roleRequired="driver"><ActiveDelivery /></ProtectedRoute>} />

            {/* Hackathon Demo Route */}
            <Route path="/demo-escrow" element={<DemoEscrow />} />

            {/* Default Route */}
            <Route path="/" element={<RoleRedirect />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}