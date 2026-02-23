'use client';

/**
 * SessionSummary Component
 * Displays the final breakdown of charges after an EV charging session.
 */
export default function SessionSummary({ 
  totalKwh, 
  pricePerKwh, 
  bookingFee = 11 
}: { 
  totalKwh: number, 
  pricePerKwh: number, 
  bookingFee?: number 
}) {
  // Calculate the financial breakdown
  const totalAmount = totalKwh * pricePerKwh;
  const restAmount = totalAmount - bookingFee;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 p-8 rounded-[40px] w-full max-w-sm border border-zinc-800 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">⚡</span>
        </div>
        
        <h2 className="text-white font-black italic uppercase text-center text-xl mb-8 tracking-tight">
          Session Summary
        </h2>
        
        <div className="space-y-4 mb-8">
          {/* Energy Breakdown */}
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 uppercase font-bold text-[10px] tracking-widest">Energy Added</span>
            <span className="text-white font-black italic">{totalKwh.toFixed(1)} kWh</span>
          </div>
          
          {/* Financial Breakdown */}
          <div className="flex justify-between items-center border-t border-zinc-800 pt-4">
            <span className="text-zinc-500 uppercase font-bold text-[10px] tracking-widest">Total Session Cost</span>
            <span className="text-white font-black italic">₹{totalAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-emerald-400">
            <span className="uppercase font-bold text-[10px] tracking-widest">Paid at Booking</span>
            <span className="font-black italic">-₹{bookingFee.toFixed(2)}</span>
          </div>

          {/* Final Settlement Amount */}
          <div className="flex justify-between items-center bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 mt-6">
            <span className="text-emerald-500 uppercase font-black text-[11px] tracking-tighter">Amount to Pay</span>
            <span className="text-3xl font-black text-emerald-400 italic">₹{restAmount.toFixed(2)}</span>
          </div>
        </div>

        <button 
          onClick={() => window.location.reload()} // For demo: resets the flow
          className="w-full py-5 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5"
        >
          Settle Payment
        </button>
      </div>
    </div>
  );
}