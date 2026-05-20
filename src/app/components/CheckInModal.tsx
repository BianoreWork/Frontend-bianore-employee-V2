import {
  useEffect, useRef, useState, useCallback,
} from 'react';
import {
  X, Navigation, CheckCircle2, XCircle,
  AlertTriangle, MapPin, Clock, Shield, Loader2, RotateCcw, RefreshCw,
  User, Camera, CameraOff,
} from 'lucide-react';
import { OFFICE_CONFIG } from '../config/officeConfig';
import {
  getDistanceMeters,
  secondsSinceWorkStart,
  formatDuration,
  simulateInRangeCoords,
  simulateOutOfRangeCoords,
  watchBestPosition,
} from '../utils/geo';

type Step = 'detecting' | 'verified' | 'out_of_range' | 'camera' | 'preview' | 'success';

interface UserCoords { lat: number; lng: number }
export interface CheckInResult {
  time: string;
  date: string;
  photo: string;
  distance: number;
  coords: UserCoords;
  timestamp: string;
}
interface Props {
  onClose: () => void;
  onSuccess: (result: CheckInResult) => void;
}

function addWatermark(ctx: CanvasRenderingContext2D, coords: UserCoords, W: number, H: number) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const coordStr = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;

  const wmGrad = ctx.createLinearGradient(0, H - 140, 0, H);
  wmGrad.addColorStop(0, 'rgba(0,0,0,0)');
  wmGrad.addColorStop(1, 'rgba(0,0,0,0.88)');
  ctx.fillStyle = wmGrad;
  ctx.fillRect(0, H - 140, W, 140);

  const pad = 20;
  ctx.fillStyle = '#3B82F6';
  ctx.beginPath(); ctx.arc(pad + 6, H - 118, 6, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('BIANORE ATTENDANCE SYSTEM', pad + 20, H - 113);

  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('Employee', pad, H - 88);

  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.fillText(`${OFFICE_CONFIG.name}  ·  Check In`, pad, H - 68);

  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText(dateStr, pad, H - 48);
  ctx.fillText(timeStr, pad, H - 30);
  ctx.fillText(coordStr, pad, H - 12);
}

function generateDummySelfie(canvas: HTMLCanvasElement, coords: UserCoords): string {
  const W = 640, H = 800;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1e293b');
  bg.addColorStop(0.5, '#334155');
  bg.addColorStop(1, '#0f172a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2 - 60;
  ctx.fillStyle = '#d4a57a';
  ctx.beginPath(); ctx.roundRect(cx - 38, cy + 95, 76, 90, 8); ctx.fill();
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath(); ctx.ellipse(cx, cy, 105, 128, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a0a00';
  ctx.beginPath(); ctx.ellipse(cx, cy - 90, 108, 60, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(cx - 38, cy - 10, 20, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 38, cy - 10, 20, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3b2000';
  ctx.beginPath(); ctx.arc(cx - 38, cy - 10, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 38, cy - 10, 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c49060'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy + 32, 38, 0.15, Math.PI - 0.15); ctx.stroke();

  const shirtGrad = ctx.createLinearGradient(0, cy + 200, 0, H);
  shirtGrad.addColorStop(0, '#1e40af'); shirtGrad.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = shirtGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 160, H); ctx.lineTo(cx - 160, cy + 210);
  ctx.quadraticCurveTo(cx - 120, cy + 170, cx - 60, cy + 175);
  ctx.lineTo(cx - 30, cy + 185); ctx.lineTo(cx + 30, cy + 185);
  ctx.lineTo(cx + 60, cy + 175);
  ctx.quadraticCurveTo(cx + 120, cy + 170, cx + 160, cy + 210);
  ctx.lineTo(cx + 160, H); ctx.closePath(); ctx.fill();

  const vig = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 500);
  vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

  addWatermark(ctx, coords, W, H);
  return canvas.toDataURL('image/jpeg', 0.92);
}

export default function CheckInModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('detecting');
  const [coords, setCoords] = useState<UserCoords | null>(null);
  const [distance, setDistance] = useState(0);
  const [absentSec, setAbsentSec] = useState(0);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [liveClock, setLiveClock] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const absentRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tick = () => setLiveClock(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    clockRef.current = setInterval(tick, 1000);
    return () => { if (clockRef.current) clearInterval(clockRef.current); };
  }, []);

  useEffect(() => {
    if (step === 'out_of_range') {
      const tick = () => setAbsentSec(Math.max(0, secondsSinceWorkStart(OFFICE_CONFIG.workStartTime)));
      tick();
      absentRef.current = setInterval(tick, 1000);
    }
    return () => { if (absentRef.current) clearInterval(absentRef.current); };
  }, [step]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 800 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera access denied';
      setCameraError(msg);
    }
  }, []);

  useEffect(() => {
    if (step === 'camera') startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [step]); // eslint-disable-line

  useEffect(() => () => stopCamera(), []); // eslint-disable-line

  const applyCoords = useCallback((c: UserCoords) => {
    const d = getDistanceMeters(c.lat, c.lng, OFFICE_CONFIG.lat, OFFICE_CONFIG.lng);
    setCoords(c);
    setDistance(d);
    if (d <= OFFICE_CONFIG.radiusMeters) {
      setStep('verified');
      setTimeout(() => setStep('camera'), 1800);
    } else {
      setStep('out_of_range');
    }
  }, []);

  const startGeoDetection = useCallback(() => {
    setStep('detecting');
    setGeoError(null);
    setGpsAccuracy(null);
    watchBestPosition(acc => setGpsAccuracy(acc), 80, 20000)
      .then(c => applyCoords({ lat: c.latitude, lng: c.longitude }))
      .catch(err => setGeoError(err.message));
  }, [applyCoords]);

  useEffect(() => { startGeoDetection(); }, []); // eslint-disable-line

  const handleCapture = () => {
    if (!coords || !canvasRef.current || capturing) return;
    setCapturing(true);

    setTimeout(() => {
      const canvas = canvasRef.current!;
      const W = 640, H = 800;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      const video = videoRef.current;
      if (video && cameraReady && video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, W, H);
        addWatermark(ctx, coords, W, H);
      } else {
        generateDummySelfie(canvas, coords);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setPhotoDataUrl(dataUrl);
      setCapturing(false);
      setStep('preview');
    }, 350);
  };

  const confirmCheckIn = () => {
    const now = new Date();
    onSuccess({
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      photo: photoDataUrl!,
      distance,
      coords: coords!,
      timestamp: now.toISOString(),
    });
    setStep('success');
  };

  const isFullScreen = step === 'camera';

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ maxWidth: 430, margin: '0 auto' }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isFullScreen ? undefined : onClose} />

      <div
        className="relative bg-white flex flex-col overflow-hidden"
        style={{
          borderRadius: isFullScreen ? 0 : '24px 24px 0 0',
          height: isFullScreen ? '100dvh' : 'auto',
          maxHeight: isFullScreen ? '100dvh' : '92dvh',
        }}
      >
        {!isFullScreen && (
          <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-200" />
          </div>
        )}

        {!isFullScreen && step !== 'success' && (
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center z-10">
            <X size={16} className="text-slate-500" />
          </button>
        )}

        {/* DETECTING */}
        {step === 'detecting' && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-50" />
              <Navigation size={36} className="text-blue-600" />
            </div>
            <p className="text-slate-800 font-bold mb-2" style={{ fontSize: '20px' }}>Checking Location</p>
            <p className="text-slate-400 text-center mb-4" style={{ fontSize: '13px' }}>
              Getting your GPS coordinates…<br />Please allow location access when prompted.
            </p>
            {!geoError && (
              <div className="flex flex-col items-center gap-2 mb-4">
                <Loader2 size={24} className="text-blue-500 animate-spin" />
                {gpsAccuracy !== null && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${gpsAccuracy <= 80 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    <div className={`w-2 h-2 rounded-full ${gpsAccuracy <= 80 ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                    <span className={`font-semibold ${gpsAccuracy <= 80 ? 'text-emerald-700' : 'text-amber-700'}`} style={{ fontSize: '12px' }}>
                      {gpsAccuracy <= 80 ? `Akurasi baik · ±${gpsAccuracy} m` : `Menunggu GPS · ±${gpsAccuracy} m`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {geoError && (
              <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-2">
                <p className="text-amber-800 font-semibold mb-1" style={{ fontSize: '13px' }}>GPS Unavailable</p>
                <p className="text-amber-700 mb-4" style={{ fontSize: '12px' }}>{geoError}</p>
                <p className="text-amber-600 font-semibold mb-2" style={{ fontSize: '11px' }}>— SIMULATE FOR DEMO —</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => applyCoords(simulateInRangeCoords(OFFICE_CONFIG.lat, OFFICE_CONFIG.lng))}
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold active:scale-95 transition-transform"
                    style={{ fontSize: '13px' }}
                  >
                    In Range
                  </button>
                  <button
                    onClick={() => applyCoords(simulateOutOfRangeCoords(OFFICE_CONFIG.lat, OFFICE_CONFIG.lng))}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-semibold active:scale-95 transition-transform"
                    style={{ fontSize: '13px' }}
                  >
                    Out of Range
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VERIFIED */}
        {step === 'verified' && coords && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-5 relative">
              <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-40" />
              <CheckCircle2 size={44} className="text-emerald-500" />
            </div>
            <p className="text-slate-800 font-bold mb-1" style={{ fontSize: '22px' }}>Location Verified</p>
            <p className="text-slate-400 mb-5" style={{ fontSize: '13px' }}>
              {Math.round(distance)} m from {OFFICE_CONFIG.name}
            </p>
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 size={16} className="animate-spin" />
              <span style={{ fontSize: '13px' }}>Opening camera…</span>
            </div>
          </div>
        )}

        {/* OUT OF RANGE */}
        {step === 'out_of_range' && coords && (
          <div className="flex-1 flex flex-col px-5 pb-8 overflow-y-auto">
            <div className="text-center py-6">
              <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-red-200 animate-ping opacity-30" />
                <XCircle size={44} className="text-red-500" />
              </div>
              <p className="text-slate-800 font-bold mb-1" style={{ fontSize: '22px' }}>Out of Range</p>
              <p className="text-slate-400 text-center" style={{ fontSize: '13px' }}>You are too far from the office</p>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-3xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-red-800 font-semibold" style={{ fontSize: '13px' }}>{OFFICE_CONFIG.name}</span>
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold" style={{ fontSize: '11px' }}>Out of Range</span>
              </div>
              {[
                { icon: Navigation, label: 'Your distance', value: `${Math.round(distance)} m` },
                { icon: Shield, label: 'Allowed radius', value: `${OFFICE_CONFIG.radiusMeters} m` },
                { icon: AlertTriangle, label: 'Must move closer by', value: `${Math.round(distance - OFFICE_CONFIG.radiusMeters)} m` },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-2 mb-1.5 last:mb-0">
                  <r.icon size={13} className="text-red-500 flex-shrink-0" />
                  <span className="text-red-600" style={{ fontSize: '12px' }}>{r.label}:</span>
                  <span className="text-red-800 font-bold ml-auto" style={{ fontSize: '12px' }}>{r.value}</span>
                </div>
              ))}
              <div className="mt-3 h-2.5 bg-red-100 rounded-full overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-red-400 to-red-600 rounded-full" />
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-5 mb-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock size={14} className="text-amber-400" />
                <span className="text-amber-400 font-semibold" style={{ fontSize: '11px' }}>ABSENT TIME ACCUMULATING</span>
              </div>
              <p className="text-white font-bold tabular-nums my-1" style={{ fontSize: '36px', letterSpacing: '-0.02em' }}>
                {absentSec > 0 ? formatDuration(absentSec) : '0s'}
              </p>
              <p className="text-slate-400" style={{ fontSize: '12px' }}>
                Work started {OFFICE_CONFIG.workStartTime} · {Math.floor(absentSec / 60)} min absent
              </p>
              {absentSec > 0 && (
                <div className="mt-3 bg-red-900/40 rounded-2xl px-3 py-2">
                  <p className="text-red-300" style={{ fontSize: '11px' }}>Absent time will affect your payroll deduction.</p>
                </div>
              )}
            </div>

            <button
              onClick={startGeoDetection}
              className="w-full bg-blue-600 text-white font-bold rounded-3xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ height: '56px', fontSize: '15px' }}
            >
              <RefreshCw size={18} /> Retry Location
            </button>

            <div className="bg-slate-50 rounded-2xl px-4 py-3 mt-3">
              <p className="text-slate-400 font-semibold mb-2" style={{ fontSize: '11px' }}>SIMULATE</p>
              <button
                onClick={() => applyCoords(simulateInRangeCoords(OFFICE_CONFIG.lat, OFFICE_CONFIG.lng))}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-semibold active:scale-95 transition-transform"
                style={{ fontSize: '13px' }}
              >
                Simulate In Range
              </button>
            </div>
          </div>
        )}

        {/* CAMERA — real device camera */}
        {step === 'camera' && (
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden" style={{ minHeight: 0 }}>
            <div className="flex-shrink-0 flex items-center justify-between px-4 pt-5 pb-3 z-10">
              <button
                onClick={() => setStep('verified')}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
              >
                <X size={18} className="text-white" />
              </button>
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
                <MapPin size={12} className="text-emerald-400" />
                <span className="text-white" style={{ fontSize: '11px' }}>
                  {Math.round(distance)} m · {OFFICE_CONFIG.name}
                </span>
              </div>
              <div className="w-10" />
            </div>

            <div className="flex-1 relative flex items-center justify-center overflow-hidden" style={{ minHeight: 0 }}>
              {/* Real camera feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Loading / error overlay */}
              {!cameraReady && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-10">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="text-blue-400 animate-spin" />
                    <p className="text-white/70" style={{ fontSize: '13px' }}>Initializing camera…</p>
                  </div>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-10 px-6">
                  <div className="text-center">
                    <CameraOff size={40} className="text-red-400 mx-auto mb-3" />
                    <p className="text-white font-semibold mb-1" style={{ fontSize: '14px' }}>Camera Unavailable</p>
                    <p className="text-white/50 mb-4" style={{ fontSize: '12px' }}>{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold"
                      style={{ fontSize: '13px' }}
                    >
                      Retry Camera
                    </button>
                    <p className="text-white/40 mt-3" style={{ fontSize: '11px' }}>
                      Tip: You can still capture using the demo photo if camera is blocked.
                    </p>
                  </div>
                </div>
              )}

              {/* Face oval overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: 80 }}>
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    width: 200, height: 250,
                    border: '2.5px solid rgba(255,255,255,0.5)',
                    borderRadius: '50%',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                  }}
                >
                  {!cameraReady && <User size={80} className="text-white/20" />}
                  {[
                    { top: -2, left: -2, rotate: '0deg' },
                    { top: -2, right: -2, rotate: '90deg' },
                    { bottom: -2, right: -2, rotate: '180deg' },
                    { bottom: -2, left: -2, rotate: '270deg' },
                  ].map((pos, i) => (
                    <div
                      key={i}
                      className="absolute w-5 h-5 border-white"
                      style={{ ...pos, borderWidth: '3px 0 0 3px', borderRadius: '2px 0 0 0', transform: `rotate(${pos.rotate})` }}
                    />
                  ))}
                </div>
              </div>

              <p className="absolute text-center text-white/70 z-10" style={{ bottom: 90, left: 0, right: 0, fontSize: '13px' }}>
                Centre your face in the oval
              </p>

              {/* Bottom info bar */}
              <div
                className="absolute bottom-0 left-0 right-0 px-4 pt-10 pb-3 pointer-events-none z-10"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.90) 0%, transparent 100%)' }}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="text-white font-semibold" style={{ fontSize: '10px' }}>BIANORE ATTENDANCE SYSTEM</span>
                </div>
                <p className="text-white font-bold" style={{ fontSize: '13px' }}>Employee</p>
                <p className="text-white/75" style={{ fontSize: '11px' }}>{OFFICE_CONFIG.name} · Check In</p>
                <p className="text-white/60 tabular-nums" style={{ fontSize: '10px' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-white/60 tabular-nums" style={{ fontSize: '10px' }}>
                  {liveClock} · {coords?.lat.toFixed(5)}, {coords?.lng.toFixed(5)}
                </p>
              </div>

              {capturing && <div className="absolute inset-0 bg-white z-20" style={{ opacity: 0.9 }} />}
            </div>

            <div className="flex-shrink-0 flex items-center justify-between px-10 py-6 bg-black">
              <button
                onClick={() => setStep('verified')}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
              >
                <RotateCcw size={20} className="text-white" />
              </button>

              <button
                onClick={handleCapture}
                disabled={capturing}
                className="relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: 'rgba(255,255,255,0.12)' }}
              >
                {capturing
                  ? <Loader2 size={28} className="text-white animate-spin" />
                  : cameraError
                    ? <Camera size={28} className="text-white/60" />
                    : <div className="w-14 h-14 rounded-full bg-white" />
                }
              </button>

              <div className="w-12" />
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {/* PREVIEW */}
        {step === 'preview' && photoDataUrl && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="relative bg-black overflow-hidden" style={{ height: '52%', minHeight: 260 }}>
              <img src={photoDataUrl} alt="Selfie" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <div className="bg-emerald-500/90 backdrop-blur-sm rounded-2xl px-3 py-1.5 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-white" />
                  <span className="text-white font-semibold" style={{ fontSize: '12px' }}>Location Verified</span>
                </div>
                <div className="bg-blue-600/90 backdrop-blur-sm rounded-2xl px-3 py-1.5 flex items-center gap-1.5">
                  <MapPin size={12} className="text-white" />
                  <span className="text-white" style={{ fontSize: '11px' }}>{Math.round(distance)} m from office</span>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-white px-5 pt-5 pb-8 overflow-y-auto">
              <p className="text-slate-800 font-bold mb-0.5" style={{ fontSize: '18px' }}>Check-In Approval</p>
              <p className="text-slate-400 mb-4" style={{ fontSize: '13px' }}>
                Review your selfie and details before confirming check-in.
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 mb-5 space-y-2.5">
                {[
                  { label: 'Office', value: OFFICE_CONFIG.name },
                  { label: 'Distance', value: `${Math.round(distance)} m (within ${OFFICE_CONFIG.radiusMeters} m limit)` },
                  { label: 'Check-in time', value: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) },
                  { label: 'Date', value: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                  { label: 'GPS', value: `${coords?.lat.toFixed(5)}, ${coords?.lng.toFixed(5)}` },
                ].map(m => (
                  <div key={m.label} className="flex justify-between items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0" style={{ fontSize: '12px' }}>{m.label}</span>
                    <span className="text-slate-700 font-semibold text-right" style={{ fontSize: '12px' }}>{m.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 mb-5">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-emerald-700 font-semibold" style={{ fontSize: '12px' }}>Ready to Check In</p>
                  <p className="text-emerald-500" style={{ fontSize: '11px' }}>GPS and selfie proof validated</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setPhotoDataUrl(null); setStep('camera'); }}
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-slate-200 rounded-2xl text-slate-700 font-semibold active:scale-95 transition-transform"
                  style={{ height: '54px', fontSize: '14px' }}
                >
                  <RotateCcw size={16} /> Retake
                </button>
                <button
                  onClick={confirmCheckIn}
                  className="flex-1 bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 transition-transform"
                  style={{ height: '54px', fontSize: '14px' }}
                >
                  <CheckCircle2 size={18} /> Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="w-28 h-28 rounded-full bg-emerald-50 flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
              <CheckCircle2 size={52} className="text-emerald-500" />
            </div>
            <p className="text-slate-800 font-bold mb-2" style={{ fontSize: '24px' }}>Checked In!</p>
            <p className="text-slate-500 text-center mb-1" style={{ fontSize: '15px' }}>
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </p>
            <p className="text-slate-400 text-center" style={{ fontSize: '13px' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <div className="mt-4 bg-emerald-50 rounded-2xl px-4 py-2 flex items-center gap-2">
              <MapPin size={13} className="text-emerald-600" />
              <span className="text-emerald-700 font-medium" style={{ fontSize: '12px' }}>
                {OFFICE_CONFIG.name} · {Math.round(distance)} m
              </span>
            </div>
            <p className="text-slate-300 mt-6" style={{ fontSize: '12px' }}>Selfie proof recorded</p>
            <button
              onClick={onClose}
              className="mt-5 px-8 py-3 bg-slate-100 rounded-2xl text-slate-600 font-semibold active:scale-95 transition-transform"
              style={{ fontSize: '14px' }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
