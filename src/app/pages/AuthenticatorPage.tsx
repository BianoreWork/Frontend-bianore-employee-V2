import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Smartphone, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../lib/api';

export default function AuthenticatorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();

  const [tempToken, setTempToken] = useState<string>(location.state?.temp_token ?? '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (code.length < 6) return;
    setError('');
    setLoading(true);

    try {
      const result = await authService.verify2fa(tempToken, code);
      setAuth(result.token, result.user);
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        // backend returns a new temp_token on failure so user can retry
        const body = err as unknown as { temp_token?: string };
        if (body.temp_token) setTempToken(body.temp_token);
      } else {
        setError('Something went wrong. Please try again.');
      }
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col bg-white overflow-y-auto"
      style={{ minHeight: '100dvh', maxWidth: '430px', margin: '0 auto' }}
    >
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 pt-14 pb-10">
        <button onClick={() => navigate('/login')} className="flex items-center gap-1.5 text-emerald-200 mb-6" style={{ fontSize: '13px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
          <Smartphone size={28} className="text-white" />
        </div>
        <p className="text-white font-bold" style={{ fontSize: '22px' }}>Authenticator</p>
        <p className="text-emerald-200 mt-1" style={{ fontSize: '13px' }}>Google Authenticator verification</p>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl -mt-5 px-5 pt-7 pb-8">
        <div className="space-y-3 mb-7">
          {['Open your authenticator app', 'Find "Bianore Attendance System"', 'Enter the 6-digit code below'].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0" style={{ fontSize: '12px' }}>{i + 1}</div>
              <p className="text-slate-600" style={{ fontSize: '14px' }}>{step}</p>
            </div>
          ))}
        </div>

        <div className="mb-5">
          <label className="block text-slate-600 mb-2" style={{ fontSize: '13px', fontWeight: 500 }}>Authenticator Code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full text-center border-2 border-slate-200 rounded-2xl text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all bg-slate-50 tracking-widest"
            style={{ height: '64px', fontSize: '28px', fontWeight: 700 }}
          />
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-red-600" style={{ fontSize: '13px' }}>{error}</p>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || code.length < 6}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
          style={{ height: '52px', fontSize: '15px' }}
        >
          {loading ? (
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          ) : (
            <><CheckCircle2 size={18} /> Verify Code</>
          )}
        </button>
      </div>
    </div>
  );
}
