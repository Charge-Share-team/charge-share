'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/components/AuthProvider';

type Step = 'details' | 'password' | 'done';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('details');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — personal details
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');

  // Step 2 — password
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading]);

  const formatMobile = (val: string) => val.replace(/\D/g, '').slice(0, 10);

  const submitDetails = async () => {
    if (!fullName.trim()) return setError('Full name is required.');
    if (mobile.length < 10) return setError('Enter a valid 10-digit mobile number.');
    setError('');
    setSaving(true);

    const { error: err } = await supabase.from('profiles').upsert({
      id: user!.id,
      full_name: fullName.trim(),
      mobile_number: mobile,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    if (err) return setError(err.message);
    setStep('password');
  };

  const submitPassword = async () => {
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setError('');
    setSaving(true);

    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setSaving(false);
      return setError(err.message);
    }

    // Mark onboarding complete
    await supabase.from('profiles').upsert({
      id: user!.id,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    setStep('done');
  };

  const skipPassword = async () => {
    setSaving(true);
    await supabase.from('profiles').upsert({
      id: user!.id,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setStep('done');
  };

  if (loading || !user) return <div className="min-h-screen bg-black" />;

  const progressPct = step === 'details' ? 33 : step === 'password' ? 66 : 100;

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">

        {/* Logo + progress */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-xl mx-auto mb-3 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
            ⚡
          </div>
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.25em]">
            Set Up Your Account
          </p>
          {/* Progress bar */}
          <div className="mt-4 h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-zinc-700 text-[8px] font-bold uppercase tracking-widest mt-1">
            Step {step === 'details' ? 1 : step === 'password' ? 2 : 3} of 3
          </p>
        </div>

        {/* ── Step 1: Details ── */}
        {step === 'details' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
            <div className="mb-2">
              <h2 className="text-white font-black italic uppercase text-lg tracking-tight">
                Personal Details
              </h2>
              <p className="text-zinc-500 text-[10px] font-bold mt-1">
                Tell us who you are — this appears on your profile.
              </p>
            </div>

            <div>
              <label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => { setFullName(e.target.value); setError(''); }}
                placeholder="Shivam Azad"
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/60 placeholder:text-zinc-700 transition-colors"
              />
            </div>

            <div>
              <label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block mb-1.5">
                Mobile Number *
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 text-sm font-bold">
                  +91
                </div>
                <input
                  type="tel"
                  value={mobile}
                  onChange={e => { setMobile(formatMobile(e.target.value)); setError(''); }}
                  placeholder="9876543210"
                  inputMode="numeric"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/60 placeholder:text-zinc-700 transition-colors"
                />
              </div>
            </div>

            {/* Email read-only */}
            <div>
              <label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block mb-1.5">
                Email
              </label>
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl px-4 py-3.5 text-zinc-500 text-sm font-bold">
                {user.email}
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-[9px] font-bold uppercase tracking-wider animate-in fade-in">
                ⚠ {error}
              </p>
            )}

            <button
              onClick={submitDetails}
              disabled={saving}
              className="w-full py-4 bg-emerald-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Next →'}
            </button>
          </div>
        )}

        {/* ── Step 2: Password ── */}
        {step === 'password' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
            <div className="mb-2">
              <h2 className="text-white font-black italic uppercase text-lg tracking-tight">
                Set a Password
              </h2>
              <p className="text-zinc-500 text-[10px] font-bold mt-1">
                Next time you can login with your email + password instead of OTP.
              </p>
            </div>

            <div>
              <label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Min. 8 characters"
                  autoFocus
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 pr-12 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/60 placeholder:text-zinc-700 transition-colors"
                />
                <button
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold uppercase hover:text-white"
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block mb-1.5">
                Confirm Password
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(''); }}
                placeholder="Re-enter password"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/60 placeholder:text-zinc-700 transition-colors"
              />
            </div>

            {/* Strength indicator */}
            {password.length > 0 && (
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(n => (
                  <div
                    key={n}
                    className={`flex-1 h-1 rounded-full transition-all ${
                      password.length >= n * 3
                        ? n <= 1 ? 'bg-red-500'
                        : n <= 2 ? 'bg-yellow-500'
                        : n <= 3 ? 'bg-emerald-500/70'
                        : 'bg-emerald-500'
                        : 'bg-zinc-800'
                    }`}
                  />
                ))}
                <span className="text-zinc-600 text-[8px] font-bold ml-1">
                  {password.length < 4 ? 'Weak' : password.length < 8 ? 'Fair' : password.length < 12 ? 'Good' : 'Strong'}
                </span>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-[9px] font-bold uppercase tracking-wider animate-in fade-in">
                ⚠ {error}
              </p>
            )}

            <button
              onClick={submitPassword}
              disabled={saving}
              className="w-full py-4 bg-emerald-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Set Password & Finish →'}
            </button>

            <button
              onClick={skipPassword}
              disabled={saving}
              className="w-full py-3 text-zinc-600 font-black uppercase text-[9px] tracking-widest hover:text-white transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === 'done' && (
          <div className="animate-in fade-in zoom-in duration-500 text-center space-y-6">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-4xl font-black shadow-[0_0_60px_rgba(16,185,129,0.35)]">
              ✓
            </div>
            <div>
              <h2 className="text-white font-black italic uppercase text-2xl tracking-tighter">
                You're All Set!
              </h2>
              <p className="text-zinc-500 text-[10px] font-bold mt-2">
                Welcome to Charge.Share, {fullName.split(' ')[0] || 'Driver'} ⚡
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-left space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Name</span>
                <span className="text-white text-[11px] font-black">{fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Mobile</span>
                <span className="text-white text-[11px] font-black">+91 {mobile}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Email</span>
                <span className="text-white text-[11px] font-black truncate max-w-[160px]">{user.email}</span>
              </div>
            </div>

            <button
              onClick={() => router.replace('/')}
              className="w-full py-5 bg-emerald-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl active:scale-95 transition-all"
            >
              Start Charging →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}