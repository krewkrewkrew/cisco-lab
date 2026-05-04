import React from 'react';

// Patterns for syntax highlighting
const PATTERNS = [
  // Errors and warnings
  { regex: /(%Error.*|%Warning.*|% Invalid.*|% Incomplete.*|% Ambiguous.*|% Bad.*)/g, className: 'text-red-400' },
  // Success / up states
  { regex: /\b(connected|up|Up|UP|active|Active|ACTIVE|forwarding|Forwarding)\b/g, className: 'text-green-400' },
  // Down / failure states
  { regex: /\b(notconnect|down|Down|DOWN|inactive|Inactive|disabled|Disabled|blocking|Blocking|err-disabled)\b/g, className: 'text-red-400' },
  // Interface names
  { regex: /\b(Gi\d+\/\d+\/\d+|Gi\d+\/\d+|Fa\d+\/\d+|Et\d+\/\d+|Vlan\d+|Po\d+|Loopback\d+|GigabitEthernet\S+|FastEthernet\S+|Ethernet\S+)\b/g, className: 'text-cyan-400' },
  // VLAN IDs
  { regex: /\bVLAN\s*(\d+)\b/gi, className: 'text-yellow-400' },
  // IP addresses
  { regex: /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?:\/\d{1,2})?)\b/g, className: 'text-blue-300' },
  // MAC addresses
  { regex: /\b([0-9a-f]{4}\.[0-9a-f]{4}\.[0-9a-f]{4})\b/gi, className: 'text-purple-400' },
  // Keywords
  { regex: /\b(trunk|access|dynamic|static|native|allowed|shutdown|no shutdown)\b/gi, className: 'text-orange-400' },
  // Numbers (standalone)
  { regex: /\b(\d+)\b/g, className: 'text-slate-300' },
];

function highlightLine(text) {
  // Split into segments with highlight info
  // We'll build an array of {text, className} segments
  const segments = [{ text, className: null }];

  for (const { regex, className } of PATTERNS) {
    const next = [];
    for (const seg of segments) {
      if (seg.className !== null) {
        // Already colored, skip
        next.push(seg);
        continue;
      }
      let lastIndex = 0;
      const str = seg.text;
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(str)) !== null) {
        if (match.index > lastIndex) {
          next.push({ text: str.slice(lastIndex, match.index), className: null });
        }
        next.push({ text: match[0], className });
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < str.length) {
        next.push({ text: str.slice(lastIndex), className: null });
      }
    }
    segments.length = 0;
    segments.push(...next);
  }

  return segments;
}

export default function TerminalOutput({ lines }) {
  return (
    <div className="whitespace-pre-wrap">
      {lines.filter(Boolean).map((line, i) => (
        <div key={i} className="leading-5">
          {line.type === 'input' ? (
            <span>
              <span className="text-primary">{line.prompt}</span>
              <span className="text-primary">{line.text}</span>
            </span>
          ) : line.type === 'boot' ? (
            <span className="text-primary/70">{line.text}</span>
          ) : (
            <span>
              {highlightLine(line.text || '').map((seg, j) => (
                <span key={j} className={seg.className || 'text-primary/90'}>{seg.text}</span>
              ))}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}