'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import Navbar from '@/app/components/Navbar';

interface AiFeature {
  feature: string;
  message: string;
  preview?: string;
  comingSoon: boolean;
}

interface AiStatusResponse {
  status: string;
  features: AiFeature[];
}

const FEATURE_ICONS: Record<string, string> = {
  'AI Task Ranking':       '🎯',
  'AI Task Creation':      '✨',
  'AI Quadrant Assistant': '🧠',
  'Daily Focus List':      '☀️',
  'Pattern Recognition':   '🔄',
};

const FEATURE_PREVIEWS: Record<string, string> = {
  'AI Task Ranking':
    'Automatically reorders your tasks each morning based on deadlines, energy levels, and your personal strengths.',
  'AI Task Creation':
    'Describe a goal in plain English and the AI will break it into actionable, prioritised tasks for you.',
  'AI Quadrant Assistant':
    'Analyses your task descriptions and suggests the optimal Eisenhower quadrant so nothing slips through.',
  'Daily Focus List':
    'Generates a curated 3–5 task focus list every morning matched to your peak productivity hours.',
  'Pattern Recognition':
    'Spots recurring habits in your task history and surfaces smart scheduling recommendations.',
};

const HOW_IT_WORKS = [
  {
    icon: '📊',
    title: 'You use the app',
    description: 'Create tasks, set priorities, and complete your work',
  },
  {
    icon: '🧠',
    title: 'AI learns your patterns',
    description: 'The AI studies your habits, strengths, and work style',
  },
  {
    icon: '🚀',
    title: 'Smart suggestions',
    description: 'Get personalised task rankings and daily focus lists',
  },
];

// Fallback features shown while loading or on error
const FALLBACK_FEATURES: AiFeature[] = Object.keys(FEATURE_ICONS).map((name) => ({
  feature: name,
  message: 'This feature is coming soon.',
  comingSoon: true,
}));

export default function AiPage() {
  const router = useRouter();
  const [features, setFeatures] = useState<AiFeature[]>(FALLBACK_FEATURES);
  const [loadingFeatures, setLoadingFeatures] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    api.get<AiStatusResponse>('/ai/status')
      .then((data) => {
        if (data.features?.length) setFeatures(data.features);
      })
      .catch(() => { /* keep fallback */ })
      .finally(() => setLoadingFeatures(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <span className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
            Phase 2 — Coming Soon
          </span>
          <h1 className="text-4xl font-bold text-white tracking-tight">AI Features</h1>
          <p className="mt-2 text-indigo-300 text-sm font-medium">
            Powered by Smart Priority Board AI Engine
          </p>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
            Our AI engine learns from your work patterns, strengths, and task history to make
            you more productive every day.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-14">

        {/* Feature cards grid */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-6">Upcoming Features</h2>

          {loadingFeatures ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {features.map((f) => {
                const icon    = FEATURE_ICONS[f.feature]    ?? '✦';
                const preview = FEATURE_PREVIEWS[f.feature] ?? f.preview ?? f.message;
                return (
                  <div
                    key={f.feature}
                    className="relative flex flex-col gap-3 bg-gray-900 border border-gray-700 hover:border-indigo-500/50 rounded-2xl p-6 transition group"
                  >
                    {/* Subtle gradient overlay on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition pointer-events-none" />

                    <div className="flex items-start justify-between relative">
                      <span className="text-3xl">{icon}</span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 shrink-0">
                        Coming Soon
                      </span>
                    </div>

                    <div className="relative">
                      <h3 className="text-white font-semibold text-base">{f.feature}</h3>
                      <p className="mt-1 text-gray-400 text-sm leading-relaxed">{f.message}</p>
                    </div>

                    <div className="relative mt-auto pt-3 border-t border-gray-800">
                      <p className="text-xs text-indigo-400 leading-relaxed">
                        <span className="font-medium text-indigo-300">What it will do: </span>
                        {preview}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-6">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center bg-gray-900 border border-gray-800 rounded-2xl px-6 py-8 gap-3">
                {/* Step connector line (between cards) */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-gray-600 text-lg">
                    →
                  </div>
                )}
                <span className="text-4xl">{step.icon}</span>
                <div>
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
                    Step {i + 1}
                  </p>
                  <h3 className="text-white font-semibold text-sm">{step.title}</h3>
                  <p className="mt-1 text-gray-400 text-xs leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-7 py-6">
            <div>
              <p className="text-white font-semibold text-sm">Want to be notified when AI features launch?</p>
              <p className="mt-0.5 text-gray-400 text-sm">Make sure your profile is complete.</p>
            </div>
            <Link
              href="/profile"
              className="shrink-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition whitespace-nowrap"
            >
              Complete My Profile
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
