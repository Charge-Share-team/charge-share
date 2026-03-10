'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const path = usePathname();
  const active = (href: string) => path === href || path.startsWith(href + '/');

  const items = [
    { href: '/',        icon: '○', label: 'Home'    },
    { href: '/explore', dot: true, label: 'Explore' },
    { href: '/wallet',  icon: '◍', label: 'Wallet'  },
  ];

  return (
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
    </nav>
  );
}