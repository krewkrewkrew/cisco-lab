import { createDefaultSwitchState } from './switchState';

// Helper to create a broken switch state for troubleshooting labs
function brokenState(overrides) {
  const base = createDefaultSwitchState();
  return { ...base, ...overrides };
}

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

// ─── Troubleshooting Labs ───────────────────────────────────────────────────

export const troubleshootingScenarios = [
  {
    id: 'ts-port-shutdown',
    title: 'Port Won\'t Come Up',
    category: 'troubleshooting',
    difficulty: 'Beginner',
    duration: '10 min',
    description: 'A user reports their workstation lost network connectivity. Ports Fa0/3 and Fa0/5 are administratively shut down. Diagnose the problem and bring the ports back up.',
    objectives: [
      'Use "show ip interface brief" to identify shutdown ports',
      'Identify that Fa0/3 and Fa0/5 are administratively down',
      'Bring Fa0/3 back up with "no shutdown"',
      'Bring Fa0/5 back up with "no shutdown"',
      'Verify both ports are up',
    ],
    hints: [
      '"show ip interface brief" shows all ports and their status at a glance',
      'Look for "administratively down" in the Status column',
      'Enter interface config: "interface fa0/3" then "no shutdown"',
      'Repeat the process for Fa0/5',
    ],
    commands: [
      { cmd: 'show ip interface brief', why: 'First step in any port troubleshooting — quickly shows every interface status. "administratively down" means someone ran shutdown on it.' },
      { cmd: 'interface FastEthernet0/3', why: 'Target the first broken port.' },
      { cmd: 'no shutdown', why: 'Administratively enables the port. The opposite of the "shutdown" command.' },
      { cmd: 'interface FastEthernet0/5', why: 'Target the second broken port.' },
      { cmd: 'no shutdown', why: 'Bring Fa0/5 up as well.' },
      { cmd: 'show interfaces status', why: 'Confirms both ports are now "connected".' },
    ],
    validation: (state) => [
      { label: 'Checked interface status (show ip interface brief)', pass: !!state.viewedInterfaceBrief },
      { label: 'Fa0/3 is back up', pass: state.interfaces['FastEthernet0/3']?.status === 'up' },
      { label: 'Fa0/5 is back up', pass: state.interfaces['FastEthernet0/5']?.status === 'up' },
    ],
    initialState: brokenState({
      interfaces: {
        ...createDefaultSwitchState().interfaces,
        'FastEthernet0/3': { ...createDefaultSwitchState().interfaces['FastEthernet0/3'], status: 'down' },
        'FastEthernet0/5': { ...createDefaultSwitchState().interfaces['FastEthernet0/5'], status: 'down' },
      },
    }),
  },
  {
    id: 'ts-wrong-vlan',
    title: 'Device on Wrong VLAN',
    category: 'troubleshooting',
    difficulty: 'Intermediate',
    duration: '15 min',
    description: 'A workstation on Fa0/4 is on VLAN 99 (which doesn\'t exist), so it can\'t communicate. Fix the port assignment and verify connectivity.',
    objectives: [
      'Use "show vlan brief" to identify the misconfiguration',
      'Identify that Fa0/4 is assigned to non-existent VLAN 99',
      'Create VLAN 10 named "OFFICE"',
      'Move Fa0/4 to VLAN 10',
      'Verify with "show vlan brief"',
    ],
    hints: [
      '"show vlan brief" lists all VLANs and their port assignments',
      'A port on a non-existent VLAN will have its line protocol down',
      'Create the correct VLAN first with "vlan 10"',
      'Then reassign the port with "switchport access vlan 10"',
    ],
    commands: [
      { cmd: 'show vlan brief', why: 'Shows VLAN membership. If a port\'s VLAN doesn\'t appear in this list, traffic will be dropped.' },
      { cmd: 'show interfaces FastEthernet0/4 switchport', why: 'Detailed switchport info for a single port — shows access VLAN, voice VLAN, and mode.' },
      { cmd: 'vlan 10', why: 'Create the correct VLAN. A port assigned to a non-existent VLAN is effectively disconnected.' },
      { cmd: 'name OFFICE', why: 'Always name VLANs for clarity.' },
      { cmd: 'interface FastEthernet0/4', why: 'Target the misconfigured port.' },
      { cmd: 'switchport access vlan 10', why: 'Reassigns the port to the correct VLAN, restoring connectivity.' },
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
  },
  {
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
      'Verify with "show interfaces trunk"',
    ],
    hints: [
      '"show interfaces trunk" shows only trunk ports — if it\'s empty, no trunks are configured',
      '"show interfaces Gi0/1 switchport" reveals the port is in access mode',
      'Set "switchport mode trunk" on the uplink interface',
      'Verify VLANs are created so the trunk has something to carry',
    ],
    commands: [
      { cmd: 'show interfaces trunk', why: 'If this output is empty, no trunk ports exist — all inter-VLAN traffic between switches is blocked.' },
      { cmd: 'show interfaces GigabitEthernet0/1 switchport', why: 'Reveals the exact switchport configuration including administrative and operational modes.' },
      { cmd: 'vlan 10', why: 'Create VLAN 10 — trunks carry VLANs that exist on the switch.' },
      { cmd: 'vlan 20', why: 'Create VLAN 20.' },
      { cmd: 'interface GigabitEthernet0/1', why: 'Enter the uplink interface.' },
      { cmd: 'switchport mode trunk', why: 'Converts the port from access to trunk mode, allowing it to carry all VLANs.' },
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
  },
  {
    id: 'ts-svi-no-ip',
    title: 'Management IP Not Reachable',
    category: 'troubleshooting',
    difficulty: 'Intermediate',
    duration: '15 min',
    description: 'The network team can\'t SSH into the switch. The management VLAN interface (Vlan1) has no IP address configured. Set up remote management access.',
    objectives: [
      'Use "show ip interface brief" to see Vlan1 has no IP',
      'Assign IP address 192.168.1.10/24 to Vlan1',
      'Configure a default gateway of 192.168.1.1',
      'Set up VTY password "cisco123" and enable login',
      'Verify with "show running-config"',
    ],
    hints: [
      '"show ip interface brief" will show Vlan1 with "unassigned" for its IP',
      'Enter "interface vlan 1" then "ip address 192.168.1.10 255.255.255.0"',
      'Set the gateway: "ip default-gateway 192.168.1.1" in global config',
      'Configure VTY: "line vty 0 4" → "password cisco123" → "login"',
    ],
    commands: [
      { cmd: 'show ip interface brief', why: 'Confirms Vlan1 has "unassigned" IP — no IP means no remote management.' },
      { cmd: 'interface vlan 1', why: 'The SVI (Switch Virtual Interface) for VLAN 1 — this is the management interface.' },
      { cmd: 'ip address 192.168.1.10 255.255.255.0', why: 'Assigns the management IP. Remote users SSH to this address.' },
      { cmd: 'no shutdown', why: 'SVIs can be administratively down — always ensure the management interface is up.' },
      { cmd: 'ip default-gateway 192.168.1.1', why: 'Without a default gateway, the switch can\'t route packets back to hosts on other networks.' },
      { cmd: 'line vty 0 4', why: 'Configures the virtual terminal lines for SSH/Telnet access.' },
      { cmd: 'password cisco123', why: 'Sets the VTY password required for remote login.' },
      { cmd: 'login', why: 'Enables password checking on the VTY lines.' },
    ],
    validation: (state) => [
      { label: 'Vlan1 has an IP address', pass: state.interfaces['Vlan1']?.ipAddress && state.interfaces['Vlan1']?.ipAddress !== 'unassigned' },
      { label: 'Default gateway is set', pass: !!state.defaultGateway },
      { label: 'VTY password is configured', pass: !!state.lines?.vty?.password },
      { label: 'VTY login is enabled', pass: !!state.lines?.vty?.login },
    ],
    initialState: null,
  },
  {
    id: 'ts-duplicate-vlan',
    title: 'Native VLAN Mismatch',
    category: 'troubleshooting',
    difficulty: 'Advanced',
    duration: '20 min',
    description: 'Spanning tree is logging native VLAN mismatch errors on the Gi0/1 trunk. The trunk is configured but the native VLAN is set to 99 on one side. Fix the native VLAN to match the default (VLAN 1).',
    objectives: [
      'Use "show interfaces trunk" to inspect the trunk configuration',
      'Identify that Gi0/1 has native VLAN set to 99',
      'Correct the native VLAN back to VLAN 1',
      'Verify the fix with "show interfaces trunk"',
    ],
    hints: [
      '"show interfaces trunk" shows native VLAN per port in the first section',
      'The native VLAN should match on both ends of a trunk link',
      'Fix with: "switchport trunk native vlan 1" on the interface',
      'Or remove it: "no switchport trunk native vlan" to reset to default',
    ],
    commands: [
      { cmd: 'show interfaces trunk', why: 'The "Native vlan" column shows mismatched native VLANs — a common cause of STP issues and unexpected flooding.' },
      { cmd: 'interface GigabitEthernet0/1', why: 'Enter the misconfigured trunk interface.' },
      { cmd: 'switchport trunk native vlan 1', why: 'Resets the native VLAN to 1 (default). Both ends of a trunk must use the same native VLAN.' },
      { cmd: 'show interfaces trunk', why: 'Verify native VLAN is now 1 on all trunk ports.' },
    ],
    validation: (state) => [
      { label: 'Gi0/1 is a trunk port', pass: state.interfaces['GigabitEthernet0/1']?.switchportMode === 'trunk' },
      { label: 'Gi0/1 native VLAN corrected to 1', pass: (state.interfaces['GigabitEthernet0/1']?.nativeVlan ?? 1) === 1 },
      { label: 'Gi0/2 is a trunk port', pass: state.interfaces['GigabitEthernet0/2']?.switchportMode === 'trunk' },
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
  },
  {
    id: 'ts-security-hardening',
    title: 'Security Hardening',
    category: 'troubleshooting',
    difficulty: 'Advanced',
    duration: '20 min',
    description: 'A security audit found several issues: no enable secret, unused ports are up, and CDP is enabled globally. Harden the switch configuration.',
    objectives: [
      'Set an enable secret password: "Str0ngPass!"',
      'Shut down all unused ports (Fa0/13 through Fa0/24)',
      'Disable CDP globally',
      'Save the hardened configuration',
    ],
    hints: [
      'Use "enable secret Str0ngPass!" in global config mode',
      'Shut down ports Fa0/13 through Fa0/24 individually',
      'Disable CDP with "no cdp run" in global config',
      'Save with "copy running-config startup-config"',
    ],
    commands: [
      { cmd: 'enable secret Str0ngPass!', why: 'The enable secret is encrypted (MD5) in the config — always prefer it over "enable password" which is stored in plaintext.' },
      { cmd: 'interface FastEthernet0/13', why: 'Target unused port. Industry best practice: shut down all unused switch ports.' },
      { cmd: 'shutdown', why: 'Prevents unauthorized devices from connecting to unused ports.' },
      { cmd: 'no cdp run', why: 'CDP (Cisco Discovery Protocol) broadcasts device info. Disable it on untrusted networks to prevent information disclosure.' },
      { cmd: 'copy running-config startup-config', why: 'Persist the hardened config so it survives a reboot.' },
    ],
    validation: (state) => [
      { label: 'Enable secret is configured', pass: !!state.enableSecret },
      { label: 'Fa0/13 is shut down', pass: state.interfaces['FastEthernet0/13']?.status === 'down' },
      { label: 'Fa0/18 is shut down', pass: state.interfaces['FastEthernet0/18']?.status === 'down' },
      { label: 'Fa0/24 is shut down', pass: state.interfaces['FastEthernet0/24']?.status === 'down' },
      { label: 'CDP is disabled', pass: state.cdp === false },
      { label: 'Configuration saved', pass: !!state.startupConfig },
    ],
    initialState: null,
  },
];