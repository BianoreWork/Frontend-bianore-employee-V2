import { useState } from 'react';
import { CheckSquare, Clock, Plus, X, ChevronDown } from 'lucide-react';

type TaskStatus = 'not_started' | 'in_progress' | 'completed';
type Priority = 'high' | 'medium' | 'low';

interface Task {
  id: number;
  title: string;
  description: string;
  dueTime: string;
  priority: Priority;
  status: TaskStatus;
}

const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  high: { label: 'High', color: 'text-red-600', bg: 'bg-red-50' },
  medium: { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50' },
  low: { label: 'Low', color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Not Started', color: 'text-slate-500', bg: 'bg-slate-100' },
  in_progress: { label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-100' },
  completed: { label: 'Done', color: 'text-emerald-600', bg: 'bg-emerald-100' },
};

const initialTasks: Task[] = [
  { id: 1, title: 'Prepare Q2 Sales Report', description: 'Compile and format Q2 sales data for management review.', dueTime: '10:00 AM', priority: 'high', status: 'in_progress' },
  { id: 2, title: 'Client Follow-up Call – PT Maju', description: "Follow up on last week's proposal.", dueTime: '11:30 AM', priority: 'high', status: 'not_started' },
  { id: 3, title: 'Update CRM Contacts', description: 'Add new leads from networking event.', dueTime: '01:00 PM', priority: 'medium', status: 'completed' },
  { id: 4, title: 'Internal Team Sync', description: 'Weekly sales team KPI update sync.', dueTime: '02:00 PM', priority: 'medium', status: 'not_started' },
  { id: 5, title: 'Submit Expense Report', description: "Submit last month's travel expenses.", dueTime: '04:00 PM', priority: 'low', status: 'completed' },
  { id: 6, title: 'Review Product Proposal', description: 'Provide feedback on new product proposal from R&D.', dueTime: '05:00 PM', priority: 'low', status: 'in_progress' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const completed = tasks.filter(t => t.status === 'completed').length;

  const cycleStatus = (id: number) => {
    const order: TaskStatus[] = ['not_started', 'in_progress', 'completed'];
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const idx = order.indexOf(t.status);
      return { ...t, status: order[(idx + 1) % 3] };
    }));
  };

  return (
    <div className="pb-4">
      {/* Summary */}
      <div className="px-4 pt-4 grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total', value: tasks.length, color: 'text-slate-700', bg: 'bg-slate-50' },
          { label: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Done', value: completed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(item => (
          <div key={item.label} className={`${item.bg} rounded-2xl p-3.5 text-center`}>
            <p className={`font-bold ${item.color}`} style={{ fontSize: '22px' }}>{item.value}</p>
            <p className="text-slate-400" style={{ fontSize: '11px' }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex justify-between mb-2">
            <span className="text-slate-700 font-medium" style={{ fontSize: '13px' }}>Daily Progress</span>
            <span className="text-slate-500" style={{ fontSize: '13px' }}>{completed}/{tasks.length}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(completed / tasks.length) * 100}%` }}
            />
          </div>
          <p className="text-slate-400 mt-1" style={{ fontSize: '11px' }}>{Math.round((completed / tasks.length) * 100)}% complete today</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-4 mb-4 flex gap-2 overflow-x-auto pb-1">
        {(['all', 'not_started', 'in_progress', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex-shrink-0 ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
            style={{ fontSize: '12px', fontWeight: 500 }}
          >
            {f === 'all' ? 'All' : statusConfig[f].label}
          </button>
        ))}
        <button
          onClick={() => setShowAdd(true)}
          className="ml-auto flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-xl"
          style={{ fontSize: '12px' }}
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {/* Task list */}
      <div className="px-4 space-y-2">
        {filtered.map(task => {
          const pCfg = priorityConfig[task.priority];
          const sCfg = statusConfig[task.status];
          return (
            <div key={task.id} className={`bg-white rounded-3xl p-4 border transition-all ${task.status === 'completed' ? 'border-slate-100 opacity-75' : 'border-slate-100'}`}>
              <div className="flex items-start gap-3">
                {/* Status toggle circle */}
                <button
                  onClick={() => cycleStatus(task.id)}
                  className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    task.status === 'completed' ? 'border-emerald-500 bg-emerald-500' :
                    task.status === 'in_progress' ? 'border-blue-500 bg-blue-50' :
                    'border-slate-300'
                  }`}
                >
                  {task.status === 'completed' && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {task.status === 'in_progress' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`} style={{ fontSize: '14px' }}>
                    {task.title}
                  </p>
                  <p className="text-slate-400 mt-0.5" style={{ fontSize: '12px' }}>{task.description}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 text-slate-400" style={{ fontSize: '11px' }}>
                      <Clock size={11} /> {task.dueTime}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${pCfg.bg} ${pCfg.color}`} style={{ fontSize: '11px' }}>
                      {pCfg.label}
                    </span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${sCfg.bg} ${sCfg.color}`} style={{ fontSize: '11px' }}>
                  {sCfg.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 mt-3">
        <p className="text-slate-400 text-center" style={{ fontSize: '11px' }}>Tap the circle to cycle task status</p>
      </div>

      {showAdd && (
        <AddTaskSheet
          onAdd={(task) => {
            setTasks(prev => [...prev, { ...task, id: Date.now() }]);
            setShowAdd(false);
          }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

function AddTaskSheet({
  onAdd, onClose,
}: {
  onAdd: (task: Omit<Task, 'id'>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) { setError('Task title is required.'); return; }
    if (!dueTime) { setError('Due time is required.'); return; }
    onAdd({ title: title.trim(), description: description.trim(), dueTime, priority, status: 'not_started' });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ maxWidth: 430, margin: '0 auto' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl p-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-800 font-bold" style={{ fontSize: '17px' }}>Add New Task</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X size={15} className="text-slate-500" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <p className="text-slate-500 font-semibold mb-1" style={{ fontSize: '11px' }}>TITLE *</p>
            <input
              value={title}
              onChange={e => { setTitle(e.target.value); setError(''); }}
              placeholder="Enter task title"
              className="w-full bg-slate-100 rounded-2xl px-4 py-3 outline-none text-slate-800"
              style={{ fontSize: '14px' }}
            />
          </div>

          <div>
            <p className="text-slate-500 font-semibold mb-1" style={{ fontSize: '11px' }}>DESCRIPTION</p>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description (optional)"
              rows={2}
              className="w-full bg-slate-100 rounded-2xl px-4 py-3 outline-none text-slate-800 resize-none"
              style={{ fontSize: '13px' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-slate-500 font-semibold mb-1" style={{ fontSize: '11px' }}>DUE TIME *</p>
              <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-3 py-3">
                <Clock size={13} className="text-slate-400 flex-shrink-0" />
                <input
                  type="time"
                  value={dueTime}
                  onChange={e => { setDueTime(e.target.value); setError(''); }}
                  className="flex-1 bg-transparent outline-none text-slate-800"
                  style={{ fontSize: '13px' }}
                />
              </div>
            </div>

            <div>
              <p className="text-slate-500 font-semibold mb-1" style={{ fontSize: '11px' }}>PRIORITY</p>
              <div className="relative">
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as Priority)}
                  className="w-full appearance-none bg-slate-100 rounded-2xl px-3 py-3 pr-8 outline-none text-slate-800"
                  style={{ fontSize: '13px' }}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-500 font-medium" style={{ fontSize: '12px' }}>{error}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border-2 border-slate-200 rounded-2xl text-slate-600 font-semibold"
            style={{ height: 48, fontSize: '14px' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
            style={{ height: 48, fontSize: '14px' }}
          >
            <CheckSquare size={16} /> Add Task
          </button>
        </div>
      </div>
    </div>
  );
}
