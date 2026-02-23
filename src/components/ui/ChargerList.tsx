'use client';

export default function ChargerList({ items, onBook }: { items: any[], onBook: (s: any) => void }) {
  return (
    <div className="w-full max-w-md mt-2 space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
      {items.map((station) => (
        <div key={station.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[32px] flex justify-between items-center">
          <div>
            <h3 className="text-white font-black italic uppercase text-sm tracking-tight">
              {station.name}
            </h3>
            <p className="text-zinc-500 text-[10px] font-bold uppercase mt-1">
              {station.charger_type}
            </p>

            <div className="flex items-center gap-2 mt-2">
              <p className="text-emerald-400 text-sm font-black">
                ₹{station.price_per_kwh || '12'}/unit
              </p>
              <span className="text-zinc-500 text-[10px] font-black uppercase bg-zinc-800/50 px-2 py-1 rounded-full">
                {station.distance ? `${station.distance} KM AWAY` : 'Scanning...'}
              </span>
            </div>
            
          </div>
          <button
            onClick={() => onBook(station)}
            className="bg-emerald-500 text-black px-8 py-3 rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all"
          >
            BOOK
          </button>
        </div>
      ))}
    </div>
  );
}