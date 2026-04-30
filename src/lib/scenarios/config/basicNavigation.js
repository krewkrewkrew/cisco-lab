export default {
  id: 'basic-navigation',
  title: 'CLI Navigation Basics',
  difficulty: 'Beginner',
  duration: '10 min',
  description: 'Learn to navigate between CLI modes: User EXEC, Privileged EXEC, and Global Configuration mode.',
  objectives: [
    'Enter Privileged EXEC mode using "enable"',
    'Enter Global Configuration mode using "configure terminal"',
    'Change the hostname to "MySwitch"',
    'Return to Privileged EXEC mode using "end"',
    'View the running configuration',
  ],
  commands: [
    { cmd: 'enable', why: 'Moves from User EXEC (Switch>) to Privileged EXEC (Switch#). You must do this before entering configuration mode.' },
    { cmd: 'configure terminal', why: 'Enters Global Configuration mode (Switch(config)#). All device-wide settings are made from here.' },
    { cmd: 'hostname MySwitch', why: 'Changes the switch display name. The prompt immediately updates to MySwitch(config)#.' },
    { cmd: 'end', why: 'Jumps directly back to Privileged EXEC from any config mode. Equivalent to pressing Ctrl+Z on a real switch.' },
    { cmd: 'show running-config', why: 'Displays the active configuration in RAM. Verify the hostname line now reads "hostname MySwitch".' },
  ],
  validation: (state) => [
    { label: 'Enter Privileged EXEC mode using "enable"', pass: !!state.visitedPrivileged },
    { label: 'Enter Global Configuration mode using "configure terminal"', pass: !!state.visitedGlobalConfig },
    { label: 'Change the hostname to "MySwitch"', pass: state.hostname?.toLowerCase() === 'myswitch' },
    { label: 'Return to Privileged EXEC mode using "end"', pass: !!state.returnedToPrivileged },
    { label: 'View the running configuration', pass: !!state.viewedRunningConfig },
  ],
  initialState: null,
};