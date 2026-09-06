const db = require('../db');
const { optimizeRoute, estimateTime } = require('./routeOptimizer');

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function nearestNeighborSort(points) {
  if (!points || points.length === 0) return [];
  const sorted = [points[0]];
  const unvisited = points.slice(1);

  while (unvisited.length > 0) {
    const last = sorted[sorted.length - 1];
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const d = haversine(last.lat, last.lng, unvisited[i].lat, unvisited[i].lng);
      if (d < minDistance) {
        minDistance = d;
        nearestIdx = i;
      }
    }
    sorted.push(unvisited[nearestIdx]);
    unvisited.splice(nearestIdx, 1);
  }
  return sorted;
}

async function autoPool() {
  try {
    const res = await db.query(`SELECT * FROM pickup_requests WHERE status = 'Pending' AND lat IS NOT NULL AND lng IS NOT NULL`);
    const requests = res.rows;
    if (requests.length === 0) return [];

    const unassigned = [...requests];
    const batches = [];
    const maxDistance = 25; // km radius for grouping

    while (unassigned.length > 0) {
      const seed = unassigned.shift();
      const group = [seed];
      
      for (let i = unassigned.length - 1; i >= 0; i--) {
        const d = haversine(seed.lat, seed.lng, unassigned[i].lat, unassigned[i].lng);
        if (d <= maxDistance) {
          group.push(unassigned.splice(i, 1)[0]);
        }
      }

      let totalKg = group.reduce((sum, req) => sum + parseFloat(req.quantity_kg), 0);
      const truckCapacity = 2000; // 2 ton truck
      const utilPercent = (totalKg / truckCapacity) * 100;

      const sortedGroup = nearestNeighborSort(group);
      
      const waypoints = sortedGroup.map((r, idx) => ({
        lat: parseFloat(r.lat), 
        lng: parseFloat(r.lng),
        label: `Pickup ${idx+1}`
      }));
      
      const routeInfo = optimizeRoute(waypoints);

      const batchRes = await db.query(
        `INSERT INTO batches (name, total_kg, truck_capacity_kg, utilization_percent, route_data, estimated_distance_km, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [`Auto-Batch ${Date.now()}`, totalKg, truckCapacity, utilPercent, JSON.stringify(routeInfo), routeInfo.totalDistance, 'Created']
      );
      const batch = batchRes.rows[0];

      for (let i = 0; i < sortedGroup.length; i++) {
        await db.query(
          `INSERT INTO batch_items (batch_id, pickup_id, stop_order) VALUES ($1, $2, $3)`,
          [batch.id, sortedGroup[i].id, i + 1]
        );
        await db.query(
          `UPDATE pickup_requests SET status = 'Batched', batch_id = $1 WHERE id = $2`,
          [batch.id, sortedGroup[i].id]
        );
      }
      batches.push(batch);
    }
    return batches;

  } catch (error) {
    console.error('Error in autoPool:', error);
    throw error;
  }
}

module.exports = {
  haversine,
  nearestNeighborSort,
  autoPool
};
