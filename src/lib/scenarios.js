import { createDefaultSwitchState } from './switchState';

export const scenarios = [
  {
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
    hints: [
      'Start by typing "enable" to enter Privileged EXEC mode',
      'Use "configure terminal" or "conf t" to enter config mode',
      'Use "hostname MySwitch" to change the name',
      'Type "end" to return to Privileged EXEC',
      'Use "show running-config" to verify your changes',
    ],
    commands: [
      { cmd: 'enable', why: 'Moves from User EXEC (Switch>) to Privileged EXEC (Switch#). You need this before making any configuration changes.' },
      { cmd: 'configure terminal', why: 'Enters Global Configuration mode (Switch(config)#). All device-wide settings are changed from here.' },
      { cmd: 'hostname MySwitch', why: 'Changes the switch\'s display name. The prompt immediately updates to reflect the new hostname.' },
      { cmd: 'end', why: 'Jumps directly back to Privileged EXEC from any config mode. Equivalent to pressing Ctrl+Z on a real switch.' },
      { cmd: 'show running-config', why: 'Displays the current active configuration in RAM. Use this to verify every change you make.' },
    ],
    validation: (state) => {
      return [
        { label: 'Enter Privileged EXEC mode using "enable"', pass: !!state.visitedPrivileged },
        { label: 'Enter Global Configuration mode using "configure terminal"', pass: !!state.visitedGlobalConfig },
        { label: 'Change the hostname to "MySwitch"', pass: state.hostname?.toLowerCase() === 'myswitch' },
        { label: 'Return to Privileged EXEC mode using "end"', pass: !!state.returnedToPrivileged },
        { label: 'View the running configuration', pass: !!state.viewedRunningConfig },
      ];
    },
    initialState: null, // Use default
  },
  {
    id: 'vlan-config',
    title: 'VLAN Configuration',
    difficulty: 'Intermediate',
    duration: '15 min',
    description: 'Create VLANs and assign ports to different VLANs for network segmentation.',
    objectives: [
      'Create VLAN 10 and name it "SALES"',
      'Create VLAN 20 and name it "ENGINEERING"',
      'Assign FastEthernet0/1 through Fa0/6 to VLAN 10',
      'Assign FastEthernet0/7 through Fa0/12 to VLAN 20',
      'Verify with "show vlan brief"',
    ],
    hints: [
      'Enter config mode, then use "vlan 10" to create a VLAN',
      'Use "name SALES" inside VLAN config mode',
      'Use "interface fa0/1" then "switchport access vlan 10"',
      'Repeat for each port or range',
      'Use "show vlan brief" to verify assignments',
    ],
    commands: [
      { cmd: 'enable', why: 'Enter Privileged EXEC mode first.' },
      { cmd: 'configure terminal', why: 'Enter Global Configuration mode to start making changes.' },
      { cmd: 'vlan 10', why: 'Creates VLAN 10 and enters VLAN config mode. VLANs are how you segment a switch into isolated broadcast domains.' },
      { cmd: 'name SALES', why: 'Assigns a human-readable name to VLAN 10 so you can identify it in show commands.' },
      { cmd: 'vlan 20', why: 'Creates VLAN 20 for the Engineering team.' },
      { cmd: 'name ENGINEERING', why: 'Names VLAN 20. Exit back to Global Config automatically after naming.' },
      { cmd: 'interface FastEthernet0/1', why: 'Enters interface configuration mode for port Fa0/1 so you can assign it to a VLAN.' },
      { cmd: 'switchport access vlan 10', why: 'Assigns this port to VLAN 10. Any device plugged in here will be on the SALES network.' },
      { cmd: 'show vlan brief', why: 'Confirms which ports belong to which VLANs. Run this after every assignment to verify.' },
    ],
    validation: (state) => {
      const checks = [
        { label: 'VLAN 10 exists with name "SALES"', pass: state.vlans[10]?.name === 'SALES' },
        { label: 'VLAN 20 exists with name "ENGINEERING"', pass: state.vlans[20]?.name === 'ENGINEERING' },
        { label: 'Fa0/1 assigned to VLAN 10', pass: state.interfaces['FastEthernet0/1']?.accessVlan === 10 },
        { label: 'Fa0/7 assigned to VLAN 20', pass: state.interfaces['FastEthernet0/7']?.accessVlan === 20 },
      ];
      return checks;
    },
    initialState: null,
  },
  {
    id: 'trunk-config',
    title: 'Trunk Port Configuration',
    difficulty: 'Intermediate',
    duration: '10 min',
    description: 'Configure trunk ports on the GigabitEthernet uplinks for inter-switch VLAN traffic.',
    objectives: [
      'Create VLAN 10 (SALES) and VLAN 20 (ENGINEERING)',
      'Configure GigabitEthernet0/1 as a trunk port',
      'Configure GigabitEthernet0/2 as a trunk port',
      'Add descriptions to both trunk interfaces',
      'Verify with "show running-config"',
    ],
    hints: [
      'First create the VLANs in config mode',
      'Enter interface config: "interface gi0/1"',
      'Set trunk mode: "switchport mode trunk"',
      'Add description: "description Uplink to Core Switch"',
    ],
    commands: [
      { cmd: 'enable', why: 'Enter Privileged EXEC mode.' },
      { cmd: 'configure terminal', why: 'Enter Global Configuration mode.' },
      { cmd: 'vlan 10', why: 'Create VLAN 10 — trunk ports carry all VLANs, so they must exist first.' },
      { cmd: 'name SALES', why: 'Name VLAN 10 for clarity.' },
      { cmd: 'vlan 20', why: 'Create VLAN 20.' },
      { cmd: 'name ENGINEERING', why: 'Name VLAN 20.' },
      { cmd: 'interface GigabitEthernet0/1', why: 'GigabitEthernet ports are typically used for uplinks because of their higher bandwidth.' },
      { cmd: 'switchport mode trunk', why: 'A trunk port carries traffic for multiple VLANs simultaneously using 802.1Q tagging. Access ports carry only one VLAN.' },
      { cmd: 'description Uplink to Core Switch', why: 'Always document trunk ports so future admins know what is connected.' },
    ],
    validation: (state) => {
      return [
        { label: 'VLAN 10 exists', pass: !!state.vlans[10] },
        { label: 'VLAN 20 exists', pass: !!state.vlans[20] },
        { label: 'Gi0/1 is trunk', pass: state.interfaces['GigabitEthernet0/1']?.switchportMode === 'trunk' },
        { label: 'Gi0/2 is trunk', pass: state.interfaces['GigabitEthernet0/2']?.switchportMode === 'trunk' },
        { label: 'Gi0/1 has description', pass: !!state.interfaces['GigabitEthernet0/1']?.description },
        { label: 'Gi0/2 has description', pass: !!state.interfaces['GigabitEthernet0/2']?.description },
      ];
    },
    initialState: null,
  },
  {
    id: 'interface-management',
    title: 'Interface Management',
    difficulty: 'Beginner',
    duration: '10 min',
    description: 'Practice enabling, disabling, and configuring switch interfaces.',
    objectives: [
      'Shut down interfaces Fa0/20 through Fa0/24 (unused ports)',
      'Add a description to Fa0/1: "Server Room Link"',
      'Set Gi0/1 description to "Uplink to Router"',
      'Verify with "show ip interface brief"',
    ],
    hints: [
      'Enter interface config mode for each interface',
      'Use "shutdown" to disable a port',
      'Use "description Server Room Link" to add descriptions',
      'Use "show ip interface brief" to check status',
    ],
    commands: [
      { cmd: 'enable', why: 'Enter Privileged EXEC mode.' },
      { cmd: 'configure terminal', why: 'Enter Global Configuration mode.' },
      { cmd: 'interface FastEthernet0/20', why: 'Target the first unused port you want to shut down.' },
      { cmd: 'shutdown', why: 'Administratively disables the port. Best practice: always shut down unused ports to prevent unauthorized access.' },
      { cmd: 'interface FastEthernet0/1', why: 'Move to the port connected to the server room.' },
      { cmd: 'description Server Room Link', why: 'Labels this port in the config and show commands. Essential for troubleshooting in a real network.' },
      { cmd: 'show ip interface brief', why: 'Compact table showing every interface, its IP (if any), and its up/down status. The fastest way to see overall port health.' },
    ],
    validation: (state) => {
      return [
        { label: 'Fa0/20 is shutdown', pass: state.interfaces['FastEthernet0/20']?.status === 'down' },
        { label: 'Fa0/24 is shutdown', pass: state.interfaces['FastEthernet0/24']?.status === 'down' },
        { label: 'Fa0/1 has description', pass: state.interfaces['FastEthernet0/1']?.description === 'Server Room Link' },
        { label: 'Gi0/1 has description', pass: state.interfaces['GigabitEthernet0/1']?.description === 'Uplink to Router' },
      ];
    },
    initialState: null,
  },
  {
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
    hints: [
      'Make your changes in config mode first',
      'Return to privileged EXEC mode',
      'Use "copy running-config startup-config" or "write memory"',
      'Verify with "show startup-config"',
    ],
    commands: [
      { cmd: 'enable', why: 'Enter Privileged EXEC mode.' },
      { cmd: 'configure terminal', why: 'Enter Global Configuration mode.' },
      { cmd: 'hostname LabSwitch', why: 'Change the hostname as required by the lab.' },
      { cmd: 'vlan 100', why: 'Create VLAN 100 for the management network.' },
      { cmd: 'name MANAGEMENT', why: 'Name VLAN 100. The management VLAN is used for remote switch administration.' },
      { cmd: 'end', why: 'Return to Privileged EXEC. You must be in Privileged EXEC to save the configuration.' },
      { cmd: 'copy running-config startup-config', why: 'Saves the running config (in RAM) to startup config (in NVRAM). Without this, all changes are lost when the switch reboots.' },
      { cmd: 'show startup-config', why: 'Confirms what will be loaded on the next reboot. Always verify after saving.' },
    ],
    validation: (state) => {
      return [
        { label: 'Hostname is "LabSwitch"', pass: state.hostname === 'LabSwitch' },
        { label: 'VLAN 100 exists', pass: !!state.vlans[100] },
        { label: 'Config saved', pass: !!state.startupConfig },
      ];
    },
    initialState: null,
  },
];