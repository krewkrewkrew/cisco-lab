import React, { useState, useEffect } from 'react';
import { Wifi, HardDrive, Clock } from 'lucide-react';

const modeLabels = {
  user: 'User EXEC',
  privileged: 'Privileged EXEC',
  globalConfig: 'Global Config',
  interfaceConfig: 'Interface Config',
  vlanConfig: 'VLAN Config',
  lineConfig: 'Line Config',
};

export default function StatusBar({ hostname, mode, currentInterface }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-1.5 border-t border-slate-800/80 text-[10px]" style={{ backgroundColor: '#060a12' }}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">{hostname}</span>
        </div>
        <div className="flex items-center gap-1.5 text-accent">
          <HardDrive className="w-3 h-3" />
          <span>{modeLabels[mode] || mode}</span>
        </div>
        {currentInterface && (
          <div className="flex items-center gap-1.5 text-amber-400">
            <Wifi className="w-3 h-3" />
            <span>{currentInterface}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-slate-500">
        <Clock className="w-3 h-3" />
        <span>{time.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}