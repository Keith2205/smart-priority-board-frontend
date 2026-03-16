'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getUser, removeToken, removeUser, isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import { User } from '@/types';

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [userName, setUserName]       = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const user = getUser() as User | null;
    if (user?.name) setUserName(user.name);
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) return;

    function fetchUnread() {
      api.get<{ count: number }>('/activity-log/unread-count')
        .then((data) => setUnreadCount(data.count))
        .catch(() => {});
    }

    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  function handleLogout() {
    removeToken();
    removeUser();
    router.replace('/login');
  }

  const navLinks = [
    { href: '/dashboard',    label: 'Dashboard' },
    { href: '/profile',      label: 'Profile' },
    { href: '/ai',           label: 'AI Features' },
    { href: '/activity-log', label: '🗑️ Log' },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-indigo-400 font-bold text-lg tracking-tight">
          Smart Priority Board
        </span>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              pathname === link.href
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {link.label}
            {link.href === '/activity-log' && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {userName && (
          <span className="text-sm text-gray-400">
            Welcome, <span className="text-white font-medium">{userName}</span>
          </span>
        )}
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
