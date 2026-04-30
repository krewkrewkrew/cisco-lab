import React, { useState, useCallback } from 'react';
import Terminal from '@/components/terminal/Terminal';
import StatusBar from '@/components/terminal/StatusBar';
import TrainingPanel from '@/components/training/TrainingPanel';
import { createDefaultSwitchState } from '@/lib/switchState';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function Simulator() {
  const [switchState, setSwitchState] = useState(createDefaultSwitchState);
  const [mode, setMode] = useState('user');
  const [currentInterface, setCurrentInterface] = useState(null);
  const [externalState, setExternalState] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const handleStateChange = useCallback((newState) => {
    setSwitchState(newState);
  }, []);

  const handleModeChange = useCallback((newMode, newInterface) => {
    setMode(newMode);
    setCurrentInterface(newInterface);
  }, []);

  const handleLoadScenario = useCallback((state) => {
    setExternalState({ ...state, _ts: Date.now() });
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#0D1117' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/60" style={{ backgroundColor: '#060a12' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="h-4 w-px bg-slate-700/50" />
          <span className="text-xs text-slate-400 font-mono">cisco-ios-simulator</span>
        </div>

        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1"
        >
          {panelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Terminal area */}
        <div className={`flex flex-col transition-all duration-300 relative ${panelOpen ? 'w-[70%]' : 'w-full'}`}>
          {/* SRC watermark logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <img
              src="https://media.base44.com/images/public/69f216b16981978d3ddba26a/f9ebb8e3c_src_logo.png"
              alt=""
              className="w-80 select-none"
              style={{ opacity: 0.35 }}
            />
          </div>
          <div className="flex-1 overflow-hidden relative z-10">
            <Terminal
              onStateChange={handleStateChange}
              onModeChange={handleModeChange}
              externalState={externalState}
            />
          </div>
          <StatusBar
            hostname={switchState.hostname}
            mode={mode}
            currentInterface={currentInterface}
          />
        </div>

        {/* Training panel */}
        {panelOpen && (
          <div className="w-[30%] border-l border-slate-800/60 overflow-hidden">
            <TrainingPanel
              switchState={switchState}
              onLoadScenario={handleLoadScenario}
            />
          </div>
        )}
      </div>
    </div>
  );
}