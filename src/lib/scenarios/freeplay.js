import { createDefaultSwitchState } from '../switchState';

// Rich pre-populated freeplay state with lots of endpoints, VLANs, and traffic
function createFreeplayState() {
  const base = createDefaultSwitchState();

  // Pre-build interfaces with realistic endpoint assignments and traffic
  const interfaces = { ...base.interfaces };

  // VLAN 10 - SALES floor (Fa0/1-6)
  const salesPorts = ['FastEthernet0/1','FastEthernet0/2','FastEthernet0/3','FastEthernet0/4','FastEthernet0/5','FastEthernet0/6'];
  const salesDescs = ['PC-Sales-01','PC-Sales-02','PC-Sales-03','PC-Sales-04','Printer-Sales','VoIP-Sales-01'];
  salesPorts.forEach((p, i) => {
    interfaces[p] = { ...interfaces[p], accessVlan: 10, switchportMode: 'access', description: salesDescs[i],
      inputPackets: 80000 + Math.floor(Math.random() * 40000), outputPackets: 75000 + Math.floor(Math.random() * 40000) };
  });

  // VLAN 20 - ENGINEERING (Fa0/7-12)
  const engPorts = ['FastEthernet0/7','FastEthernet0/8','FastEthernet0/9','FastEthernet0/10','FastEthernet0/11','FastEthernet0/12'];
  const engDescs = ['WS-Eng-01','WS-Eng-02','WS-Eng-03','Lab-Server-01','Lab-Server-02','Dev-NAS'];
  engPorts.forEach((p, i) => {
    interfaces[p] = { ...interfaces[p], accessVlan: 20, switchportMode: 'access', description: engDescs[i],
      inputPackets: 150000 + Math.floor(Math.random() * 80000), outputPackets: 140000 + Math.floor(Math.random() * 80000), speed: '100Mb/s' };
  });

  // VLAN 30 - MANAGEMENT (Fa0/13-14)
  interfaces['FastEthernet0/13'] = { ...interfaces['FastEthernet0/13'], accessVlan: 30, switchportMode: 'access', description: 'Network-Mgmt-PC', inputPackets: 5000, outputPackets: 4800 };
  interfaces['FastEthernet0/14'] = { ...interfaces['FastEthernet0/14'], accessVlan: 30, switchportMode: 'access', description: 'SNMP-Monitor', inputPackets: 2100, outputPackets: 1900 };

  // VLAN 40 - VOICE (Fa0/15-18)
  const voicePorts = ['FastEthernet0/15','FastEthernet0/16','FastEthernet0/17','FastEthernet0/18'];
  const voiceDescs = ['VoIP-Phone-101','VoIP-Phone-102','VoIP-Phone-103','VoIP-Phone-104'];
  voicePorts.forEach((p, i) => {
    interfaces[p] = { ...interfaces[p], accessVlan: 40, switchportMode: 'access', description: voiceDescs[i],
      inputPackets: 20000 + Math.floor(Math.random() * 5000), outputPackets: 20000 + Math.floor(Math.random() * 5000) };
  });

  // Unused / shutdown ports (Fa0/19-24)
  ['FastEthernet0/19','FastEthernet0/20','FastEthernet0/21','FastEthernet0/22','FastEthernet0/23','FastEthernet0/24'].forEach(p => {
    interfaces[p] = { ...interfaces[p], status: 'down', protocol: 'down', description: 'UNUSED - SHUTDOWN' };
  });

  // Trunk uplinks
  interfaces['GigabitEthernet0/1'] = { ...interfaces['GigabitEthernet0/1'], switchportMode: 'trunk', description: 'Uplink to Core-SW-01', trunkAllowedVlans: '1,10,20,30,40', nativeVlan: 1, inputPackets: 500000, outputPackets: 480000 };
  interfaces['GigabitEthernet0/2'] = { ...interfaces['GigabitEthernet0/2'], switchportMode: 'trunk', description: 'Uplink to Core-SW-02 (redundant)', trunkAllowedVlans: '1,10,20,30,40', nativeVlan: 1, inputPackets: 12000, outputPackets: 11000 };

  // SVI for management
  interfaces['Vlan30'] = {
    name: 'Vlan30', shortName: 'Vl30', status: 'up', protocol: 'up',
    description: 'Management SVI', speed: '', duplex: '', switchportMode: 'svi',
    accessVlan: 0, trunkAllowedVlans: '', ipAddress: '10.0.30.1', subnetMask: '255.255.255.0',
    mtu: 1500, bandwidth: 100000, inputPackets: 3200, outputPackets: 3100, inputErrors: 0, outputErrors: 0, crc: 0,
  };

  return {
    ...base,
    hostname: 'AccessSW-Floor1',
    defaultGateway: '10.0.30.254',
    domainName: 'corp.local',
    sshVersion: 2,
    servicePasswordEncryption: true,
    spanningTreeMode: 'rapid-pvst',
    cdp: true,
    lldp: true,
    vtpDomain: 'CORP',
    vtpMode: 'client',
    vtpVersion: 2,
    snmpCommunity: { string: 'public', access: 'RO' },
    users: {
      admin: { username: 'admin', privilege: 15, password: 'Admin@2024', secret: false },
    },
    lines: {
      console: { password: 'console123', login: true, loginLocal: false },
      vty: { password: '', login: true, loginLocal: true, transport: 'ssh', execTimeout: 600 },
    },
    vlans: {
      ...base.vlans,
      10: { id: 10, name: 'SALES', status: 'active', ports: [] },
      20: { id: 20, name: 'ENGINEERING', status: 'active', ports: [] },
      30: { id: 30, name: 'MANAGEMENT', status: 'active', ports: [] },
      40: { id: 40, name: 'VOICE', status: 'active', ports: [] },
    },
    interfaces,
    syslog: [
      { seq: 1,  ts: '*Apr 30 08:00:01.000', facility: '%SYS-5-CONFIG_I',    msg: 'Configured from console by admin on vty0' },
      { seq: 2,  ts: '*Apr 30 08:00:02.000', facility: '%LINK-3-UPDOWN',     msg: 'Interface GigabitEthernet0/1, changed state to up' },
      { seq: 3,  ts: '*Apr 30 08:00:03.000', facility: '%LINEPROTO-5-UPDOWN',msg: 'Line protocol on Interface GigabitEthernet0/1, changed state to up' },
      { seq: 4,  ts: '*Apr 30 08:01:14.000', facility: '%CDP-4-NATIVE_VLAN_MISMATCH', msg: 'Native VLAN mismatch discovered on GigabitEthernet0/2 (1), with Core-SW-02 GigabitEthernet1/0/2 (99).' },
      { seq: 5,  ts: '*Apr 30 08:15:22.000', facility: '%LINK-3-UPDOWN',     msg: 'Interface FastEthernet0/19, changed state to down' },
      { seq: 6,  ts: '*Apr 30 09:32:47.000', facility: '%SYS-5-CONFIG_I',    msg: 'Configured from console by admin on vty0' },
    ],
    startupConfig: null,
    configChanged: false,
  };
}

export default {
  id: 'freeplay',
  title: 'Free Play — Open Lab',
  category: 'freeplay',
  duration: 'Unlimited',
  description: 'A fully pre-configured access switch with 4 VLANs, 18 connected endpoints, trunk uplinks, SVI, SSH, port security, and realistic traffic. Explore, break things, fix them — no objectives, no limits.',
  objectives: [
    'Pre-configured with VLANs 10 (SALES), 20 (ENGINEERING), 30 (MANAGEMENT), 40 (VOICE)',
    '18 simulated endpoints across Fa0/1-18 with realistic traffic stats',
    'Trunk uplinks on Gi0/1 and Gi0/2 to core switches',
    'Management SVI on Vlan30 with IP 10.0.30.1/24',
    'SSH configured with local user "admin"',
    'Ports Fa0/19-24 administratively shutdown',
    'Try: show cdp neighbors, show mac-address-table, show interfaces trunk',
  ],
  commands: [],
  validation: () => [],
  initialState: createFreeplayState(),
  isFreeplay: true,
};