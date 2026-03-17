'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function BottomNav() {
  const path = usePathname();
  const { user, isGuest, logout } = useAuth();

  const active = (href: string) => path === href || path.startsWith(href + '/');

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const items = [
    { href: '/',        icon: '○', label: 'Home'    },
    { href: '/explore', dot: true,  label: 'Explore' },
    { href: '/wallet',  icon: '◍', label: 'Wallet'  },
  ];

  const isAuthenticated = !!user && !isGuest;

  return (
    <>
      {/* Guest banner — shown only for guest users, above the nav */}
      {isGuest && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-40 animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/60 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-zinc-400 text-[9px] font-bold uppercase tracking-wider">
              Browsing as guest
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <Link
                href="/login"
                className="bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl active:scale-95 transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="border border-zinc-700 text-zinc-300 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl active:scale-95 transition-all"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main nav */}
      <nav className="app-nav">
        {items.map(({ href, icon, dot, label }) => (
          <Link
            key={href}
            href={href}
            className={`app-nav-item${active(href) ? ' app-nav-active' : ''}`}
          >
            {dot
              ? <span className="app-nav-dot" />
              : <span className="app-nav-icon">{icon}</span>
            }
            <span className="app-nav-label">{label}</span>
          </Link>
        ))}

        {/* Profile — always shown, middleware handles the guard */}
        <Link
          href="/profile"
          className={`app-nav-item${active('/profile') ? ' app-nav-active' : ''}`}
        >
          <span className="app-nav-icon">◇</span>
          <span className="app-nav-label">Profile</span>
        </Link>

        {/* Logout button — always visible */}
        <button
          onClick={handleLogout}
          className="app-nav-item"
          title={isAuthenticated ? 'Log out' : 'Exit guest / go to login'}
        >
          <span className="app-nav-icon text-zinc-600">⏏</span>
          <span className="app-nav-label text-zinc-600">
            {isAuthenticated ? 'Logout' : 'Login'}
          </span>
        </button>
      </nav>
    </>
  );
}