import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#0f172a] text-slate-400 py-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 select-none">
            <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
            <div className="flex flex-col text-left">
              <span className="font-black text-sm text-white uppercase tracking-wide leading-none">Teacher</span>
              <span className="font-extrabold text-base text-blue-400 uppercase tracking-wide leading-none mt-0.5">Performance</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-[1px] w-3 bg-cyan-400 rounded"></span>
                <span className="text-[8px] font-bold tracking-[0.2em] text-slate-300 uppercase">Analyzer</span>
                <span className="h-[1px] w-3 bg-emerald-500 rounded"></span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/courses" className="hover:text-white transition-colors">Courses</Link>
            <Link to="/professors" className="hover:text-white transition-colors">Professors</Link>
            <Link to="/campus-life" className="hover:text-white transition-colors">Campus Life</Link>
            <Link to="/events" className="hover:text-white transition-colors">Events</Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800/60 mt-6 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Teacher Performance Analyzer. All Rights Reserved.</p>
          <p>Bright Future College Portal</p>
        </div>
      </div>
    </footer>
  );
}
