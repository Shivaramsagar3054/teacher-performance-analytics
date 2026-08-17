import React, { useState, useEffect } from 'react';
import { Bell, Menu, LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { teachersApi, eventsApi, getImageUrl } from '../../services/api';

export function TopNavbar({ onMenuClick }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);

  useEffect(() => {
    const fetchTopProfile = async () => {
      const teacherId = localStorage.getItem('teacher_id');
      if (teacherId) {
        try {
          const data = await teachersApi.getById(teacherId);
          setProfile(data);
        } catch (err) {
          console.error('Failed to fetch top navbar profile', err);
        }
      }
    };
    const fetchLiveEvents = async () => {
      const teacherId = localStorage.getItem('teacher_id');
      if (teacherId) {
        try {
          const data = await eventsApi.getAll({ organizer_id: teacherId });
          const allEvents = data.results || (Array.isArray(data) ? data : []);
          const now = new Date();
          const active = allEvents.filter(event => {
            if (!event.start_date || !event.end_date) return false;
            const start = new Date(event.start_date);
            const end = new Date(event.end_date);
            const todayStr = now.toDateString();
            const isToday = start.toDateString() === todayStr || end.toDateString() === todayStr;
            const isCurrentlyRunning = start <= now && end >= now;
            return isCurrentlyRunning || isToday;
          });
          setLiveEvents(active);
        } catch (err) {
          console.error('Failed to fetch live events for notifications', err);
        }
      }
    };
    fetchTopProfile();
    fetchLiveEvents();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };


  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-50 shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-500 hover:text-primary transition-colors lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="relative">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-500 hover:text-primary transition-all hover:bg-slate-50 rounded-lg cursor-pointer border-none bg-transparent outline-none"
          >
            <Bell className="w-5 h-5" />
            {liveEvents.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border border-white shadow-sm flex items-center justify-center text-[8px] font-black text-white animate-pulse">
                {liveEvents.length}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden text-left z-50">
              <div className="px-4 py-2 border-b border-slate-50 mb-2 flex justify-between items-center">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Notifications</p>
                {liveEvents.length > 0 && (
                  <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                    Live Event Active
                  </span>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto px-1 space-y-1.5">
                {liveEvents.length > 0 ? (
                  liveEvents.map(event => (
                    <div 
                      key={event.id}
                      onClick={() => { navigate('/dashboard/events'); setIsNotifOpen(false); }}
                      className="p-3 bg-red-50/40 hover:bg-red-50/80 rounded-xl border border-red-100/50 transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">{event.title}</p>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{event.description}</p>
                      <p className="text-[9px] text-red-500 font-bold uppercase tracking-wide">Live at {event.location}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    No live events right now.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 sm:border-l border-slate-200 sm:pl-6 cursor-pointer group hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              <img 
                src={getImageUrl(profile?.profile_image)} 
                alt="Profile" 
                className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-primary/20 transition-all"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-bold text-slate-800 leading-tight">
                {profile ? `Dr. ${profile.first_name} ${profile.last_name}` : 'Loading...'}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                {profile?.department || 'Department'}
              </p>
            </div>
          </div>

          {/* Profile Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-50 mb-1">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Signed in as</p>
                <p className="text-sm font-bold text-slate-800 truncate">{profile?.user?.email || 'User'}</p>
              </div>
              <button 
                onClick={() => { navigate('/dashboard/profile'); setIsDropdownOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors font-medium"
              >
                <User className="w-4 h-4" /> My Profile
              </button>
              <button 
                onClick={() => setIsDropdownOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors font-medium"
              >
                <Settings className="w-4 h-4" /> Account Settings
              </button>
              <div className="h-px bg-slate-50 my-1"></div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-bold"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setIsDropdownOpen(false)}></div>
      )}
      {isNotifOpen && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setIsNotifOpen(false)}></div>
      )}
    </header>
  );
}
