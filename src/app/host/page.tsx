'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/utils/supabase/client';

const PLUG_TYPES = ['CCS2', 'Type 2', 'CHAdeMO', 'Type 1', 'Bharat AC-001', 'Bharat DC-001'];
const POWER_OPTIONS = ['3.3 kW', '7.4 kW', '11 kW', '22 kW', '50 kW', '100 kW', '150 kW'];

type Tab = 'requests' | 'active' | 'dashboard' | 'listings' | 'add';

interface HostListing {
  id: string;
  name: string;
  address: string;
  plug_types: string[];
  power_kw: number;
  price_per_kwh: number;
  is_available: boolean;
}

interface SessionRequest {
  id: string;
  charger_id: number;
  driver_id: string;
  status: string;
  requested_at: string;
  approved_at: string | null;
  started_at: string | null;
  hold_amount: number;
  rate_per_kwh: number;
  time_limit_mins: number;
  // joined
  driver_name?: string;
  driver_email?: string;
  vehicle_reg?: string;
  charger_name?: string;
}

export default function HostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = useRef(createClient()).current;

  const [tab, setTab] = useState<Tab>('requests');
  const [listings, setListings] = useState<HostListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [pendingRequests, setPendingRequests] = useState<SessionRequest[]>([]);
  const [activeSessions, setActiveSessions] = useState<SessionRequest[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [autoApprove, setAutoApprove] = useState(false);

  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalSessions: 0,
    activeListings: 0,
  });

  const [form, setForm] = useState({
    name: '', address: '', latitude: '', longitude: '',
    plug_types: [] as string[], power_kw: '7.4',
    price_per_kwh: '12', description: '', is_available: true,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // ── Load host listings ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('chargers')
        .select('*')
        .eq('host_id', user.id);

      if (data) {
        setListings(data as HostListing[]);
        setStats(s => ({ ...s, activeListings: data.filter((c: any) => c.is_available).length }));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  // ── Enrich a session row with driver + charger info ─────────────────────
  // FIX: fallback chain — full_name → mobile → last 8 of user ID
  const enrichRequest = async (req: any): Promise<SessionRequest> => {
    const [{ data: profile }, { data: charger }] = await Promise.all([
      supabase.from('profiles')
        .select('full_name, vehicle_reg_number, mobile_number')
        .eq('id', req.driver_id)
        .single(),
      supabase.from('chargers').select('name').eq('id', req.charger_id).single(),
    ]);

    const driverName =
      profile?.full_name?.trim() ||
      (profile?.mobile_number ? `+91 ${profile.mobile_number}` : null) ||
      `Driver …${req.driver_id.slice(-8)}`;

    return {
      ...req,
      driver_name: driverName,
      vehicle_reg: profile?.vehicle_reg_number || null,
      charger_name: charger?.name || 'Your Charger',
    };
  };

  // ── Load pending + active sessions ──────────────────────────────────────
  const loadRequests = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('session_requests')
      .select('*')
      .eq('host_id', user.id)
      .in('status', ['pending', 'approved', 'en_route', 'active'])
      .order('requested_at', { ascending: false });

    if (error || !data) return;

    const enriched = await Promise.all(data.map(enrichRequest));

    setPendingRequests(enriched.filter(r => r.status === 'pending'));
    setActiveSessions(enriched.filter(r => ['approved', 'en_route', 'active'].includes(r.status)));
  };

  useEffect(() => { loadRequests(); }, [user]);

  // ── Load completed session stats ────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    supabase
      .from('session_requests')
      .select('amount_charged')
      .eq('host_id', user.id)
      .eq('status', 'completed')
      .then(({ data }) => {
        if (data) {
          const total = data.reduce((s, r) => s + (r.amount_charged || 0), 0);
          setStats(s => ({
            ...s,
            totalEarnings: +(total * 0.85).toFixed(0),
            totalSessions: data.length,
          }));
        }
      });
  }, [user]);

  // ── Realtime: new pending requests + active session updates ─────────────
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('host-requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'session_requests',
        filter: `host_id=eq.${user.id}`,
      }, () => {
        loadRequests();
        setTab('requests');
        showToast('⚡ New charging request!');
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'session_requests',
        filter: `host_id=eq.${user.id}`,
      }, () => {
        loadRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ── Allow ───────────────────────────────────────────────────────────────
  const handleAllow = async (req: SessionRequest) => {
    setActionLoading(req.id);

    await supabase
      .from('session_requests')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', req.id);

    await supabase.from('notifications').insert({
      user_id: req.driver_id,
      type: 'session_approved',
      title: 'Session Approved!',
      body: `Your charging request at ${req.charger_name} has been approved.`,
      data: { session_id: req.id },
      read: false,
    });

    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    setActionLoading(null);
    showToast('✓ Session approved — driver is on the way');
    await loadRequests();
  };

  // ── Deny ────────────────────────────────────────────────────────────────
  const handleDeny = async (req: SessionRequest) => {
    setActionLoading(req.id);

    await supabase
      .from('session_requests')
      .update({ status: 'denied' })
      .eq('id', req.id);

    const { data: wallet } = await supabase
      .from('wallets')
      .select('held')
      .eq('user_id', req.driver_id)
      .single();

    if (wallet) {
      await supabase
        .from('wallets')
        .update({ held: Math.max(0, wallet.held - req.hold_amount), updated_at: new Date().toISOString() })
        .eq('user_id', req.driver_id);

      await supabase.from('wallet_transactions').insert({
        user_id: req.driver_id,
        type: 'release',
        amount: req.hold_amount,
        description: 'Hold released — host declined request',
        session_id: req.id,
      });
    }

    await supabase.from('notifications').insert({
      user_id: req.driver_id,
      type: 'session_denied',
      title: 'Request Declined',
      body: 'The host has declined your charging request.',
      data: { session_id: req.id },
      read: false,
    });

    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    setActionLoading(null);
    showToast('✗ Request declined · hold released to driver');
  };

  // ── Force-stop an active session ────────────────────────────────────────
  const handleForceStop = async (req: SessionRequest) => {
    if (!confirm('Force-stop this session? The driver will be taken to payment.')) return;
    setActionLoading(req.id);

    await supabase
      .from('session_requests')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('id', req.id);

    await supabase.from('notifications').insert({
      user_id: req.driver_id,
      type: 'session_ended',
      title: 'Session Ended by Host',
      body: 'Your charging session has been ended by the host.',
      data: { session_id: req.id },
      read: false,
    });

    setActiveSessions(prev => prev.filter(r => r.id !== req.id));
    setActionLoading(null);
    showToast('✓ Session force-stopped');
  };

  // ── Toggle charger availability ─────────────────────────────────────────
  const toggleAvailability = async (id: string, current: boolean) => {
    await supabase.from('chargers').update({ is_available: !current }).eq('id', id);
    setListings(prev => prev.map(l => l.id === id ? { ...l, is_available: !current } : l));
    showToast(!current ? '✓ Charger is now Live' : '✓ Charger set to Offline');
  };

  // ── Add new charger ──────────────────────────────────────────────────────
  const submitCharger = async () => {
    if (!user) return;
    if (!form.name || !form.address || !form.latitude || !form.longitude || form.plug_types.length === 0) {
      showToast('⚠ Fill all required fields'); return;
    }
    setSaving(true);
    const { data, error } = await supabase.from('chargers').insert({
      host_id: user.id,
      owner_id: user.id,
      name: form.name, address: form.address,
      latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude),
      plug_types: form.plug_types,
      power_kw: parseFloat(form.power_kw),
      price_per_kwh: parseFloat(form.price_per_kwh),
      description: form.description,
      is_available: form.is_available, is_verified: false,
    }).select().single();
    setSaving(false);
    if (!error && data) {
      setListings(prev => [data as HostListing, ...prev]);
      setForm({ name: '', address: '', latitude: '', longitude: '', plug_types: [], power_kw: '7.4', price_per_kwh: '12', description: '', is_available: true });
      setTab('listings');
      showToast('✓ Charger listed! Pending verification.');
    } else {
      showToast('✗ Failed to save. Try again.');
    }
  };

  const togglePlug = (p: string) =>
    setForm(f => ({ ...f, plug_types: f.plug_types.includes(p) ? f.plug_types.filter(x => x !== p) : [...f.plug_types, p] }));

  const timeAgo = (iso: string) => {
    const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (secs < 60) return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    return `${Math.floor(secs / 3600)}h ago`;
  };

  const sessionStatusLabel = (status: string) => {
    if (status === 'approved' || status === 'en_route') return { label: 'Driver En Route', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' };
    if (status === 'active') return { label: 'Charging Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    return { label: status, color: 'text-zinc-400', bg: 'bg-zinc-800 border-zinc-700' };
  };

  return (
    <main className="min-h-screen bg-black pb-40">

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-zinc-900 border border-emerald-500/40 px-6 py-3 rounded-2xl text-emerald-400 text-[11px] font-black uppercase tracking-widest shadow-2xl animate-in slide-in-from-top-4 duration-300">
          {toast}
        </div>
      )}

      <div className="w-full max-w-md mx-auto px-5 pt-14">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.3em] mb-1">Host Mode</p>
            <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Your Network</h1>
          </div>
          <div className="flex items-center gap-2">
            {pendingRequests.length > 0 && (
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-[9px] font-black">{pendingRequests.length}</span>
              </div>
            )}
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">⚡</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800 overflow-x-auto no-scrollbar">
          {(['requests', 'active', 'dashboard', 'listings', 'add'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-shrink-0 px-3 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
                tab === t ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-zinc-500 hover:text-white'
              }`}>
              {t === 'add' ? '+ Add' : t === 'requests' ? 'Requests' : t === 'active' ? 'Active' : t}
              {t === 'requests' && pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[7px] text-white font-black flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
              {t === 'active' && activeSessions.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full text-[7px] text-black font-black flex items-center justify-center">
                  {activeSessions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── REQUESTS TAB ─── */}
        {tab === 'requests' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-[24px] flex justify-between items-center">
              <div>
                <p className="text-white text-sm font-black italic uppercase">Auto-Approve</p>
                <p className="text-zinc-500 text-[8px] font-bold mt-0.5">Approve all requests automatically</p>
              </div>
              <button
                onClick={() => setAutoApprove(a => !a)}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${autoApprove ? 'bg-emerald-500' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${autoApprove ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="py-16 border border-dashed border-zinc-800 rounded-[32px] text-center">
                <p className="text-4xl mb-4">📡</p>
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-2">No pending requests</p>
                <p className="text-zinc-700 text-[9px] font-bold">You'll be notified instantly when a driver requests your charger</p>
              </div>
            ) : (
              pendingRequests.map(req => (
                <div key={req.id} className="bg-zinc-900 border border-emerald-500/30 p-5 rounded-[28px] shadow-[0_0_30px_rgba(16,185,129,0.06)] animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-emerald-500 text-[8px] font-black uppercase tracking-widest mb-1">New Request · {timeAgo(req.requested_at)}</p>
                      <h3 className="text-white font-black italic uppercase text-base">{req.driver_name}</h3>
                      {req.vehicle_reg && (
                        <span className="text-emerald-400 text-[9px] font-black font-mono tracking-widest">{req.vehicle_reg}</span>
                      )}
                    </div>
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center text-lg">🚗</div>
                  </div>

                  <div className="bg-zinc-800/50 rounded-2xl p-3 space-y-2 mb-4">
                    {[
                      ['Charger', req.charger_name || '–'],
                      ['Rate', `₹${req.rate_per_kwh}/kWh`],
                      ['Time Limit', `${req.time_limit_mins} mins`],
                      ['Pre-Auth Hold', `₹${req.hold_amount}`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center">
                        <span className="text-zinc-500 text-[8px] font-bold uppercase">{k}</span>
                        <span className="text-white text-[9px] font-black italic">{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDeny(req)}
                      disabled={actionLoading === req.id}
                      className="py-4 bg-red-500/10 border border-red-500/30 text-red-400 font-black uppercase text-[10px] tracking-widest rounded-2xl active:scale-95 transition-all disabled:opacity-40"
                    >
                      {actionLoading === req.id ? '...' : '✕ Deny'}
                    </button>
                    <button
                      onClick={() => handleAllow(req)}
                      disabled={actionLoading === req.id}
                      className="py-4 bg-emerald-500 text-black font-black uppercase text-[10px] tracking-widest rounded-2xl active:scale-95 transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    >
                      {actionLoading === req.id ? '...' : '✓ Allow'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── ACTIVE SESSIONS TAB ─── */}
        {tab === 'active' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeSessions.length === 0 ? (
              <div className="py-16 border border-dashed border-zinc-800 rounded-[32px] text-center">
                <p className="text-4xl mb-4">⚡</p>
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-2">No active sessions</p>
                <p className="text-zinc-700 text-[9px] font-bold">Approved sessions will appear here while in progress</p>
              </div>
            ) : (
              activeSessions.map(req => {
                const { label, color, bg } = sessionStatusLabel(req.status);
                const elapsedMins = req.started_at
                  ? Math.floor((Date.now() - new Date(req.started_at).getTime()) / 60000)
                  : null;

                return (
                  <div key={req.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-[28px] space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest mb-2 ${bg}`}>
                          <span className="relative flex h-1.5 w-1.5">
                            {req.status === 'active' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400" />}
                            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${req.status === 'active' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                          </span>
                          <span className={color}>{label}</span>
                        </div>
                        <h3 className="text-white font-black italic uppercase text-base">{req.driver_name}</h3>
                        {req.vehicle_reg && (
                          <span className="text-zinc-500 text-[9px] font-black font-mono tracking-widest">{req.vehicle_reg}</span>
                        )}
                      </div>
                      <div className="w-10 h-10 bg-zinc-800 rounded-2xl flex items-center justify-center text-lg">🚗</div>
                    </div>

                    <div className="bg-zinc-800/50 rounded-2xl p-3 space-y-2">
                      {[
                        ['Charger', req.charger_name || '–'],
                        ['Rate', `₹${req.rate_per_kwh}/kWh`],
                        ...(elapsedMins !== null ? [['Charging', `${elapsedMins} min`]] : []),
                        ['Approved', req.approved_at ? timeAgo(req.approved_at) : '–'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between items-center">
                          <span className="text-zinc-500 text-[8px] font-bold uppercase">{k}</span>
                          <span className="text-white text-[9px] font-black italic">{v}</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => router.push(`/session/${req.id}`)}
                        className="py-3.5 bg-zinc-800 border border-zinc-700 text-white font-black uppercase text-[9px] tracking-widest rounded-2xl active:scale-95 transition-all"
                      >
                        View Session
                      </button>
                      {req.status === 'active' && (
                        <button
                          onClick={() => handleForceStop(req)}
                          disabled={actionLoading === req.id}
                          className="py-3.5 bg-red-500/10 border border-red-500/30 text-red-400 font-black uppercase text-[9px] tracking-widest rounded-2xl active:scale-95 transition-all disabled:opacity-40"
                        >
                          {actionLoading === req.id ? '...' : 'Force Stop'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ─── DASHBOARD TAB ─── */}
        {tab === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[28px]">
                <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1">Total Earned</p>
                <p className="text-2xl font-black text-emerald-400 italic">₹{stats.totalEarnings.toFixed(0)}</p>
                <p className="text-zinc-600 text-[8px] font-bold mt-1">After 15% platform fee</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[28px]">
                <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1">Sessions</p>
                <p className="text-2xl font-black text-white italic">{stats.totalSessions}</p>
                <p className="text-zinc-600 text-[8px] font-bold mt-1">All time</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[28px]">
                <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1">Active</p>
                <p className="text-2xl font-black text-white italic">{stats.activeListings}</p>
                <p className="text-zinc-600 text-[8px] font-bold mt-1">Live chargers</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[28px]">
                <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1">Pending</p>
                <p className="text-2xl font-black text-amber-400 italic">{pendingRequests.length}</p>
                <p className="text-zinc-600 text-[8px] font-bold mt-1">Requests waiting</p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[28px]">
              <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-4">Host Tips</p>
              <div className="space-y-3">
                {[
                  ['⚡', 'Set competitive rates — ₹10–14/kWh converts best'],
                  ['📍', 'Accurate GPS location gets 3x more bookings'],
                  ['🕐', 'Respond to requests quickly to build trust rating'],
                  ['💰', 'Payouts processed every Monday to your wallet'],
                ].map(([icon, tip], i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-sm">{icon}</span>
                    <p className="text-zinc-400 text-[10px] font-bold leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setTab('add')}
              className="w-full py-5 bg-emerald-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl active:scale-95 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              + List Your Charger
            </button>
          </div>
        )}

        {/* ─── LISTINGS TAB ─── */}
        {tab === 'listings' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loading ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">Loading...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="py-16 border border-dashed border-zinc-800 rounded-[32px] text-center">
                <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest mb-4">No chargers listed yet</p>
                <button onClick={() => setTab('add')} className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">+ Add Your First Charger</button>
              </div>
            ) : (
              listings.map(l => (
                <div key={l.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-[28px]">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-black italic uppercase text-sm tracking-tight">{l.name}</h3>
                      <p className="text-zinc-500 text-[9px] font-bold mt-0.5">{l.address}</p>
                    </div>
                    <button onClick={() => toggleAvailability(l.id, l.is_available)}
                      className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${l.is_available ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${l.is_available ? 'left-6' : 'left-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {(l.plug_types || []).map(p => (
                      <span key={p} className="bg-zinc-800 text-zinc-400 text-[8px] font-black uppercase px-2 py-1 rounded-lg">{p}</span>
                    ))}
                    <span className="bg-zinc-800 text-zinc-400 text-[8px] font-black uppercase px-2 py-1 rounded-lg">{l.power_kw} kW</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
                    <span className="text-emerald-400 text-sm font-black italic">₹{l.price_per_kwh}/kWh</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${l.is_available ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-zinc-600 border-zinc-700 bg-zinc-800/50'}`}>
                      {l.is_available ? '● Live' : '○ Offline'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── ADD CHARGER TAB ─── */}
        {tab === 'add' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[28px] space-y-4">
              <p className="text-zinc-400 text-[9px] font-black uppercase tracking-widest">Station Details</p>
              <div>
                <label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block mb-1.5">Station Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Azad's Home Charger"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-600" />
              </div>
              <div>
                <label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block mb-1.5">Address *</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Street, Area, City"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block mb-1.5">Latitude *</label>
                  <input value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                    placeholder="28.6139" type="number" step="any"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-600" />
                </div>
                <div>
                  <label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block mb-1.5">Longitude *</label>
                  <input value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                    placeholder="77.2090" type="number" step="any"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-600" />
                </div>
              </div>
              <button onClick={() => {
                if ('geolocation' in navigator) {
                  navigator.geolocation.getCurrentPosition(pos => {
                    setForm(f => ({ ...f, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }));
                    showToast('✓ Location captured');
                  });
                }
              }} className="w-full py-3 border border-dashed border-zinc-700 rounded-xl text-zinc-500 text-[9px] font-black uppercase tracking-widest hover:border-emerald-500/40 hover:text-emerald-500 transition-all">
                📍 Use My Current Location
              </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[28px] space-y-4">
              <p className="text-zinc-400 text-[9px] font-black uppercase tracking-widest">Charger Specs</p>
              <div>
                <label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block mb-2">Plug Types * (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {PLUG_TYPES.map(p => (
                    <button key={p} onClick={() => togglePlug(p)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all ${
                        form.plug_types.includes(p) ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                      }`}>{p}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block mb-1.5">Power Output</label>
                  <select value={form.power_kw} onChange={e => setForm(f => ({ ...f, power_kw: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/50">
                    {POWER_OPTIONS.map(p => <option key={p} value={p.replace(' kW', '')}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block mb-1.5">Price (₹/kWh)</label>
                  <input value={form.price_per_kwh} onChange={e => setForm(f => ({ ...f, price_per_kwh: e.target.value }))}
                    type="number" min="5" max="50"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>
              <div>
                <label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block mb-1.5">Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Access instructions, parking info, availability hours..." rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/50 resize-none placeholder:text-zinc-600" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <div>
                  <p className="text-white text-sm font-black italic uppercase">Go Live Immediately</p>
                  <p className="text-zinc-500 text-[8px] font-bold mt-0.5">Make visible to drivers now</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${form.is_available ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${form.is_available ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            <button onClick={submitCharger} disabled={saving}
              className="w-full py-5 bg-emerald-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              {saving ? 'Saving...' : 'List My Charger →'}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-3xl flex items-center justify-around z-50">
        <Link href="/" className="flex flex-col items-center text-zinc-500 gap-1 hover:text-white transition-colors"><span className="text-lg">○</span><span className="text-[9px] font-bold uppercase">Home</span></Link>
        <Link href="/explore" className="flex flex-col items-center text-zinc-500 gap-1 hover:text-white transition-colors"><span className="text-lg">◎</span><span className="text-[9px] font-bold uppercase">Explore</span></Link>
        <Link href="/host" className="flex flex-col items-center text-emerald-400 gap-1"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mb-1" /><span className="text-[9px] font-bold uppercase">Host</span></Link>
        <Link href="/wallet" className="flex flex-col items-center text-zinc-500 gap-1 hover:text-white transition-colors"><span className="text-lg">◍</span><span className="text-[9px] font-bold uppercase">Wallet</span></Link>
        <Link href="/profile" className="flex flex-col items-center text-zinc-500 gap-1 hover:text-white transition-colors"><span className="text-lg">◇</span><span className="text-[9px] font-bold uppercase">Profile</span></Link>
      </nav>
    </main>
  );
}