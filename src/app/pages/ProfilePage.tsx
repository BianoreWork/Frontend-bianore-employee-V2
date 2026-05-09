import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  User, Mail, Building2, Briefcase, Hash,
  Shield, Monitor, ChevronRight, LogOut
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from '../components/ui/alert-dialog';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import type { User as UserType } from '../../types/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { clearAuth, user: cachedUser } = useAuth();
  const [user, setUser] = useState<UserType | null>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    authService.me()
      .then(setUser)
      .catch(() => {/* gunakan data cache */})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      /* abaikan error */
    }
    clearAuth();
    navigate('/login');
  };

  const employee = user?.employee;
  const displayName = employee?.full_name ?? user?.email ?? '—';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const roles = user?.roles?.map(r => r.name).join(', ') ?? '—';

  return (
    <div className="pb-4">
      {/* Profile hero */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-5 pt-5 pb-12">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold" style={{ fontSize: '22px' }}>
                {loading ? '…' : initials}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold" style={{ fontSize: '17px' }}>
              {loading ? 'Loading...' : displayName}
            </p>
            <p className="text-blue-200" style={{ fontSize: '12px' }}>
              {employee?.position?.name ?? roles}
            </p>
            <p className="text-blue-300 mt-0.5" style={{ fontSize: '11px' }}>
              {employee?.department?.name ?? ''}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <span className="px-3 py-1 bg-white/20 rounded-full text-white" style={{ fontSize: '11px' }}>
            {employee?.employee_code ?? '—'}
          </span>
          <span className="flex items-center gap-1 px-3 py-1 bg-emerald-400/30 rounded-full text-emerald-200" style={{ fontSize: '11px' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {user?.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Info card */}
      <div className="px-4 -mt-5 mb-4">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-slate-700 font-semibold flex items-center gap-2" style={{ fontSize: '13px' }}>
              <User size={14} className="text-blue-600" /> Employee Information
            </p>
          </div>
          {[
            { label: 'Employee ID', value: employee?.employee_code ?? '—', icon: Hash },
            { label: 'Department', value: employee?.department?.name ?? '—', icon: Building2 },
            { label: 'Position', value: employee?.position?.name ?? '—', icon: Briefcase },
            { label: 'Email', value: user?.email ?? '—', icon: Mail },
            { label: 'Role', value: roles, icon: User },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                <item.icon size={14} className="text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-400" style={{ fontSize: '11px' }}>{item.label}</p>
                <p className="text-slate-800 font-medium truncate" style={{ fontSize: '13px' }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-slate-700 font-semibold flex items-center gap-2" style={{ fontSize: '13px' }}>
              <Shield size={14} className="text-blue-600" /> Security Settings
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${user?.two_factor_enabled ? 'bg-emerald-50' : 'bg-slate-50'}`}>
              <Monitor size={16} className={user?.two_factor_enabled ? 'text-emerald-600' : 'text-slate-400'} />
            </div>
            <div className="flex-1">
              <p className="text-slate-800 font-medium" style={{ fontSize: '13px' }}>Google Authenticator (2FA)</p>
              <p className="text-slate-400" style={{ fontSize: '11px' }}>
                {user?.two_factor_enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Shield size={16} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-slate-800 font-medium" style={{ fontSize: '13px' }}>OTP Verification</p>
              <p className="text-slate-400" style={{ fontSize: '11px' }}>One-time password via email</p>
            </div>
            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Logout button */}
      <div className="px-4">
        <button
          onClick={() => setShowLogoutDialog(true)}
          className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-100 rounded-3xl text-red-600 font-semibold active:bg-red-100 transition-colors"
          style={{ height: '52px', fontSize: '15px' }}
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>

      {/* Logout confirmation dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="rounded-2xl" style={{ maxWidth: '340px' }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800" style={{ fontSize: '16px' }}>
              Sign Out Confirmation
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500" style={{ fontSize: '13px' }}>
              Are you sure you want to sign out? You will need to log in again to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 sm:flex-row">
            <button
              onClick={() => setShowLogoutDialog(false)}
              className="flex-1 border border-slate-200 rounded-xl text-slate-600 font-medium transition-colors hover:bg-slate-50"
              style={{ height: '44px', fontSize: '14px' }}
            >
              No
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl text-white font-semibold transition-colors"
              style={{ height: '44px', fontSize: '14px' }}
            >
              Sign Out
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
