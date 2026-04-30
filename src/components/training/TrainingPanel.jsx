import React, { useState, useMemo } from 'react';
import { scenarios, troubleshootingScenarios, testScenarios } from '@/lib/scenarios';
import ScenarioCard from './ScenarioCard';
import ScenarioDetail from './ScenarioDetail';
import TestCard from './TestCard';
import { createDefaultSwitchState } from '@/lib/switchState';
import { BookOpen, Terminal as TerminalIcon, Wrench, FlaskConical } from 'lucide-react';
import VlanStatusPanel from './VlanStatusPanel';

const allScenarios = [...scenarios, ...troubleshootingScenarios, ...testScenarios];

export default function TrainingPanel({ switchState, onLoadScenario }) {
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [tab, setTab] = useState('config');
  const [labStarted, setLabStarted] = useState(false);

  const activeScenario = allScenarios.find(s => s.id === activeScenarioId);

  const validationResults = useMemo(() => {
    if (!activeScenario || !switchState || !labStarted) return null;
    return activeScenario.validation(switchState);
  }, [activeScenario, switchState, labStarted]);

  const handleStart = () => {
    if (!activeScenario) return;
    const state = activeScenario.initialState || createDefaultSwitchState();
    onLoadScenario(state);
    setLabStarted(true);
  };

  const handleReset = () => {
    const state = createDefaultSwitchState();
    onLoadScenario(state);
    setActiveScenarioId(null);
    setLabStarted(false);
  };

  const handleSelectScenario = (id) => {
    setActiveScenarioId(id);
    setLabStarted(false);
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#0a0f1a' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-slate-200">Training Labs</h2>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Select a scenario to practice Cisco IOS commands</p>
        {/* Tabs */}
        {!activeScenario && (
          <div className="flex mt-2 gap-1">
            <button
              onClick={() => setTab('config')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] rounded font-medium transition-colors ${tab === 'config' ? 'bg-accent/20 text-accent' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <BookOpen className="w-3 h-3" /> Config
            </button>
            <button
              onClick={() => setTab('troubleshoot')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] rounded font-medium transition-colors ${tab === 'troubleshoot' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Wrench className="w-3 h-3" /> Diagnose
            </button>
            <button
              onClick={() => setTab('tests')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] rounded font-medium transition-colors ${tab === 'tests' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <FlaskConical className="w-3 h-3" /> Tests
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto terminal-scroll">
        {/* Scenario list */}
        {!activeScenario && tab !== 'tests' && (
          <div className="p-3 space-y-2">
            {(tab === 'config' ? scenarios : troubleshootingScenarios).map(scenario => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                isActive={activeScenarioId === scenario.id}
                onClick={() => handleSelectScenario(scenario.id)}
              />
            ))}
          </div>
        )}

        {/* Test list */}
        {!activeScenario && tab === 'tests' && (
          <div className="p-3 space-y-2">
            <div className="text-[10px] text-purple-400/70 bg-purple-500/5 border border-purple-500/10 rounded p-2 leading-relaxed">
              Real-world exam scenarios combining multiple skills. No guided steps — diagnose and configure from scratch.
            </div>
            {testScenarios.map(scenario => (
              <TestCard
                key={scenario.id}
                scenario={scenario}
                isActive={activeScenarioId === scenario.id}
                onClick={() => handleSelectScenario(scenario.id)}
              />
            ))}
          </div>
        )}

        {/* Active scenario detail */}
        {activeScenario && (
          <div className="p-4">
            <button
              onClick={() => { setActiveScenarioId(null); setLabStarted(false); }}
              className="text-[10px] text-slate-500 hover:text-slate-300 mb-3 flex items-center gap-1"
            >
              ← Back to scenarios
            </button>
            <ScenarioDetail
              scenario={activeScenario}
              validationResults={validationResults}
              onStart={handleStart}
              onReset={handleReset}
            />
          </div>
        )}
      </div>

      {/* VLAN Status */}
      <VlanStatusPanel switchState={switchState} />

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
          <TerminalIcon className="w-3 h-3" />
          <span>Cisco IOS Simulator v1.0</span>
        </div>
      </div>
    </div>
  );
}