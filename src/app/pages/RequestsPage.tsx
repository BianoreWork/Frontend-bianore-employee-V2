import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, Filter, ChevronRight, Clock,
  CalendarDays, CheckCircle2, XCircle, FileText, History, X,
  Umbrella, Key, Thermometer, PenLine, Timer, type LucideIcon,
} from 'lucide-react';
import { REQUEST_TYPE_META, STATUS_META } from '../data/requestsStore';
import type { RequestType, RequestStatus } from '../data/requestsStore';
import { requestsService, type MappedRequest, type FrontendRequestType, type FrontendRequestStatus } from '../../services/requestsService';
import { ApiError } from '../../lib/api';

const REQUEST_TYPES: { type: FrontendRequestType; Icon: LucideIcon; label: string; desc: string; color: string; bg: string }[] = [
  { type: 'leave',                 Icon: Umbrella,     label: 'Leave',          desc: 'Annual or special leave',          color: 'text-blue-700',   bg: 'bg-blue-50'   },
  { type: 'permission',            Icon: Key,          label: 'Permission',     desc: 'Permission for a specific date',   color: 'text-purple-700', bg: 'bg-purple-50' },
  { type: 'sick_leave',            Icon: Thermometer,  label: 'Sick Leave',     desc: 'Sick leave with medical note',     color: 'text-red-700',    bg: 'bg-red-50'    },
  { type: 'attendance_correction', Icon: PenLine,      label: 'Attendance Fix', desc: 'Fix missing/incorrect attendance', color: 'text-orange-700', bg: 'bg-orange-50' },
  { type: 'overtime',              Icon: Timer,        label: 'Overtime',       desc: 'Overtime before or after shift',   color: 'text-amber-700',  bg: 'bg-amber-50'  },
];

const FILTER_TABS: { key: 'all' | FrontendRequestStatus; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'pending',  label: 'Pending'  },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function RequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<MappedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | FrontendRequestStatus>('all');
  const [showTypeSheet, setShowTypeSheet] = useState(false);
  const [showAdvFilter, setShowAdvFilter] = useState(false);
  const [advType, setAdvType] = useState<FrontendRequestType | 'all'>('all');
  const [advStatus, setAdvStatus] = useState<FrontendRequestStatus | 'all'>('all');
  const loadRequests = () => {
    setLoading(true);
    setError('');
    requestsService.getRequests()
      .then(res => setRequests(res.data))
      .catch(err => {
        if (err instanceof ApiError) setError(err.message);
        else setError('Failed to load requests. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRequests();
  }, []);


  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const counts = {
    pending:   requests.filter(r => r.status === 'pending').length,
    approved:  requests.filter(r => r.status === 'approved').length,
    rejected:  requests.filter(r => r.status === 'rejected').length,
    thisMonth: requests.filter(r => (r.submittedAt ?? r.createdAt).startsWith(thisMonth)).length,
  };

  const filtered = requests.filter(r => {
    const byTab    = filter === 'all' || r.status === filter;
    const byType   = advType === 'all' || r.type === advType;
    const byStatus = advStatus === 'all' || r.status === advStatus;
    return byTab && byType && byStatus;
  });

  return (
    <div className="pb-6">
      {/* Summary cards */}
      <div className="px-4 pt-4 grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Pending',    value: counts.pending,   color: 'text-amber-600',   bg: 'bg-amber-50'   },
          { label: 'Approved',   value: counts.approved,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Rejected',   value: counts.rejected,  color: 'text-red-600',     bg: 'bg-red-50'     },
          { label: 'This Month', value: counts.thisMonth, color: 'text-blue-600',    bg: 'bg-blue-50'    },
        ].map(c => (
          <div key={c.label} className={`${c.bg} rounded-2xl p-3 text-center`}>
            <p className={`font-bold ${c.color}`} style={{ fontSize: '22px' }}>
              {loading ? '—' : c.value}
            </p>
            <p className="text-slate-400" style={{ fontSize: '10px' }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Quick action chips */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-slate-700 font-semibold" style={{ fontSize: '13px' }}>Quick Actions</p>
          <button
            onClick={() => setShowTypeSheet(true)}
            className="flex items-center gap-1 text-blue-600"
            style={{ fontSize: '12px' }}
          >
            <Plus size={14} /> New Request
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {REQUEST_TYPES.map(t => (
            <button
              key={t.type}
              onClick={() => navigate(`/dashboard/requests/form/${t.type}`)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl ${t.bg} active:scale-95 transition-transform`}
            >
              <t.Icon size={14} className={t.color} />
              <span className={`font-semibold ${t.color}`} style={{ fontSize: '12px' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* History shortcut */}
      <div className="px-4 mb-4">
        <button
          onClick={() => navigate('/dashboard/requests/history')}
          className="w-full flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3 active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <History size={17} className="text-slate-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-slate-700 font-semibold" style={{ fontSize: '13px' }}>Request History</p>
            <p className="text-slate-400" style={{ fontSize: '11px' }}>View all past requests with filters</p>
          </div>
          <ChevronRight size={15} className="text-slate-300" />
        </button>
      </div>

      {/* Filter tabs + advanced filter */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex gap-1 bg-slate-100 p-1 rounded-2xl">
            {FILTER_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`flex-1 py-1.5 rounded-xl transition-all ${
                  filter === t.key ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'
                }`}
                style={{ fontSize: '12px', fontWeight: filter === t.key ? 600 : 400 }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAdvFilter(true)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              advType !== 'all' || advStatus !== 'all' ? 'bg-blue-600' : 'bg-slate-100'
            }`}
          >
            <Filter size={15} className={advType !== 'all' || advStatus !== 'all' ? 'text-white' : 'text-slate-500'} />
          </button>
        </div>
      </div>

      {/* Request list */}
      <div className="px-4">
        <p className="text-slate-700 font-semibold mb-3" style={{ fontSize: '13px' }}>
          {filter === 'all' ? 'Recent Requests' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Requests`}
          <span className="text-slate-400 font-normal ml-1">({loading ? '…' : filtered.length})</span>
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
            <p className="text-red-600 mb-3" style={{ fontSize: '13px' }}>{error}</p>
            <button onClick={loadRequests} className="text-blue-600 font-semibold" style={{ fontSize: '13px' }}>
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} onCreateRequest={() => setShowTypeSheet(true)} />
        ) : (
          <div className="space-y-3">
            {filtered.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                onClick={() => navigate(`/dashboard/requests/${req.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {showTypeSheet && (
        <TypeSelectionSheet
          onSelect={type => { setShowTypeSheet(false); navigate(`/dashboard/requests/form/${type}`); }}
          onClose={() => setShowTypeSheet(false)}
        />
      )}

      {showAdvFilter && (
        <AdvancedFilterSheet
          advType={advType}
          advStatus={advStatus}
          onApply={(t, s) => { setAdvType(t); setAdvStatus(s); setShowAdvFilter(false); }}
          onClose={() => setShowAdvFilter(false)}
        />
      )}


    </div>
  );
}

function RequestCard({ req, onClick }: { req: MappedRequest; onClick: () => void }) {
  const tm = REQUEST_TYPE_META[req.type as RequestType];
  const sm = STATUS_META[req.status as RequestStatus];
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-3xl p-4 border border-slate-100 text-left active:scale-98 transition-transform shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-2xl ${tm.bg} flex items-center justify-center flex-shrink-0`}>
          <tm.Icon size={18} className={tm.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-slate-800 font-semibold" style={{ fontSize: '14px' }}>{tm.label}</span>
            <span className={`px-2 py-0.5 rounded-full font-semibold ${sm.bg} ${sm.color}`} style={{ fontSize: '10px' }}>
              {sm.label}
            </span>
          </div>
          <p className="text-slate-400 truncate" style={{ fontSize: '12px' }}>{req.reason || req.title}</p>
          <div className="flex items-center gap-3 mt-1.5">
            {req.startDate && (
              <span className="flex items-center gap-1 text-slate-400" style={{ fontSize: '11px' }}>
                <CalendarDays size={10} /> {formatDate(req.startDate)}
              </span>
            )}
            {req.submittedAt && (
              <span className="flex items-center gap-1 text-slate-300" style={{ fontSize: '11px' }}>
                <Clock size={10} /> {formatDate(req.submittedAt)}
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={14} className="text-slate-300 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

function EmptyState({ filter, onCreateRequest }: { filter: string; onCreateRequest: () => void }) {
  const msgs: Record<string, { icon: React.ReactNode; title: string; sub: string }> = {
    all:      { icon: <FileText size={36} className="text-slate-300" />,     title: 'No requests yet',       sub: 'Create a request when you need leave, correction, or overtime approval.' },
    pending:  { icon: <Clock size={36} className="text-slate-300" />,        title: 'No pending requests',   sub: 'All your requests have been processed.' },
    approved: { icon: <CheckCircle2 size={36} className="text-slate-300" />, title: 'No approved requests',  sub: 'Your approved requests will appear here.' },
    rejected: { icon: <XCircle size={36} className="text-slate-300" />,      title: 'No rejected requests',  sub: 'Your rejected requests will appear here.' },
  };
  const m = msgs[filter] || msgs.all;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
        {m.icon}
      </div>
      <p className="text-slate-600 font-semibold mb-1" style={{ fontSize: '15px' }}>{m.title}</p>
      <p className="text-slate-400 mb-5" style={{ fontSize: '13px' }}>{m.sub}</p>
      {filter === 'all' && (
        <button
          onClick={onCreateRequest}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-semibold active:scale-95 transition-transform"
          style={{ fontSize: '14px' }}
        >
          <Plus size={16} /> Create Request
        </button>
      )}
    </div>
  );
}

function TypeSelectionSheet({ onSelect, onClose }: { onSelect: (t: FrontendRequestType) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ maxWidth: 430, margin: '0 auto' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl p-5 pb-8">
        <div className="flex items-center justify-between mb-5">
          <p className="text-slate-800 font-bold" style={{ fontSize: '18px' }}>Create Request</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X size={15} className="text-slate-500" />
          </button>
        </div>
        <div className="space-y-2">
          {REQUEST_TYPES.map(t => (
            <button
              key={t.type}
              onClick={() => onSelect(t.type)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 active:scale-98 transition-transform"
            >
              <div className={`w-12 h-12 rounded-2xl ${t.bg} flex items-center justify-center flex-shrink-0`}>
                <t.Icon size={22} className={t.color} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-slate-800 font-semibold" style={{ fontSize: '14px' }}>{t.label}</p>
                <p className="text-slate-400" style={{ fontSize: '12px' }}>{t.desc}</p>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdvancedFilterSheet({
  advType, advStatus, onApply, onClose,
}: {
  advType: FrontendRequestType | 'all';
  advStatus: FrontendRequestStatus | 'all';
  onApply: (t: FrontendRequestType | 'all', s: FrontendRequestStatus | 'all') => void;
  onClose: () => void;
}) {
  const [localType, setLocalType] = useState(advType);
  const [localStatus, setLocalStatus] = useState(advStatus);

  const types: (FrontendRequestType | 'all')[] = ['all', 'leave', 'permission', 'sick_leave', 'attendance_correction', 'overtime'];
  const statuses: (FrontendRequestStatus | 'all')[] = ['all', 'draft', 'pending', 'approved', 'rejected', 'cancelled', 'needs_revision'];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ maxWidth: 430, margin: '0 auto' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl p-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-800 font-bold" style={{ fontSize: '17px' }}>Filter Requests</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X size={15} className="text-slate-500" />
          </button>
        </div>

        <p className="text-slate-500 font-semibold mb-2" style={{ fontSize: '11px' }}>REQUEST TYPE</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setLocalType(t)}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                localType === t ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600'
              }`}
              style={{ fontSize: '12px', fontWeight: 500 }}
            >
              {t === 'all' ? 'All Types' : REQUEST_TYPE_META[t as RequestType].label}
            </button>
          ))}
        </div>

        <p className="text-slate-500 font-semibold mb-2" style={{ fontSize: '11px' }}>STATUS</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setLocalStatus(s)}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                localStatus === s ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600'
              }`}
              style={{ fontSize: '12px', fontWeight: 500 }}
            >
              {s === 'all' ? 'All Statuses' : STATUS_META[s as RequestStatus].label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setLocalType('all'); setLocalStatus('all'); }}
            className="flex-1 border-2 border-slate-200 rounded-2xl text-slate-600 font-semibold"
            style={{ height: 48, fontSize: '14px' }}
          >
            Reset
          </button>
          <button
            onClick={() => onApply(localType, localStatus)}
            className="flex-1 bg-blue-600 text-white rounded-2xl font-semibold"
            style={{ height: 48, fontSize: '14px' }}
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
}
