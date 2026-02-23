'use client';
import { useState } from 'react';

export default function PayoutModal({ amount, onSuccess, onClose }: { amount: string, onSuccess: () => void, onClose: () => void }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleWithdraw = () => {
    setIsProcessing(true);
    setTimeout(() => {
      alert(`Success! ${amount} has been transferred to your bank.`);
      onSuccess();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[32px] w-full max-w-sm text-center">
        <h2 className="text-white font-black italic uppercase text-xl mb-6">Withdraw Earnings</h2>
        <div className="bg-black/50 p-6 rounded-2xl mb-8 border border-zinc-800">
          <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Available Balance</p>
          <p className="text-3xl font-black text-blue-400 italic">{amount}</p>
        </div>
        
        <button 
          onClick={handleWithdraw}
          disabled={isProcessing}
          className="w-full py-5 bg-blue-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl disabled:opacity-50"
        >
          {isProcessing ? 'Processing Transfer...' : 'Confirm Bank Payout'}
        </button>
        
        {!isProcessing && (
          <button onClick={onClose} className="mt-4 text-zinc-600 text-[10px] font-black uppercase tracking-widest">Close</button>
        )}
      </div>
    </div>
  );
}