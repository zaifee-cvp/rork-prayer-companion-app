const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;
const DEG = Math.PI / 180;

export function calculateQiblaDirection(lat: number, lng: number): number {
  const phiK = KAABA_LAT * DEG;
  const lambdaK = KAABA_LNG * DEG;
  const phi = lat * DEG;
  const lambda = lng * DEG;

  const bearing = Math.atan2(
    Math.sin(lambdaK - lambda),
    Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
  );

  return ((bearing / DEG) + 360) % 360;
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * DEG;
  const dLng = (lng2 - lng1) * DEG;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
