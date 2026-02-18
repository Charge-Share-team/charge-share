import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic'
export default async function ProfilePage() {
  const supabase = await createClient();

  // Securely get the user session from the server
  const { data: { user }, error } = await supabase.auth.getUser();

  // If no user is logged in, send them to the login page
  if (!user || error) {
    redirect('/login');
  }

  // Fetch host details if the user is a charger owner
  const { data: hostProfile } = await supabase
    .from('chargers')
    .select('*')
    .eq('host_id', user.id)
    .single();

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-black uppercase italic mb-2">Driver Profile</h1>
        <p className="text-zinc-500 text-sm mb-8">{user.email}</p>

        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
          <h2 className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-4">
            Charging Stats
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/50 p-4 rounded-2xl">
              <span className="block text-zinc-500 text-[9px] uppercase font-bold">Status</span>
              <span className="text-lg font-black uppercase italic">
                {hostProfile ? 'Host' : 'Driver'}
              </span>
            </div>
            <div className="bg-black/50 p-4 rounded-2xl">
              <span className="block text-zinc-500 text-[9px] uppercase font-bold">Rank</span>
              <span className="text-lg font-black uppercase italic text-emerald-500">Gold</span>
            </div>
          </div>
        </div>

        <button className="mt-8 w-full border border-white/10 text-[10px] font-black uppercase py-4 rounded-2xl hover:bg-white/5 transition-colors">
          Log Out
        </button>
      </div>
    </main>
  );
}