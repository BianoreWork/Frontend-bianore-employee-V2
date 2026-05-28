import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  User, Mail, Building2, Briefcase, Hash,
  Shield, Monitor, ChevronRight, LogOut,
  FileText, DollarSign, CreditCard, Heart,
  Edit2, X, Save, CheckCircle2, AlertCircle,
  IdCard, Phone, MapPin, BookOpen,
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
import { employeeService, type TaxProfile, type BpjsProfile } from '../../services/employeeService';
import { useAuth } from '../../contexts/AuthContext';
import type { User as UserType } from '../../types/api';

// ── Edit sheet component ──────────────────────────────────────────────────────

function EditSheet({ open, title, onClose, onSave, saving, children }: {
  open: boolean; title: string; onClose: () => void;
  onSave: () => void; saving: boolean; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-white rounded-t-3xl z-50 pb-8 overflow-y-auto"
        style={{ maxWidth: '430px', maxHeight: '85dvh' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <p className="text-slate-800 font-bold" style={{ fontSize: '15px' }}>{title}</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X size={16} className="text-slate-500" />
          </button>
        </div>
        <div className="px-5 pt-4 pb-4">{children}</div>
        <div className="px-5 flex gap-3">
          <button onClick={onClose} disabled={saving}
            className="flex-1 border-2 border-slate-200 rounded-2xl text-slate-700 font-semibold" style={{ height: 48, fontSize: '14px' }}>
            Batal
          </button>
          <button onClick={onSave} disabled={saving}
            className="flex-1 bg-blue-600 text-white rounded-2xl font-bold disabled:opacity-50" style={{ height: 48, fontSize: '14px' }}>
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </div>
    </>
  );
}

function FieldInput({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="mb-4">
      <p className="text-slate-500 font-semibold mb-1.5" style={{ fontSize: '12px' }}>{label}</p>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 outline-none focus:border-blue-400 bg-white"
        style={{ fontSize: '14px' }} />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, iconBg = 'bg-slate-50', iconColor = 'text-slate-400' }: {
  icon: React.ElementType; label: string; value: string; iconBg?: string; iconColor?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0">
      <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={14} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-400" style={{ fontSize: '11px' }}>{label}</p>
        <p className="text-slate-800 font-medium truncate" style={{ fontSize: '13px' }}>{value || '—'}</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, onEdit, iconColor = 'text-blue-600' }: {
  icon: React.ElementType; title: string; onEdit?: () => void; iconColor?: string;
}) {
  return (
    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
      <p className="text-slate-700 font-semibold flex items-center gap-2" style={{ fontSize: '13px' }}>
        <Icon size={14} className={iconColor} /> {title}
      </p>
      {onEdit && (
        <button onClick={onEdit} className="flex items-center gap-1 text-blue-500 font-semibold" style={{ fontSize: '12px' }}>
          <Edit2 size={12} /> Edit
        </button>
      )}
    </div>
  );
}

function NavItem({ icon: Icon, label, desc, iconBg, iconColor, onClick }: {
  icon: React.ElementType; label: string; desc: string; iconBg: string; iconColor: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0 active:bg-slate-50">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="flex-1 text-left">
        <p className="text-slate-800 font-semibold" style={{ fontSize: '13px' }}>{label}</p>
        <p className="text-slate-400" style={{ fontSize: '11px' }}>{desc}</p>
      </div>
      <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const navigate = useNavigate();
  const { clearAuth, user: cachedUser } = useAuth();
  const [user, setUser] = useState<UserType | null>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Tax profile state
  const [taxProfile, setTaxProfile] = useState<TaxProfile>({});
  const [taxLoading, setTaxLoading] = useState(false);
  const [showTaxEdit, setShowTaxEdit] = useState(false);
  const [taxEdit, setTaxEdit] = useState<TaxProfile>({});
  const [taxSaving, setTaxSaving] = useState(false);
  const [taxSaveMsg, setTaxSaveMsg] = useState('');

  // BPJS profile state
  const [bpjsProfile, setBpjsProfile] = useState<BpjsProfile>({});
  const [bpjsLoading, setBpjsLoading] = useState(false);
  const [showBpjsEdit, setShowBpjsEdit] = useState(false);
  const [bpjsEdit, setBpjsEdit] = useState<BpjsProfile>({});
  const [bpjsSaving, setBpjsSaving] = useState(false);
  const [bpjsSaveMsg, setBpjsSaveMsg] = useState('');

  useEffect(() => {
    authService.me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const employeeId = user?.employee?.id;

  useEffect(() => {
    if (!employeeId) return;
    setTaxLoading(true);
    employeeService.getTaxProfile(employeeId)
      .then(res => setTaxProfile(res.data ?? {}))
      .catch(() => {})
      .finally(() => setTaxLoading(false));

    setBpjsLoading(true);
    employeeService.getBpjsProfile(employeeId)
      .then(res => setBpjsProfile(res.data ?? {}))
      .catch(() => {})
      .finally(() => setBpjsLoading(false));
  }, [employeeId]);

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    clearAuth();
    navigate('/login');
  };

  const openTaxEdit = () => { setTaxEdit({ ...taxProfile }); setTaxSaveMsg(''); setShowTaxEdit(true); };
  const saveTaxProfile = async () => {
    if (!employeeId) return;
    setTaxSaving(true);
    setTaxSaveMsg('');
    try {
      const res = await employeeService.updateTaxProfile(employeeId, taxEdit);
      setTaxProfile(res.data);
      setTaxSaveMsg('Berhasil disimpan');
      setTimeout(() => { setShowTaxEdit(false); setTaxSaveMsg(''); }, 1000);
    } catch {
      setTaxSaveMsg('Gagal menyimpan. Coba lagi.');
    } finally {
      setTaxSaving(false);
    }
  };

  const openBpjsEdit = () => { setBpjsEdit({ ...bpjsProfile }); setBpjsSaveMsg(''); setShowBpjsEdit(true); };
  const saveBpjsProfile = async () => {
    if (!employeeId) return;
    setBpjsSaving(true);
    setBpjsSaveMsg('');
    try {
      const res = await employeeService.updateBpjsProfile(employeeId, bpjsEdit);
      setBpjsProfile(res.data);
      setBpjsSaveMsg('Berhasil disimpan');
      setTimeout(() => { setShowBpjsEdit(false); setBpjsSaveMsg(''); }, 1000);
    } catch {
      setBpjsSaveMsg('Gagal menyimpan. Coba lagi.');
    } finally {
      setBpjsSaving(false);
    }
  };

  const employee = user?.employee;
  const displayName = employee?.full_name ?? user?.email ?? '—';
  const initials = displayName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const roles = user?.roles?.map(r => r.name).join(', ') ?? '—';

  const ptkpLabels: Record<string, string> = {
    TK0: 'TK/0 - Tidak Kawin', TK1: 'TK/1 - Tidak Kawin 1 tanggungan',
    K0: 'K/0 - Kawin tanpa tanggungan', K1: 'K/1 - Kawin 1 tanggungan',
    K2: 'K/2 - Kawin 2 tanggungan', K3: 'K/3 - Kawin 3 tanggungan',
  };

  return (
    <div className="pb-8">
      {/* Profile hero */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-5 pt-5 pb-5">
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
              {loading ? 'Memuat...' : displayName}
            </p>
            <p className="text-blue-200" style={{ fontSize: '12px' }}>{employee?.position?.name ?? roles}</p>
            <p className="text-blue-300 mt-0.5" style={{ fontSize: '11px' }}>{employee?.department?.name ?? ''}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <span className="px-3 py-1 bg-white/20 rounded-full text-white" style={{ fontSize: '11px' }}>
            {employee?.employee_code ?? '—'}
          </span>
          <span className="flex items-center gap-1 px-3 py-1 bg-emerald-400/30 rounded-full text-emerald-200" style={{ fontSize: '11px' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {user?.is_active ? 'Aktif' : 'Tidak Aktif'}
          </span>
        </div>
      </div>

      {/* Info Karyawan */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <SectionHeader icon={User} title="Info Karyawan" />
          <InfoRow icon={Hash}      label="ID Karyawan"  value={employee?.employee_code ?? '—'} />
          <InfoRow icon={Building2} label="Departemen"   value={employee?.department?.name ?? '—'} />
          <InfoRow icon={Briefcase} label="Jabatan"      value={employee?.position?.name ?? '—'} />
          <InfoRow icon={Mail}      label="Email"        value={user?.email ?? '—'} />
          <InfoRow icon={Phone}     label="Role"         value={roles} />
          {employee?.join_date && (
            <InfoRow icon={BookOpen} label="Tanggal Bergabung" value={employee.join_date} />
          )}
        </div>
      </div>

      {/* Informasi Pajak */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <SectionHeader icon={IdCard} title="Informasi Pajak" iconColor="text-amber-600"
            onEdit={employeeId ? openTaxEdit : undefined} />
          {taxLoading ? (
            <div className="px-4 py-4 space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-8 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              <InfoRow icon={IdCard}    label="NIK (No. KTP)"  value={taxProfile.nik ?? '—'}  iconBg="bg-amber-50" iconColor="text-amber-500" />
              <InfoRow icon={CreditCard} label="NPWP"          value={taxProfile.npwp ?? '—'} iconBg="bg-amber-50" iconColor="text-amber-500" />
              <InfoRow icon={User}      label="Status PTKP"    value={taxProfile.ptkp_code ? (ptkpLabels[taxProfile.ptkp_code] ?? taxProfile.ptkp_code) : '—'} iconBg="bg-amber-50" iconColor="text-amber-500" />
              <InfoRow icon={FileText}  label="Metode Pajak"   value={taxProfile.tax_method ?? '—'} iconBg="bg-amber-50" iconColor="text-amber-500" />
            </>
          )}
          {!employeeId && (
            <div className="px-4 py-3 bg-amber-50">
              <p className="text-amber-600 text-center" style={{ fontSize: '11px' }}>Data karyawan tidak tersedia</p>
            </div>
          )}
        </div>
      </div>

      {/* Data BPJS */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <SectionHeader icon={Heart} title="Data BPJS" iconColor="text-rose-500"
            onEdit={employeeId ? openBpjsEdit : undefined} />
          {bpjsLoading ? (
            <div className="px-4 py-4 space-y-2">
              {[1, 2].map(i => <div key={i} className="h-8 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              <InfoRow icon={Heart}    label="No. BPJS Kesehatan"       value={bpjsProfile.bpjs_kesehatan_number ?? '—'}       iconBg="bg-rose-50" iconColor="text-rose-400" />
              <InfoRow icon={Shield}   label="No. BPJS Ketenagakerjaan" value={bpjsProfile.bpjs_ketenagakerjaan_number ?? '—'} iconBg="bg-rose-50" iconColor="text-rose-400" />
              {bpjsProfile.bpjs_kesehatan_number && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span className="text-emerald-600 font-medium" style={{ fontSize: '11px' }}>BPJS Kesehatan Aktif</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Menu navigasi lainnya */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-slate-700 font-semibold" style={{ fontSize: '13px' }}>Menu Lainnya</p>
          </div>
          <NavItem icon={IdCard}     label="Informasi Pajak & NIK" desc="Update NIK, NPWP, PTKP, metode pajak"   iconBg="bg-amber-50"   iconColor="text-amber-600"  onClick={employeeId ? openTaxEdit : () => {}} />
          <NavItem icon={Heart}      label="Data BPJS"             desc="Nomor BPJS Kesehatan & Ketenagakerjaan" iconBg="bg-rose-50"    iconColor="text-rose-500"   onClick={employeeId ? openBpjsEdit : () => {}} />
          <NavItem icon={FileText}   label="Dokumen & Berkas"      desc="Upload dan kelola dokumen pribadi"      iconBg="bg-blue-50"    iconColor="text-blue-600"   onClick={() => navigate('/dashboard/documents')} />
          <NavItem icon={MapPin}     label="Field Activity"        desc="Aktivitas kunjungan lapangan"           iconBg="bg-orange-50"  iconColor="text-orange-500" onClick={() => navigate('/dashboard/field-visit')} />
        </div>
      </div>

      {/* Keamanan */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <SectionHeader icon={Shield} title="Keamanan" />
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${user?.two_factor_enabled ? 'bg-emerald-50' : 'bg-slate-50'}`}>
              <Monitor size={16} className={user?.two_factor_enabled ? 'text-emerald-600' : 'text-slate-400'} />
            </div>
            <div className="flex-1">
              <p className="text-slate-800 font-medium" style={{ fontSize: '13px' }}>Google Authenticator (2FA)</p>
              <p className="text-slate-400" style={{ fontSize: '11px' }}>{user?.two_factor_enabled ? 'Aktif' : 'Tidak aktif'}</p>
            </div>
            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Shield size={16} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-slate-800 font-medium" style={{ fontSize: '13px' }}>Verifikasi OTP</p>
              <p className="text-slate-400" style={{ fontSize: '11px' }}>One-time password via email</p>
            </div>
            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4">
        <button onClick={() => setShowLogoutDialog(true)}
          className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-100 rounded-3xl text-red-600 font-semibold active:bg-red-100"
          style={{ height: '52px', fontSize: '15px' }}>
          <LogOut size={18} /> Keluar
        </button>
      </div>

      {/* Logout dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="rounded-2xl" style={{ maxWidth: '340px' }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800" style={{ fontSize: '16px' }}>Konfirmasi Keluar</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500" style={{ fontSize: '13px' }}>
              Yakin ingin keluar? Kamu perlu login kembali untuk mengakses sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 sm:flex-row">
            <button onClick={() => setShowLogoutDialog(false)}
              className="flex-1 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50"
              style={{ height: '44px', fontSize: '14px' }}>
              Tidak
            </button>
            <button onClick={handleLogout}
              className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl text-white font-semibold"
              style={{ height: '44px', fontSize: '14px' }}>
              Keluar
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tax edit sheet */}
      <EditSheet open={showTaxEdit} title="Edit Informasi Pajak"
        onClose={() => setShowTaxEdit(false)} onSave={saveTaxProfile} saving={taxSaving}>
        <FieldInput label="NIK (Nomor Induk Kependudukan)" value={taxEdit.nik ?? ''} onChange={v => setTaxEdit(p => ({ ...p, nik: v }))} placeholder="16 digit NIK" />
        <FieldInput label="NPWP" value={taxEdit.npwp ?? ''} onChange={v => setTaxEdit(p => ({ ...p, npwp: v }))} placeholder="XX.XXX.XXX.X-XXX.XXX" />
        <div className="mb-4">
          <p className="text-slate-500 font-semibold mb-1.5" style={{ fontSize: '12px' }}>Status PTKP</p>
          <select value={taxEdit.ptkp_code ?? ''} onChange={e => setTaxEdit(p => ({ ...p, ptkp_code: e.target.value }))}
            className="w-full border border-slate-200 bg-white rounded-2xl px-4 py-3 text-slate-700 outline-none focus:border-blue-400"
            style={{ fontSize: '14px' }}>
            <option value="">Pilih status...</option>
            {Object.entries(ptkpLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="mb-4">
          <p className="text-slate-500 font-semibold mb-1.5" style={{ fontSize: '12px' }}>Metode Pajak</p>
          <select value={taxEdit.tax_method ?? ''} onChange={e => setTaxEdit(p => ({ ...p, tax_method: e.target.value }))}
            className="w-full border border-slate-200 bg-white rounded-2xl px-4 py-3 text-slate-700 outline-none focus:border-blue-400"
            style={{ fontSize: '14px' }}>
            <option value="">Pilih metode...</option>
            <option value="gross">Gross (PPh21 ditanggung karyawan)</option>
            <option value="nett">Nett (PPh21 ditanggung perusahaan)</option>
            <option value="gross_up">Gross Up (ditunjang perusahaan)</option>
          </select>
        </div>
        {taxSaveMsg && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-2 ${taxSaveMsg.includes('Berhasil') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {taxSaveMsg.includes('Berhasil') ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            <span style={{ fontSize: '12px' }}>{taxSaveMsg}</span>
          </div>
        )}
      </EditSheet>

      {/* BPJS edit sheet */}
      <EditSheet open={showBpjsEdit} title="Edit Data BPJS"
        onClose={() => setShowBpjsEdit(false)} onSave={saveBpjsProfile} saving={bpjsSaving}>
        <FieldInput label="No. BPJS Kesehatan" value={bpjsEdit.bpjs_kesehatan_number ?? ''} onChange={v => setBpjsEdit(p => ({ ...p, bpjs_kesehatan_number: v }))} placeholder="13 digit nomor kartu" />
        <FieldInput label="No. BPJS Ketenagakerjaan" value={bpjsEdit.bpjs_ketenagakerjaan_number ?? ''} onChange={v => setBpjsEdit(p => ({ ...p, bpjs_ketenagakerjaan_number: v }))} placeholder="Nomor BPJS TK" />
        <div className="bg-blue-50 rounded-2xl px-4 py-3 flex gap-2">
          <AlertCircle size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-blue-700" style={{ fontSize: '11px' }}>Perubahan nomor BPJS akan diverifikasi oleh tim HR sebelum disetujui.</p>
        </div>
        {bpjsSaveMsg && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mt-3 ${bpjsSaveMsg.includes('Berhasil') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {bpjsSaveMsg.includes('Berhasil') ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            <span style={{ fontSize: '12px' }}>{bpjsSaveMsg}</span>
          </div>
        )}
      </EditSheet>
    </div>
  );

}
