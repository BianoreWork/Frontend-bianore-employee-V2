import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronLeft, Search, Filter, X, ChevronRight,
  CalendarDays, Clock, FileText,
} from 'lucide-react';
import { REQUEST_TYPE_META, STATUS_META } from '../data/requestsStore';
import type { RequestType, RequestStatus } from '../data/requestsStore';
import { requestsService, type MappedRequest, type FrontendRequestType, type FrontendRequestStatus } from '../../services/requestsService';
import { ApiError } from '../../lib/api';

const ALL_TYPES: (FrontendRequestType | 'all')[] = ['all', 'leave', 'permission', 'sick_leave', 'attendance_correction', 'overtime'];
const ALL_STATUSES: (FrontendRequestStatus | 'all')[] = ['all', 'draft', 'pending', 'approved', 'rejected', 'cancelled', 'needs_revision'];

export default function RequestHistoryPage() {
  const navigate = useNavigate();
  const [allReqs, setAllReqs] = useState<MappedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FrontendRequestType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<FrontendRequestStatus | 'all'>('all');
  const [showFilter, setShowFilter] = useState(false);

  const loadRequests = () => {
    setLoading(true);
    setError('');
    requestsService.getRequests()
      .then(res => setAllReqs(res.data))
      .catch(err => {
        if (err instanceof ApiError) setError(err.message);
        else setError('Failed to load requests.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filtered = useMemo(() => {
    return allReqs.filter(r => {
      const searchLow = search.toLowerCase();
      const matchSearch =
        !search ||
        REQUEST_TYPE_META[r.type as RequestType].label.toLowerCase().includes(searchLow) ||
        r.reason.toLowerCase().includes(searchLow) ||
        r.requestCode.toLowerCase().includes(searchLow);
      const matchType   = filterType === 'all'   || r.type === filterType;
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [allReqs, search, filterType, filterStatus]);

  const hasFilter = filterType !== 'all' || filterStatus !== 'all';
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100dvh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 bg-white flex-shrink-0">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <ChevronLeft size={18} className="text-slate-600" />
        </button>
        <p className="text-slate-800 font-bold flex-1" style={{ fontSize: '16px' }}>Request History</p>
        <span className="text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium" style={{ fontSize: '12px' }}>
          {loading ? '…' : filtered.length}
        </span>
      </div>

      {/* Search + filter row */}
      <div className="px-4 py-3 flex gap-2 bg-white border-b border-slate-50 flex-shrink-0">
        <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-2xl px-3" style={{ height: 40 }}>
          <Search size={15} className="text-slate-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search requests…"
            className="flex-1 bg-transparent outline-none text-slate-700"
            style={{ fontSize: '13px' }}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X size={13} className="text-slate-400" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilter(true)}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            hasFilter ? 'bg-blue-600' : 'bg-slate-100'
          }`}
        >
          <Filter size={15} className={hasFilter ? 'text-white' : 'text-slate-500'} />
        </button>
      </div>

      {/* Active filter chips */}
      {hasFilter && (
        <div className="px-4 py-2 flex gap-2 flex-wrap bg-white border-b border-slate-50 flex-shrink-0">
          {filterType !== 'all' && (
            <div className="flex items-center gap-1.5 bg-blue-100 rounded-full px-3 py-1">
              <span className="text-blue-700 font-medium" style={{ fontSize: '11px' }}>{REQUEST_TYPE_META[filterType as RequestType].label}</span>
              <button onClick={() => setFilterType('all')}>
                <X size={11} className="text-blue-500" />
              </button>
            </div>
          )}
          {filterStatus !== 'all' && (
            <div className="flex items-center gap-1.5 bg-blue-100 rounded-full px-3 py-1">
              <span className="text-blue-700 font-medium" style={{ fontSize: '11px' }}>{STATUS_META[filterStatus as RequestStatus].label}</span>
              <button onClick={() => setFilterStatus('all')}>
                <X size={11} className="text-blue-500" />
              </button>
            </div>
          )}
          <button
            onClick={() => { setFilterType('all'); setFilterStatus('all'); }}
            className="text-slate-400"
            style={{ fontSize: '11px' }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-red-500 mb-3" style={{ fontSize: '13px' }}>{error}</p>
            <button onClick={loadRequests} className="text-blue-600 font-semibold" style={{ fontSize: '13px' }}>
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-3">
              <FileText size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-semibold mb-1" style={{ fontSize: '15px' }}>No requests found</p>
            <p className="text-slate-400" style={{ fontSize: '13px' }}>
              {search ? `No results for "${search}"` : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => {
              const tm = REQUEST_TYPE_META[req.type as RequestType];
              const sm = STATUS_META[req.status as RequestStatus];
              return (
                <button
                  key={req.id}
                  onClick={() => navigate(`/dashboard/requests/${req.id}`)}
                  className="w-full bg-white border border-slate-100 rounded-3xl p-4 text-left shadow-sm active:scale-98 transition-transform"
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
                      <p className="text-slate-400 truncate mb-1.5" style={{ fontSize: '12px' }}>{req.reason || req.title}</p>
                      <div className="flex items-center gap-3">
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
            })}
          </div>
        )}
      </div>

      {/* Filter sheet */}
      {showFilter && (
        <FilterSheet
          filterType={filterType}
          filterStatus={filterStatus}
          onApply={(t, s) => { setFilterType(t); setFilterStatus(s); setShowFilter(false); }}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
}

function FilterSheet({
  filterType, filterStatus, onApply, onClose,
}: {
  filterType: FrontendRequestType | 'all';
  filterStatus: FrontendRequestStatus | 'all';
  onApply: (t: FrontendRequestType | 'all', s: FrontendRequestStatus | 'all') => void;
  onClose: () => void;
}) {
  const [localType, setLocalType] = useState(filterType);
  const [localStatus, setLocalStatus] = useState(filterStatus);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ maxWidth: 430, margin: '0 auto' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl p-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-800 font-bold" style={{ fontSize: '17px' }}>Filter</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X size={15} className="text-slate-500" />
          </button>
        </div>

        <p className="text-slate-400 font-semibold mb-2" style={{ fontSize: '11px' }}>REQUEST TYPE</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {ALL_TYPES.map(t => (
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

        <p className="text-slate-400 font-semibold mb-2" style={{ fontSize: '11px' }}>STATUS</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {ALL_STATUSES.map(s => (
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
            className="flex-1 bg-blue-600 text-white rounded-2xl font-bold"
            style={{ height: 48, fontSize: '14px' }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
