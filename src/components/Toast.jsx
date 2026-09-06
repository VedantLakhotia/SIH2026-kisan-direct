import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose && onClose(), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'success' 
    ? 'bg-green-600' 
    : type === 'error' 
    ? 'bg-red-600' 
    : 'bg-blue-600';

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

  return (
    <div className={`fixed top-4 right-4 z-[100] transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
      <div className={`${bgColor} text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] max-w-[420px]`}>
        <span className="text-lg font-bold">{icon}</span>
        <span className="text-sm font-medium flex-1">{message}</span>
        <button onClick={() => { setVisible(false); setTimeout(() => onClose && onClose(), 300); }} className="text-white/70 hover:text-white text-lg">×</button>
      </div>
    </div>
  );
};

export default Toast;
