import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, Shield, Lock, Mail, Smartphone, ShieldCheck } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);

  const emailError = submitted && !email.trim() ? 'Email or phone is required' : '';
  const passwordError = submitted && !password ? 'Password is required' : '';

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!email.trim() || !password) return;

    setError('');
    setLoading(true);

    try {
      const result = await authService.login(email, password);

      if (result.status === 'otp_required') {
        navigate('/auth/otp', { state: { otp_token: result.otp_token, email } });
      } else if (result.status === '2fa_required') {
        navigate('/auth/authenticator', { state: { temp_token: result.temp_token } });
      } else {
        setAuth(result.token, result.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col bg-white overflow-y-auto"
      style={{ minHeight: '100dvh', maxWidth: '430px', margin: '0 auto' }}
    >
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 pt-16 pb-14 flex-shrink-0">
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
          <svg width="29" height="29" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9.5" fill="white" />
            <path d="M9.25 8.25h1.9v7.5h-1.9v-7.5Zm3.6 0h1.9v7.5h-1.9v-7.5Z" fill="#2563eb" />
          </svg>
        </div>
        <p className="text-white font-bold leading-tight" style={{ fontSize: '24px' }}>Bianore</p>
        <p className="text-blue-100 mt-1" style={{ fontSize: '13px' }}>Attendance System</p>
        <p className="text-white mt-5" style={{ fontSize: '14px' }}>Welcome back! Sign in to continue.</p>
      </div>

      <div className="flex-1 bg-white rounded-t-[24px] -mt-6 px-5 pt-7 pb-8">
        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div>
            <label className="block text-slate-700 mb-2" style={{ fontSize: '13px', fontWeight: 500 }}>Email or Phone</label>
            <div className="relative">
              <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${emailError ? 'text-red-400' : 'text-blue-300'}`} />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (submitted) setSubmitted(false); }}
                placeholder="employee@bianore.com"
                className={`w-full pl-10 pr-4 bg-slate-50 border rounded-[14px] text-slate-800 outline-none focus:ring-2 transition-all placeholder-blue-300 ${
                  emailError
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
                style={{ fontSize: '14px', height: '48px' }}
              />
            </div>
            {emailError && (
              <p className="mt-1.5 text-red-500 flex items-center gap-1" style={{ fontSize: '12px' }}>
                <span></span> {emailError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-700 mb-2" style={{ fontSize: '13px', fontWeight: 500 }}>Password</label>
            <div className="relative">
              <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${passwordError ? 'text-red-400' : 'text-blue-300'}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); if (submitted) setSubmitted(false); }}
                placeholder="Enter your password"
                className={`w-full pl-10 pr-12 bg-slate-50 border rounded-[14px] text-slate-800 outline-none focus:ring-2 transition-all placeholder-blue-300 ${
                  passwordError
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
                style={{ fontSize: '14px', height: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-300"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {passwordError && (
              <p className="mt-1.5 text-red-500 flex items-center gap-1" style={{ fontSize: '12px' }}>
                <span></span> {passwordError}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-slate-600" style={{ fontSize: '13px', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={e => setRememberDevice(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-blue-600"
              />
              Remember device
            </label>
            <button
              type="button"
              className="font-semibold text-blue-600"
              style={{ fontSize: '13px' }}
            >
              Forgot password?
            </button>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-red-600" style={{ fontSize: '13px' }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold rounded-[14px] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            style={{ height: '52px', fontSize: '15px' }}
          >
            {loading ? (
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-blue-300" style={{ fontSize: '12px' }}>or sign in with</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate('/auth/authenticator')}
            className="h-12 rounded-[14px] border border-slate-200 bg-slate-50 text-slate-700 font-semibold flex items-center justify-center gap-2"
            style={{ fontSize: '13px' }}
          >
            <Smartphone size={15} className="text-blue-500" />
            Authenticator
          </button>
          <button
            type="button"
            onClick={() => navigate('/auth/otp')}
            className="h-12 rounded-[14px] border border-slate-200 bg-slate-50 text-slate-700 font-semibold flex items-center justify-center gap-2"
            style={{ fontSize: '13px' }}
          >
            <ShieldCheck size={15} className="text-emerald-500" />
            OTP / 2FA
          </button>
        </div>

        <div className="flex items-start justify-center gap-2 mt-6 p-3 bg-slate-50 rounded-2xl">
          <Shield size={14} className="text-blue-300 flex-shrink-0 mt-0.5" />
          <p className="text-center text-blue-300" style={{ fontSize: '12px' }}>
            Your device and login activity are protected by Bianore security protocols.
          </p>
        </div>
      </div>
    </div>
  );
}
