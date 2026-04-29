import React from 'react';

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
            <span className="text-primary/90">{line.text}</span>
          )}
        </div>
      ))}
    </div>
  );
}