'use client';

import { useAuth } from '@/components/AuthProvider';

export default function LogoutButton({ className }: { className?: string }) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <button
      onClick={handleLogout}
      className={
        className ??
        'mt-8 w-full border border-white/10 text-[10px] font-black uppercase py-4 rounded-2xl text-white hover:bg-white/5 transition-colors'
      }
    >
      Log Out
    </button>
  );
}