import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Shield, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../lib/api';

export default function OTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();

  const otpToken: string = location.state?.otp_token ?? '';
  const email: string = location.state?.email ?? '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return;
    setError('');
    setLoading(true);

    try {
      const result = await authService.verifyOtp(otpToken, code);

      if (result.status === '2fa_required') {
        navigate('/auth/authenticator', { state: { temp_token: result.temp_token } });
      } else {
        setAuth(result.token, result.user);
        navigate('/dashboard');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await authService.resendOtp(otpToken);
      setResent(true);
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      setTimeout(() => setResent(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2}).+(@.+)/, '$1***$2')
    : '***@***.com';

  return (
    <div
      className="flex flex-col bg-white overflow-y-auto"
      style={{ minHeight: '100dvh', maxWidth: '430px', margin: '0 auto' }}
    >
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 pt-14 pb-10">
        <button onClick={() => navigate('/login')} className="flex items-center gap-1.5 text-blue-200 mb-6" style={{ fontSize: '13px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
          <Shield size={28} className="text-white" />
        </div>
        <p className="text-white font-bold" style={{ fontSize: '22px' }}>OTP Verification</p>
        <p className="text-blue-200 mt-1" style={{ fontSize: '13px' }}>Code sent to {maskedEmail}</p>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl -mt-5 px-5 pt-7 pb-8">
        <p className="text-slate-500 mb-6" style={{ fontSize: '13px' }}>Enter the 6-digit code from your email</p>

        <div className="grid grid-cols-6 gap-1.5 sm:gap-2 mb-6">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-full min-w-0 text-center font-bold border-2 rounded-xl outline-none transition-all ${
                digit ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-800'
              } focus:border-blue-500`}
              style={{ height: 'clamp(44px, 12vw, 56px)', fontSize: 'clamp(18px, 5vw, 22px)' }}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-red-600" style={{ fontSize: '13px' }}>{error}</p>
          </div>
        )}

        {resent && (
          <p className="text-emerald-600 mb-4 flex items-center gap-1.5" style={{ fontSize: '13px' }}>
            <CheckCircle2 size={15} className="flex-shrink-0" />
            <span>A new OTP code has been sent!</span>
          </p>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || otp.join('').length < 6}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2 mb-4 shadow-lg shadow-blue-200"
          style={{ height: '52px', fontSize: '15px' }}
        >
          {loading ? (
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          ) : 'Verify OTP'}
        </button>

        <button
          onClick={handleResend}
          disabled={resending}
          className="flex items-center justify-center gap-1.5 w-full text-blue-600 font-medium disabled:opacity-50"
          style={{ fontSize: '14px' }}
        >
          <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
          {resending ? 'Sending...' : 'Resend Code'}
        </button>
      </div>
    </div>
  );
}
