import { useState, useRef } from 'react';
import {
  FileText, Image, File, Calendar, Clock, X,
  Upload, CheckCircle2, ChevronRight, AlertCircle,
  Paperclip, Play, Flag,
} from 'lucide-react';

type Priority = 'high' | 'medium' | 'low';
type TaskStatus = 'not_started' | 'in_progress' | 'completed';
type TaskTab = 'baru' | 'berjalan' | 'selesai';

interface AdminDoc {
  id: number;
  name: string;
  type: 'pdf' | 'image' | 'doc' | 'other';
  size: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  dueDate: string;   // yyyy-MM-dd
  dueTime: string;   // HH:mm
  priority: Priority;
  status: TaskStatus;
  assignedBy: string;
  location?: string;
  adminDocs: AdminDoc[];
  proofUploaded: boolean;
  completedAt?: string;
}

const PRIORITY_CFG: Record<Priority, { label: string; color: string; bg: string; dot: string }> = {
  high:   { label: 'Tinggi',  color: 'text-red-600',    bg: 'bg-red-50',    dot: 'bg-red-500'    },
  medium: { label: 'Sedang',  color: 'text-amber-600',  bg: 'bg-amber-50',  dot: 'bg-amber-500'  },
  low:    { label: 'Rendah',  color: 'text-emerald-600',bg: 'bg-emerald-50',dot: 'bg-emerald-500' },
};

const TABS: { key: TaskTab; label: string; status: TaskStatus }[] = [
  { key: 'baru',     label: 'Tugas Baru',    status: 'not_started' },
  { key: 'berjalan', label: 'Tugas Berjalan', status: 'in_progress' },
  { key: 'selesai',  label: 'Tugas Selesai', status: 'completed'   },
];

const INITIAL_TASKS: Task[] = [
  {
    id: 1, title: 'Review Proposal Proyek Baru',
    description: 'Tinjau dan berikan masukan terhadap proposal proyek Q3 yang dikirim oleh tim R&D. Pastikan estimasi biaya dan timeline sesuai.',
    dueDate: '2026-05-28', dueTime: '10:00', priority: 'high',
    status: 'not_started', assignedBy: 'Andi Wijaya (Manager)',
    adminDocs: [
      { id: 1, name: 'Proposal_Q3_2026.pdf', type: 'pdf', size: '2.4 MB' },
      { id: 2, name: 'Template_Review.docx', type: 'doc', size: '120 KB' },
    ],
    proofUploaded: false,
  },
  {
    id: 2, title: 'Follow-up Klien PT Maju',
    description: 'Hubungi tim PT Maju untuk membahas tindak lanjut presentasi minggu lalu. Konfirmasi ketertarikan mereka terhadap paket enterprise.',
    dueDate: '2026-05-28', dueTime: '11:30', priority: 'high',
    status: 'not_started', assignedBy: 'Andi Wijaya (Manager)',
    adminDocs: [
      { id: 3, name: 'Notulen_Meeting_PT_Maju.pdf', type: 'pdf', size: '540 KB' },
    ],
    proofUploaded: false,
  },
  {
    id: 3, title: 'Update Laporan Penjualan Mingguan',
    description: 'Perbarui data penjualan di spreadsheet laporan mingguan berdasarkan transaksi yang masuk dari Senin-Jumat pekan ini.',
    dueDate: '2026-05-27', dueTime: '14:00', priority: 'medium',
    status: 'in_progress', assignedBy: 'Sari Dewi (Supervisor)',
    adminDocs: [
      { id: 4, name: 'Template_Laporan_Penjualan.xlsx', type: 'doc', size: '890 KB' },
    ],
    proofUploaded: false,
  },
  {
    id: 4, title: 'Presentasi KPI Tim Sales',
    description: 'Siapkan dan sampaikan presentasi KPI tim sales bulan Mei di hadapan manajemen. Gunakan data terbaru dari sistem CRM.',
    dueDate: '2026-05-27', dueTime: '15:00', priority: 'high',
    status: 'in_progress', assignedBy: 'Andi Wijaya (Manager)',
    adminDocs: [],
    proofUploaded: false,
  },
  {
    id: 5, title: 'Rekap Pengeluaran Operasional April',
    description: 'Kumpulkan semua bukti pengeluaran operasional bulan April dan masukkan ke dalam sistem keuangan.',
    dueDate: '2026-05-25', dueTime: '17:00', priority: 'low',
    status: 'completed', assignedBy: 'HR Admin',
    adminDocs: [],
    proofUploaded: true, completedAt: '2026-05-25',
  },
  {
    id: 6, title: 'Pengisian Data CRM Kontak Baru',
    description: 'Tambahkan 15 kontak baru dari acara networking kemarin ke dalam sistem CRM dengan informasi lengkap.',
    dueDate: '2026-05-24', dueTime: '12:00', priority: 'medium',
    status: 'completed', assignedBy: 'Sari Dewi (Supervisor)',
    adminDocs: [
      { id: 5, name: 'Daftar_Kontak_Networking.xlsx', type: 'doc', size: '210 KB' },
    ],
    proofUploaded: true, completedAt: '2026-05-24',
  },
];

function docIcon(type: AdminDoc['type']) {
  if (type === 'pdf')   return <FileText size={14} className="text-red-500" />;
  if (type === 'image') return <Image    size={14} className="text-blue-500" />;
  if (type === 'doc')   return <File     size={14} className="text-indigo-500" />;
  return <Paperclip size={14} className="text-slate-400" />;
}

function fmtDate(d: string) {
  try {
    const [y, m, day] = d.split('-').map(Number);
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return `${day} ${months[m - 1]} ${y}`;
  } catch { return d; }
}

// ── Task detail bottom sheet ──────────────────────────────────────────────────

function TaskDetailSheet({ task, onClose, onAction }: {
  task: Task;
  onClose: () => void;
  onAction: (id: number, action: 'start' | 'complete') => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const p = PRIORITY_CFG[task.priority];

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setProofFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-white rounded-t-3xl z-50 overflow-y-auto"
        style={{ maxWidth: '430px', maxHeight: '75dvh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-2 pb-3">
          <div className="flex-1 pr-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2 py-0.5 rounded-full font-semibold ${p.bg} ${p.color}`} style={{ fontSize: '10px' }}>
                <Flag size={9} className="inline mr-1" />{p.label}
              </span>
              {task.status === 'completed' && (
                <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700" style={{ fontSize: '10px' }}>
                  <CheckCircle2 size={9} className="inline mr-1" />Selesai
                </span>
              )}
            </div>
            <p className="text-slate-800 font-bold" style={{ fontSize: '15px' }}>{task.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
            <X size={15} className="text-slate-500" />
          </button>
        </div>

        <div className="px-5 pb-6 space-y-4">
          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-2xl px-3 py-2.5">
              <p className="text-slate-400 mb-0.5 flex items-center gap-1" style={{ fontSize: '10px' }}>
                <Calendar size={10} /> Tenggat
              </p>
              <p className="text-slate-700 font-semibold" style={{ fontSize: '12px' }}>{fmtDate(task.dueDate)}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl px-3 py-2.5">
              <p className="text-slate-400 mb-0.5 flex items-center gap-1" style={{ fontSize: '10px' }}>
                <Clock size={10} /> Waktu
              </p>
              <p className="text-slate-700 font-semibold" style={{ fontSize: '12px' }}>{task.dueTime}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl px-3 py-2.5">
            <p className="text-slate-400 mb-0.5" style={{ fontSize: '10px' }}>Ditugaskan oleh</p>
            <p className="text-slate-700 font-semibold" style={{ fontSize: '12px' }}>{task.assignedBy}</p>
          </div>

          {/* Description */}
          <div>
            <p className="text-slate-500 font-semibold mb-2" style={{ fontSize: '11px' }}>DESKRIPSI</p>
            <p className="text-slate-600 leading-relaxed" style={{ fontSize: '13px' }}>{task.description}</p>
          </div>

          {/* Admin documents */}
          {task.adminDocs.length > 0 && (
            <div>
              <p className="text-slate-500 font-semibold mb-2" style={{ fontSize: '11px' }}>
                DOKUMEN DARI ADMIN ({task.adminDocs.length})
              </p>
              <div className="space-y-2">
                {task.adminDocs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 bg-slate-50 rounded-2xl px-3 py-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center flex-shrink-0">
                      {docIcon(doc.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 font-medium truncate" style={{ fontSize: '12px' }}>{doc.name}</p>
                      <p className="text-slate-400" style={{ fontSize: '10px' }}>{doc.size}</p>
                    </div>
                    <button className="text-blue-600 font-semibold flex-shrink-0" style={{ fontSize: '11px' }}>Unduh</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proof upload */}
          {task.status !== 'completed' && (
            <div>
              <p className="text-slate-500 font-semibold mb-2" style={{ fontSize: '11px' }}>BUKTI PENGERJAAN</p>
              <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFiles} />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-2xl py-4 flex flex-col items-center gap-1.5 active:bg-slate-50"
              >
                <Upload size={18} className="text-slate-400" />
                <p className="text-slate-500 font-medium" style={{ fontSize: '12px' }}>Upload foto / dokumen</p>
                <p className="text-slate-400" style={{ fontSize: '10px' }}>JPG, PNG, PDF — maks 10 MB</p>
              </button>
              {proofFiles.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {proofFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2">
                      <Paperclip size={12} className="text-blue-500 flex-shrink-0" />
                      <span className="flex-1 truncate text-blue-700" style={{ fontSize: '11px' }}>{f.name}</span>
                      <button onClick={() => setProofFiles(p => p.filter((_, j) => j !== i))}>
                        <X size={12} className="text-blue-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {task.status === 'completed' && task.proofUploaded && (
            <div className="flex items-center gap-2 bg-emerald-50 rounded-2xl px-3 py-2.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <p className="text-emerald-700 font-medium" style={{ fontSize: '12px' }}>
                Bukti sudah diupload{task.completedAt ? ` · ${fmtDate(task.completedAt)}` : ''}
              </p>
            </div>
          )}

          {/* Action button */}
          {task.status === 'not_started' && (
            <button
              onClick={() => { onAction(task.id, 'start'); onClose(); }}
              className="w-full bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:bg-blue-700"
              style={{ height: 48, fontSize: '14px' }}
            >
              <Play size={15} /> Mulai Tugas
            </button>
          )}
          {task.status === 'in_progress' && (
            <button
              onClick={() => { onAction(task.id, 'complete'); onClose(); }}
              className="w-full bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:bg-emerald-700"
              style={{ height: 48, fontSize: '14px' }}
            >
              <CheckCircle2 size={15} /> Tandai Selesai
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [tasks, setTasks]         = useState<Task[]>(INITIAL_TASKS);
  const [activeTab, setActiveTab] = useState<TaskTab>('baru');
  const [filterDate, setFilterDate] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleAction = (id: number, action: 'start' | 'complete') => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (action === 'start')    return { ...t, status: 'in_progress' };
      if (action === 'complete') return { ...t, status: 'completed', proofUploaded: true, completedAt: new Date().toISOString().slice(0, 10) };
      return t;
    }));
  };

  const currentStatus = TABS.find(t => t.key === activeTab)!.status;

  const filtered = tasks.filter(t => {
    if (t.status !== currentStatus) return false;
    if (filterDate && t.dueDate !== filterDate) return false;
    return true;
  });

  const counts: Record<TaskTab, number> = {
    baru:     tasks.filter(t => t.status === 'not_started').length,
    berjalan: tasks.filter(t => t.status === 'in_progress').length,
    selesai:  tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="pb-4">
      {/* Stats */}
      <div className="px-4 pt-4 grid grid-cols-3 gap-2 mb-4">
        {TABS.map(t => (
          <div
            key={t.key}
            className={`rounded-2xl p-3 text-center ${activeTab === t.key ? 'bg-blue-600' : 'bg-slate-50'}`}
          >
            <p className={`font-bold ${activeTab === t.key ? 'text-white' : 'text-slate-700'}`} style={{ fontSize: '20px' }}>
              {counts[t.key]}
            </p>
            <p className={activeTab === t.key ? 'text-blue-200' : 'text-slate-400'} style={{ fontSize: '10px' }}>
              {t.label}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-4 mb-3">
        <div className="bg-slate-100 rounded-2xl p-1 flex gap-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-2 rounded-xl font-semibold transition-all relative ${activeTab === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              style={{ fontSize: '11px' }}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center ${activeTab === t.key ? 'bg-blue-500' : 'bg-slate-400'}`} style={{ fontSize: '9px' }}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Date filter */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5">
          <Calendar size={14} className="text-slate-400 flex-shrink-0" />
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="flex-1 bg-transparent outline-none text-slate-600"
            style={{ fontSize: '13px' }}
          />
          {filterDate && (
            <button onClick={() => setFilterDate('')}>
              <X size={14} className="text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Task list */}
      <div className="px-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 py-12 text-center">
            <AlertCircle size={28} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold" style={{ fontSize: '14px' }}>
              {filterDate ? 'Tidak ada tugas pada tanggal ini' : `Tidak ada ${TABS.find(t => t.key === activeTab)!.label.toLowerCase()}`}
            </p>
          </div>
        ) : (
          filtered.map(task => {
            const p = PRIORITY_CFG[task.priority];
            return (
              <button
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="w-full bg-white rounded-3xl border border-slate-100 p-4 text-left active:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Priority dot */}
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${p.dot}`} />

                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`} style={{ fontSize: '13px' }}>
                      {task.title}
                    </p>
                    <p className="text-slate-400 mt-0.5 line-clamp-2" style={{ fontSize: '11px' }}>{task.description}</p>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-400" style={{ fontSize: '11px' }}>
                        <Clock size={10} /> {task.dueTime} · {fmtDate(task.dueDate)}
                      </span>
                      {task.adminDocs.length > 0 && (
                        <span className="flex items-center gap-1 text-blue-500" style={{ fontSize: '11px' }}>
                          <Paperclip size={10} /> {task.adminDocs.length} dok
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${p.bg} ${p.color}`} style={{ fontSize: '10px' }}>
                      {p.label}
                    </span>
                    <ChevronRight size={14} className="text-slate-300" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Task detail sheet */}
      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
