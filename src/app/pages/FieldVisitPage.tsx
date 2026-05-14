import { useState } from 'react';
import { MapPin, Camera, Send, CheckCircle2, Clock, AlertTriangle, Navigation, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

interface VisitRecord {
  id: number;
  client: string;
  purpose: string;
  location: string;
  date: string;
  time: string;
  note: string;
  status: 'Submitted' | 'Verified' | 'Flagged';
  photo?: string;
}

const visitHistory: VisitRecord[] = [
  {
    id: 1, client: 'PT Cahaya Nusantara', purpose: 'Product Demo',
    location: 'Jl. Sudirman No.12, Jakarta', date: 'May 7', time: '10:30 AM',
    note: 'Presented new product line. Interested in bulk order.',
    status: 'Verified',
    photo: 'https://images.unsplash.com/photo-1758691736067-b309ee3ef7b9?w=80&h=80&fit=crop',
  },
  {
    id: 2, client: 'CV Mitra Abadi', purpose: 'Contract Renewal',
    location: 'Jl. Thamrin No.45, Jakarta', date: 'May 6', time: '02:00 PM',
    note: 'Discussed 1-year renewal. Follow-up needed.',
    status: 'Submitted',
  },
  {
    id: 3, client: 'Toko Besar Sejahtera', purpose: 'Cold Visit',
    location: 'Pasar Tanah Abang, Jakarta', date: 'May 4', time: '11:00 AM',
    note: 'GPS location mismatch detected.', status: 'Flagged',
  },
];

const statusConfig = {
  Submitted: { color: 'text-blue-600', bg: 'bg-blue-50' },
  Verified: { color: 'text-emerald-600', bg: 'bg-emerald-50' },
  Flagged: { color: 'text-red-600', bg: 'bg-red-50' },
};

export default function FieldVisitPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [visitActive, setVisitActive] = useState(false);
  const [gpsDetected, setGpsDetected] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ client: '', purpose: '', note: '' });
  const [loading, setLoading] = useState(false);

  const handleStartVisit = () => {
    setLoading(true);
    setTimeout(() => { setGpsDetected(true); setVisitActive(true); setLoading(false); }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setSubmitted(true); setLoading(false); }, 1000);
  };

  return (
    <div className="pb-4">
      {/* Tabs */}
      <div className="px-4 pt-4 mb-4">
        <div className="bg-slate-100 rounded-2xl p-1 flex">
          {[
            { key: 'new', label: 'New Visit' },
            { key: 'history', label: 'History' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as 'new' | 'history')}
              className={`flex-1 py-2 rounded-xl transition-all ${tab === t.key ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
              style={{ fontSize: '13px', fontWeight: 600 }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'new' ? (
        <div className="px-4">
          {!submitted ? (
            <>
              {/* GPS Card */}
              <div className={`rounded-3xl p-4 mb-4 border-2 transition-all ${gpsDetected ? 'border-emerald-200 bg-emerald-50' : 'border-dashed border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${gpsDetected ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                    <Navigation size={20} className={gpsDetected ? 'text-emerald-600' : 'text-slate-400'} />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-800 font-semibold" style={{ fontSize: '13px' }}>
                      {gpsDetected ? 'Location Detected' : 'GPS Location'}
                    </p>
                    <p className="text-slate-500 mt-0.5" style={{ fontSize: '12px' }}>
                      {gpsDetected ? 'Jl. Sudirman, Jakarta (-6.20, 106.84)' : 'Tap start to detect your location'}
                    </p>
                  </div>
                  {gpsDetected && (
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1" style={{ fontSize: '11px' }}>
                      <CheckCircle2 size={10} className="flex-shrink-0" />
                      Verified
                    </span>
                  )}
                </div>
              </div>

              {!visitActive ? (
                <button
                  onClick={handleStartVisit}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-bold rounded-3xl flex items-center justify-center gap-3 shadow-xl shadow-blue-200 active:scale-95 transition-all mb-4"
                  style={{ height: '64px', fontSize: '16px' }}
                >
                  {loading ? (
                    <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  ) : <MapPin size={22} />}
                  {loading ? 'Detecting GPS...' : 'Start Visit'}
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-slate-600 mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>Client / Customer *</label>
                    <input
                      type="text"
                      value={formData.client}
                      onChange={e => setFormData(p => ({ ...p, client: e.target.value }))}
                      placeholder="e.g. PT Maju Sejahtera"
                      required
                      className="w-full px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder-slate-400"
                      style={{ height: '48px', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>Visit Purpose *</label>
                    <select
                      value={formData.purpose}
                      onChange={e => setFormData(p => ({ ...p, purpose: e.target.value }))}
                      required
                      className="w-full px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 outline-none focus:border-blue-500 transition-all"
                      style={{ height: '48px', fontSize: '14px' }}
                    >
                      <option value="">Select purpose...</option>
                      <option>Product Demo</option>
                      <option>Contract Renewal</option>
                      <option>Issue Resolution</option>
                      <option>Cold Visit</option>
                      <option>Follow-up</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>Notes</label>
                    <textarea
                      value={formData.note}
                      onChange={e => setFormData(p => ({ ...p, note: e.target.value }))}
                      placeholder="Visit outcome, follow-ups..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder-slate-400 resize-none"
                      style={{ fontSize: '14px' }}
                    />
                  </div>

                  {/* Photo upload */}
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center bg-slate-50">
                    <Camera size={22} className="text-slate-400 mx-auto mb-1.5" />
                    <p className="text-slate-500" style={{ fontSize: '13px' }}>Upload photo proof</p>
                    <p className="text-slate-400" style={{ fontSize: '11px' }}>JPG, PNG up to 10MB</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                    style={{ height: '52px', fontSize: '15px' }}
                  >
                    {loading ? (
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                    ) : <Send size={17} />}
                    Submit Report
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-8 text-center">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
              <p className="text-emerald-800 font-bold mb-1" style={{ fontSize: '16px' }}>Report Submitted!</p>
              <p className="text-emerald-600 mb-5" style={{ fontSize: '13px' }}>Your visit has been submitted for verification.</p>
              <button
                onClick={() => { setSubmitted(false); setVisitActive(false); setGpsDetected(false); setFormData({ client: '', purpose: '', note: '' }); }}
                className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-2xl" style={{ fontSize: '13px' }}
              >
                Record New Visit
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {visitHistory.map(visit => {
            const sCfg = statusConfig[visit.status];
            const StatusIcon = visit.status === 'Verified' ? CheckCircle2 : visit.status === 'Flagged' ? AlertTriangle : Send;
            return (
              <div key={visit.id} className="bg-white rounded-3xl p-4 border border-slate-100">
                <div className="flex items-start gap-3">
                  {visit.photo ? (
                    <img src={visit.photo} alt="Visit" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Camera size={18} className="text-slate-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-slate-800 font-semibold" style={{ fontSize: '13px' }}>{visit.client}</p>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${sCfg.bg} ${sCfg.color}`} style={{ fontSize: '11px' }}>
                        <StatusIcon size={10} />
                        {visit.status}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-0.5" style={{ fontSize: '12px' }}>{visit.purpose}</p>
                    <div className="flex items-center gap-1 mt-1.5 text-slate-400" style={{ fontSize: '11px' }}>
                      <Clock size={11} />{visit.date}, {visit.time} ·
                      <MapPin size={11} className="ml-1" /> {visit.location}
                    </div>
                    {visit.note && (
                      <p className="text-slate-400 mt-1.5 italic" style={{ fontSize: '11px' }}>"{visit.note}"</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
