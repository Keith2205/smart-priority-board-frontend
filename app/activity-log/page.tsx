'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import { ActivityLogResponse, TaskLogEntry } from '@/types';
import Navbar from '@/app/components/Navbar';

const QUADRANT_BADGE: Record<string, string> = {
  Q1: 'bg-red-500/20 text-red-300',
  Q2: 'bg-blue-500/20 text-blue-300',
  Q3: 'bg-yellow-500/20 text-yellow-300',
  Q4: 'bg-gray-500/20 text-gray-300',
};

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function LogCard({ entry }: { entry: TaskLogEntry }) {
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <div className="flex items-start justify-between gap-3">
        <p className="text-gray-400 font-semibold text-sm line-through leading-snug flex-1">
          {entry.title}
        </p>
        {entry.quadrant && (
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${QUADRANT_BADGE[entry.quadrant] ?? 'bg-gray-700 text-gray-300'}`}>
            {entry.quadrant}
          </span>
        )}
      </div>

      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {entry.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-gray-500">
        <span>
          <span className="text-gray-400">Completed:</span>{' '}
          <span className="text-gray-300">{formatDate(entry.completedAt)}</span>
        </span>
        <span>
          <span className="text-gray-400">Auto-removed:</span>{' '}
          <span className="text-gray-300">{formatDate(entry.autoDeletedAt)}</span>
        </span>
      </div>
    </div>
  );
}

export default function ActivityLogPage() {
  const router = useRouter();
  const [logs, setLogs]         = useState<TaskLogEntry[]>([]);
  const [message, setMessage]   = useState('');
  const [loading, setLoading]   = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return; }
    fetchLog();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function fetchLog() {
    setLoading(true);
    try {
      const data = await api.get<ActivityLogResponse>('/activity-log');
      setLogs(data.logs);
      setMessage(data.message);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    if (!confirm('Clear your entire activity log? This cannot be undone.')) return;
    setClearing(true);
    try {
      await api.delete('/activity-log');
      setLogs([]);
    } catch {
      alert('Failed to clear log. Please try again.');
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white">Activity Log</h1>
            <p className="mt-1 text-gray-400 text-sm">
              Tasks auto-removed after 72 hours in Done status
            </p>
          </div>
          {logs.length > 0 && (
            <button
              onClick={handleClear}
              disabled={clearing}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-lg transition disabled:opacity-50"
            >
              {clearing ? 'Clearing...' : '🗑️ Clear Log'}
            </button>
          )}
        </div>

        {/* Info banner */}
        {message && (
          <div className="mt-4 mb-6 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm leading-relaxed">
            ℹ️ {message}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <span className="text-5xl">📭</span>
            <p className="text-gray-400 font-medium">No activity yet.</p>
            <p className="text-gray-600 text-sm">Complete tasks to see them here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-500 mb-1">{logs.length} archived task{logs.length !== 1 ? 's' : ''}</p>
            {logs.map((entry) => (
              <LogCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
