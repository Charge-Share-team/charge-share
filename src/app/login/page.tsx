'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../utils/supabase/client'; 

export default function LoginPage() {
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState(''); 
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Step 1: Request the 6-digit code from Supabase
  const handleGetOTP = async () => {
    if (!email.includes('@')) return alert('Please enter a valid email');
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        // We remove emailRedirectTo to ensure Supabase uses the Token flow
        shouldCreateUser: true,
      },
    });

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      setStep('OTP');
    }
    setLoading(false);
  };

  // Step 2: Verify the 6-digit code
  const handleVerifyOTP = async (codeToVerify: string) => {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: codeToVerify,
      type: 'email', // Required for verifying numeric email tokens
    });

    if (error) {
      alert(`Verification failed: ${error.message}`);
      setLoading(false);
    } else {
      // Success: Establish the session
      router.push('/');
      router.refresh(); 
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8 flex flex-col justify-center font-sans">
      {/* Brand Header */}
      <div className="mb-12">
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl mb-6 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
          <span className="text-black text-2xl font-black italic">⚡</span>
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
          Charge.<span className="text-emerald-500">Share</span>
        </h1>
        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.3em] mt-4">
          India's Private EV Network
        </p>
      </div>

      {step === 'EMAIL' ? (
        /* EMAIL INPUT */
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl focus-within:border-emerald-500 transition-all flex items-center gap-3">
            <input 
              type="email" 
              placeholder="Enter your Email"
              className="bg-transparent outline-none flex-1 font-mono tracking-wider text-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button 
            onClick={handleGetOTP}
            disabled={loading}
            className="w-full py-5 bg-white text-black font-black uppercase text-xs tracking-[.3em] rounded-2xl active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Get OTP Code'}
          </button>
        </div>
      ) : (
        /* OTP VERIFICATION */
        <div className="space-y-6 animate-in zoom-in duration-300">
          <div className="text-center">
            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Code sent to</p>
            <p className="text-emerald-500 font-mono text-sm">{email}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl focus-within:border-emerald-500 transition-all">
            <input 
               type="text" 
               maxLength={8}
               placeholder="00000000"
               className="w-full bg-transparent text-center text-4xl font-black text-emerald-500 outline-none tracking-[0.4em]"
               value={otpCode}
               onChange={(e) => {
                 const val = e.target.value.replace(/\D/g, ''); 
                 setOtpCode(val);
                 if (val.length === 8) handleVerifyOTP(val); 
               }}
            />
          </div>
          <button 
            disabled={loading}
            onClick={() => handleVerifyOTP(otpCode)}
            className="w-full py-5 bg-emerald-500 text-black font-black uppercase text-xs tracking-[.3em] rounded-2xl disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </div>
      )}

      <button 
        onClick={() => router.push('/')}
        className="mt-8 text-zinc-600 text-[9px] uppercase font-bold tracking-widest hover:text-zinc-400 transition-colors"
      >
        Skip to Guest Mode →
      </button>
    </main>
  );
}