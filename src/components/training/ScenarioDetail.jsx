import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Lightbulb, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import CommandGuide from './CommandGuide';
import ContextHint from './ContextHint';

export default function ScenarioDetail({ scenario, validationResults, onStart, onReset }) {
  const [showHints, setShowHints] = useState(false);
  const [revealedHints, setRevealedHints] = useState(0);

  const allPassed = validationResults?.length > 0 && validationResults.every(r => r.pass);

  const revealNextHint = () => {
    setRevealedHints(prev => Math.min(prev + 1, scenario.hints.length));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-white">{scenario.title}</h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{scenario.description}</p>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onStart}
          className="bg-accent hover:bg-accent/80 text-white text-xs h-7"
        >
          Start Lab
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReset}
          className="text-xs h-7 border-border/50 text-slate-400 hover:text-white"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* Objectives */}
      <div>
        <h3 className="text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Objectives</h3>
        <div className="space-y-1.5">
          {scenario.objectives.map((obj, i) => {
            const result = validationResults?.[i];
            const passed = result?.pass;
            return (
              <div key={i} className="flex items-start gap-2">
                {passed ? (
                  <Circle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" style={{ fill: 'currentColor' }} />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" />
                )}
                <span className={`text-xs leading-relaxed ${passed ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {obj}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {allPassed && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs text-emerald-400 font-medium">
            ✓ Lab Complete! All objectives achieved.
          </p>
        </div>
      )}

      {/* Context-aware hint for current failing objective */}
      <ContextHint scenario={scenario} validationResults={validationResults} />

      {/* Command Guide */}
      <CommandGuide commands={scenario.commands} />

      {/* Hints */}
      <div>
        <button
          onClick={() => setShowHints(!showHints)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Lightbulb className="w-3 h-3" />
          <span>Hints</span>
          {showHints ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {showHints && (
          <div className="mt-2 space-y-1.5">
            {scenario.hints.slice(0, revealedHints).map((hint, i) => (
              <div key={i} className="text-xs text-amber-400/80 pl-4 border-l border-amber-500/20">
                {hint}
              </div>
            ))}
            {revealedHints < scenario.hints.length && (
              <button
                onClick={revealNextHint}
                className="text-[10px] text-slate-500 hover:text-amber-400 pl-4 transition-colors"
              >
                Reveal next hint →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}