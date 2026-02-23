interface BatteryCardProps {
  level: number;
  range: number;
  isCharging: boolean;
}

export default function BatteryCard({ level, range, isCharging }: BatteryCardProps) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 p-8 rounded-[40px] w-full shadow-2xl relative overflow-hidden">
       {/* UI for Connected Status */}
       <div className="flex justify-between items-start mb-6">
          <span className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">Tata Nexon EV</span>
          {isCharging && <span className="text-emerald-500 text-[8px] font-black uppercase tracking-widest animate-pulse">● Live</span>}
       </div>
       
       <h2 className="text-white text-2xl font-black italic uppercase mb-8">Connected</h2>
       
       <div className="flex items-baseline gap-2">
         <span className="text-7xl font-black text-white italic tracking-tighter">{level}%</span>
         <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Range: {range}km</span>
       </div>

       {/* Progress Bar */}
       <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-6">
         <div 
           className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
           style={{ width: `${level}%` }}
         />
       </div>
    </div>
  );
}