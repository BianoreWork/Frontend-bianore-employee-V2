import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Monitor, CheckCircle2, X } from 'lucide-react';

export default function DeviceBindingPage() {
  const navigate = useNavigate();
  const [binding, setBinding] = useState(false);
  const [bound, setBound] = useState(false);

  const handleBind = () => {
    setBinding(true);
    setTimeout(() => {
      setBinding(false); setBound(true);
      setTimeout(() => navigate('/auth/role-select'), 1500);
    }, 1500);
  };

  return (
    <div
      className="flex flex-col bg-white overflow-y-auto"
      style={{ minHeight: '100dvh', maxWidth: '430px', margin: '0 auto' }}
    >
      <div className={`px-6 pt-14 pb-10 transition-colors ${bound ? 'bg-gradient-to-br from-emerald-600 to-emerald-800' : 'bg-gradient-to-br from-blue-600 to-blue-800'}`}>
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
          {bound ? <CheckCircle2 size={28} className="text-white" /> : <Monitor size={28} className="text-white" />}
        </div>
        <p className="text-white font-bold" style={{ fontSize: '22px' }}>{bound ? 'Device Bound!' : 'Bind Device'}</p>
        <p className="text-blue-200 mt-1" style={{ fontSize: '13px' }}>
          {bound ? 'Your device is now trusted.' : 'Register this device for extra security'}
        </p>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl -mt-5 px-5 pt-7 pb-8">
        {!bound ? (
          <>
            <div className="bg-slate-50 rounded-2xl p-4 mb-6">
              <p className="text-slate-400 mb-3" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Device Info</p>
              {[
                { label: 'Device', value: 'Chrome on Windows 11' },
                { label: 'Location', value: 'Jakarta, Indonesia' },
                { label: 'Time', value: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500" style={{ fontSize: '13px' }}>{item.label}</span>
                  <span className="text-slate-800 font-medium" style={{ fontSize: '13px' }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/auth/role-select')}
                className="flex items-center justify-center gap-2 border border-slate-200 rounded-2xl text-slate-600 font-medium"
                style={{ height: '52px', fontSize: '14px' }}
              >
                <X size={16} /> Skip
              </button>
              <button
                onClick={handleBind}
                disabled={binding}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold rounded-2xl transition-colors"
                style={{ height: '52px', fontSize: '14px' }}
              >
                {binding ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                ) : <CheckCircle2 size={16} />}
                {binding ? 'Binding...' : 'Bind'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <p className="text-slate-800 font-semibold mb-1" style={{ fontSize: '16px' }}>Redirecting...</p>
            <p className="text-slate-400" style={{ fontSize: '13px' }}>Taking you to role selection</p>
          </div>
        )}
      </div>
    </div>
  );
}
