import { createDefaultSwitchState } from '../../switchState';

export default {
  id: 'test-full-outage',
  title: 'Full Network Outage Diagnosis',
  category: 'test',
  difficulty: 'Advanced',
  duration: '35 min',
  description: 'Multiple users are reporting a network outage. The switch has several simultaneous misconfigurations: two access ports are assigned to a VLAN that does not exist (VLAN 50), one uplink port is shut down, and the management SVI has no IP address. Diagnose and fix all issues.',
  objectives: [
    'Identify Fa0/2 and Fa0/4 are assigned to non-existent VLAN 50',
    'Create VLAN 50 named USERS to restore those ports',
    'Identify that Gi0/1 is administratively down',
    'Bring Gi0/1 back up',
    'Identify Vlan1 SVI has no IP',
    'Assign IP 10.0.0.1 255.255.255.0 to Vlan1 SVI',
    'Set default gateway to 10.0.0.254',
    'Save the fixed configuration',
  ],
  commands: [
    { cmd: 'show ip interface brief', why: 'Get a quick overview of all interface states — spot the down ones fast.' },
    { cmd: 'show vlan brief', why: 'Confirm which VLANs exist. If VLAN 50 is missing, ports in it will be down.' },
    { cmd: 'show interfaces status', why: 'Shows connected/not-connected status and VLAN assignment for every port.' },
    { cmd: 'enable', why: 'Enter Privileged EXEC mode to make configuration changes.' },
    { cmd: 'configure terminal', why: 'Enter Global Configuration mode.' },
    { cmd: 'vlan 50', why: 'Create the missing VLAN 50 to restore Fa0/2 and Fa0/4.' },
    { cmd: 'name USERS', why: 'Give the new VLAN a descriptive name.' },
    { cmd: 'exit', why: 'Return to Global Configuration mode.' },
    { cmd: 'interface GigabitEthernet0/1', why: 'Enter config for the administratively down uplink.' },
    { cmd: 'no shutdown', why: 'Re-enable the administratively disabled uplink.' },
    { cmd: 'exit', why: 'Return to Global Configuration mode.' },
    { cmd: 'interface vlan 1', why: 'Enter the management SVI config.' },
    { cmd: 'ip address 10.0.0.1 255.255.255.0', why: 'Assign the management IP so the switch is remotely accessible.' },
    { cmd: 'no shutdown', why: 'Ensure the SVI is administratively up.' },
    { cmd: 'exit', why: 'Return to Global Configuration mode.' },
    { cmd: 'ip default-gateway 10.0.0.254', why: 'Set gateway so the switch can communicate beyond its subnet.' },
    { cmd: 'end', why: 'Return to Privileged EXEC mode.' },
    { cmd: 'copy running-config startup-config', why: 'Persist all fixes so they survive a reboot.' },
    { cmd: 'show ip interface brief', why: 'Final verification — all interfaces should now show up/up.' },
  ],
  validation: (state) => [
    { label: 'VLAN 50 (USERS) created', pass: !!state.vlans[50] && state.vlans[50].name === 'USERS' },
    { label: 'Gi0/1 is back up', pass: state.interfaces['GigabitEthernet0/1']?.status === 'up' },
    { label: 'Vlan1 SVI has IP 10.0.0.1', pass: state.interfaces['Vlan1']?.ipAddress === '10.0.0.1' },
    { label: 'Default gateway set to 10.0.0.254', pass: state.defaultGateway === '10.0.0.254' },
    { label: 'Checked interface brief', pass: !!state.viewedInterfaceBrief },
    { label: 'Configuration saved', pass: !!state.startupConfig },
  ],
  initialState: (() => {
    const base = createDefaultSwitchState();
    return {
      ...base,
      interfaces: {
        ...base.interfaces,
        'FastEthernet0/2': { ...base.interfaces['FastEthernet0/2'], accessVlan: 50 },
        'FastEthernet0/4': { ...base.interfaces['FastEthernet0/4'], accessVlan: 50 },
        'GigabitEthernet0/1': { ...base.interfaces['GigabitEthernet0/1'], status: 'down', protocol: 'down' },
      },
    };
  })(),
};