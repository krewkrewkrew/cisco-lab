import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, ChevronRight } from 'lucide-react';

const difficultyColors = {
  Beginner: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Intermediate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
};

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
          <h3 className="text-sm font-medium text-slate-200 group-hover:text-white truncate">
            {scenario.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${difficultyColors[scenario.difficulty]}`}>
              {scenario.difficulty}
            </Badge>
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="w-3 h-3" />
              {scenario.duration}
            </span>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 mt-0.5 transition-transform ${isActive ? 'text-accent rotate-90' : 'text-slate-600'}`} />
      </div>
    </button>
  );
}