import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '../ui/Button';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    } else {
      setUser(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('teacher_id');
    setUser(null);
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Courses', path: '/courses' },
    { name: 'Professors', path: '/professors' },
    { name: 'Campus Life', path: '/campus-life' },
    { name: 'Events', path: '/events' },
  ];

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-3 select-none">
            <img src="/logo.png" alt="Logo" className="h-14 w-14 object-contain" />
            <div className="flex flex-col">
              <span className="font-black text-lg text-slate-800 uppercase tracking-wide leading-none">Teacher</span>
              <span className="font-extrabold text-xl text-blue-600 uppercase tracking-wide leading-none mt-0.5">Performance</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-[2px] w-5 bg-cyan-400 rounded"></span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-slate-700 uppercase">Analyzer</span>
                <span className="h-[2px] w-5 bg-emerald-500 rounded"></span>
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === link.path ? 'text-primary border-b-2 border-secondary' : 'text-slate-600'
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {user.role === 'teacher' && (
                  <Link to="/dashboard">
                    <Button variant="ghost" className="text-slate-600 flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                )}
                <Button
                  onClick={handleLogout}
                  className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button className="bg-primary text-white hover:bg-blue-800 px-8">Login</Button>
              </Link>
            )}
          </div>

          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-600 hover:text-primary-dark focus:outline-none p-2"
            >
              {isMobileMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 right-0 bg-white border-b border-slate-100 shadow-lg px-4 pt-2 pb-6 flex flex-col space-y-2 max-h-[calc(100vh-80px)] overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${location.pathname === link.path ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-primary-dark'
                }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-100 px-4 mt-2 flex flex-col gap-3">
            {user ? (
              <>
                {user.role === 'teacher' && (
                  <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                )}
                <Button
                  onClick={handleLogout}
                  className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-primary text-white hover:bg-blue-800">Login</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
