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
        {/* SRC Branding */}
        <a href="https://www.scires.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 opacity-75 hover:opacity-100 transition-opacity group">
          {/* SRC shield-style logo mark */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="4" fill="#1a4fa0" />
            <text x="14" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="11" fill="white" letterSpacing="0.5">SRC</text>
          </svg>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">Scientific Research</span>
            <span className="text-[8px] text-slate-500 tracking-widest uppercase">Corporation</span>
          </div>
        </a>
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
            <svg width="320" height="120" viewBox="0 0 320 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.055 }}>
              {/* SRC shield/emblem */}
              <circle cx="52" cy="52" r="48" fill="none" stroke="white" strokeWidth="3" />
              <text x="52" y="38" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="30" fill="white" letterSpacing="1">SRC</text>
              <line x1="16" y1="48" x2="88" y2="48" stroke="white" strokeWidth="1.5" />
              <text x="52" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="7" fill="white" letterSpacing="2">SCIENTIFIC RESEARCH</text>
              <text x="52" y="76" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="7" fill="white" letterSpacing="2">CORPORATION</text>
              {/* Full name text beside */}
              <text x="116" y="45" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="36" fill="white" letterSpacing="2">SRC</text>
              <text x="117" y="65" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="11" fill="white" letterSpacing="1.5">SCIENTIFIC RESEARCH</text>
              <text x="117" y="81" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="11" fill="white" letterSpacing="1.5">CORPORATION</text>
            </svg>
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