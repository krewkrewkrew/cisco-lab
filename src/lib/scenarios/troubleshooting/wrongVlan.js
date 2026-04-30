import { createDefaultSwitchState } from '../../switchState';

export default {
  id: 'ts-wrong-vlan',
  title: 'Device on Wrong VLAN',
  category: 'troubleshooting',
  difficulty: 'Intermediate',
  duration: '15 min',
  description: "A workstation on Fa0/4 is on VLAN 99 (which doesn't exist), so it can't communicate. Fix the port assignment and verify connectivity.",
  objectives: [
    'Create VLAN 10 named "OFFICE"',
    'Move Fa0/4 to VLAN 10',
    'Confirm Fa0/4 is no longer on VLAN 99',
  ],
  commands: [
    { cmd: 'show vlan brief', why: "First look — lists all VLANs and their port members. Fa0/4 will NOT appear here because VLAN 99 does not exist." },
    { cmd: 'show ip interface brief', why: "Shows Fa0/4 line protocol is down — a dead giveaway that its assigned VLAN doesn't exist." },
    { cmd: 'show interfaces FastEthernet0/4 switchport', why: "Detailed switchport info for Fa0/4 — confirms the Access Mode VLAN is 99 and that VLAN does not exist." },
    { cmd: 'enable', why: 'Enter Privileged EXEC mode to make configuration changes.' },
    { cmd: 'configure terminal', why: 'Enter Global Configuration mode.' },
    { cmd: 'vlan 10', why: "Create VLAN 10 first — you cannot assign a port to a VLAN that doesn't exist." },
    { cmd: 'name OFFICE', why: 'Always name VLANs for clarity and documentation.' },
    { cmd: 'exit', why: 'Return to Global Configuration mode.' },
    { cmd: 'interface FastEthernet0/4', why: 'Enter interface config for the misconfigured port.' },
    { cmd: 'switchport mode access', why: 'Explicitly set the port to access mode before changing the VLAN assignment.' },
    { cmd: 'switchport access vlan 10', why: 'Moves the port from the non-existent VLAN 99 to VLAN 10, restoring connectivity.' },
    { cmd: 'end', why: 'Return to Privileged EXEC mode.' },
    { cmd: 'show vlan brief', why: 'Confirm Fa0/4 now appears under VLAN 10.' },
    { cmd: 'show ip interface brief', why: 'Confirm Fa0/4 line protocol is now up/up.' },
  ],
  validation: (state) => [
    { label: 'VLAN 10 exists', pass: !!state.vlans[10] },
    { label: 'Fa0/4 is on VLAN 10', pass: state.interfaces['FastEthernet0/4']?.accessVlan === 10 },
    { label: 'Fa0/4 is not on the old broken VLAN 99', pass: state.interfaces['FastEthernet0/4']?.accessVlan !== 99 },
  ],
  initialState: (() => {
    const base = createDefaultSwitchState();
    return {
      ...base,
      interfaces: {
        ...base.interfaces,
        'FastEthernet0/4': { ...base.interfaces['FastEthernet0/4'], accessVlan: 99 },
      },
    };
  })(),
};