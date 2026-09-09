import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const roles = [
    { id: 'Farmer', icon: '🧑‍🌾', label: 'Farmer' },
    { id: 'Consumer', icon: '🛒', label: 'Consumer' },
    { id: 'Lead', icon: '👑', label: 'Society Lead' },
    { id: 'Admin', icon: '🛡️', label: 'Admin' },
    { id: 'Driver', icon: '🚚', label: 'Driver' },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!name || !role) {
      setError('Please enter your name and select a role');
      return;
    }

    try {
      setError('');
      await login(name, role);
      navigate(`/${role.toLowerCase()}`);
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <span className="text-6xl">🌾</span>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Welcome to KisanDirect
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Farm-to-Consumer platform for fresh produce
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-green-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Your Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Enter your name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`flex flex-col items-center p-3 border rounded-lg transition-all ${
                      role === r.id 
                        ? 'border-green-500 bg-green-50 shadow-md ring-1 ring-green-500' 
                        : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-green-300'
                    }`}
                  >
                    <span className="text-2xl mb-1">{r.icon}</span>
                    <span className={`text-xs font-medium ${role === r.id ? 'text-green-800' : 'text-gray-700'}`}>
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
