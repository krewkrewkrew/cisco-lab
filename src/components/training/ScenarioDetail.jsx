import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, RotateCcw } from 'lucide-react';
import CommandGuide from './CommandGuide';

export default function ScenarioDetail({ scenario, validationResults, onStart, onReset }) {
  const allPassed = validationResults?.length > 0 && validationResults.every(r => r.pass);

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

      {/* Command Guide */}
      <CommandGuide commands={scenario.commands} />


    </div>
  );
}