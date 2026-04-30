import React from 'react';
import { Clock, ChevronRight, Wrench } from 'lucide-react';

const isTroubleshooting = (scenario) => scenario.category === 'troubleshooting';

export default function ScenarioCard({ scenario, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group ${
        isActive
          ? 'border-accent bg-accent/10'
          : 'border-border/50 hover:border-border hover:bg-secondary/30'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {isTroubleshooting(scenario) && <Wrench className="w-3 h-3 text-amber-400 shrink-0" />}
            <h3 className="text-sm font-medium text-slate-200 group-hover:text-white truncate">
              {scenario.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="w-3 h-3" />
              {scenario.duration}
            </span>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 mt-1 shrink-0 transition-transform ${isActive ? 'text-accent rotate-90' : 'text-slate-600'}`} />
      </div>
    </button>
  );
}