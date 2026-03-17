'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useVehicle } from '@/context/VehicleContext';
import { createClient } from '@/utils/supabase/client';
import { EV_BRANDS, EV_MODELS } from '@/data/ev-database';

type Tab = 'profile' | 'garage' | 'sessions' | 'host';

interface UserProfile {
  full_name: string;
  mobile_number: string;
  city: string;
  upi_id: string;
  is_host: boolean;
  host_bank_account: string;
  host_upi: string;
  dl_number: string;
  aadhar_last4: string;
  rating: number;
  total_sessions: number;
}

interface Session {
  id: string;
  station_name: string;
  kwh: number;
  cost: number;
  date: string;
  type: 'driver' | 'host';
}

// ── reusable field ────────────────────────────────────────────────────────
function ProfileField({
  label, value, onChange, placeholder, type = 'text',
  prefix, readOnly, mono,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; prefix?: string;
  readOnly?: boolean; mono?: boolean;
}) {
  return (
    <div className="group">
      <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.18em] mb-1.5">{label}</p>
      {readOnly ? (
        <p className={`text-white text-sm font-bold px-1 ${mono ? 'font-mono text-zinc-400 text-xs' : ''}`}>
          {value || <span className="text-zinc-700">—</span>}
        </p>
      ) : prefix ? (
        <div className="flex gap-2 items-center">
          <span className="text-zinc-500 text-sm font-black bg-zinc-800/60 border border-zinc-700/60 px-3 py-2.5 rounded-xl flex-shrink-0">
            {prefix}
          </span>
          <input
            type={type}
            value={value}
            onChange={e => onChange?.(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder={placeholder}
            inputMode="numeric"
            className="flex-1 bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-700 transition-colors"
          />
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-700 transition-colors"
        />
      )}
    </div>
  );
}

// ── stat pill ─────────────────────────────────────────────────────────────
function StatPill({ value, label, accent }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-lg font-black italic leading-none ${accent ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </span>
      <span className="text-zinc-600 text-[8px] font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ── section wrapper ───────────────────────────────────────────────────────
function Section({ title, children, action }: {
  title?: string; children: React.ReactNode;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-3xl overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-800/60">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">{title}</p>
          {action && (
            <button onClick={action.onClick}
              className="text-emerald-500 text-[9px] font-black uppercase tracking-wider hover:text-emerald-400 transition-colors">
              {action.label}
            </button>
          )}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { userCars, selectedCar, setSelectedCar, addCar } = useVehicle();

  const [tab, setTab]                   = useState<Tab>('profile');
  const [saving, setSaving]             = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [toast, setToast]               = useState('');
  const [toastOk, setToastOk]           = useState(true);
  const [showAddCar, setShowAddCar]     = useState(false);
  const [sessions, setSessions]         = useState<Session[]>([]);
  const [editMode, setEditMode]         = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    full_name: '', mobile_number: '', city: '', upi_id: '',
    is_host: false, host_bank_account: '', host_upi: '',
    dl_number: '', aadhar_last4: '', rating: 4.8, total_sessions: 0,
  });

  const [carForm, setCarForm] = useState({ brand: 'Tata', model: 'nexon-ev' });

  const showToast = (msg: string, ok = true) => {
    setToast(msg); setToastOk(ok);
    setTimeout(() => setToast(''), 3000);
  };

  // ── load ──────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setProfileLoading(false); return; }
    const supabase = createClient();
    (async () => {
      setProfileLoading(true);
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(prev => ({
          ...prev,
          full_name:         data.full_name         ?? prev.full_name,
          mobile_number:     data.mobile_number     ?? data.phone ?? prev.mobile_number,
          city:              data.city              ?? prev.city,
          upi_id:            data.upi_id            ?? prev.upi_id,
          is_host:           data.is_host           ?? prev.is_host,
          host_bank_account: data.host_bank_account ?? prev.host_bank_account,
          host_upi:          data.host_upi          ?? prev.host_upi,
          dl_number:         data.dl_number         ?? prev.dl_number,
          aadhar_last4:      data.aadhar_last4      ?? prev.aadhar_last4,
          rating:            data.rating            ?? prev.rating,
          total_sessions:    data.total_sessions    ?? prev.total_sessions,
        }));
      } else {
        const meta = user.user_metadata ?? {};
        setProfile(prev => ({
          ...prev,
          full_name: meta.full_name || meta.name || '',
          mobile_number: meta.mobile_number || meta.phone || '',
        }));
        await supabase.from('profiles').insert({ id: user.id, full_name: meta.full_name || meta.name || '' });
      }
      setSessions([
        { id: '1', station_name: "Sarah's Driveway", kwh: 7.5,  cost: 83,  date: '9 Mar 2026', type: 'driver' },
        { id: '2', station_name: 'Statiq Hub',        kwh: 3.8,  cost: 55,  date: '7 Mar 2026', type: 'driver' },
        { id: '3', station_name: 'Your Charger',       kwh: 11.2, cost: 134, date: '6 Mar 2026', type: 'host'   },
        { id: '4', station_name: 'Your Charger',       kwh: 8.9,  cost: 107, date: '4 Mar 2026', type: 'host'   },
      ]);
      setProfileLoading(false);
    })();
  }, [user, authLoading]);

  // ── save ──────────────────────────────────────────────────────
  const saveProfile = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { showToast('Not logged in', false); return; }
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      full_name: profile.full_name,
      mobile_number: profile.mobile_number,
      city: profile.city,
      upi_id: profile.upi_id,
      is_host: profile.is_host,
      host_bank_account: profile.host_bank_account,
      host_upi: profile.host_upi,
      dl_number: profile.dl_number,
      aadhar_last4: profile.aadhar_last4,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    setSaving(false);
    if (!error) { showToast('Profile saved'); setEditMode(false); }
    else showToast(error.message, false);
  };

  const handleAddCar = () => {
    const model = (EV_MODELS[carForm.brand] || []).find((m: any) => m.id === carForm.model);
    if (!model) return;
    addCar({ ...model, brand: carForm.brand });
    setShowAddCar(false);
    showToast('Vehicle added');
  };

  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  const firstName = profile.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Driver';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : '—';

  const totalEarned = sessions.filter(s => s.type === 'host').reduce((a, s) => a + s.cost, 0);
  const totalSpent  = sessions.filter(s => s.type === 'driver').reduce((a, s) => a + s.cost, 0);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3">
        <div className="w-7 h-7 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-zinc-700 text-[9px] font-black uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black pb-40">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[200] px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl animate-in slide-in-from-top-3 duration-200 border ${
          toastOk
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {toastOk ? '✓' : '✗'} {toast}
        </div>
      )}

      {/* Add car modal */}
      {showAddCar && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[150] flex items-center justify-center p-5">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[28px] p-6 space-y-4">
            <div className="text-center mb-2">
              <p className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.25em]">Garage</p>
              <h3 className="text-white font-black italic uppercase text-xl mt-1">Add Vehicle</h3>
            </div>
            <div>
              <label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block mb-1.5">Brand</label>
              <select value={carForm.brand}
                onChange={e => setCarForm({ brand: e.target.value, model: EV_MODELS[e.target.value]?.[0]?.id || '' })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none">
                {EV_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block mb-1.5">Model</label>
              <select value={carForm.model}
                onChange={e => setCarForm(f => ({ ...f, model: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none">
                {(EV_MODELS[carForm.brand] || []).map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name} · {m.battery}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowAddCar(false)}
                className="flex-1 py-3.5 bg-zinc-800 text-zinc-400 font-black uppercase text-[9px] tracking-widest rounded-2xl">
                Cancel
              </button>
              <button onClick={handleAddCar}
                className="flex-1 py-3.5 bg-emerald-500 text-black font-black uppercase text-[9px] tracking-widest rounded-2xl">
                Add →
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md mx-auto px-4 pt-12">

        {/* ── HERO HEADER ─────────────────────────────────────── */}
        <div className="relative mb-6">
          {/* background glow */}
          <div className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/8 rounded-full blur-3xl" />
            <div className="absolute -bottom-5 -right-5 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
          </div>

          <div className="relative bg-zinc-900/80 border border-zinc-800/80 rounded-[28px] p-5 backdrop-blur-sm">
            {/* top row */}
            <div className="flex items-start gap-4 mb-5">
              {/* avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-black font-black text-xl"
                  style={{ boxShadow: '0 0 24px rgba(16,185,129,0.3)' }}>
                  {initials}
                </div>
                {profile.is_host && (
                  <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 rounded-lg px-1.5 py-0.5">
                    <span className="text-black text-[7px] font-black uppercase tracking-wide">Host</span>
                  </div>
                )}
              </div>

              {/* name + email */}
              <div className="flex-1 min-w-0 pt-0.5">
                <h1 className="text-white font-black italic uppercase text-[22px] tracking-tighter leading-tight truncate">
                  {firstName}
                </h1>
                <p className="text-zinc-500 text-[10px] font-bold truncate mt-0.5">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="flex">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} className={`text-[10px] ${i <= Math.round(profile.rating) ? 'text-emerald-400' : 'text-zinc-700'}`}>★</span>
                    ))}
                  </div>
                  <span className="text-zinc-500 text-[9px] font-bold">{profile.rating.toFixed(1)}</span>
                  <span className="text-zinc-700 text-[9px]">·</span>
                  <span className="text-zinc-600 text-[9px] font-bold">Since {memberSince}</span>
                </div>
              </div>

              {/* logout */}
              <button
                onClick={async () => { await logout(); window.location.href = '/login'; }}
                className="flex-shrink-0 mt-0.5 p-2 rounded-xl border border-zinc-800 text-zinc-600 hover:text-white hover:border-zinc-700 transition-colors"
                title="Logout"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>

            {/* divider */}
            <div className="h-px bg-zinc-800/80 mb-4" />

            {/* stats row */}
            <div className="grid grid-cols-4 gap-2">
              <StatPill value={sessions.length} label="Sessions" />
              <div className="w-px bg-zinc-800 self-stretch mx-auto" />
              <StatPill value={`₹${totalEarned}`} label="Earned" accent />
              <div className="w-px bg-zinc-800 self-stretch mx-auto" />
              <StatPill value={`₹${totalSpent}`} label="Spent" />
              <div className="w-px bg-zinc-800 self-stretch mx-auto" />
              <StatPill value={userCars.length || 0} label="Vehicles" />
            </div>
          </div>
        </div>

        {/* ── TABS ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-1 mb-5 bg-zinc-900/60 p-1 rounded-2xl border border-zinc-800/60">
          {([
            ['profile',  'Profile'],
            ['garage',   'Garage'],
            ['sessions', 'History'],
            ['host',     'Host'],
          ] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-2.5 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all ${
                tab === t ? 'bg-emerald-500 text-black shadow-sm' : 'text-zinc-600 hover:text-zinc-300'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════
            PROFILE TAB
        ══════════════════════════════════════════════════════ */}
        {tab === 'profile' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-400">

            {/* Personal Info */}
            <Section
              title="Personal Info"
              action={editMode
                ? undefined
                : { label: 'Edit', onClick: () => setEditMode(true) }}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <ProfileField label="Full Name" value={profile.full_name}
                    onChange={editMode ? v => setProfile(p => ({ ...p, full_name: v })) : undefined}
                    placeholder="Shivam Azad" readOnly={!editMode} />
                  <ProfileField label="City" value={profile.city}
                    onChange={editMode ? v => setProfile(p => ({ ...p, city: v })) : undefined}
                    placeholder="Mohali" readOnly={!editMode} />
                </div>
                <ProfileField label="Mobile Number" value={profile.mobile_number}
                  onChange={editMode ? v => setProfile(p => ({ ...p, mobile_number: v })) : undefined}
                  placeholder="9876543210" type="tel" prefix="+91" readOnly={!editMode} />
                <ProfileField label="UPI ID" value={profile.upi_id}
                  onChange={editMode ? v => setProfile(p => ({ ...p, upi_id: v })) : undefined}
                  placeholder="name@upi" readOnly={!editMode} />
              </div>
            </Section>

            {/* Account Info — always read-only */}
            <Section title="Account">
              <div className="space-y-3">
                {[
                  { label: 'Email',        value: user?.email || '—',             mono: false },
                  { label: 'Member Since', value: memberSince,                    mono: false },
                  { label: 'User ID',      value: user?.id?.slice(0, 16) + '…' || '—', mono: true  },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.18em]">{label}</span>
                    <span className={`text-white text-[11px] font-bold truncate max-w-[55%] text-right ${mono ? 'font-mono text-zinc-500 text-[10px]' : ''}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Save / Cancel only in edit mode */}
            {editMode && (
              <div className="flex gap-2">
                <button onClick={() => setEditMode(false)}
                  className="flex-1 py-4 bg-zinc-900 border border-zinc-800 text-zinc-500 font-black uppercase text-[10px] tracking-widest rounded-2xl">
                  Cancel
                </button>
                <button onClick={saveProfile} disabled={saving}
                  className="flex-[2] py-4 bg-emerald-500 text-black font-black uppercase text-[10px] tracking-widest rounded-2xl active:scale-95 transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes →'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            GARAGE TAB
        ══════════════════════════════════════════════════════ */}
        {tab === 'garage' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-400">
            {userCars.length === 0 ? (
              <div className="py-16 border border-dashed border-zinc-800 rounded-3xl text-center">
                <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl">🚗</div>
                <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest mb-3">No vehicles yet</p>
                <button onClick={() => setShowAddCar(true)}
                  className="text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:text-emerald-400 transition-colors">
                  + Add Your EV
                </button>
              </div>
            ) : (
              userCars.map((car: any) => {
                const isActive = selectedCar === car.id;
                return (
                  <div key={car.instanceId || car.id} onClick={() => setSelectedCar(car.id)}
                    className={`p-5 rounded-[24px] border cursor-pointer transition-all ${
                      isActive ? 'bg-emerald-500/8 border-emerald-500/30' : 'bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700'
                    }`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isActive ? 'text-emerald-500' : 'text-zinc-600'}`}>
                          {car.brand}
                        </p>
                        <h3 className="text-white font-black italic uppercase text-base tracking-tight">{car.name}</h3>
                        <div className="flex gap-1.5 mt-2">
                          {[car.charger, car.battery].map((tag: string) => tag && (
                            <span key={tag} className="bg-zinc-800 text-zinc-500 text-[8px] font-black uppercase px-2 py-1 rounded-lg">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isActive ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-700'
                      }`}>
                        {isActive && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                      </div>
                    </div>
                    {isActive && (
                      <div className="mt-3 pt-3 border-t border-emerald-500/15">
                        <span className="text-emerald-500 text-[8px] font-black uppercase tracking-widest">● Active Vehicle</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <button onClick={() => setShowAddCar(true)}
              className="w-full py-4 border border-dashed border-zinc-800 rounded-2xl text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:border-emerald-500/30 hover:text-emerald-500 transition-all">
              + Add Another Vehicle
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            HISTORY TAB
        ══════════════════════════════════════════════════════ */}
        {tab === 'sessions' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-400">

            {/* summary cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'As Driver', value: sessions.filter(s => s.type === 'driver').length, sub: `₹${totalSpent} spent`,  color: 'text-white' },
                { label: 'As Host',   value: sessions.filter(s => s.type === 'host').length,   sub: `₹${totalEarned} earned`, color: 'text-emerald-400' },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4">
                  <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest mb-1">{label}</p>
                  <p className={`text-2xl font-black italic ${color}`}>{value}</p>
                  <p className="text-zinc-600 text-[9px] font-bold mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* session rows */}
            {sessions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest">No sessions yet</p>
              </div>
            ) : sessions.map(s => (
              <div key={s.id} className="bg-zinc-900/70 border border-zinc-800/80 rounded-[22px] p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                  s.type === 'host' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {s.type === 'host' ? '⌂' : '⚡'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[11px] font-black truncate">{s.station_name}</p>
                  <p className="text-zinc-600 text-[9px] font-bold mt-0.5">{s.kwh} kWh · {s.date}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-black text-sm ${s.type === 'host' ? 'text-emerald-400' : 'text-white'}`}>
                    {s.type === 'host' ? '+' : '−'}₹{s.cost}
                  </p>
                  <p className="text-zinc-700 text-[8px] font-bold uppercase mt-0.5">{s.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            HOST TAB
        ══════════════════════════════════════════════════════ */}
        {tab === 'host' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-400">

            {/* host toggle */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-3xl p-5 flex items-center justify-between">
              <div>
                <p className="text-white font-black uppercase tracking-tight">Host Mode</p>
                <p className="text-zinc-600 text-[9px] font-bold mt-0.5">Share your charger and earn ₹</p>
              </div>
              <button
                onClick={() => setProfile(p => ({ ...p, is_host: !p.is_host }))}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${profile.is_host ? 'bg-emerald-500' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${profile.is_host ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>

            {profile.is_host && (
              <>
                <Section title="KYC Details">
                  <p className="text-zinc-600 text-[9px] font-bold mb-4 leading-relaxed">
                    Required to receive payouts. Encrypted and stored securely.
                  </p>
                  <div className="space-y-4">
                    {[
                      { label: "Driver's License No.", key: 'dl_number',    placeholder: 'HR-0120110012345', type: 'text',     max: 50 },
                      { label: 'Aadhaar Last 4 Digits', key: 'aadhar_last4', placeholder: '••••',            type: 'password', max: 4  },
                    ].map(({ label, key, placeholder, type, max }) => (
                      <div key={key}>
                        <label className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.18em] block mb-1.5">{label}</label>
                        <input type={type} value={(profile as any)[key]}
                          onChange={e => setProfile(p => ({ ...p, [key]: e.target.value.slice(0, max) }))}
                          placeholder={placeholder}
                          className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-700" />
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Payout Details">
                  <div className="space-y-4">
                    {[
                      { label: 'UPI ID',              key: 'host_upi',          placeholder: 'name@upi'         },
                      { label: 'Bank Account (opt.)', key: 'host_bank_account', placeholder: 'XXXXX1234 · IFSC' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.18em] block mb-1.5">{label}</label>
                        <input value={(profile as any)[key]}
                          onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-700" />
                      </div>
                    ))}
                  </div>
                </Section>

                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-4">
                  <p className="text-emerald-500 text-[9px] font-black uppercase tracking-widest mb-2">Host Agreement</p>
                  <p className="text-zinc-500 text-[9px] font-bold leading-relaxed">
                    Platform fee: 15% per session. Payouts every Monday. Min. payout ₹100. By saving you agree to ChargeShare's Terms of Service.
                  </p>
                </div>
              </>
            )}

            <button onClick={saveProfile} disabled={saving}
              className="w-full py-4 bg-emerald-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl active:scale-95 transition-all disabled:opacity-50">
              {saving ? 'Saving...' : 'Save & Continue →'}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-3xl flex items-center justify-around z-50">
        <Link href="/"        className="flex flex-col items-center text-zinc-500 gap-1 hover:text-white transition-colors"><span className="text-lg">○</span><span className="text-[9px] font-bold uppercase">Home</span></Link>
        <Link href="/explore" className="flex flex-col items-center text-zinc-500 gap-1 hover:text-white transition-colors"><span className="text-lg">◎</span><span className="text-[9px] font-bold uppercase">Explore</span></Link>
        <Link href="/host"    className="flex flex-col items-center text-zinc-500 gap-1 hover:text-white transition-colors"><span className="text-lg">◇</span><span className="text-[9px] font-bold uppercase">Host</span></Link>
        <Link href="/wallet"  className="flex flex-col items-center text-zinc-500 gap-1 hover:text-white transition-colors"><span className="text-lg">◍</span><span className="text-[9px] font-bold uppercase">Wallet</span></Link>
        <Link href="/profile" className="flex flex-col items-center text-emerald-400 gap-1">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mb-1" />
          <span className="text-[9px] font-bold uppercase">Profile</span>
        </Link>
      </nav>
    </main>
  );
}