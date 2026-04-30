import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';

export default function TestCard({ scenario, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isActive
          ? 'border-purple-500/50 bg-purple-500/10'
          : 'border-slate-800/60 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className="min-w-0">
            <p className={`text-xs font-medium truncate ${isActive ? 'text-purple-300' : 'text-slate-300'}`}>
              {scenario.title}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
              {scenario.description}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="flex items-center gap-1 text-[9px] text-slate-600">
                <Clock className="w-2.5 h-2.5" />
                {scenario.duration}
              </span>
              <span className="text-[9px] text-slate-600">
                {scenario.objectives?.length} objectives
              </span>
            </div>
          </div>
        </div>
        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0 mt-1" />
      </div>
    </button>
  );
}