import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('kisanUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (name, role) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, role }),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('kisanUser', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      // Fallback for demo without backend
      const dummyUser = { id: Math.floor(Math.random() * 1000), name, role, society_id: 1, lat: 28.6139, lng: 77.2090 };
      setUser(dummyUser);
      localStorage.setItem('kisanUser', JSON.stringify(dummyUser));
      return dummyUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kisanUser');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
