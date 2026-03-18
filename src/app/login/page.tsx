'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/components/AuthProvider';

// ─── subtle grid background ───────────────────────────────────────────────
function GridBg() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 70%)',
      }} />
    </div>
  );
}

type Mode = 'login' | 'register' | 'guest';

function ModePills({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const pills: { id: Mode; label: string }[] = [
    { id: 'login',    label: 'Sign In'  },
    { id: 'register', label: 'Register' },
    { id: 'guest',    label: 'Guest'    },
  ];
  const idx = pills.findIndex(p => p.id === mode);
  return (
    <div className="relative flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1 mb-7">
      <div
        className="absolute top-1 bottom-1 rounded-xl bg-zinc-800 transition-all duration-300 ease-out"
        style={{ width: `calc(33.333% - 2.67px)`, left: `calc(${idx} * 33.333% + 4px)` }}
      />
      {pills.map(p => (
        <button key={p.id} onClick={() => onChange(p.id)}
          className={`relative z-10 flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${
            mode === p.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'
          }`}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder, onKeyDown, autoFocus }: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void; autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPass = type === 'password';
  return (
    <div>
      <label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={isPass && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          suppressHydrationWarning
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/60 placeholder:text-zinc-700 transition-colors"
          style={isPass ? { paddingRight: '64px' } : {}}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[9px] font-black uppercase tracking-wider hover:text-zinc-300 transition-colors">
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
    </div>
  );
}

function OtpBoxes({ otp, onChange, onKeyDown }: {
  otp: string[];
  onChange: (idx: number, val: string) => void;
  onKeyDown: (idx: number, e: React.KeyboardEvent) => void;
}) {
  return (
    <div className="flex gap-1.5 justify-between">
      {otp.map((d, i) => (
        <input key={i} id={`otp-${i}`} value={d}
          onChange={e => onChange(i, e.target.value)}
          onKeyDown={e => onKeyDown(i, e)}
          maxLength={1} inputMode="numeric" suppressHydrationWarning
          className="w-full aspect-square text-center text-base font-black text-white bg-zinc-900 border-2 border-zinc-800 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
        />
      ))}
    </div>
  );
}

function Err({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <p className="text-red-400 text-[9px] font-bold uppercase tracking-wider animate-in fade-in flex items-center gap-1.5">
      <span>⚠</span>{msg}
    </p>
  );
}

function PrimaryBtn({ onClick, disabled, children }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full py-4 bg-emerald-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
      {children}
    </button>
  );
}

function GhostBtn({ onClick, disabled, children }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full py-3 text-zinc-600 font-black uppercase text-[9px] tracking-widest hover:text-zinc-400 transition-colors disabled:opacity-40">
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || '';
  const nextPath = ['/wallet', '/profile'].includes(nextParam) ? nextParam : '/';
  const { continueAsGuest, user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [mode, setMode]           = useState<Mode>('login');
  // ── FIX: only two steps now — 'form' and 'otp'. No 'setpass' step.
  // Password is set in onboarding, not here. This removes the duplicate.
  const [step, setStep]           = useState<'form' | 'otp'>('form');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [otp, setOtp]             = useState(Array(8).fill(''));
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [countdown, setCountdown] = useState(0);

  // ── FIX: use a flag to block the useEffect redirect during OTP flow
  // Without this flag, when verifyOtp sets the session and user becomes
  // non-null, the useEffect fires router.replace(nextPath) before
  // goAfterAuth can check onboarding_complete, skipping onboarding.
  const [handlingOtp, setHandlingOtp] = useState(false);

  useEffect(() => {
    // Only redirect if we're NOT in the middle of OTP verification
    if (!authLoading && user && !handlingOtp) {
      router.replace(nextPath);
    }
  }, [user, authLoading, handlingOtp]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const clearForm = () => {
    setEmail(''); setPassword('');
    setOtp(Array(8).fill('')); setError(''); setStep('form');
    setHandlingOtp(false);
  };

  const switchMode = (m: Mode) => { setMode(m); clearForm(); };

  const handleOtpChange = (idx: number, val: string) => {
    if (val.length > 1) {
      const digits = val.replace(/\D/g, '').slice(0, 8).split('');
      const next = Array(8).fill('');
      digits.forEach((d, i) => { next[i] = d; });
      setOtp(next);
      document.getElementById(`otp-${Math.min(7, digits.length - 1)}`)?.focus();
      return;
    }
    const next = [...otp];
    next[idx] = val.replace(/\D/g, '').slice(-1);
    setOtp(next);
    if (val && idx < 7) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  // ── LOGIN with email + password ──────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim()) return setError('Enter your email.');
    if (!password)     return setError('Enter your password.');
    setLoading(true); setError('');

    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), password,
    });
    setLoading(false);

    if (err) {
      if (err.message.toLowerCase().includes('invalid')) return setError('Incorrect email or password.');
      return setError(err.message);
    }
    router.replace(nextPath);
    router.refresh();
  };

  // ── REGISTER step 1: send OTP ────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!email.trim()) return setError('Enter your email address.');
    setLoading(true); setError('');

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (err) return setError(err.message);

    setStep('otp');
    setCountdown(60);
    setOtp(Array(8).fill(''));
  };

  // ── REGISTER step 2: verify OTP → go to onboarding ──────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 8) return setError('Enter the full 8-digit code.');
    setLoading(true); setError('');

    // Block the useEffect redirect while we handle this
    setHandlingOtp(true);

    const { data, error: err } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code, type: 'email',
    });

    if (err) {
      setLoading(false);
      setHandlingOtp(false);
      return setError('Invalid or expired code. Try again.');
    }

    // Write session to cookies so middleware picks it up
    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }

    const uid = data.session?.user?.id || data.user?.id;

    // Check if onboarding is already complete
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', uid)
      .single();

    setLoading(false);
    // Keep handlingOtp true until after navigation
    router.refresh();
    router.replace(!profile?.onboarding_complete ? '/onboarding' : nextPath);
  };

  // ── GUEST ────────────────────────────────────────────────────────────
  const handleGuest = () => { continueAsGuest(); router.replace('/'); };

  if (authLoading) return <div className="min-h-screen bg-black" />;

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-5 py-10 relative">
      <GridBg />

      <div className="relative z-10 w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-[18px] flex items-center justify-center text-2xl mx-auto mb-3"
            style={{ background: '#10b981', boxShadow: '0 0 48px rgba(16,185,129,0.32)' }}>
            ⚡
          </div>
          <h1 className="text-[28px] font-black text-white italic uppercase tracking-tighter leading-none">
            Charge<span style={{ color: '#10b981' }}>.Share</span>
          </h1>
          <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.28em] mt-1">
            India's Private EV Network
          </p>
        </div>

        {/* Card */}
        <div className="rounded-[28px] p-5 border"
          style={{ background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.06)' }}>

          {step === 'form' && <ModePills mode={mode} onChange={switchMode} />}

          {/* ══ LOGIN ══ */}
          {mode === 'login' && step === 'form' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="mb-2">
                <h2 className="text-white font-black italic uppercase text-lg tracking-tight">Welcome back</h2>
                <p className="text-zinc-600 text-[9px] font-bold mt-0.5">Sign in with your email & password</p>
              </div>

              <Field label="Email" type="email" value={email}
                onChange={v => { setEmail(v); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="you@example.com" autoFocus />

              <Field label="Password" type="password" value={password}
                onChange={v => { setPassword(v); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Your password" />

              <Err msg={error} />
              <PrimaryBtn onClick={handleLogin} disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In →'}
              </PrimaryBtn>

              <p className="text-zinc-700 text-[9px] font-bold text-center pt-1">
                New here?{' '}
                <button onClick={() => switchMode('register')}
                  className="text-emerald-500 hover:text-emerald-400 transition-colors font-black">
                  Create an account
                </button>
              </p>
            </div>
          )}

          {/* ══ REGISTER: email ══ */}
          {mode === 'register' && step === 'form' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="mb-2">
                <h2 className="text-white font-black italic uppercase text-lg tracking-tight">Create account</h2>
                <p className="text-zinc-600 text-[9px] font-bold mt-0.5">We'll verify your email with a one-time code</p>
              </div>

              <Field label="Email Address" type="email" value={email}
                onChange={v => { setEmail(v); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                placeholder="you@example.com" autoFocus />

              <Err msg={error} />
              <PrimaryBtn onClick={handleSendOtp} disabled={loading}>
                {loading ? 'Sending Code...' : 'Send Verification Code →'}
              </PrimaryBtn>

              <p className="text-zinc-700 text-[9px] font-bold text-center pt-1">
                Already have an account?{' '}
                <button onClick={() => switchMode('login')}
                  className="text-emerald-500 hover:text-emerald-400 transition-colors font-black">
                  Sign in
                </button>
              </p>
            </div>
          )}

          {/* ══ REGISTER: OTP ══ */}
          {mode === 'register' && step === 'otp' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <button onClick={() => { setStep('form'); setError(''); setOtp(Array(8).fill('')); setHandlingOtp(false); }}
                className="text-zinc-600 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors">
                ← Back
              </button>

              <div>
                <h2 className="text-white font-black italic uppercase text-lg tracking-tight">Check your email</h2>
                <p className="text-zinc-600 text-[9px] font-bold mt-1">
                  8-digit code sent to <span className="text-white font-black">{email}</span>
                </p>
              </div>

              <OtpBoxes otp={otp} onChange={handleOtpChange} onKeyDown={handleOtpKey} />

              <Err msg={error} />
              <PrimaryBtn onClick={handleVerifyOtp} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Continue →'}
              </PrimaryBtn>
              <GhostBtn onClick={countdown > 0 ? () => {} : handleSendOtp} disabled={countdown > 0}>
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </GhostBtn>

              {/* Clear hint about what happens next */}
              <p className="text-zinc-700 text-[8px] font-bold text-center">
                After verification you'll set up your profile
              </p>
            </div>
          )}

          {/* ══ GUEST ══ */}
          {mode === 'guest' && step === 'form' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="mb-1">
                <h2 className="text-white font-black italic uppercase text-lg tracking-tight">Browse freely</h2>
                <p className="text-zinc-600 text-[9px] font-bold mt-0.5">
                  Explore the app without creating an account.
                </p>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-2">
                {[
                  { ok: true,  label: 'Browse nearby chargers' },
                  { ok: true,  label: 'View map & explore'     },
                  { ok: false, label: 'Book a charging session' },
                  { ok: false, label: 'Host your charger'       },
                  { ok: false, label: 'Access wallet & history' },
                ].map(({ ok, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className={`text-[11px] font-black w-4 flex-shrink-0 ${ok ? 'text-emerald-500' : 'text-zinc-700'}`}>
                      {ok ? '✓' : '✗'}
                    </span>
                    <span className={`text-[10px] font-bold ${ok ? 'text-zinc-300' : 'text-zinc-600'}`}>{label}</span>
                  </div>
                ))}
              </div>

              <PrimaryBtn onClick={handleGuest}>Continue as Guest →</PrimaryBtn>

              <p className="text-zinc-700 text-[9px] font-bold text-center">
                Want full access?{' '}
                <button onClick={() => switchMode('register')}
                  className="text-emerald-500 hover:text-emerald-400 transition-colors font-black">
                  Create a free account
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="text-zinc-800 text-[8px] font-bold text-center mt-5 uppercase tracking-widest">
          Charge.Share · India's P2P EV Network
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginContent />
    </Suspense>
  );
}