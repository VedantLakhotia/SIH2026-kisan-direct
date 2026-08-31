import { useEffect, useState } from 'react';

export default function Consumer() {
  const [pools, setPools] = useState([]);

  useEffect(() => {
    fetch('http://localhost:4000/api/pools/1') // society_id = 1 for demo
      .then(res => res.json())
      .then(data => setPools(data));
  }, []);

  return (
    <div className="p-6 space-y-4">
      {pools.map(pool => {
        const progress = Math.min((pool.current_kg / pool.target_kg) * 100, 100);
        return (
          <div key={pool.id} className="border rounded p-4">
            <h2 className="font-semibold">{pool.crop_name}</h2>
            <div className="w-full bg-gray-200 rounded h-4 mt-2">
              <div
                className="bg-green-600 h-4 rounded"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm mt-1">{pool.current_kg}kg / {pool.target_kg}kg ({progress.toFixed(0)}%)</p>
          </div>
        );
      })}
    </div>
  );
}