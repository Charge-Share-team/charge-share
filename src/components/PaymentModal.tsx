'use client';

import { useState } from 'react';

export default function PaymentModal({ amount, onSuccess, onClose }: { amount: string, onSuccess: () => void, onClose: () => void }) {
  const [step, setStep] = useState<'CHOOSING' | 'LOADING' | 'SUCCESS'>('CHOOSING');
  const [method, setMethod] = useState('');

  const handleFakePay = (type: string) => {
    setMethod(type);
    setStep('LOADING');
    
    // Simulate a 2-second payment processing delay
    setTimeout(() => {
      setStep('SUCCESS');
      // After success message, trigger the app's next step (e.g., start charging)
      setTimeout(onSuccess, 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] w-full max-w-sm shadow-2xl">
        
        {step === 'CHOOSING' && (
          <div className="animate-in fade-in zoom-in duration-300">
            <h2 className="text-white font-black italic uppercase text-xl mb-1 text-center">Confirm Booking</h2>
            
            {/* NEW: Booking Deposit UI Card */}
            <div className="bg-zinc-800/50 p-5 rounded-2xl my-6 text-left border border-blue-500/30">
              <p className="text-zinc-500 text-[9px] uppercase font-black tracking-widest">Booking Deposit</p>
              <p className="text-3xl font-black text-blue-400 italic">₹11.00</p>
              <p className="text-[8px] text-zinc-400 mt-2 uppercase font-bold italic tracking-wider">
                * This amount will be deducted from your final electricity bill.
              </p>
            </div>

            <p className="text-zinc-500 text-[9px] font-bold uppercase mb-4 tracking-widest text-center">Select Payment Method</p>
            
            <div className="space-y-3">
              <button onClick={() => handleFakePay('UPI')} className="w-full bg-zinc-800/50 border border-zinc-700 p-4 rounded-2xl flex items-center gap-4 hover:bg-zinc-800 transition-all group">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 font-black italic">U</div>
                <span className="text-sm font-bold uppercase italic">UPI (GPay / PhonePe)</span>
              </button>

              <button onClick={() => handleFakePay('CARD')} className="w-full bg-zinc-800/50 border border-zinc-700 p-4 rounded-2xl flex items-center gap-4 hover:bg-zinc-800 transition-all">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 font-black italic">C</div>
                <span className="text-sm font-bold uppercase italic">Debit / Credit Card</span>
              </button>
            </div>

            <button onClick={onClose} className="w-full mt-6 text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Cancel Booking</button>
          </div>
        )}

        {step === 'LOADING' && (
          <div className="py-12 text-center animate-pulse">
            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6" />
            <p className="text-white font-black italic uppercase text-xs tracking-[0.3em]">Processing Deposit...</p>
            <p className="text-zinc-600 text-[9px] font-bold uppercase mt-2">Connecting via {method}</p>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="py-12 text-center animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-500 text-black rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-black">✓</div>
            <h3 className="text-white font-black italic uppercase text-lg">Slot Reserved</h3>
            <p className="text-zinc-500 text-[9px] font-bold mt-2 uppercase">₹11.00 Deposit Confirmed</p>
          </div>
        )}
      </div>
    </div>
  );
}