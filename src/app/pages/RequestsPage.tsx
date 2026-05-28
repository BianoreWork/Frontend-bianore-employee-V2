import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, ChevronRight, Clock, X,
  Umbrella, Key, Thermometer, PenLine, Timer,
  Banknote, Package, UserCheck, ArrowLeftRight,
} from 'lucide-react';
import { REQUEST_TYPE_META, STATUS_META, ABSENSI_TYPES, OPERASIONAL_TYPES } from '../data/requestsStore';
import type { RequestType } from '../data/requestsStore';
import { requestsService, type MappedRequest } from '../../services/requestsService';
import { ApiError } from '../../lib/api';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

type Tab = 'semua' | 'absensi' | 'operasional';

const TABS: { key: Tab; label: string }[] = [
  { key: 'semua',       label: 'Semua'       },
  { key: 'absensi',     label: 'Absensi'     },
  { key: 'operasional', label: 'Operasional' },
];

const ABSENSI_GROUP = [
  { type: 'leave' as RequestType,                 Icon: Umbrella,      label: 'Cuti',            desc: 'Cuti tahunan atau khusus',           color: 'text-blue-700',   bg: 'bg-blue-50'    },
  { type: 'permission' as RequestType,            Icon: Key,           label: 'Izin',            desc: 'Izin tidak masuk kerja',             color: 'text-purple-700', bg: 'bg-purple-50'  },
  { type: 'sick_leave' as RequestType,            Icon: Thermometer,   label: 'Sakit',           desc: 'Ijin sakit dengan surat dokter',     color: 'text-red-700',    bg: 'bg-red-50'     },
  { type: 'attendance_correction' as RequestType, Icon: PenLine,       label: 'Koreksi Absensi', desc: 'Perbaiki data absensi yang keliru',  color: 'text-orange-700', bg: 'bg-orange-50'  },
  { type: 'overtime' as RequestType,              Icon: Timer,         label: 'Lembur',          desc: 'Pengajuan lembur di luar jam kerja', color: 'text-amber-700',  bg: 'bg-amber-50'   },
];

const OPERASIONAL_GROUP = [
  { type: 'cash_advance' as RequestType,       Icon: Banknote,       label: 'Kasbon',            desc: 'Pengajuan uang muka gaji',          color: 'text-emerald-700', bg: 'bg-emerald-50' },
  { type: 'item_request' as RequestType,       Icon: Package,        label: 'Permintaan Barang', desc: 'Request peralatan atau kebutuhan',  color: 'text-teal-700',    bg: 'bg-teal-50'    },
  { type: 'shift_substitution' as RequestType, Icon: UserCheck,      label: 'Ganti Shift',       desc: 'Minta rekan gantikan shift kamu',   color: 'text-indigo-700',  bg: 'bg-indigo-50'  },
  { type: 'shift_swap' as RequestType,         Icon: ArrowLeftRight, label: 'Tukar Shift',       desc: 'Tukar jadwal shift dengan rekan',   color: 'text-violet-700',  bg: 'bg-violet-50'  },
];

function fmtDate(dateStr: string | null) {
  if (!dateStr) return '—';
  try { return format(parseISO(dateStr), 'd MMM yyyy', { locale: localeId }); } catch { return dateStr; }
}

function getSubtitle(r: MappedRequest): string {
  if (r.startDate)       return fmtDate(r.startDate) + (r.endDate && r.endDate !== r.startDate ? ` – ${fmtDate(r.endDate)}` : '');
  if (r.attendanceDate)  return fmtDate(r.attendanceDate);
  if (r.overtimeDate)    return fmtDate(r.overtimeDate);
  return fmtDate(r.createdAt);
}

function RequestCard({ r, onClick }: { r: MappedRequest; onClick: () => void }) {
  const meta   = REQUEST_TYPE_META[r.type as RequestType];
  const sMeta  = STATUS_META[r.status];
  if (!meta || !sMeta) return null;
  const Icon = meta.Icon;
  return (
    <div onClick={onClick} className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0 active:bg-slate-50 cursor-pointer">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
        <Icon size={17} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-800 font-semibold truncate" style={{ fontSize: '13px' }}>{r.title}</p>
        <p className="text-slate-400 flex items-center gap-1 mt-0.5" style={{ fontSize: '11px' }}>
          <Clock size={10} /> {getSubtitle(r)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={`px-2 py-0.5 rounded-full font-semibold ${sMeta.bg} ${sMeta.color}`} style={{ fontSize: '10px' }}>
          {sMeta.label}
        </span>
        <ChevronRight size={14} className="text-slate-300" />
      </div>
    </div>
  );
}

function NewRequestSheet({ open, onClose, onSelect }: {
  open: boolean; onClose: () => void; onSelect: (type: RequestType) => void;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-white rounded-t-3xl z-50 pb-8 overflow-y-auto" style={{ maxWidth: '430px', maxHeight: '85dvh' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <p className="text-slate-800 font-bold" style={{ fontSize: '16px' }}>Buat Pengajuan</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="px-5 mb-1">
          <p className="text-xs font-semibold text-slate-400 mb-3 tracking-wider">ABSENSI</p>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            {ABSENSI_GROUP.map((item, i) => (
              <button key={item.type} onClick={() => { onSelect(item.type); onClose(); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 transition-colors text-left ${i < ABSENSI_GROUP.length - 1 ? 'border-b border-slate-50' : ''}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                  <item.Icon size={18} className={item.color} />
                </div>
                <div className="flex-1">
                  <p className="text-slate-800 font-semibold" style={{ fontSize: '13px' }}>{item.label}</p>
                  <p className="text-slate-400" style={{ fontSize: '11px' }}>{item.desc}</p>
                </div>
                <ChevronRight size={15} className="text-slate-300" />
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 mt-5">
          <p className="text-xs font-semibold text-slate-400 mb-3 tracking-wider">OPERASIONAL</p>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            {OPERASIONAL_GROUP.map((item, i) => (
              <button key={item.type} onClick={() => { onSelect(item.type); onClose(); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 transition-colors text-left ${i < OPERASIONAL_GROUP.length - 1 ? 'border-b border-slate-50' : ''}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                  <item.Icon size={18} className={item.color} />
                </div>
                <div className="flex-1">
                  <p className="text-slate-800 font-semibold" style={{ fontSize: '13px' }}>{item.label}</p>
                  <p className="text-slate-400" style={{ fontSize: '11px' }}>{item.desc}</p>
                </div>
                <ChevronRight size={15} className="text-slate-300" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function EmptyState({ tab, onNew }: { tab: Tab; onNew: () => void }) {
  const msgs: Record<Tab, { title: string; desc: string }> = {
    semua:       { title: 'Belum ada pengajuan', desc: 'Buat pengajuan pertama kamu di sini.' },
    absensi:     { title: 'Tidak ada pengajuan absensi', desc: 'Cuti, izin, sakit, koreksi, dan lembur akan muncul di sini.' },
    operasional: { title: 'Belum ada pengajuan operasional', desc: 'Kasbon, barang, ganti/tukar shift akan muncul di sini.' },
  };
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
        <Plus size={26} className="text-blue-400" />
      </div>
      <p className="text-slate-700 font-semibold mb-1" style={{ fontSize: '15px' }}>{msgs[tab].title}</p>
      <p className="text-slate-400 mb-5" style={{ fontSize: '13px' }}>{msgs[tab].desc}</p>
      <button onClick={onNew} className="px-5 py-2.5 bg-blue-600 text-white rounded-2xl font-semibold" style={{ fontSize: '13px' }}>
        Buat Pengajuan
      </button>
    </div>
  );
}

export default function RequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<MappedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('semua');
  const [showSheet, setShowSheet] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    requestsService.getRequests()
      .then(res => setRequests(res.data))
      .catch(err => setError(err instanceof ApiError ? err.message : 'Gagal memuat data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const counts = {
    pending:   requests.filter(r => r.status === 'pending').length,
    approved:  requests.filter(r => r.status === 'approved').length,
    rejected:  requests.filter(r => r.status === 'rejected').length,
    thisMonth: requests.filter(r => (r.submittedAt ?? r.createdAt).startsWith(thisMonth)).length,
  };

  const filtered = requests.filter(r => {
    if (tab === 'absensi')     return ABSENSI_TYPES.includes(r.type as RequestType);
    if (tab === 'operasional') return OPERASIONAL_TYPES.includes(r.type as RequestType);
    return true;
  });

  return (
    <div className="pb-6">
      {/* Stats */}
      <div className="px-4 pt-4 grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Menunggu',  value: counts.pending,   color: 'text-amber-600',   bg: 'bg-amber-50'   },
          { label: 'Disetujui', value: counts.approved,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Ditolak',   value: counts.rejected,  color: 'text-red-600',     bg: 'bg-red-50'     },
          { label: 'Bulan Ini', value: counts.thisMonth, color: 'text-blue-600',    bg: 'bg-blue-50'    },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-2.5 flex flex-col items-center`}>
            <span className={`font-bold ${s.color}`} style={{ fontSize: '18px' }}>{s.value}</span>
            <span className="text-slate-500 text-center leading-tight mt-0.5" style={{ fontSize: '9px' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="bg-slate-100 rounded-2xl p-1 flex gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 rounded-xl py-2 font-semibold transition-all ${tab === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              style={{ fontSize: '12px' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* New request button */}
      <div className="px-4 mb-4">
        <button onClick={() => setShowSheet(true)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-2xl font-semibold shadow-sm shadow-blue-200 active:bg-blue-700"
          style={{ height: '44px', fontSize: '13px' }}>
          <Plus size={16} /> Buat Pengajuan
        </button>
      </div>

      {/* List */}
      <div className="px-4">
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded-full animate-pulse w-3/4" />
                  <div className="h-2.5 bg-slate-100 rounded-full animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-3xl px-4 py-5 text-center">
            <p className="text-red-600 mb-3" style={{ fontSize: '13px' }}>{error}</p>
            <button onClick={load} className="text-blue-600 font-semibold" style={{ fontSize: '13px' }}>Coba Lagi</button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState tab={tab} onNew={() => setShowSheet(true)} />
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            {filtered.map(r => (
              <RequestCard key={r.id} r={r} onClick={() => navigate(`/dashboard/requests/${r.id}`)} />
            ))}
          </div>
        )}
      </div>

      <NewRequestSheet open={showSheet} onClose={() => setShowSheet(false)} onSelect={t => navigate(`/dashboard/requests/form/${t}`)} />
    </div>
  );
}
