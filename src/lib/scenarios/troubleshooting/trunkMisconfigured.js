import { createDefaultSwitchState } from '../../switchState';

export default {
  id: 'ts-trunk-misconfigured',
  title: 'Trunk Link Not Carrying VLANs',
  category: 'troubleshooting',
  difficulty: 'Intermediate',
  duration: '15 min',
  description: 'Inter-VLAN traffic between switches is broken. Gi0/1 is set to access mode instead of trunk, and VLAN 10 and 20 are missing. Diagnose and fix the uplink.',
  objectives: [
    'Use "show interfaces trunk" to confirm no trunks are active',
    'Use "show interfaces Gi0/1 switchport" to see the misconfiguration',
    'Create VLAN 10 and VLAN 20',
    'Configure Gi0/1 as a trunk port',
    'Configure Gi0/2 as a trunk port',
    'Verify with "show interfaces trunk"',
  ],
  hints: [
    '"show interfaces trunk" shows only trunk ports — if it\'s empty, no trunks are configured',
    '"show ip interface brief" shows both Gi ports are up but not trunking',
    'Create VLANs first so the trunk has something to carry',
    'Set "switchport mode trunk" on each uplink interface',
  ],
  commands: [
    { cmd: 'show interfaces trunk', why: 'If this output is empty, no trunk ports exist — all inter-VLAN traffic between switches is blocked.' },
    { cmd: 'show ip interface brief', why: 'Confirms both Gi ports are physically up but not configured as trunks.' },
    { cmd: 'enable', why: 'Enter Privileged EXEC mode.' },
    { cmd: 'configure terminal', why: 'Enter Global Configuration mode.' },
    { cmd: 'vlan 10', why: 'Create VLAN 10 — trunks carry VLANs that exist on the switch.' },
    { cmd: 'name DATA', why: 'Name VLAN 10 for clarity.' },
    { cmd: 'exit', why: 'Return to Global Configuration mode.' },
    { cmd: 'vlan 20', why: 'Create VLAN 20.' },
    { cmd: 'name VOICE', why: 'Name VLAN 20.' },
    { cmd: 'exit', why: 'Return to Global Configuration mode.' },
    { cmd: 'interface GigabitEthernet0/1', why: 'Enter the first uplink interface.' },
    { cmd: 'switchport mode trunk', why: 'Converts the port from access to trunk mode, allowing it to carry all VLANs.' },
    { cmd: 'exit', why: 'Return to Global Configuration mode.' },
    { cmd: 'interface GigabitEthernet0/2', why: 'Enter the second uplink interface.' },
    { cmd: 'switchport mode trunk', why: 'Configure Gi0/2 as a trunk as well.' },
    { cmd: 'end', why: 'Return to Privileged EXEC mode.' },
    { cmd: 'show interfaces trunk', why: 'Verify both Gi0/1 and Gi0/2 now appear in the trunk table.' },
  ],
  validation: (state) => [
    { label: 'VLAN 10 created', pass: !!state.vlans[10] },
    { label: 'VLAN 20 created', pass: !!state.vlans[20] },
    { label: 'Gi0/1 is configured as trunk', pass: state.interfaces['GigabitEthernet0/1']?.switchportMode === 'trunk' },
    { label: 'Gi0/2 is configured as trunk', pass: state.interfaces['GigabitEthernet0/2']?.switchportMode === 'trunk' },
  ],
  initialState: (() => {
    const base = createDefaultSwitchState();
    return {
      ...base,
      interfaces: {
        ...base.interfaces,
        'GigabitEthernet0/1': { ...base.interfaces['GigabitEthernet0/1'], switchportMode: 'access' },
        'GigabitEthernet0/2': { ...base.interfaces['GigabitEthernet0/2'], switchportMode: 'access' },
      },
    };
  })(),
};