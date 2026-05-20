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

/**
 * Watch GPS position and resolve when accuracy <= targetAccuracy metres,
 * or after timeoutMs with the best reading seen (whichever comes first).
 * Rejects only if geolocation is unavailable or no reading arrives at all.
 */
export function watchBestPosition(
  onAccuracy: (accuracyMeters: number) => void,
  targetAccuracy = 80,
  timeoutMs = 20000,
): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by this browser.'));
      return;
    }

    let best: GeolocationCoordinates | null = null;
    let watchId: number;

    const done = () => {
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
      if (best) resolve(best);
      else reject(new Error('No GPS position received.'));
    };

    const timer = window.setTimeout(done, timeoutMs);

    watchId = navigator.geolocation.watchPosition(
      pos => {
        const c = pos.coords;
        onAccuracy(Math.round(c.accuracy));
        if (!best || c.accuracy < best.accuracy) best = c;
        if (c.accuracy <= targetAccuracy) done();
      },
      err => {
        clearTimeout(timer);
        navigator.geolocation.clearWatch(watchId);
        reject(new Error(err.message));
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );
  });
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
