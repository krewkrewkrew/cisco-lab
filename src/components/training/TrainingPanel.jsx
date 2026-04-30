import React, { useState, useMemo } from 'react';
import { scenarios, troubleshootingScenarios, testScenarios, freeplay } from '@/lib/scenarios';
import ScenarioCard from './ScenarioCard';
import ScenarioDetail from './ScenarioDetail';
import TestCard from './TestCard';
import FreeplayCard from './FreeplayCard';
import { createDefaultSwitchState } from '@/lib/switchState';
import { BookOpen, Terminal as TerminalIcon, Wrench, FlaskConical, Search, X, Gamepad2 } from 'lucide-react';
import VlanStatusPanel from './VlanStatusPanel';

const allScenarios = [...scenarios, ...troubleshootingScenarios, ...testScenarios, freeplay];

export default function TrainingPanel({ switchState, onLoadScenario }) {
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [tab, setTab] = useState('config');
  const [labStarted, setLabStarted] = useState(false);
  const [search, setSearch] = useState('');

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
<h2 className="text-sm font-semibold text-slate-200">Training Labs</h2>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Select a scenario to practice Cisco IOS commands</p>
        {/* Search */}
        {!activeScenario && (
          <div className="relative mt-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search labs..."
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded text-[11px] text-slate-300 placeholder-slate-600 py-1 pl-7 pr-6 focus:outline-none focus:border-slate-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
        {/* Tabs */}
        {!activeScenario && !search && (
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
            <button
              onClick={() => setTab('freeplay')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] rounded font-medium transition-colors ${tab === 'freeplay' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Gamepad2 className="w-3 h-3" /> Free
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto terminal-scroll">
        {/* Search results */}
        {!activeScenario && search && (() => {
          const q = search.toLowerCase();
          const matched = allScenarios.filter(s =>
            s.title.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q) ||
            s.objectives?.some(o => o.toLowerCase().includes(q))
          );
          return (
            <div className="p-3 space-y-2">
              {matched.length === 0 && (
                <p className="text-[10px] text-slate-500 text-center py-4">No labs match "{search}"</p>
              )}
              {matched.map(scenario => (
                scenario.category === 'test'
                  ? <TestCard key={scenario.id} scenario={scenario} isActive={activeScenarioId === scenario.id} onClick={() => handleSelectScenario(scenario.id)} />
                  : <ScenarioCard key={scenario.id} scenario={scenario} isActive={activeScenarioId === scenario.id} onClick={() => handleSelectScenario(scenario.id)} />
              ))}
            </div>
          );
        })()}

        {/* Scenario list */}
        {!activeScenario && !search && tab !== 'tests' && (
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
        {!activeScenario && !search && tab === 'tests' && (
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

        {/* Freeplay tab */}
        {!activeScenario && !search && tab === 'freeplay' && (
          <div className="p-3 space-y-3">
            <div className="text-[10px] text-emerald-400/70 bg-emerald-500/5 border border-emerald-500/10 rounded p-2 leading-relaxed">
              A fully pre-configured switch with 4 VLANs, 18 endpoints, trunk uplinks, SSH, and realistic traffic. No objectives — explore freely.
            </div>
            <FreeplayCard
              scenario={freeplay}
              isActive={activeScenarioId === freeplay.id}
              onClick={() => handleSelectScenario(freeplay.id)}
            />
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