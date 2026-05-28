import { useState } from 'react';
import {
  MapPin, Camera, CheckCircle2, Clock, AlertTriangle, Navigation,
  X, ChevronRight, Play, Send, Filter, Calendar, Package,
  Truck, Eye, Clipboard,
} from 'lucide-react';

type VisitStatus = 'assigned' | 'active' | 'completed' | 'submitted' | 'verified' | 'flagged';
type VisitType   = 'kunjungan' | 'pengiriman' | 'delivery' | 'survey' | 'lainnya';
type FieldTab    = 'baru' | 'aktif' | 'riwayat';

interface VisitTask { id: number; label: string; done: boolean; }

interface FieldVisit {
  id: number;
  client: string;
  purpose: string;
  location: string;
  scheduledDate: string;
  scheduledTime: string;
  notes: string;
  status: VisitStatus;
  type: VisitType;
  photo?: string;
  tasks: VisitTask[];
  completedAt?: string;
  adminNote?: string;
}

const TYPE_CFG: Record<VisitType, { label: string; Icon: typeof MapPin; color: string; bg: string }> = {
  kunjungan: { label: 'Kunjungan', Icon: MapPin,      color: 'text-blue-600',   bg: 'bg-blue-50'   },
  pengiriman:{ label: 'Pengiriman',Icon: Package,     color: 'text-indigo-600', bg: 'bg-indigo-50' },
  delivery:  { label: 'Delivery',  Icon: Truck,       color: 'text-violet-600', bg: 'bg-violet-50' },
  survey:    { label: 'Survey',    Icon: Clipboard,   color: 'text-teal-600',   bg: 'bg-teal-50'   },
  lainnya:   { label: 'Lainnya',   Icon: Eye,         color: 'text-slate-600',  bg: 'bg-slate-100' },
};

const STATUS_CFG: Record<VisitStatus, { label: string; color: string; bg: string }> = {
  assigned:  { label: 'Ditugaskan', color: 'text-blue-600',    bg: 'bg-blue-50'    },
  active:    { label: 'Aktif',      color: 'text-amber-600',   bg: 'bg-amber-50'   },
  completed: { label: 'Selesai',    color: 'text-emerald-600', bg: 'bg-emerald-50' },
  submitted: { label: 'Dikirim',    color: 'text-teal-600',    bg: 'bg-teal-50'    },
  verified:  { label: 'Terverifikasi', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  flagged:   { label: 'Ditandai',   color: 'text-red-600',     bg: 'bg-red-50'     },
};

const MOCK_VISITS: FieldVisit[] = [
  {
    id: 1, client: 'PT Cahaya Nusantara', purpose: 'Demo Produk', type: 'kunjungan',
    location: 'Jl. Sudirman No.12, Jakarta Pusat', scheduledDate: '2026-05-28', scheduledTime: '10:00',
    notes: 'Presentasi lini produk baru. Siapkan katalog dan unit sample.',
    status: 'assigned',
    tasks: [
      { id: 1, label: 'Konfirmasi jadwal dengan klien', done: false },
      { id: 2, label: 'Siapkan materi presentasi', done: false },
      { id: 3, label: 'Foto lokasi saat tiba', done: false },
    ],
    adminNote: 'Klien tertarik paket enterprise. Fokus pada fitur integrasi.',
  },
  {
    id: 2, client: 'CV Mitra Karya', purpose: 'Perpanjangan Kontrak', type: 'kunjungan',
    location: 'Jl. Thamrin No.45, Jakarta Selatan', scheduledDate: '2026-05-29', scheduledTime: '14:00',
    notes: 'Diskusi perpanjangan kontrak 1 tahun. Bawa draft perjanjian.',
    status: 'assigned',
    tasks: [
      { id: 1, label: 'Bawa draft kontrak', done: false },
      { id: 2, label: 'Review poin negosiasi', done: false },
    ],
    adminNote: undefined,
  },
  {
    id: 3, client: 'Toko Besar Sejahtera', purpose: 'Pengiriman Barang', type: 'pengiriman',
    location: 'Pasar Tanah Abang Blok B, Jakarta', scheduledDate: '2026-05-27', scheduledTime: '09:00',
    notes: 'Pengiriman 3 karton produk. Minta tanda terima.',
    status: 'active',
    tasks: [
      { id: 1, label: 'Cek kondisi barang sebelum berangkat', done: true },
      { id: 2, label: 'Foto barang saat tiba di lokasi', done: true },
      { id: 3, label: 'Dapatkan tanda tangan penerima', done: false },
      { id: 4, label: 'Upload bukti pengiriman', done: false },
    ],
    adminNote: undefined,
  },
  {
    id: 4, client: 'PT Maju Sejahtera', purpose: 'Follow-up Meeting', type: 'kunjungan',
    location: 'Jl. Gatot Subroto No.7, Jakarta', scheduledDate: '2026-05-20', scheduledTime: '11:00',
    notes: 'Follow up proposal yang dikirim minggu lalu.',
    status: 'verified',
    photo: 'https://images.unsplash.com/photo-1664575601711-486af9a7baf5?w=80&h=80&fit=crop',
    tasks: [], completedAt: '2026-05-20',
    adminNote: undefined,
  },
  {
    id: 5, client: 'CV Anugerah Teknik', purpose: 'Survey Lokasi', type: 'survey',
    location: 'Kawasan Industri MM2100, Bekasi', scheduledDate: '2026-05-18', scheduledTime: '13:00',
    notes: 'Survey untuk kebutuhan instalasi sistem baru.',
    status: 'submitted',
    tasks: [], completedAt: '2026-05-18',
    adminNote: undefined,
  },
  {
    id: 6, client: 'Apotek Sehat Prima', purpose: 'Cold Visit', type: 'kunjungan',
    location: 'Jl. Kemang Raya No.33, Jakarta Selatan', scheduledDate: '2026-05-15', scheduledTime: '10:30',
    notes: 'GPS location mismatch detected.',
    status: 'flagged',
    tasks: [], completedAt: '2026-05-15',
    adminNote: 'Koordinat GPS tidak sesuai dengan lokasi klien. Harap konfirmasi.',
  },
];

function fmtDate(d: string) {
  try {
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const [y, m, day] = d.split('-').map(Number);
    return `${day} ${months[m - 1]} ${y}`;
  } catch { return d; }
}

// ── Visit Detail Sheet ────────────────────────────────────────────────────────

function VisitDetailSheet({ visit, onClose, onStart }: {
  visit: FieldVisit;
  onClose: () => void;
  onStart?: (id: number) => void;
}) {
  const [tasks, setTasks] = useState(visit.tasks);
  const typeCfg   = TYPE_CFG[visit.type];
  const statusCfg = STATUS_CFG[visit.status];
  const TypeIcon  = typeCfg.Icon;

  const toggleTask = (id: number) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-white rounded-t-3xl z-50 overflow-y-auto"
        style={{ maxWidth: '430px', maxHeight: '75dvh' }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-2 pb-3">
          <div className="flex-1 pr-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${typeCfg.bg} ${typeCfg.color}`} style={{ fontSize: '10px' }}>
                <TypeIcon size={9} /> {typeCfg.label}
              </span>
              <span className={`px-2 py-0.5 rounded-full font-semibold ${statusCfg.bg} ${statusCfg.color}`} style={{ fontSize: '10px' }}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-slate-800 font-bold" style={{ fontSize: '15px' }}>{visit.client}</p>
            <p className="text-slate-500 mt-0.5" style={{ fontSize: '12px' }}>{visit.purpose}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
            <X size={15} className="text-slate-500" />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-4">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-2xl px-3 py-2.5">
              <p className="text-slate-400 mb-0.5" style={{ fontSize: '10px' }}>Tanggal</p>
              <p className="text-slate-700 font-semibold" style={{ fontSize: '12px' }}>{fmtDate(visit.scheduledDate)}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl px-3 py-2.5">
              <p className="text-slate-400 mb-0.5" style={{ fontSize: '10px' }}>Waktu</p>
              <p className="text-slate-700 font-semibold" style={{ fontSize: '12px' }}>{visit.scheduledTime}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl px-3 py-2.5 flex items-start gap-2">
            <MapPin size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-slate-700 font-medium" style={{ fontSize: '12px' }}>{visit.location}</p>
          </div>

          {visit.notes && (
            <div>
              <p className="text-slate-500 font-semibold mb-1.5" style={{ fontSize: '11px' }}>CATATAN</p>
              <p className="text-slate-600 leading-relaxed" style={{ fontSize: '13px' }}>{visit.notes}</p>
            </div>
          )}

          {visit.adminNote && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2.5 flex gap-2">
              <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700" style={{ fontSize: '12px' }}>{visit.adminNote}</p>
            </div>
          )}

          {/* Task checklist */}
          {tasks.length > 0 && (
            <div>
              <p className="text-slate-500 font-semibold mb-2" style={{ fontSize: '11px' }}>
                CHECKLIST ({tasks.filter(t => t.done).length}/{tasks.length})
              </p>
              <div className="space-y-2">
                {tasks.map(task => (
                  <button key={task.id} onClick={() => toggleTask(task.id)}
                    className="w-full flex items-center gap-3 bg-slate-50 rounded-2xl px-3 py-2.5 text-left">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${task.done ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                      {task.done && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span className={`flex-1 ${task.done ? 'line-through text-slate-400' : 'text-slate-700'}`} style={{ fontSize: '12px' }}>
                      {task.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Photo */}
          {visit.photo && (
            <div>
              <p className="text-slate-500 font-semibold mb-2" style={{ fontSize: '11px' }}>FOTO KUNJUNGAN</p>
              <img src={visit.photo} alt="Visit" className="w-full h-32 object-cover rounded-2xl" />
            </div>
          )}

          {/* Action */}
          {visit.status === 'assigned' && onStart && (
            <button onClick={() => { onStart(visit.id); onClose(); }}
              className="w-full bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:bg-blue-700"
              style={{ height: 48, fontSize: '14px' }}>
              <Play size={15} /> Mulai Kunjungan
            </button>
          )}
          {visit.status === 'active' && (
            <button className="w-full bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:bg-emerald-700"
              style={{ height: 48, fontSize: '14px' }}>
              <Send size={15} /> Submit Laporan
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FieldVisitPage() {
  const [tab, setTab] = useState<FieldTab>('baru');
  const [visits, setVisits] = useState<FieldVisit[]>(MOCK_VISITS);
  const [selectedVisit, setSelectedVisit] = useState<FieldVisit | null>(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState<VisitType | 'semua'>('semua');

  const handleStart = (id: number) => {
    setVisits(prev => prev.map(v => v.id === id ? { ...v, status: 'active' } : v));
    setTab('aktif');
  };

  const newVisits    = visits.filter(v => v.status === 'assigned');
  const activeVisits = visits.filter(v => v.status === 'active');
  const historyVisits = visits.filter(v => ['completed','submitted','verified','flagged'].includes(v.status)).filter(v => {
    if (filterDate && v.scheduledDate !== filterDate) return false;
    if (filterType !== 'semua' && v.type !== filterType) return false;
    return true;
  });

  const tabs: { key: FieldTab; label: string; count?: number }[] = [
    { key: 'baru',    label: 'Kunjungan Baru', count: newVisits.length    },
    { key: 'aktif',   label: 'Aktif',          count: activeVisits.length },
    { key: 'riwayat', label: 'Riwayat'                                    },
  ];

  return (
    <div className="pb-4">
      {/* Tabs */}
      <div className="px-4 pt-4 mb-4">
        <div className="bg-slate-100 rounded-2xl p-1 flex gap-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-xl font-semibold transition-all relative ${tab === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              style={{ fontSize: '11px' }}>
              {t.label}
              {t.count != null && t.count > 0 && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center ${tab === t.key ? 'bg-blue-500' : 'bg-slate-400'}`} style={{ fontSize: '9px' }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: Kunjungan Baru ── */}
      {tab === 'baru' && (
        <div className="px-4 space-y-3">
          {newVisits.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 py-14 text-center">
              <CheckCircle2 size={30} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold" style={{ fontSize: '14px' }}>Tidak ada kunjungan baru</p>
              <p className="text-slate-400 mt-1" style={{ fontSize: '12px' }}>Kunjungan yang ditugaskan admin akan muncul di sini</p>
            </div>
          ) : newVisits.map(visit => {
            const typeCfg = TYPE_CFG[visit.type];
            const TypeIcon = typeCfg.Icon;
            return (
              <div key={visit.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                <div className="px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${typeCfg.bg}`}>
                      <TypeIcon size={18} className={typeCfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 font-semibold" style={{ fontSize: '13px' }}>{visit.client}</p>
                      <p className="text-slate-500 mt-0.5" style={{ fontSize: '11px' }}>{visit.purpose}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-400" style={{ fontSize: '11px' }}>
                          <Calendar size={10} /> {fmtDate(visit.scheduledDate)}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400" style={{ fontSize: '11px' }}>
                          <Clock size={10} /> {visit.scheduledTime}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedVisit(visit)} className="mt-1">
                      <ChevronRight size={16} className="text-slate-300" />
                    </button>
                  </div>

                  {visit.adminNote && (
                    <div className="mt-3 bg-amber-50 rounded-2xl px-3 py-2 flex gap-2">
                      <AlertTriangle size={11} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-amber-700" style={{ fontSize: '11px' }}>{visit.adminNote}</p>
                    </div>
                  )}
                </div>

                <div className="flex border-t border-slate-50">
                  <button onClick={() => setSelectedVisit(visit)}
                    className="flex-1 py-3 text-slate-500 font-medium flex items-center justify-center gap-1.5 border-r border-slate-50"
                    style={{ fontSize: '12px' }}>
                    <Eye size={13} /> Detail
                  </button>
                  <button onClick={() => handleStart(visit.id)}
                    className="flex-1 py-3 text-blue-600 font-semibold flex items-center justify-center gap-1.5"
                    style={{ fontSize: '12px' }}>
                    <Navigation size={13} /> Mulai Kunjungan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB: Aktif ── */}
      {tab === 'aktif' && (
        <div className="px-4 space-y-3">
          {activeVisits.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 py-14 text-center">
              <Navigation size={30} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold" style={{ fontSize: '14px' }}>Tidak ada kunjungan aktif</p>
              <p className="text-slate-400 mt-1" style={{ fontSize: '12px' }}>Mulai kunjungan dari tab "Kunjungan Baru"</p>
            </div>
          ) : activeVisits.map(visit => {
            const typeCfg = TYPE_CFG[visit.type];
            const TypeIcon = typeCfg.Icon;
            const done = visit.tasks.filter(t => t.done).length;
            const total = visit.tasks.length;
            return (
              <div key={visit.id} className="bg-white rounded-3xl border-2 border-blue-200 overflow-hidden">
                {/* Active badge */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border-b border-blue-100">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <p className="text-blue-700 font-semibold" style={{ fontSize: '12px' }}>Kunjungan Sedang Berjalan</p>
                </div>

                <div className="px-4 py-3.5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${typeCfg.bg}`}>
                      <TypeIcon size={18} className={typeCfg.color} />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-800 font-bold" style={{ fontSize: '14px' }}>{visit.client}</p>
                      <p className="text-slate-500 mt-0.5 flex items-center gap-1" style={{ fontSize: '11px' }}>
                        <MapPin size={10} /> {visit.location}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {total > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-500 font-medium" style={{ fontSize: '11px' }}>Progress Checklist</span>
                        <span className="text-slate-500 font-medium" style={{ fontSize: '11px' }}>{done}/{total}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${total ? (done/total)*100 : 0}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Task checklist */}
                  <div className="space-y-1.5">
                    {visit.tasks.map(task => (
                      <div key={task.id} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${task.done ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${task.done ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                          {task.done && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5.5L7 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <span className={task.done ? 'line-through text-slate-400' : 'text-slate-700'} style={{ fontSize: '12px' }}>{task.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex border-t border-blue-100">
                  <button onClick={() => setSelectedVisit(visit)}
                    className="flex-1 py-3 text-slate-500 font-medium flex items-center justify-center gap-1.5 border-r border-blue-100"
                    style={{ fontSize: '12px' }}>
                    <Eye size={13} /> Detail
                  </button>
                  <button className="flex-1 py-3 text-emerald-600 font-semibold flex items-center justify-center gap-1.5" style={{ fontSize: '12px' }}>
                    <Send size={13} /> Submit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB: Riwayat ── */}
      {tab === 'riwayat' && (
        <div className="px-4">
          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <div className="flex items-center gap-1.5 flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5">
              <Calendar size={13} className="text-slate-400 flex-shrink-0" />
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                className="flex-1 bg-transparent outline-none text-slate-600 min-w-0" style={{ fontSize: '12px' }} />
              {filterDate && <button onClick={() => setFilterDate('')}><X size={12} className="text-slate-400" /></button>}
            </div>
            <div className="relative">
              <select value={filterType} onChange={e => setFilterType(e.target.value as VisitType | 'semua')}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-2xl pl-2.5 pr-7 py-2.5 text-slate-600 outline-none"
                style={{ fontSize: '12px' }}>
                <option value="semua">Semua</option>
                {(Object.keys(TYPE_CFG) as VisitType[]).map(t => (
                  <option key={t} value={t}>{TYPE_CFG[t].label}</option>
                ))}
              </select>
              <Filter size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {historyVisits.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 py-14 text-center">
              <Clock size={30} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold" style={{ fontSize: '14px' }}>Tidak ada riwayat</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historyVisits.map(visit => {
                const typeCfg   = TYPE_CFG[visit.type];
                const statusCfg = STATUS_CFG[visit.status];
                const TypeIcon  = typeCfg.Icon;
                return (
                  <button key={visit.id} onClick={() => setSelectedVisit(visit)}
                    className="w-full bg-white rounded-3xl border border-slate-100 p-4 flex items-center gap-3 text-left active:bg-slate-50">
                    {visit.photo ? (
                      <img src={visit.photo} alt="" className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${typeCfg.bg}`}>
                        <TypeIcon size={20} className={typeCfg.color} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 font-semibold truncate" style={{ fontSize: '13px' }}>{visit.client}</p>
                      <p className="text-slate-500 mt-0.5" style={{ fontSize: '11px' }}>{visit.purpose}</p>
                      <p className="text-slate-400 mt-0.5 flex items-center gap-1" style={{ fontSize: '11px' }}>
                        <Calendar size={10} /> {fmtDate(visit.scheduledDate)} · {visit.scheduledTime}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${statusCfg.bg} ${statusCfg.color}`} style={{ fontSize: '10px' }}>
                        {statusCfg.label}
                      </span>
                      <ChevronRight size={14} className="text-slate-300" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Visit detail sheet */}
      {selectedVisit && (
        <VisitDetailSheet
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onStart={handleStart}
        />
      )}
    </div>
  );
}
