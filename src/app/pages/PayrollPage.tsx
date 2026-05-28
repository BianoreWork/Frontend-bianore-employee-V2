import { useState, useEffect } from 'react';
import { Download, ChevronDown, TrendingUp, TrendingDown, CheckCircle2, Clock, AlertCircle, DollarSign } from 'lucide-react';
import { payrollService, type Payslip } from '../../services/payrollService';
import { ApiError } from '../../lib/api';

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function fmtPeriod(month: number, year: number) {
  return `${MONTHS_ID[month - 1]} ${year}`;
}

type DisplayStatus = 'Diterima' | 'Diproses' | 'Draft';

function mapStatus(s: Payslip['status']): DisplayStatus {
  if (s === 'sent')      return 'Diterima';
  if (s === 'generated') return 'Diproses';
  return 'Draft';
}

const statusConfig: Record<DisplayStatus, { color: string; bg: string; Icon: typeof CheckCircle2 }> = {
  Diterima: { color: 'text-emerald-600', bg: 'bg-emerald-100', Icon: CheckCircle2 },
  Diproses: { color: 'text-blue-600',    bg: 'bg-blue-100',    Icon: Clock        },
  Draft:    { color: 'text-amber-600',   bg: 'bg-amber-100',   Icon: AlertCircle  },
};

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

export default function PayrollPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selected, setSelected] = useState<Payslip | null>(null);
  const [detail, setDetail] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    payrollService.getMyPayslips()
      .then(res => {
        const list = res.data ?? [];
        setPayslips(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Gagal memuat data penggajian.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDetail(null);
    setDetailLoading(true);
    payrollService.getPayslipDetail(selected.id)
      .then(res => setDetail(res.data))
      .catch(() => setDetail(selected))
      .finally(() => setDetailLoading(false));
  }, [selected?.id]);

  const handleDownload = async () => {
    if (!selected) return;
    setDownloading(true);
    try {
      if (selected.pdf_url) {
        window.open(selected.pdf_url, '_blank');
      } else {
        const res = await payrollService.getDownloadUrl(selected.id);
        window.open(res.url, '_blank');
      }
    } catch {
      // no pdf available
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="pb-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-5 pt-5 pb-6">
          <div className="h-8 w-36 bg-white/10 rounded-xl animate-pulse mb-5" />
          <div className="h-4 w-20 bg-white/10 rounded animate-pulse mb-2" />
          <div className="h-9 w-48 bg-white/10 rounded-lg animate-pulse mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-8 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-8 bg-white/10 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="px-4 pt-4 space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 p-4 space-y-3">
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-100 rounded-3xl px-4 py-8 text-center">
          <p className="text-red-600 mb-3" style={{ fontSize: '13px' }}>{error}</p>
          <button onClick={() => window.location.reload()} className="text-blue-600 font-semibold" style={{ fontSize: '13px' }}>Coba Lagi</button>
        </div>
      </div>
    );
  }

  if (payslips.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
          <DollarSign size={26} className="text-blue-400" />
        </div>
        <p className="text-slate-700 font-semibold mb-1" style={{ fontSize: '15px' }}>Belum ada payslip</p>
        <p className="text-slate-400" style={{ fontSize: '13px' }}>Payslip akan muncul setelah payroll diproses.</p>
      </div>
    );
  }

  const slip = detail ?? selected!;
  const statusLabel = mapStatus(slip.status);
  const { color: sColor, bg: sBg, Icon: StatusIcon } = statusConfig[statusLabel];

  const earnings  = slip.components?.filter(c => c.component_type === 'earning')   ?? [];
  const deductions = slip.components?.filter(c => c.component_type === 'deduction') ?? [];

  return (
    <div className="pb-4">
      {/* Hero card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-5 pt-5 pb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div className="relative">
              <select
                value={selected?.id ?? ''}
                onChange={e => {
                  const p = payslips.find(x => x.id === Number(e.target.value));
                  if (p) setSelected(p);
                }}
                className="appearance-none bg-white/10 border border-white/20 rounded-xl pl-3 pr-8 text-white font-semibold outline-none cursor-pointer"
                style={{ height: '36px', fontSize: '13px' }}
              >
                {payslips.map(p => (
                  <option key={p.id} value={p.id} className="text-slate-800 bg-white">
                    {fmtPeriod(p.period_month, p.period_year)}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
            </div>
            <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${sBg} ${sColor} font-semibold`} style={{ fontSize: '12px' }}>
              <StatusIcon size={12} /> {statusLabel}
            </span>
          </div>

          <p className="text-slate-400" style={{ fontSize: '11px' }}>Gaji Bersih</p>
          <p className="text-white font-bold mt-0.5" style={{ fontSize: '28px' }}>{fmt(slip.net_salary)}</p>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-slate-400" style={{ fontSize: '11px' }}>Total Penghasilan</p>
              <p className="text-white font-semibold mt-0.5" style={{ fontSize: '14px' }}>{fmt(slip.gross_salary)}</p>
            </div>
            <div>
              <p className="text-slate-400" style={{ fontSize: '11px' }}>Potongan</p>
              <p className="text-red-300 font-semibold mt-0.5" style={{ fontSize: '14px' }}>- {fmt(slip.total_deduction)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Download */}
      <div className="px-4 pt-4 pb-4">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-700 font-medium shadow-sm active:bg-slate-50 transition-colors disabled:opacity-60"
          style={{ height: '48px', fontSize: '14px' }}
        >
          <Download size={17} className="text-blue-600" />
          {downloading ? 'Membuka...' : 'Download Payslip'}
        </button>
      </div>

      {/* Earnings */}
      <div className="px-4 mb-3">
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-emerald-50">
            <TrendingUp size={15} className="text-emerald-600" />
            <p className="text-emerald-700 font-semibold" style={{ fontSize: '13px' }}>Penghasilan</p>
          </div>
          {detailLoading ? (
            <div className="px-4 py-4 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-3 bg-slate-100 rounded-full animate-pulse" />)}
            </div>
          ) : (
            <div className="px-4 py-3 space-y-3">
              {earnings.length > 0 ? earnings.map(c => (
                <div key={c.id} className="flex justify-between">
                  <span className="text-slate-600" style={{ fontSize: '13px' }}>{c.component_name}</span>
                  <span className="text-emerald-600 font-medium" style={{ fontSize: '13px' }}>+{fmt(c.amount)}</span>
                </div>
              )) : (
                <div className="flex justify-between">
                  <span className="text-slate-600" style={{ fontSize: '13px' }}>Gaji Pokok</span>
                  <span className="text-emerald-600 font-medium" style={{ fontSize: '13px' }}>+{fmt(slip.gross_salary)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-700 font-semibold" style={{ fontSize: '13px' }}>Total</span>
                <span className="text-emerald-700 font-bold" style={{ fontSize: '13px' }}>{fmt(slip.gross_salary)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deductions */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-red-50">
            <TrendingDown size={15} className="text-red-500" />
            <p className="text-red-600 font-semibold" style={{ fontSize: '13px' }}>Potongan</p>
          </div>
          {detailLoading ? (
            <div className="px-4 py-4 space-y-3">
              {[1, 2].map(i => <div key={i} className="h-3 bg-slate-100 rounded-full animate-pulse" />)}
            </div>
          ) : (
            <div className="px-4 py-3 space-y-3">
              {deductions.length > 0 ? deductions.map(c => (
                <div key={c.id} className="flex justify-between">
                  <span className="text-slate-600" style={{ fontSize: '13px' }}>{c.component_name}</span>
                  <span className="text-red-500 font-medium" style={{ fontSize: '13px' }}>-{fmt(c.amount)}</span>
                </div>
              )) : slip.total_deduction > 0 ? (
                <div className="flex justify-between">
                  <span className="text-slate-600" style={{ fontSize: '13px' }}>Total Potongan</span>
                  <span className="text-red-500 font-medium" style={{ fontSize: '13px' }}>-{fmt(slip.total_deduction)}</span>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-1" style={{ fontSize: '13px' }}>Tidak ada potongan</p>
              )}
              {slip.total_deduction > 0 && (
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-700 font-semibold" style={{ fontSize: '13px' }}>Total</span>
                  <span className="text-red-600 font-bold" style={{ fontSize: '13px' }}>-{fmt(slip.total_deduction)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="px-4">
        <p className="text-slate-800 font-semibold mb-3" style={{ fontSize: '14px' }}>Riwayat Penggajian</p>
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          {payslips.map(p => {
            const sLabel = mapStatus(p.status);
            const cfg = statusConfig[sLabel];
            const isActive = selected?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0 text-left transition-colors ${isActive ? 'bg-blue-50' : 'active:bg-slate-50'}`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-blue-100' : 'bg-slate-50'}`}>
                  <DollarSign size={17} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
                </div>
                <div className="flex-1">
                  <p className="text-slate-800 font-medium" style={{ fontSize: '13px' }}>{fmtPeriod(p.period_month, p.period_year)}</p>
                  <p className="text-slate-400" style={{ fontSize: '11px' }}>Bruto: {fmt(p.gross_salary)}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-800 font-semibold" style={{ fontSize: '13px' }}>{fmt(p.net_salary)}</p>
                  <span className={`${cfg.color} font-medium`} style={{ fontSize: '11px' }}>{sLabel}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
