'use client';

import { useEffect, useState, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import Navbar from '@/app/components/Navbar';

type WorkHours = 'EARLY_BIRD' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT_OWL';
type WorkStyle = 'SMALL_WINS_FIRST' | 'BIG_TASKS_FIRST' | 'DEADLINE_DRIVEN' | 'BALANCED';

interface UserProfile {
  strengths?: string[];
  weaknesses?: string[];
  preferredWorkHours?: WorkHours;
  workStyle?: WorkStyle;
  avgTasksPerDay?: number;
}

const WORK_HOURS_OPTIONS: { value: WorkHours; label: string }[] = [
  { value: 'EARLY_BIRD',  label: 'Early Bird (5am - 8am)' },
  { value: 'MORNING',     label: 'Morning (8am - 12pm)' },
  { value: 'AFTERNOON',   label: 'Afternoon (12pm - 5pm)' },
  { value: 'EVENING',     label: 'Evening (5pm - 9pm)' },
  { value: 'NIGHT_OWL',   label: 'Night Owl (9pm+)' },
];

const WORK_STYLE_OPTIONS: { value: WorkStyle; label: string }[] = [
  { value: 'SMALL_WINS_FIRST', label: 'Small Wins First' },
  { value: 'BIG_TASKS_FIRST',  label: 'Big Tasks First' },
  { value: 'DEADLINE_DRIVEN',  label: 'Deadline Driven' },
  { value: 'BALANCED',         label: 'Balanced' },
];

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
  badgeClass,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
  badgeClass: string;
}) {
  const [input, setInput] = useState('');

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.trim();
      if (val && !tags.includes(val)) onAdd(val);
      setInput('');
    }
  }

  return (
    <div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="hover:opacity-70 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  const [strengths, setStrengths]           = useState<string[]>([]);
  const [weaknesses, setWeaknesses]         = useState<string[]>([]);
  const [workHours, setWorkHours]           = useState<WorkHours | ''>('');
  const [workStyle, setWorkStyle]           = useState<WorkStyle | ''>('');
  const [avgTasksPerDay, setAvgTasksPerDay] = useState<number | ''>('');
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [success, setSuccess]               = useState(false);
  const [error, setError]                   = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    api.get<UserProfile>('/profile')
      .then((data) => {
        setStrengths(data.strengths ?? []);
        setWeaknesses(data.weaknesses ?? []);
        setWorkHours(data.preferredWorkHours ?? '');
        setWorkStyle(data.workStyle ?? '');
        setAvgTasksPerDay(data.avgTasksPerDay ?? '');
      })
      .catch((err: Error) => {
        // 404 = no profile yet, leave form empty
        if (!err.message.includes('404')) {
          setError('Failed to load profile.');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    const payload: UserProfile = {
      strengths:          strengths.length > 0 ? strengths : undefined,
      weaknesses:         weaknesses.length > 0 ? weaknesses : undefined,
      preferredWorkHours: workHours  || undefined,
      workStyle:          workStyle  || undefined,
      avgTasksPerDay:     avgTasksPerDay !== '' ? Number(avgTasksPerDay) : undefined,
    };

    try {
      await api.post('/profile', payload);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="mt-1 text-gray-400 text-sm">
            Help the AI understand how you work best
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Feedback messages */}
            {success && (
              <div className="px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                Profile saved! The AI will use this to rank your tasks smarter.
              </div>
            )}
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Section 1: Strengths & Weaknesses */}
            <div className="bg-gray-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-base font-semibold text-white">
                Your Strengths &amp; Weaknesses
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Strengths
                </label>
                <TagInput
                  tags={strengths}
                  onAdd={(t) => setStrengths([...strengths, t])}
                  onRemove={(t) => setStrengths(strengths.filter((s) => s !== t))}
                  placeholder='e.g. coding, writing, math — press Enter to add'
                  badgeClass="bg-green-500/15 text-green-300 border-green-500/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Weaknesses
                </label>
                <TagInput
                  tags={weaknesses}
                  onAdd={(t) => setWeaknesses([...weaknesses, t])}
                  onRemove={(t) => setWeaknesses(weaknesses.filter((w) => w !== t))}
                  placeholder='e.g. design, presentations — press Enter to add'
                  badgeClass="bg-orange-500/15 text-orange-300 border-orange-500/30"
                />
              </div>
            </div>

            {/* Section 2: Work Preferences */}
            <div className="bg-gray-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-base font-semibold text-white">Work Preferences</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Preferred Work Hours
                </label>
                <select
                  value={workHours}
                  onChange={(e) => setWorkHours(e.target.value as WorkHours | '')}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                >
                  <option value="">— Select your peak hours —</option>
                  {WORK_HOURS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Work Style
                </label>
                <select
                  value={workStyle}
                  onChange={(e) => setWorkStyle(e.target.value as WorkStyle | '')}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                >
                  <option value="">— Select your work style —</option>
                  {WORK_STYLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  How many tasks do you typically complete per day?
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={avgTasksPerDay}
                  onChange={(e) => setAvgTasksPerDay(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 5"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                />
              </div>
            </div>

            {/* Save button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950"
            >
              {saving && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>

            {/* AI info box */}
            <div className="px-5 py-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm leading-relaxed">
              🤖 <span className="font-semibold">AI Learning</span> — The more you use the app,
              the smarter your AI assistant becomes. Your profile helps the AI understand when
              you work best and what tasks suit your strengths.
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
