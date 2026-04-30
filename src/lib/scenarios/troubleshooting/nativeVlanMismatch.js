import { createDefaultSwitchState } from '../../switchState';

export default {
  id: 'ts-duplicate-vlan',
  title: 'Native VLAN Mismatch',
  category: 'troubleshooting',
  difficulty: 'Advanced',
  duration: '20 min',
  description: 'Spanning tree is logging native VLAN mismatch errors on the Gi0/1 trunk. The trunk is configured but the native VLAN is set to 99 on one side. Fix the native VLAN to match the default (VLAN 1).',
  objectives: [
    'Correct the native VLAN on Gi0/1 back to VLAN 1',
  ],
  hints: [
    '"show interfaces trunk" shows native VLAN per port in the first section',
    'The native VLAN must match on both ends of a trunk link',
    'Fix with: "switchport trunk native vlan 1" on the interface',
    'Or remove the override: "no switchport trunk native vlan" to reset to default',
  ],
  commands: [
    { cmd: 'show interfaces trunk', why: 'The "Native vlan" column reveals the mismatch — Gi0/1 shows 99, Gi0/2 shows 1. This causes STP errors and unexpected flooding.' },
    { cmd: 'show running-config', why: 'Confirms "switchport trunk native vlan 99" is explicitly set on Gi0/1.' },
    { cmd: 'enable', why: 'Enter Privileged EXEC mode.' },
    { cmd: 'configure terminal', why: 'Enter Global Configuration mode.' },
    { cmd: 'interface GigabitEthernet0/1', why: 'Enter the misconfigured trunk interface.' },
    { cmd: 'switchport trunk native vlan 1', why: 'Resets the native VLAN to 1 (the default). Both ends of a trunk must use the same native VLAN.' },
    { cmd: 'end', why: 'Return to Privileged EXEC mode.' },
    { cmd: 'show interfaces trunk', why: 'Verify the Native vlan column on Gi0/1 now shows 1, matching Gi0/2.' },
  ],
  validation: (state) => [
    { label: 'Gi0/1 native VLAN corrected to 1', pass: (state.interfaces['GigabitEthernet0/1']?.nativeVlan ?? 1) === 1 },
  ],
  initialState: (() => {
    const base = createDefaultSwitchState();
    return {
      ...base,
      vlans: { ...base.vlans, 10: { id: 10, name: 'DATA', status: 'active', ports: [] }, 20: { id: 20, name: 'VOICE', status: 'active', ports: [] } },
      interfaces: {
        ...base.interfaces,
        'GigabitEthernet0/1': { ...base.interfaces['GigabitEthernet0/1'], switchportMode: 'trunk', nativeVlan: 99 },
        'GigabitEthernet0/2': { ...base.interfaces['GigabitEthernet0/2'], switchportMode: 'trunk', nativeVlan: 1 },
      },
    };
  })(),
};