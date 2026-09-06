import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Mocking fetch GET /api/deliveries/driver/:driverId
    setTimeout(() => {
      setDeliveries([
        { id: 101, status: 'Pending', dest: 'Society A, Mumbai', stops: 3 },
        { id: 102, status: 'InTransit', dest: 'Society B, Mumbai', stops: 2 },
        { id: 103, status: 'Delivered', dest: 'Society C, Mumbai', stops: 4 }
      ]);
      setLoading(false);
    }, 500);
  }, [user]);

  if (loading) return <div className="p-4">Loading Dashboard...</div>;

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'InTransit': return 'bg-blue-100 text-blue-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Driver Dashboard</h1>
      <p className="text-gray-600">Welcome, {user?.name}</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Today's Deliveries</p>
          <p className="text-2xl font-bold">3</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Completed</p>
          <p className="text-2xl font-bold text-green-600">1</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500 text-sm">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">1</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Total KM</p>
          <p className="text-2xl font-bold text-gray-800">45 km</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">Assigned Deliveries</h2>
        <div className="space-y-4">
          {deliveries.map(d => (
            <div key={d.id} className="border p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-bold">Delivery #{d.id}</p>
                <p className="text-sm text-gray-600">Destination: {d.dest}</p>
                <p className="text-sm text-gray-600">Stops: {d.stops}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(d.status)} mb-2 inline-block`}>
                  {d.status}
                </span>
                <br />
                {(d.status === 'Pending' || d.status === 'InTransit') && (
                  <Link to={`/driver/delivery/${d.id}`} className="bg-green-600 text-white px-3 py-1 rounded shadow hover:bg-green-700 text-sm">
                    {d.status === 'Pending' ? 'Start Delivery' : 'Resume'}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
