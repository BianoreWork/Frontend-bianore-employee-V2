/** Haversine distance between two lat/lng points — returns metres */
export function getDistanceMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Seconds elapsed since today's work-start time; negative = before start */
export function secondsSinceWorkStart(workStartTime: string): number {
  const [h, m] = workStartTime.split(':').map(Number);
  const start = new Date();
  start.setHours(h, m, 0, 0);
  return (Date.now() - start.getTime()) / 1000;
}

/** Format seconds → "Xh Ym Zs" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/** Slight offset to simulate "just inside range" (≈10 m) */
export function simulateInRangeCoords(
  officeLat: number,
  officeLng: number,
): { lat: number; lng: number } {
  return { lat: officeLat + 0.00009, lng: officeLng + 0.00003 };
}

/** Offset to simulate well outside range (≈900 m) */
export function simulateOutOfRangeCoords(
  officeLat: number,
  officeLng: number,
): { lat: number; lng: number } {
  return { lat: officeLat + 0.008, lng: officeLng + 0.005 };
}
