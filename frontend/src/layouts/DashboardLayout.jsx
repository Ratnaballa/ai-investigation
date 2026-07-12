import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MdMenu, MdNotifications, MdSearch, MdChevronRight } from 'react-icons/md';
import Sidebar from '../components/Sidebar';
import { useAuthContext } from '../utils/AuthContext';

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

  const title = PAGE_TITLES[pathname] || 'AI Investigation Assistant';
  const breadcrumb = pathname === '/dashboard' ? 'Command Center' : title;

  return (
    <div className="flex h-screen overflow-hidden gradient-bg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex-shrink-0 border-b border-white/10 bg-slate-950/40 px-4 py-3 backdrop-blur-xl lg:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-2xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
              >
                <MdMenu size={22} />
              </button>
              <div>
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.26em] text-slate-400">
                  <span>AI Investigation Assistant</span>
                  <MdChevronRight size={14} />
                  <span>{breadcrumb}</span>
                </div>
                <h1 className="text-base font-semibold text-white">{title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2 md:flex">
                <MdSearch className="text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Quick search..."
                  className="w-40 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                />
              </div>
              <button className="relative rounded-2xl border border-white/10 bg-slate-900/70 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
                <MdNotifications size={20} />
                <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border border-slate-950 bg-blue-500" />
              </button>
              {user && (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-semibold text-white">
                  {user.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
