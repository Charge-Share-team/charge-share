import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfileMap from '@/components/ui/ProfileMap';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect('/login');
  }

  const { data: hostProfile } = await supabase
    .from('chargers')
    .select('*')
    .eq('owner_id', user.id)  // ✅ Fixed: was 'host_id'
    .single();

  return (
    <main className="flex flex-col lg:flex-row h-screen w-full bg-black overflow-hidden">

      {/* LEFT SIDE */}
      <div className="w-full lg:w-[450px] h-full overflow-y-auto border-r border-white/5 z-10 bg-black flex flex-col p-8">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-2xl font-black uppercase italic mb-2 text-white">Driver Profile</h1>
          <p className="text-zinc-500 text-sm mb-8">{user.email}</p>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
            <h2 className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-4">
              Charging Stats
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/50 p-4 rounded-2xl">
                <span className="block text-zinc-500 text-[9px] uppercase font-bold">Status</span>
                <span className="text-lg font-black uppercase italic text-white">
                  {hostProfile ? 'Host' : 'Driver'}
                </span>
              </div>
              <div className="bg-black/50 p-4 rounded-2xl">
                <span className="block text-zinc-500 text-[9px] uppercase font-bold">Rank</span>
                <span className="text-lg font-black uppercase italic text-emerald-500">Gold</span>
              </div>
            </div>
          </div>

          <button className="mt-8 w-full border border-white/10 text-[10px] font-black uppercase py-4 rounded-2xl text-white hover:bg-white/5 transition-colors">
            Log Out
          </button>
        </div>
      </div>

      {/* RIGHT SIDE: Map — ✅ Fixed via ProfileMap client wrapper (passes required props) */}
      <div className="hidden lg:block flex-1 h-full relative bg-zinc-950">
        <ProfileMap />
        <div className="absolute inset-0 opacity-20 pointer-events-none z-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent animate-pulse" />
      </div>

    </main>
  );
}