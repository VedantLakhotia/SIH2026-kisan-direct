function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function optimizeRoute(waypoints) {
  if (!waypoints || waypoints.length === 0) return { sortedWaypoints: [], totalDistance: 0 };
  
  const sorted = [waypoints[0]];
  const unvisited = waypoints.slice(1);
  let totalDist = 0;

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
    const nearest = unvisited[nearestIdx];
    nearest.distanceFromPrevious = minDistance;
    totalDist += minDistance;
    
    sorted.push(nearest);
    unvisited.splice(nearestIdx, 1);
  }

  return {
    sortedWaypoints: sorted,
    totalDistance: totalDist
  };
}

function estimateTime(distanceKm) {
  const speedKmh = 30; // avg rural + urban mix
  const hours = distanceKm / speedKmh;
  return hours * 60; // returns minutes
}

module.exports = {
  optimizeRoute,
  estimateTime
};
