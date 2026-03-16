'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { api } from '@/lib/api';
import { Task, Quadrant, EffortEstimate } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (task: Task) => void;
  existingTask?: Task;
}

const EFFORT_OPTIONS: { label: string; value: EffortEstimate }[] = [
  { label: '15 min',   value: 'MINS_15' },
  { label: '30 min',   value: 'MINS_30' },
  { label: '1 hour',   value: 'HOUR_1' },
  { label: '3 hours',  value: 'HOURS_3' },
  { label: 'Half day', value: 'HALF_DAY' },
  { label: 'Full day', value: 'FULL_DAY' },
];

const QUADRANT_META: Record<Quadrant, { label: string; icon: string; colorClass: string }> = {
  Q1: { label: 'Do First',  icon: '⚡', colorClass: 'bg-red-500/20 text-red-300 border-red-500/40' },
  Q2: { label: 'Schedule',  icon: '📅', colorClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  Q3: { label: 'Delegate',  icon: '👋', colorClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  Q4: { label: 'Later',     icon: '🗑️', colorClass: 'bg-gray-500/20 text-gray-300 border-gray-500/40' },
};

function calcQuadrant(isImportant: boolean, isUrgent: boolean): Quadrant {
  if (isImportant && isUrgent)  return 'Q1';
  if (isImportant)              return 'Q2';
  if (isUrgent)                 return 'Q3';
  return 'Q4';
}

function toDateInputValue(iso?: string): string {
  if (!iso) return '';
  return iso.split('T')[0];
}

export default function TaskModal({ isOpen, onClose, onSaved, existingTask }: Props) {
  const isEditing = !!existingTask;

  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [isImportant, setIsImportant]   = useState(false);
  const [isUrgent, setIsUrgent]         = useState(false);
  const [effort, setEffort]             = useState<EffortEstimate | ''>('');
  const [deadline, setDeadline]         = useState('');
  const [tags, setTags]                 = useState<string[]>([]);
  const [tagInput, setTagInput]         = useState('');
  const [subtasks, setSubtasks]         = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');

  const titleRef = useRef<HTMLInputElement>(null);

  const quadrant = calcQuadrant(isImportant, isUrgent);
  const qMeta = QUADRANT_META[quadrant];

  // Populate form when editing
  useEffect(() => {
    if (!isOpen) return;
    if (existingTask) {
      setTitle(existingTask.title);
      setDescription(existingTask.description ?? '');
      setIsImportant(existingTask.isImportant);
      setIsUrgent(existingTask.isUrgent);
      setEffort(existingTask.effortEstimate ?? '');
      setDeadline(toDateInputValue(existingTask.deadline));
      setTags(existingTask.tags ?? []);
      setSubtasks([]);
    } else {
      setTitle('');
      setDescription('');
      setIsImportant(false);
      setIsUrgent(false);
      setEffort('');
      setDeadline('');
      setTags([]);
      setSubtasks([]);
    }
    setTagInput('');
    setSubtaskInput('');
    setError('');
    setTimeout(() => titleRef.current?.focus(), 50);
  }, [isOpen, existingTask]);

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !tags.includes(val)) setTags([...tags, val]);
      setTagInput('');
    }
  }

  function handleSubtaskKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = subtaskInput.trim();
      if (val) setSubtasks([...subtasks, val]);
      setSubtaskInput('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      isImportant,
      isUrgent,
      effortEstimate: effort || undefined,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    try {
      let saved: Task;
      if (isEditing && existingTask) {
        saved = await api.put<Task>(`/tasks/${existingTask.id}`, payload);
      } else {
        saved = await api.post<Task>('/tasks', payload);
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            {isEditing ? 'Edit Task' : 'Add Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={2}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm resize-none"
            />
          </div>

          {/* Important / Urgent toggles + Quadrant */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Important?</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-600">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setIsImportant(val)}
                    className={`flex-1 py-2 text-sm font-medium transition ${
                      isImportant === val
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {val ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Urgent?</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-600">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setIsUrgent(val)}
                    className={`flex-1 py-2 text-sm font-medium transition ${
                      isUrgent === val
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {val ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quadrant (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Quadrant</label>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${qMeta.colorClass}`}>
              <span>{qMeta.icon}</span>
              <span>{quadrant} · {qMeta.label}</span>
            </div>
          </div>

          {/* Effort + Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Effort Estimate</label>
              <select
                value={effort}
                onChange={(e) => setEffort(e.target.value as EffortEstimate | '')}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
              >
                <option value="">— None —</option>
                {EFFORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Tags</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Type a tag and press Enter"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                      className="hover:text-white leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Subtasks</label>
            <input
              type="text"
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={handleSubtaskKeyDown}
              placeholder="Type a subtask and press Enter"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
            />
            {subtasks.length > 0 && (
              <ul className="mt-2 space-y-1">
                {subtasks.map((st, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" className="accent-indigo-500" readOnly />
                    <span className="flex-1">{st}</span>
                    <button
                      type="button"
                      onClick={() => setSubtasks(subtasks.filter((_, idx) => idx !== i))}
                      className="text-gray-500 hover:text-red-400 transition text-xs"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            form="task-form"
            type="submit"
            disabled={saving}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition"
          >
            {saving && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {saving ? 'Saving...' : isEditing ? 'Update Task' : 'Save Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
