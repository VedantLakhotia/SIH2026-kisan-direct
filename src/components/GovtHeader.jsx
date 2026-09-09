export default function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* ADD: Government header at top */}
        <GovtHeader />
        
        {/* KEPT: Your current Navbar */}
        {user && <Navbar />}

        {/* KEPT: Your current pages and routes */}
        <main id="main-content" className="flex-grow">
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

            {/* Default Route */}
            <Route path="/" element={<RoleRedirect />} />

            {/* 404 Catch-All Route */}
            <Route path="*" element={
              <div className="p-8 text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-gray-600 mb-4">Page not found</p>
                <a href="/" className="text-[#004080] hover:underline font-medium">Go to Home</a>
              </div>
            } />
          </Routes>
        </main>

        {/* ADD: Government footer at bottom */}
        <GovtFooter />
      </div>
    </BrowserRouter>
  );
}