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
    validation: (state) => {
      const checks = [
        { label: 'Hostname changed to "MySwitch"', pass: state.hostname === 'MySwitch' },
      ];
      return checks;
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