import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import Farmer from './pages/Farmer';
import Consumer from './pages/Consumer';
import CLead from './pages/CLead';
import Admin from './pages/Admin';

function App() {
  const [role, setRole] = useState('Farmer');

  return (
    <BrowserRouter>
      {/* This header stays visible on every page */}
      <header className="bg-green-700 text-white p-4 flex justify-between items-center">
        <span className="font-bold">Society Farm App (Demo)</span>
        <select
          className="text-black rounded px-2 py-1"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option>Farmer</option>
          <option>Consumer</option>
          <option>Lead</option>
          <option>Admin</option>
        </select>
        <div className="flex gap-4">
          <Link to="/farmer">Farmer</Link>
          <Link to="/consumer">Consumer</Link>
          <Link to="/lead">Lead</Link>
          <Link to="/admin">Admin</Link>
        </div>
      </header>

      <Routes>
        <Route path="/farmer" element={<Farmer />} />
        <Route path="/consumer" element={<Consumer />} />
        <Route path="/lead" element={<CLead />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/" element={<Consumer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;