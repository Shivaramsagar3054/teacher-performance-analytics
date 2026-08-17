import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';

export function DashboardLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (user.role !== 'teacher') {
        navigate('/');
      }
    } catch (e) {
      console.error("Error parsing user data", e);
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="h-screen bg-slate-50 font-sans flex flex-col overflow-hidden relative">
      {/* Top Brand Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-16 bg-primary-dark text-white border-b border-slate-800 shrink-0 z-20 relative">
         <Link to="/" className="flex items-center gap-3 select-none hover:opacity-90 transition-opacity">
            <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain animate-pulse" />
            <div className="flex flex-col">
              <span className="font-black text-sm text-white uppercase tracking-wide leading-none">Teacher</span>
              <span className="font-extrabold text-base text-blue-400 uppercase tracking-wide leading-none mt-0.5">Performance</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-[1.5px] w-3 bg-cyan-400 rounded"></span>
                <span className="text-[8px] font-bold tracking-[0.2em] text-slate-300 uppercase">Analyzer</span>
                <span className="h-[1.5px] w-3 bg-emerald-500 rounded"></span>
              </div>
            </div>
          </Link>
          <div className="text-sm text-slate-400 hidden sm:block">
            Academic Year 2026-2027
          </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <main className="flex-1 overflow-hidden flex flex-col bg-slate-50/50 w-full relative z-0">
          <TopNavbar onMenuClick={() => setIsSidebarOpen(true)} />
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
