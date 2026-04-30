export default {
  id: 'save-config',
  title: 'Save Configuration',
  difficulty: 'Beginner',
  duration: '5 min',
  description: 'Learn to save the running configuration to startup configuration.',
  objectives: [
    'Change the hostname to "LabSwitch"',
    'Create VLAN 100 named "MANAGEMENT"',
    'Save the configuration using "copy running-config startup-config"',
    'Verify with "show startup-config"',
  ],
  commands: [
    { cmd: 'enable', why: 'Enter Privileged EXEC mode.' },
    { cmd: 'configure terminal', why: 'Enter Global Configuration mode.' },
    { cmd: 'hostname LabSwitch', why: 'Change the hostname as required by the lab.' },
    { cmd: 'vlan 100', why: 'Create VLAN 100 for the management network.' },
    { cmd: 'name MANAGEMENT', why: 'Name VLAN 100. The management VLAN is used for remote switch administration.' },
    { cmd: 'end', why: 'Return to Privileged EXEC. You must NOT be in config mode to run copy commands.' },
    { cmd: 'copy running-config startup-config', why: 'Saves the running config (in RAM) to startup config (in NVRAM). Without this, all changes are lost on reboot.' },
    { cmd: 'show startup-config', why: 'Confirms what will be loaded on the next reboot. Always verify after saving.' },
  ],
  validation: (state) => [
    { label: 'Hostname is "LabSwitch"', pass: state.hostname === 'LabSwitch' },
    { label: 'VLAN 100 exists', pass: !!state.vlans[100] },
    { label: 'Config saved', pass: !!state.startupConfig },
  ],
  initialState: null,
};