// Default switch state factory
export function createDefaultSwitchState() {
  const interfaces = {};

  // 24 FastEthernet ports
  for (let i = 1; i <= 24; i++) {
    const name = `FastEthernet0/${i}`;
    interfaces[name] = {
      name,
      shortName: `Fa0/${i}`,
      status: 'up',
      protocol: 'up',
      description: '',
      speed: '100Mb/s',
      duplex: 'Full',
      switchportMode: 'access',
      accessVlan: 1,
      trunkAllowedVlans: 'ALL',
      ipAddress: 'unassigned',
      subnetMask: '',
      mtu: 1500,
      bandwidth: 100000,
      inputPackets: Math.floor(Math.random() * 50000),
      outputPackets: Math.floor(Math.random() * 50000),
      inputErrors: 0,
      outputErrors: 0,
      crc: 0,
    };
  }

  // 2 GigabitEthernet uplinks
  for (let i = 1; i <= 2; i++) {
    const name = `GigabitEthernet0/${i}`;
    interfaces[name] = {
      name,
      shortName: `Gi0/${i}`,
      status: 'up',
      protocol: 'up',
      description: '',
      speed: '1000Mb/s',
      duplex: 'Full',
      switchportMode: 'access',
      accessVlan: 1,
      trunkAllowedVlans: 'ALL',
      ipAddress: 'unassigned',
      subnetMask: '',
      mtu: 1500,
      bandwidth: 1000000,
      inputPackets: Math.floor(Math.random() * 100000),
      outputPackets: Math.floor(Math.random() * 100000),
      inputErrors: 0,
      outputErrors: 0,
      crc: 0,
    };
  }

  // VLAN SVI
  interfaces['Vlan1'] = {
    name: 'Vlan1',
    shortName: 'Vl1',
    status: 'up',
    protocol: 'up',
    description: '',
    speed: '',
    duplex: '',
    switchportMode: '',
    accessVlan: 0,
    trunkAllowedVlans: '',
    ipAddress: 'unassigned',
    subnetMask: '',
    mtu: 1500,
    bandwidth: 100000,
    inputPackets: 0,
    outputPackets: 0,
    inputErrors: 0,
    outputErrors: 0,
    crc: 0,
  };

  return {
    hostname: 'Switch',
    enablePassword: '',
    enableSecret: '',
    consolePassword: '',
    bannerMotd: '',
    vlans: {
      1: { id: 1, name: 'default', status: 'active', ports: [] },
      1002: { id: 1002, name: 'fddi-default', status: 'act/unsup', ports: [] },
      1003: { id: 1003, name: 'token-ring-default', status: 'act/unsup', ports: [] },
      1004: { id: 1004, name: 'fddinet-default', status: 'act/unsup', ports: [] },
      1005: { id: 1005, name: 'trnet-default', status: 'act/unsup', ports: [] },
    },
    interfaces,
    lines: {
      console: { password: '', login: false },
      vty: { password: '', login: false },
    },
    spanningTree: true,
    cdp: true,
    configChanged: false,
    startupConfig: null,
  };
}

// Resolve short interface names to full names
export function resolveInterfaceName(input) {
  const lower = input.toLowerCase().trim();
  
  const patterns = [
    { regex: /^fa(?:stethernet)?(\d+\/\d+)$/i, prefix: 'FastEthernet' },
    { regex: /^gi(?:gabitethernet)?(\d+\/\d+)$/i, prefix: 'GigabitEthernet' },
    { regex: /^vlan\s*(\d+)$/i, prefix: 'Vlan' },
  ];

  for (const { regex, prefix } of patterns) {
    const match = lower.match(regex);
    if (match) {
      return prefix === 'Vlan' ? `Vlan${match[1]}` : `${prefix}${match[1]}`;
    }
  }
  return null;
}

// Get VLAN ports list
export function getVlanPorts(switchState, vlanId) {
  const ports = [];
  for (const iface of Object.values(switchState.interfaces)) {
    if (iface.switchportMode === 'access' && iface.accessVlan === vlanId && iface.name !== 'Vlan1') {
      ports.push(iface.shortName);
    }
  }
  return ports;
}

/**
 * Compute the effective line protocol status for an interface.
 * Returns { protocol: 'up'|'down', reason: string|null }
 * This does NOT modify state — it is used at display time.
 */
export function computePortHealth(iface, switchState) {
  // Admin-shutdown always down
  if (iface.status === 'down') return { protocol: 'down', reason: null };

  const isPhysical = iface.name.startsWith('FastEthernet') || iface.name.startsWith('GigabitEthernet');

  if (isPhysical) {
    // Routed port with no IP → line protocol down
    if (iface.switchportMode === 'routed') {
      if (!iface.ipAddress || iface.ipAddress === 'unassigned') {
        return { protocol: 'down', reason: 'not connected (routed port has no IP address)' };
      }
      return { protocol: 'up', reason: null };
    }

    // Access port assigned to a VLAN that doesn't exist → line protocol down
    if (iface.switchportMode === 'access') {
      const vid = iface.accessVlan;
      if (vid && vid !== 1 && !switchState.vlans[vid]) {
        return { protocol: 'down', reason: `not connected (access VLAN ${vid} does not exist)` };
      }
    }

    // Trunk port — healthy if trunk VLANs exist (simplified: always up if not shutdown)
    return { protocol: 'up', reason: null };
  }

  // SVI (Vlan interface): up only if the VLAN exists and has at least one active access port
  if (iface.name.startsWith('Vlan')) {
    const vlanId = parseInt(iface.name.replace('Vlan', ''));
    if (!switchState.vlans[vlanId]) {
      return { protocol: 'down', reason: `not connected (VLAN ${vlanId} does not exist)` };
    }
    const hasActivePorts = Object.values(switchState.interfaces).some(
      p => p.switchportMode === 'access' && p.accessVlan === vlanId && p.status === 'up'
    );
    if (!hasActivePorts && vlanId !== 1) {
      return { protocol: 'down', reason: `not connected (no active ports in VLAN ${vlanId})` };
    }
    return { protocol: 'up', reason: null };
  }

  return { protocol: 'up', reason: null };
}