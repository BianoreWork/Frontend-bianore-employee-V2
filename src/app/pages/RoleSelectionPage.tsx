import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Shield, Users, Briefcase, ChevronRight } from 'lucide-react';

const roles = [
  { id: 'admin', label: 'Admin', desc: 'Full system access and management', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-300' },
  { id: 'hr', label: 'HR', desc: 'Manage attendance, payroll, and employees', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-300' },
  { id: 'employee', label: 'Employee', desc: 'Check in/out, view schedule and payslip', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300' },
];

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('employee');
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('/dashboard'); }, 900);
  };

  return (
    <div
      className="flex flex-col bg-white overflow-y-auto"
      style={{ minHeight: '100dvh', maxWidth: '430px', margin: '0 auto' }}
    >
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 pt-14 pb-10">
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="white"/>
          </svg>
        </div>
        <p className="text-white font-bold" style={{ fontSize: '22px' }}>Select Role</p>
        <p className="text-blue-200 mt-1" style={{ fontSize: '13px' }}>Choose your account type to continue</p>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl -mt-5 px-5 pt-7 pb-8">
        <div className="space-y-3 mb-6">
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => setSelected(role.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                selected === role.id ? `${role.border} ${role.bg}` : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl ${role.bg} flex items-center justify-center flex-shrink-0`}>
                <role.icon size={22} className={role.color} />
              </div>
              <div className="flex-1">
                <p className="text-slate-800 font-semibold" style={{ fontSize: '15px' }}>{role.label}</p>
                <p className="text-slate-400 mt-0.5" style={{ fontSize: '12px' }}>{role.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selected === role.id ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
              }`}>
                {selected === role.id && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
          style={{ height: '52px', fontSize: '15px' }}
        >
          {loading ? (
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          ) : (
            <>Continue as {roles.find(r => r.id === selected)?.label} <ChevronRight size={17} /></>
          )}
        </button>
      </div>
    </div>
  );
}
