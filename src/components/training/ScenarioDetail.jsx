import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Circle, RotateCcw, Gamepad2 } from 'lucide-react';
import CommandGuide from './CommandGuide';

function FreeplayDetail({ scenario, onStart, onReset }) {
  const quickCmds = [
    'show vlan brief',
    'show interfaces status',
    'show interfaces trunk',
    'show mac-address-table',
    'show cdp neighbors',
    'show ip interface brief',
    'show spanning-tree',
    'show running-config',
    'show log',
    'show etherchannel summary',
    'show arp',
    'show ip ssh',
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Gamepad2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <h2 className="text-base font-semibold text-white">{scenario.title}</h2>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{scenario.description}</p>

      <div className="flex gap-2">
        <Button size="sm" onClick={onStart} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7">
          Load Lab
        </Button>
        <Button size="sm" variant="outline" onClick={onReset} className="text-xs h-7 border-border/50 text-slate-400 hover:text-white">
          <RotateCcw className="w-3 h-3 mr-1" /> Reset
        </Button>
      </div>

      {/* Pre-configured network summary */}
      <div>
        <h3 className="text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">What's pre-configured</h3>
        <div className="space-y-1.5">
          {scenario.objectives.map((obj, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5 shrink-0 text-xs">›</span>
              <span className="text-xs text-slate-400 leading-relaxed">{obj}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick commands to try */}
      <div>
        <h3 className="text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Try these commands</h3>
        <div className="grid grid-cols-1 gap-1">
          {quickCmds.map((cmd, i) => (
            <div key={i} className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700/40 font-mono text-[10px] text-emerald-400/80">
              {cmd}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ScenarioDetail({ scenario, validationResults, onStart, onReset }) {
  const allPassed = validationResults?.length > 0 && validationResults.every(r => r.pass);

  if (scenario.isFreeplay) {
    return <FreeplayDetail scenario={scenario} onStart={onStart} onReset={onReset} />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-white">{scenario.title}</h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{scenario.description}</p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={onStart} className="bg-accent hover:bg-accent/80 text-white text-xs h-7">
          Start Lab
        </Button>
        <Button size="sm" variant="outline" onClick={onReset} className="text-xs h-7 border-border/50 text-slate-400 hover:text-white">
          <RotateCcw className="w-3 h-3 mr-1" /> Reset
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
          <p className="text-xs text-emerald-400 font-medium">✓ Lab Complete! All objectives achieved.</p>
        </div>
      )}

      <CommandGuide commands={scenario.commands} />
    </div>
  );
}