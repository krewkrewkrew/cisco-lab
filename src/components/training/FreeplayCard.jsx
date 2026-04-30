import React from 'react';
import { ChevronRight, Gamepad2, Wifi, Server, Network } from 'lucide-react';

export default function FreeplayCard({ scenario, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border transition-all ${
        isActive
          ? 'border-emerald-500/50 bg-emerald-500/10'
          : 'border-slate-800/60 bg-slate-900/40 hover:border-emerald-500/30 hover:bg-emerald-500/5'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 p-1.5 rounded bg-emerald-500/10 shrink-0">
            <Gamepad2 className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-emerald-500/70'}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-semibold ${isActive ? 'text-emerald-300' : 'text-slate-200'}`}>
              {scenario.title}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
              {scenario.description}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-[10px] text-emerald-500/80">
                <Wifi className="w-3 h-3" /> 18 Endpoints
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-500/80">
                <Network className="w-3 h-3" /> 4 VLANs
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-500/80">
                <Server className="w-3 h-3" /> 2 Uplinks
              </span>
            </div>
          </div>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-1" />
      </div>
    </button>
  );
}