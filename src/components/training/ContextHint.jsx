import React, { useState } from 'react';
import { Zap, X, Copy, Check } from 'lucide-react';

/**
 * Derives a context-aware hint for the first failing objective.
 * Maps the failing objective text to relevant commands from the command guide.
 */
function deriveHint(scenario, validationResults) {
  if (!validationResults || !scenario) return null;

  // Find index of first failing objective
  const failIdx = validationResults.findIndex(r => !r.pass);
  if (failIdx === -1) return null;

  const failingLabel = validationResults[failIdx].label;

  // Try to match failing label keywords to command guide entries
  const label = failingLabel.toLowerCase();
  const candidates = (scenario.commands || []).filter(({ cmd, why }) => {
    const c = cmd.toLowerCase();
    const w = why.toLowerCase();
    // Match against common keywords derived from the objective label
    if (label.includes('shutdown') || label.includes('shut down')) {
      return c === 'shutdown' || c === 'no shutdown';
    }
    if (label.includes('no shutdown') || label.includes('back up') || label.includes('come up')) {
      return c === 'no shutdown';
    }
    if (label.includes('vlan 10') && label.includes('sales')) return c === 'name sales' || c === 'vlan 10';
    if (label.includes('vlan 20') && label.includes('engineering')) return c === 'name engineering' || c === 'vlan 20';
    if (label.includes('vlan 10') && !label.includes('sales')) return c === 'vlan 10' || c.startsWith('switchport access vlan 10');
    if (label.includes('vlan 20') && !label.includes('engineering')) return c === 'vlan 20' || c.startsWith('switchport access vlan 20');
    if (label.includes('vlan 100')) return c === 'vlan 100' || c === 'name management';
    if (label.includes('hostname')) return c.startsWith('hostname');
    if (label.includes('trunk')) return c === 'switchport mode trunk';
    if (label.includes('native vlan')) return c.startsWith('switchport trunk native vlan');
    if (label.includes('description')) return c.startsWith('description');
    if (label.includes('ip address') || label.includes('ip configured')) return c.startsWith('ip address');
    if (label.includes('default gateway')) return c.startsWith('ip default-gateway');
    if (label.includes('vty password') || label.includes('password')) return c.startsWith('password');
    if (label.includes('vty login') || label.includes('login')) return c === 'login';
    if (label.includes('enable secret')) return c.startsWith('enable secret');
    if (label.includes('cdp')) return c === 'no cdp run';
    if (label.includes('saved') || label.includes('config saved')) return c === 'copy running-config startup-config' || c === 'write memory';
    if (label.includes('running')) return c === 'show running-config';
    if (label.includes('interface brief') || label.includes('viewedinterfacebrief')) return c === 'show ip interface brief';
    // Fallback: check if any command why-text matches words from the label
    const words = label.split(/\s+/).filter(w => w.length > 4);
    return words.some(word => w.includes(word) || c.includes(word));
  });

  // Pick the most relevant candidate — prefer config commands over show commands
  const best = candidates.find(c => !c.cmd.startsWith('show') && !c.cmd.startsWith('exit') && !c.cmd.startsWith('end') && !c.cmd.startsWith('enable') && !c.cmd.startsWith('configure'))
    || candidates[0];

  if (!best) {
    // Generic nudge based on the objective text
    return { objective: failingLabel, cmd: null, tip: `Focus on: "${failingLabel}". Check the Command Guide above for the exact syntax.` };
  }

  return { objective: failingLabel, cmd: best.cmd, tip: best.why };
}

export default function ContextHint({ scenario, validationResults }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const hint = deriveHint(scenario, validationResults);

  // Don't render if all passed or no hint available
  const allPassed = validationResults?.length > 0 && validationResults.every(r => r.pass);
  if (allPassed || !hint) return null;

  const handleCopy = () => {
    if (!hint.cmd) return;
    navigator.clipboard.writeText(hint.cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      {!visible ? (
        <button
          onClick={() => setVisible(true)}
          className="flex items-center gap-1.5 text-xs text-amber-500/70 hover:text-amber-400 transition-colors"
        >
          <Zap className="w-3 h-3" />
          <span>Get a hint for current objective</span>
        </button>
      ) : (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
              <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">Stuck on</span>
            </div>
            <button onClick={() => setVisible(false)} className="text-slate-600 hover:text-slate-400 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed italic pl-4 border-l border-amber-500/30">
            "{hint.objective}"
          </p>

          <p className="text-[11px] text-slate-400 leading-relaxed">{hint.tip}</p>

          {hint.cmd && (
            <div className="flex items-center justify-between gap-2 rounded bg-slate-900/80 border border-slate-800 px-2 py-1.5">
              <code className="text-[11px] text-primary font-mono">{hint.cmd}</code>
              <button
                onClick={handleCopy}
                className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors"
                title="Copy command"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}