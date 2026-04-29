import React from 'react';
import { Network } from 'lucide-react';

const statusColors = {
  active: 'text-emerald-400',
  'act/unsup': 'text-slate-500',
  suspend: 'text-amber-400',
};

export default function VlanStatusPanel({ switchState }) {
  if (!switchState) return null;

  const vlans = Object.values(switchState.vlans).sort((a, b) => a.id - b.id);

  // Count ports per VLAN
  const portCounts = {};
  Object.values(switchState.interfaces).forEach(iface => {
    if (iface.switchportMode === 'access' && iface.name !== 'Vlan1') {
      const vid = iface.accessVlan;
      portCounts[vid] = (portCounts[vid] || 0) + 1;
    }
  });

  return (
    <div className="border-t border-slate-800/80 px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Network className="w-3.5 h-3.5 text-accent" />
        <span className="text-[11px] font-semibold text-slate-300">VLAN Status</span>
      </div>
      <div className="space-y-1">
        {vlans.map(vlan => (
          <div key={vlan.id} className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-slate-500 w-10 shrink-0">
                {String(vlan.id).padStart(4, '0')}
              </span>
              <span className="text-slate-300 truncate">{vlan.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-slate-600">{portCounts[vlan.id] || 0}p</span>
              <span className={statusColors[vlan.status] || 'text-slate-400'}>
                {vlan.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}