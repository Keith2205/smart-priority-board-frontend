'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import { Task, Quadrant, TaskStatus, PagedResponse, EffortEstimate } from '@/types';
import Navbar from '@/app/components/Navbar';
import TaskModal from '@/app/components/TaskModal';

// ─── Constants ───────────────────────────────────────────────────────────────

const QUADRANT_META: Record<Quadrant, { label: string; icon: string; headerClass: string; badgeClass: string }> = {
  Q1: { label: 'Do First',  icon: '⚡', headerClass: 'border-red-500/50 text-red-400',       badgeClass: 'bg-red-500/20 text-red-300' },
  Q2: { label: 'Schedule',  icon: '📅', headerClass: 'border-blue-500/50 text-blue-400',     badgeClass: 'bg-blue-500/20 text-blue-300' },
  Q3: { label: 'Delegate',  icon: '👋', headerClass: 'border-yellow-500/50 text-yellow-400', badgeClass: 'bg-yellow-500/20 text-yellow-300' },
  Q4: { label: 'Later',     icon: '🗑️', headerClass: 'border-gray-500/50 text-gray-400',    badgeClass: 'bg-gray-500/20 text-gray-300' },
};

const STATUS_META: Record<TaskStatus, { label: string; icon: string; headerClass: string }> = {
  TODO:        { label: 'Todo',        icon: '○', headerClass: 'border-gray-500/50 text-gray-400' },
  IN_PROGRESS: { label: 'In Progress', icon: '◑', headerClass: 'border-indigo-500/50 text-indigo-400' },
  DONE:        { label: 'Done',        icon: '●', headerClass: 'border-green-500/50 text-green-400' },
};

const EFFORT_LABELS: Record<EffortEstimate, string> = {
  MINS_15:  '15 min',
  MINS_30:  '30 min',
  HOUR_1:   '1 hr',
  HOURS_3:  '3 hrs',
  HALF_DAY: 'Half day',
  FULL_DAY: 'Full day',
};

const QUADRANT_BADGE: Record<string, string> = {
  Q1: 'bg-red-500/20 text-red-300',
  Q2: 'bg-blue-500/20 text-blue-300',
  Q3: 'bg-yellow-500/20 text-yellow-300',
  Q4: 'bg-gray-500/20 text-gray-300',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function autoDeleteCountdown(completedAt: string): string {
  const deleteAt = new Date(completedAt).getTime() + 72 * 60 * 60 * 1000;
  const remaining = deleteAt - Date.now();
  if (remaining <= 0) return 'soon';
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  if (hours < 1) return '<1h';
  return `${hours}h`;
}

// ─── Priority view card ───────────────────────────────────────────────────────

interface PriorityCardProps {
  task: Task;
  badgeClass: string;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function PriorityCard({ task, badgeClass, onEdit, onDelete }: PriorityCardProps) {
  return (
    <div className="group bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-500 transition">
      <div className="flex items-start justify-between gap-2">
        <p className="text-white font-semibold text-sm leading-snug flex-1">{task.title}</p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
          <button onClick={() => onEdit(task)} title="Edit task"
            className="p-1 text-gray-400 hover:text-indigo-400 transition rounded">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button onClick={() => onDelete(task)} title="Delete task"
            className="p-1 text-gray-400 hover:text-red-400 transition rounded">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zm-.5 5a.5.5 0 011 0v6a.5.5 0 01-1 0V7zm3 0a.5.5 0 011 0v6a.5.5 0 01-1 0V7z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      {task.description && <p className="text-gray-400 text-xs mt-1 truncate">{task.description}</p>}
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>{task.quadrant}</span>
        {task.effortEstimate && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
            {EFFORT_LABELS[task.effortEstimate]}
          </span>
        )}
        {task.deadline && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
            📅 {formatDeadline(task.deadline)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Status view card ─────────────────────────────────────────────────────────

interface StatusCardProps {
  task: Task;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function StatusCard({ task, onStatusChange, onEdit, onDelete }: StatusCardProps) {
  const [moving, setMoving] = useState(false);

  async function move(newStatus: TaskStatus) {
    setMoving(true);
    await onStatusChange(task, newStatus);
    setMoving(false);
  }

  return (
    <div className="group bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-500 transition">
      <div className="flex items-start justify-between gap-2">
        <p className="text-white font-semibold text-sm leading-snug flex-1">{task.title}</p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
          <button onClick={() => onEdit(task)} title="Edit"
            className="p-1 text-gray-400 hover:text-indigo-400 transition rounded">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button onClick={() => onDelete(task)} title="Delete"
            className="p-1 text-gray-400 hover:text-red-400 transition rounded">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zm-.5 5a.5.5 0 011 0v6a.5.5 0 01-1 0V7zm3 0a.5.5 0 011 0v6a.5.5 0 01-1 0V7z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {task.quadrant && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${QUADRANT_BADGE[task.quadrant] ?? 'bg-gray-700 text-gray-300'}`}>
            {task.quadrant}
          </span>
        )}
        {task.effortEstimate && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
            {EFFORT_LABELS[task.effortEstimate]}
          </span>
        )}
        {task.deadline && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
            📅 {formatDeadline(task.deadline)}
          </span>
        )}
      </div>

      {/* Status action buttons */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {task.status === 'TODO' && (
          <button disabled={moving} onClick={() => move('IN_PROGRESS')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg transition disabled:opacity-50">
            ▶ Start
          </button>
        )}
        {task.status === 'IN_PROGRESS' && (
          <>
            <button disabled={moving} onClick={() => move('DONE')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30 rounded-lg transition disabled:opacity-50">
              ✓ Complete
            </button>
            <button disabled={moving} onClick={() => move('TODO')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 rounded-lg transition disabled:opacity-50">
              ↩ Back to Todo
            </button>
          </>
        )}
        {task.status === 'DONE' && (
          <>
            <button disabled={moving} onClick={() => move('IN_PROGRESS')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 rounded-lg transition disabled:opacity-50">
              ↩ Reopen
            </button>
            {task.completedAt && (
              <span className="flex items-center gap-1 px-2.5 py-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                🕐 Auto-deletes in {autoDeleteCountdown(task.completedAt)}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Column components ────────────────────────────────────────────────────────

function QuadrantColumn({ quadrant, tasks, onEdit, onDelete }: {
  quadrant: Quadrant; tasks: Task[];
  onEdit: (t: Task) => void; onDelete: (t: Task) => void;
}) {
  const meta = QUADRANT_META[quadrant];
  return (
    <div className="flex flex-col gap-3">
      <div className={`flex items-center justify-between border-b pb-2 ${meta.headerClass}`}>
        <span className="font-bold text-sm">{meta.icon} {quadrant} · {meta.label}</span>
        <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full border border-gray-700 text-gray-400">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.length === 0
          ? <p className="text-gray-600 text-xs text-center py-6">No tasks yet</p>
          : tasks.map((t) => (
              <PriorityCard key={t.id} task={t} badgeClass={meta.badgeClass} onEdit={onEdit} onDelete={onDelete} />
            ))}
      </div>
    </div>
  );
}

function StatusColumn({ status, tasks, onStatusChange, onEdit, onDelete }: {
  status: TaskStatus; tasks: Task[];
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onEdit: (t: Task) => void; onDelete: (t: Task) => void;
}) {
  const meta = STATUS_META[status];
  return (
    <div className="flex flex-col gap-3">
      <div className={`flex items-center justify-between border-b pb-2 ${meta.headerClass}`}>
        <span className="font-bold text-sm">{meta.icon} {meta.label}</span>
        <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full border border-gray-700 text-gray-400">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.length === 0
          ? <p className="text-gray-600 text-xs text-center py-6">No tasks yet</p>
          : tasks.map((t) => (
              <StatusCard key={t.id} task={t} onStatusChange={onStatusChange} onEdit={onEdit} onDelete={onDelete} />
            ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ViewMode = 'priority' | 'status';

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks]             = useState<Task[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [viewMode, setViewMode]       = useState<ViewMode>('priority');

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return; }
    api.get<PagedResponse<Task>>('/tasks?page=0&size=100')
      .then((data) => setTasks(data.content))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [router]);

  function openAddModal() { setEditingTask(undefined); setModalOpen(true); }
  function openEditModal(task: Task) { setEditingTask(task); setModalOpen(true); }

  function handleSaved(saved: Task) {
    setTasks((prev) => {
      const exists = prev.find((t) => t.id === saved.id);
      return exists ? prev.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...prev];
    });
  }

  async function handleDelete(task: Task) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch {
      alert('Failed to delete task. Please try again.');
    }
  }

  async function handleStatusChange(task: Task, newStatus: TaskStatus) {
    try {
      const updated = await api.patch<Task>(`/tasks/${task.id}/status`, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      alert('Failed to update status. Please try again.');
    }
  }

  const grouped = (Object.keys(QUADRANT_META) as Quadrant[]).reduce<Record<Quadrant, Task[]>>(
    (acc, q) => { acc[q] = tasks.filter((t) => t.quadrant === q); return acc; },
    { Q1: [], Q2: [], Q3: [], Q4: [] }
  );

  const byStatus = (Object.keys(STATUS_META) as TaskStatus[]).reduce<Record<TaskStatus, Task[]>>(
    (acc, s) => { acc[s] = tasks.filter((t) => t.status === s); return acc; },
    { TODO: [], IN_PROGRESS: [], DONE: [] }
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-white">My Priority Board</h1>
          <div className="flex gap-3">
            <button onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition">
              + Add Task
            </button>
            <button onClick={() => alert('AI features coming in Phase 2!')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg border border-gray-600 transition">
              🤖 AI Mode
            </button>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 mb-8 bg-gray-800 rounded-xl p-1 w-fit border border-gray-700">
          {([['priority', '📊 Priority View'], ['status', '📋 Status View']] as [ViewMode, string][]).map(([mode, label]) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                viewMode === mode ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : viewMode === 'priority' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(Object.keys(QUADRANT_META) as Quadrant[]).map((q) => (
              <QuadrantColumn key={q} quadrant={q} tasks={grouped[q]} onEdit={openEditModal} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {(Object.keys(STATUS_META) as TaskStatus[]).map((s) => (
              <StatusColumn key={s} status={s} tasks={byStatus[s]}
                onStatusChange={handleStatusChange} onEdit={openEditModal} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      <TaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        onSaved={handleSaved} existingTask={editingTask} />
    </div>
  );
}
