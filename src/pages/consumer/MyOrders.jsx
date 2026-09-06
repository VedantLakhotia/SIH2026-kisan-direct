import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/orders/consumer/${user.id}`);
      if (res.ok) setOrders(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Confirmed': return 'bg-blue-100 text-blue-800';
      case 'Shipped': 
      case 'InTransit': return 'bg-purple-100 text-purple-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = filter === 'All' 
    ? orders 
    : filter === 'Pool Orders' 
      ? orders.filter(o => o.order_type === 'Pool')
      : orders.filter(o => o.order_type === 'Direct');

  if (loading) return <div className="p-8 text-center">Loading orders...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>

      <div className="flex space-x-2 mb-6 border-b pb-2">
        {['All', 'Pool Orders', 'Direct Orders'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              filter === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white p-8 rounded shadow text-center text-gray-500">
          <p>No {filter !== 'All' ? filter.toLowerCase() : ''} found.</p>
          <Link to={filter === 'Pool Orders' ? '/consumer/pools' : '/consumer/marketplace'} className="text-green-600 hover:underline mt-2 inline-block">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order.order_id} className="bg-white rounded shadow border border-gray-100 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${order.order_type === 'Pool' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                    {order.order_type}
                  </span>
                  <h3 className="font-bold text-lg">{order.crop_name}</h3>
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                  <p>Order ID: #{order.order_id}</p>
                  <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
                  <p>Quantity: {order.quantity_kg} kg</p>
                  <p className="font-semibold text-gray-800">Total: ₹{order.total_price}</p>
                  <p className="col-span-2">Delivery: {order.delivery_type}</p>
                </div>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                {['Shipped', 'InTransit'].includes(order.status) && (
                  <Link 
                    to={`/consumer/tracking/${order.order_id}?type=${order.order_type}`}
                    className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded shadow"
                  >
                    Track Delivery
                  </Link>
                )}
                {order.status === 'Delivered' && (
                  <button className="w-full border border-gray-300 bg-gray-50 text-gray-700 py-2 px-4 rounded hover:bg-gray-100 font-medium">
                    Leave Review
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
