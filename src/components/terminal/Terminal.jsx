import React, { useState, useRef, useEffect, useCallback } from 'react';
import TerminalOutput from './TerminalOutput';
import TerminalInput from './TerminalInput';
import { bootLines } from '@/lib/bootBanner';
import { executeCommand, tabComplete, getPrompt } from '@/lib/commandParser';
import { createDefaultSwitchState } from '@/lib/switchState';

export default function Terminal({ onStateChange, onModeChange, externalState }) {
  const [outputLines, setOutputLines] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [mode, setMode] = useState('user');
  const [switchState, setSwitchState] = useState(createDefaultSwitchState);
  const [currentInterface, setCurrentInterface] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [booted, setBooted] = useState(false);
  const scrollRef = useRef(null);

  // Boot sequence
  useEffect(() => {
    const lines = bootLines.map(text => ({ type: 'boot', text }));
    let index = 0;
    const timer = setInterval(() => {
      if (index < lines.length) {
        setOutputLines(prev => [...prev, lines[index]]);
        index++;
      } else {
        clearInterval(timer);
        setBooted(true);
      }
    }, 25);
    return () => clearInterval(timer);
  }, []);

  // Handle external state reset (from scenarios)
  useEffect(() => {
    if (externalState) {
      setSwitchState(externalState);
      setMode('user');
      setCurrentInterface(null);
      setOutputLines([{ type: 'output', text: '\n--- Switch state reset for scenario ---\n' }]);
      setCommandHistory([]);
      setHistoryIndex(-1);
      setBooted(true);
    }
  }, [externalState]);

  // Propagate state changes
  useEffect(() => {
    onStateChange?.(switchState);
  }, [switchState, onStateChange]);

  // Propagate mode changes
  useEffect(() => {
    onModeChange?.(mode, currentInterface);
  }, [mode, currentInterface, onModeChange]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [outputLines, currentInput]);

  const prompt = getPrompt(switchState.hostname, mode, currentInterface);

  const handleSubmit = useCallback(() => {
    const input = currentInput;
    
    // Add input line to output
    setOutputLines(prev => [...prev, { type: 'input', prompt: prompt, text: input }]);

    if (input.trim()) {
      setCommandHistory(prev => [...prev, input]);
      setHistoryIndex(-1);

      const result = executeCommand(input, switchState, mode, currentInterface, commandHistory);

      if (result.output) {
        const outputTextLines = result.output.split('\n').map(text => ({ type: 'output', text }));
        setOutputLines(prev => [...prev, ...outputTextLines]);
      }

      if (result.newState) setSwitchState(result.newState);
      if (result.newMode) setMode(result.newMode);
      if (result.newCurrentInterface !== undefined) setCurrentInterface(result.newCurrentInterface);
    }

    setCurrentInput('');
  }, [currentInput, switchState, mode, currentInterface, commandHistory, prompt]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const completed = tabComplete(currentInput, mode);
      setCurrentInput(completed);
    }
  }, [commandHistory, historyIndex, currentInput, mode]);

  const handleContainerClick = () => {
    // Focus the input when clicking anywhere in the terminal
    const input = scrollRef.current?.querySelector('input');
    input?.focus();
  };

  return (
    <div
      ref={scrollRef}
      onClick={handleContainerClick}
      className="h-full overflow-y-auto terminal-scroll p-4 font-mono text-sm cursor-text"
      style={{ backgroundColor: '#0D1117' }}
    >
      <TerminalOutput lines={outputLines} />
      {booted && (
        <TerminalInput
          prompt={prompt}
          value={currentInput}
          onChange={setCurrentInput}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
        />
      )}
    </div>
  );
}