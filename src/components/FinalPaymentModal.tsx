'use client';
import { useState } from 'react';

interface FinalPaymentProps {
  totalAmount: number;
  bookingFee: number;
  restAmount: number;
  onComplete: () => void;
}

export default function FinalPaymentModal({ totalAmount, bookingFee, restAmount, onComplete }: FinalPaymentProps) {
  const [step, setStep] = useState<'BILL' | 'GATEWAY' | 'FEEDBACK' | 'SUCCESS'>('BILL');
  const [rating, setRating] = useState(0);

  const handlePayment = () => {
    setStep('GATEWAY');
    // Simulate payment processing
    setTimeout(() => {
      setStep('FEEDBACK');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] w-full max-w-sm shadow-2xl">
        
        {/* STEP 1: BILL SUMMARY */}
        {step === 'BILL' && (
          <div className="animate-in fade-in zoom-in duration-300">
            <h2 className="text-white font-black italic uppercase text-center mb-8 tracking-tighter text-xl">Settlement</h2>
            <div className="space-y-4 mb-10">
              <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                <span>Gross Total</span>
                <span className="text-white italic">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                <span>Deposit Paid</span>
                <span className="italic">-₹{bookingFee.toFixed(2)}</span>
              </div>
              <div className="h-[1px] bg-zinc-800/50 my-2"></div>
              <div className="flex justify-between items-center py-2">
                <span className="text-zinc-400 text-[12px] font-black uppercase tracking-tighter">Amount Due</span>
                <span className="text-4xl font-black text-white italic tracking-tighter">₹{restAmount.toFixed(2)}</span>
              </div>
            </div>
            <button 
              onClick={handlePayment}
              className="w-full py-5 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl active:scale-95 transition-all"
            >
              Pay Now
            </button>
          </div>
        )}

        {/* STEP 2: GATEWAY ANIMATION */}
        {step === 'GATEWAY' && (
          <div className="text-center py-10">
            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mx-auto mb-8"></div>
            <p className="text-white font-black italic uppercase text-xs tracking-widest animate-pulse">Processing UPI...</p>
          </div>
        )}

        {/* STEP 3: OPTIONAL FEEDBACK */}
        {step === 'FEEDBACK' && (
          <div className="animate-in slide-in-from-right duration-500 text-center">
            <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Payment Received</p>
            <h3 className="text-white text-xl font-black italic uppercase mb-6">Rate Sarah's Charger</h3>
            
            <div className="flex justify-center gap-3 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-all ${rating >= star ? 'grayscale-0 scale-110' : 'grayscale opacity-30'}`}
                >
                  ⚡
                </button>
              ))}
            </div>

            <textarea 
              placeholder="Any comments? (Optional)"
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-emerald-500/50 mb-6 resize-none h-24"
            />

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setStep('SUCCESS')}
                className="w-full py-4 bg-emerald-500 text-black font-black uppercase text-[10px] tracking-widest rounded-xl"
              >
                Submit Review
              </button>
              <button 
                onClick={() => setStep('SUCCESS')}
                className="w-full py-4 text-zinc-500 font-bold uppercase text-[9px] tracking-widest hover:text-white transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: FINAL SUCCESS */}
        {step === 'SUCCESS' && (
          <div className="text-center py-6 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-emerald-500 text-black rounded-full flex items-center justify-center mx-auto mb-8 text-4xl font-black shadow-[0_0_40px_rgba(16,185,129,0.3)]">✓</div>
            <h3 className="text-white font-black italic uppercase text-2xl tracking-tighter mb-2">Done!</h3>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-10">Session Closed • E-Receipt Sent</p>
            <button 
              onClick={onComplete}
              className="w-full py-5 bg-zinc-800 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl"
            >
              Finish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}