import { useState } from 'react';
import { Download, ChevronDown, TrendingUp, TrendingDown, CheckCircle2, Clock, AlertCircle, DollarSign } from 'lucide-react';
import jsPDF from 'jspdf';

type PayslipStatus = 'Paid' | 'Pending' | 'Processing';

const monthlyData: Record<string, {
  basic: number; allowance: number; overtime: number;
  deduction: number; late: number; tax: number; status: PayslipStatus;
}> = {
  'May 2026': { basic: 8000000, allowance: 1500000, overtime: 800000, deduction: 200000, late: 50000, tax: 450000, status: 'Processing' },
  'Apr 2026': { basic: 8000000, allowance: 1500000, overtime: 600000, deduction: 150000, late: 100000, tax: 430000, status: 'Paid' },
  'Mar 2026': { basic: 8000000, allowance: 1500000, overtime: 1200000, deduction: 200000, late: 0, tax: 500000, status: 'Paid' },
  'Feb 2026': { basic: 8000000, allowance: 1500000, overtime: 400000, deduction: 100000, late: 200000, tax: 410000, status: 'Paid' },
};

const statusConfig: Record<PayslipStatus, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  Paid: { color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle2 },
  Pending: { color: 'text-amber-600', bg: 'bg-amber-100', icon: AlertCircle },
  Processing: { color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock },
};

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState('May 2026');
  const slip = monthlyData[selectedMonth];
  const gross = slip.basic + slip.allowance + slip.overtime;
  const totalDed = slip.deduction + slip.late + slip.tax;
  const net = gross - totalDed;
  const sCfg = statusConfig[slip.status];
  const StatusIcon = sCfg.icon;

  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const W = 794, H = 1060;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, W, 100);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Arial, sans-serif';
    ctx.fillText('BIANORE', 40, 44);
    ctx.font = '13px Arial, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Employee Payslip', 40, 68);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px Arial, sans-serif';
    ctx.fillText(selectedMonth, W - 40, 44);
    ctx.fillStyle = slip.status === 'Paid' ? '#34d399' : slip.status === 'Processing' ? '#60a5fa' : '#fbbf24';
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText(slip.status, W - 40, 68);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 100, W, 90);
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('NET SALARY', 40, 128);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 34px Arial, sans-serif';
    ctx.fillText(fmt(net), 40, 170);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('GROSS', W - 40, 128);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText(fmt(gross), W - 40, 152);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('DEDUCTIONS', W - 40, 170);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText(`-${fmt(totalDed)}`, W - 40, 190);
    ctx.textAlign = 'left';

    const line = (y: number, light = false) => {
      ctx.strokeStyle = light ? '#f1f5f9' : '#e2e8f0'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W - 40, y); ctx.stroke();
    };
    const row = (label: string, value: string, y: number, valueColor = '#1e293b') => {
      ctx.fillStyle = '#64748b'; ctx.font = '13px Arial, sans-serif'; ctx.fillText(label, 60, y);
      ctx.fillStyle = valueColor; ctx.textAlign = 'right'; ctx.fillText(value, W - 60, y); ctx.textAlign = 'left';
    };
    const sectionHead = (title: string, y: number, textColor: string, bgColor: string) => {
      ctx.fillStyle = bgColor; ctx.fillRect(40, y - 20, W - 80, 28);
      ctx.fillStyle = textColor; ctx.font = 'bold 12px Arial, sans-serif'; ctx.fillText(title, 60, y - 2);
    };

    line(220);
    sectionHead('EARNINGS', 255, '#047857', '#ecfdf5');
    row('Basic Salary', `+${fmt(slip.basic)}`, 285, '#047857'); line(292, true);
    row('Allowance', `+${fmt(slip.allowance)}`, 312, '#047857'); line(319, true);
    row('Overtime Pay', `+${fmt(slip.overtime)}`, 339, '#047857'); line(350);
    ctx.fillStyle = '#064e3b'; ctx.font = 'bold 13px Arial, sans-serif'; ctx.fillText('Total Earnings', 60, 370);
    ctx.textAlign = 'right'; ctx.fillStyle = '#047857'; ctx.fillText(fmt(gross), W - 60, 370); ctx.textAlign = 'left';

    line(395);
    sectionHead('DEDUCTIONS', 430, '#dc2626', '#fef2f2');
    row('Other Deductions', `-${fmt(slip.deduction)}`, 460, '#dc2626'); line(467, true);
    row('Late Deduction', `-${fmt(slip.late)}`, 487, '#dc2626'); line(494, true);
    row('Income Tax', `-${fmt(slip.tax)}`, 514, '#dc2626'); line(525);
    ctx.fillStyle = '#7f1d1d'; ctx.font = 'bold 13px Arial, sans-serif'; ctx.fillText('Total Deductions', 60, 545);
    ctx.textAlign = 'right'; ctx.fillStyle = '#dc2626'; ctx.fillText(`-${fmt(totalDed)}`, W - 60, 545); ctx.textAlign = 'left';

    ctx.fillStyle = '#1e293b'; ctx.fillRect(40, 575, W - 80, 55);
    ctx.fillStyle = '#94a3b8'; ctx.font = '11px Arial, sans-serif'; ctx.fillText('NET SALARY', 60, 596);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'right'; ctx.fillText(fmt(net), W - 60, 616); ctx.textAlign = 'left';

    ctx.fillStyle = '#94a3b8'; ctx.font = '11px Arial, sans-serif';
    ctx.fillText('This document is automatically generated by Bianore Attendance System.', 40, H - 36);
    ctx.fillText(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 40, H - 18);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH);
    pdf.save(`payslip-${selectedMonth.replace(' ', '-')}.pdf`);
  };

  return (
    <div className="pb-4">
      {/* Hero payslip card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-5 pt-5 pb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="appearance-none bg-white/10 border border-white/20 rounded-xl pl-3 pr-8 text-white font-semibold outline-none cursor-pointer"
                style={{ height: '36px', fontSize: '13px' }}
              >
                {Object.keys(monthlyData).map(m => (
                  <option key={m} value={m} className="text-slate-800 bg-white">{m}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
            </div>
            <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${sCfg.bg} ${sCfg.color} font-semibold`} style={{ fontSize: '12px' }}>
              <StatusIcon size={12} /> {slip.status}
            </span>
          </div>

          <p className="text-slate-400" style={{ fontSize: '11px' }}>Net Salary</p>
          <p className="text-white font-bold mt-0.5" style={{ fontSize: '28px' }}>{fmt(net)}</p>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-slate-400" style={{ fontSize: '11px' }}>Gross Pay</p>
              <p className="text-white font-semibold mt-0.5" style={{ fontSize: '14px' }}>{fmt(gross)}</p>
            </div>
            <div>
              <p className="text-slate-400" style={{ fontSize: '11px' }}>Deductions</p>
              <p className="text-red-300 font-semibold mt-0.5" style={{ fontSize: '14px' }}>- {fmt(totalDed)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Download button */}
      <div className="px-4 pt-4 pb-4">
        <button
          onClick={handleDownload}
          className="w-full bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-700 font-medium shadow-sm active:bg-slate-50 transition-colors"
          style={{ height: '48px', fontSize: '14px' }}
        >
          <Download size={17} className="text-blue-600" /> Download Payslip
        </button>
      </div>

      {/* Earnings */}
      <div className="px-4 mb-3">
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-emerald-50">
            <TrendingUp size={15} className="text-emerald-600" />
            <p className="text-emerald-700 font-semibold" style={{ fontSize: '13px' }}>Earnings</p>
          </div>
          <div className="px-4 py-3 space-y-3">
            {[
              { label: 'Basic Salary', value: slip.basic },
              { label: 'Allowance', value: slip.allowance },
              { label: 'Overtime Pay', value: slip.overtime },
            ].map(item => (
              <div key={item.label} className="flex justify-between">
                <span className="text-slate-600" style={{ fontSize: '13px' }}>{item.label}</span>
                <span className="text-emerald-600 font-medium" style={{ fontSize: '13px' }}>+{fmt(item.value)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-700 font-semibold" style={{ fontSize: '13px' }}>Total</span>
              <span className="text-emerald-700 font-bold" style={{ fontSize: '13px' }}>{fmt(gross)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deductions */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-red-50">
            <TrendingDown size={15} className="text-red-500" />
            <p className="text-red-600 font-semibold" style={{ fontSize: '13px' }}>Deductions</p>
          </div>
          <div className="px-4 py-3 space-y-3">
            {[
              { label: 'Other Deductions', value: slip.deduction },
              { label: 'Late Deduction', value: slip.late },
              { label: 'Income Tax', value: slip.tax },
            ].map(item => (
              <div key={item.label} className="flex justify-between">
                <span className="text-slate-600" style={{ fontSize: '13px' }}>{item.label}</span>
                <span className="text-red-500 font-medium" style={{ fontSize: '13px' }}>-{fmt(item.value)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-700 font-semibold" style={{ fontSize: '13px' }}>Total</span>
              <span className="text-red-600 font-bold" style={{ fontSize: '13px' }}>-{fmt(totalDed)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="px-4">
        <p className="text-slate-800 font-semibold mb-3" style={{ fontSize: '14px' }}>Payment History</p>
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          {Object.entries(monthlyData).map(([month, d]) => {
            const g = d.basic + d.allowance + d.overtime;
            const ded = d.deduction + d.late + d.tax;
            const n = g - ded;
            const cfg = statusConfig[d.status];
            return (
              <div key={month} className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <DollarSign size={17} className="text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-800 font-medium" style={{ fontSize: '13px' }}>{month}</p>
                  <p className="text-slate-400" style={{ fontSize: '11px' }}>Gross: {fmt(g)}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-800 font-semibold" style={{ fontSize: '13px' }}>{fmt(n)}</p>
                  <span className={`${cfg.color} font-medium`} style={{ fontSize: '11px' }}>{d.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
