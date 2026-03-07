'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="mt-8 w-full border border-white/10 text-[10px] font-black uppercase py-4 rounded-2xl text-white hover:bg-white/5 transition-colors"
    >
      Log Out
    </button>
  );
}