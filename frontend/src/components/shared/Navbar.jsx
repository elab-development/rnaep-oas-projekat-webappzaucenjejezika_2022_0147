import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  LogIn,
  UserPlus,
  User,
  LogOut,
  Menu,
  X,
  Languages,
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { NavItem } from './NavItem';

export default function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logout = useAuthStore((s) => s.logout);
  const loading = useAuthStore((s) => s.loading);

  useEffect(() => {
    if (token && !user) {
      fetchMe().catch(() => {});
    }
  }, [token]);

  const links = useMemo(() => {
    if (user) {
      return [
        { to: '/', label: 'Home', icon: Home },
        { to: '/translate', label: 'Translate', icon: Languages },
        { to: '/profile', label: 'Profile', icon: User },
      ];
    }
    return [
      { to: '/', label: 'Home', icon: Home },
      { to: '/login', label: 'Login', icon: LogIn },
      { to: '/register', label: 'Register', icon: UserPlus },
    ];
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/login');
  };

  const closeMobile = () => setOpen(false);

  return (
    <header className='sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur'>
      <div className='mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4'>
        {/* Left brand */}
        <Link
          to='/'
          className='flex items-center gap-2 rounded-2xl px-3 py-2 transition hover:bg-green-50'
          onClick={closeMobile}
        >
          <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500 text-white shadow-sm'>
            <span className='text-lg font-black'>D</span>
          </div>
          <div className='leading-tight'>
            <div className='text-base font-extrabold text-gray-900'>
              duolingo
            </div>
            <div className='text-xs font-semibold text-green-700'>
              learn fast
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className='hidden items-center gap-2 md:flex'>
          {links.map((l) => (
            <NavItem key={l.to} to={l.to} icon={l.icon} label={l.label} />
          ))}

          {user && (
            <button
              onClick={handleLogout}
              disabled={loading}
              className='ml-2 flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60'
            >
              <LogOut className='h-4 w-4' />
              Logout
            </button>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className='inline-flex items-center justify-center rounded-2xl p-2 text-gray-700 shadow-sm ring-1 ring-black/5 transition hover:bg-green-50 md:hidden'
          onClick={() => setOpen((v) => !v)}
          aria-label='Toggle menu'
        >
          {open ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className='md:hidden'>
          <div className='mx-auto w-full max-w-6xl px-4 pb-4'>
            <div className='rounded-3xl bg-white p-3 shadow-md ring-1 ring-black/5'>
              <div className='flex flex-col gap-1'>
                {links.map((l) => (
                  <NavItem
                    key={l.to}
                    to={l.to}
                    icon={l.icon}
                    label={l.label}
                    onClick={closeMobile}
                  />
                ))}

                {user ? (
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className='mt-2 flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60'
                  >
                    <LogOut className='h-4 w-4' />
                    Logout
                  </button>
                ) : (
                  <div className='mt-2 flex items-center gap-2 rounded-2xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-800'>
                    <User className='h-4 w-4' />
                    Not logged in
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
