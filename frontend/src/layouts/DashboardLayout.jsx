import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MdMenu, MdNotifications, MdSearch, MdChevronRight, MdWbSunny, MdNightsStay } from 'react-icons/md';
import Sidebar from '../components/Sidebar';
import { useAuthContext } from '../utils/AuthContext';
import { useTheme } from '../utils/ThemeContext';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/chat': 'AI Chat',
  '/legal': 'Legal Recommendation',
  '/cases': 'Case Management',
  '/graph': 'Evidence Relationship Graph',
  '/reports': 'Reports',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuthContext();
  const { theme, toggleTheme, isDark } = useTheme();

  const title = PAGE_TITLES[pathname] || 'AI Investigation Assistant';
  const breadcrumb = pathname === '/dashboard' ? 'Command Center' : title;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#020817] text-slate-900 dark:text-white transition-colors">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* TOP HEADER */}
        <header className="flex-shrink-0 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] px-4 py-3 shadow-sm lg:px-6 transition-colors z-20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl p-2 text-slate-600 dark:text-[#94A3B8] transition hover:bg-slate-100 dark:hover:bg-[#111827] lg:hidden"
              >
                <MdMenu size={22} />
              </button>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#94A3B8]">
                  <span>AI Investigation Assistant</span>
                  <MdChevronRight size={14} />
                  <span>{breadcrumb}</span>
                </div>
                <h1 className="text-base font-extrabold text-slate-900 dark:text-white">{title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111827] px-3 py-2 md:flex">
                <MdSearch className="text-slate-400 dark:text-[#94A3B8]" size={16} />
                <input
                  type="text"
                  placeholder="Quick search..."
                  className="w-40 bg-transparent text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]"
                />
              </div>

              {/* Light / Dark Mode Switch Button */}
              <button
                onClick={toggleTheme}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-bold transition-all ${
                  isDark
                    ? 'border-white/10 bg-[#111827] text-white hover:bg-slate-800'
                    : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 shadow-sm'
                }`}
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              >
                {isDark ? (
                  <>
                    <MdWbSunny size={18} className="text-amber-400" />
                    <span>Dark</span>
                  </>
                ) : (
                  <>
                    <MdNightsStay size={18} className="text-slate-700" />
                    <span>Light</span>
                  </>
                )}
              </button>

              <button className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111827] p-2 text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <MdNotifications size={20} />
                <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border border-white dark:border-[#0F172A] bg-blue-500" />
              </button>

              {user && (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
                  {user.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50 dark:bg-[#020817] transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
