import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, Settings, MessageSquare, PieChart, X, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

export function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/dashboard/profile', icon: Users },
    { name: 'My Courses', path: '/dashboard/courses', icon: BookOpen },
    { name: 'Analytics', path: '/dashboard/analytics', icon: PieChart },
    { name: 'Events', path: '/dashboard/events', icon: Calendar },
    { name: 'Student Feedback', path: '/dashboard/messages', icon: MessageSquare },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay Background */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside className={clsx(
        "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 h-full lg:h-full flex flex-col transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0 mt-16 lg:mt-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 flex justify-between items-center lg:hidden border-b border-slate-100">
          <span className="font-bold text-slate-800">Menu</span>
          <button onClick={() => setIsOpen(false)} className="p-2 text-slate-500 hover:text-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path || (link.path === '/dashboard' && location.pathname === '/dashboard/');
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
