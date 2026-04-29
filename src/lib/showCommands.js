import { getVlanPorts, computePortHealth } from './switchState';

export function showLog(state) {
  const logs = state.syslog || [];
  if (logs.length === 0) return 'Syslog logging: enabled (0 messages logged)';
  const header = [
    'Syslog logging: enabled',
    `Log Buffer (4096 bytes):`,
    '',
  ];
  const entries = logs.map(e => `${e.ts}: ${e.facility}: ${e.msg}`);
  return [...header, ...entries].join('\n');
}

export function showVersion(state) {
  return `Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.2(7)E2, RELEASE SOFTWARE (fc3)
Technical Support: http://www.cisco.com/techsupport
Copyright (c) 1986-2023 by Cisco Systems, Inc.
Compiled Thu 14-Sep-23 09:42 by prod_rel_team

ROM: Bootstrap program is C2960 boot loader
BOOTLDR: C2960 Boot Loader (C2960-HBOOT-M) Version 15.2(7r)E2, RELEASE SOFTWARE (fc1)

${state.hostname} uptime is 2 days, 14 hours, 22 minutes
System returned to ROM by power-on
System image file is "flash:c2960-lanbasek9-mz.152-7.E2.bin"

cisco WS-C2960-24TT-L (PowerPC405) processor (revision B0) with 131072K bytes of memory.
Processor board ID FOC1234X5YZ
Last reset from power-on
2 Virtual Ethernet interfaces
26 FastEthernet interfaces
2 Gigabit Ethernet interfaces
The password-recovery mechanism is enabled.

64K bytes of flash-simulated non-volatile configuration memory.

Configuration register is 0x2102`;
}

export function showInterfaces(state, specific) {
  const lines = [];
  const ifaces = specific ? { [specific]: state.interfaces[specific] } : state.interfaces;
  
  for (const [name, iface] of Object.entries(ifaces)) {
    if (!iface) continue;
    const health = computePortHealth(iface, state);
    const status = iface.status === 'up' ? 'up' : 'administratively down';
    const proto = health.protocol;
    
    lines.push(`${name} is ${status}, line protocol is ${proto}`);
    if (iface.description) lines.push(`  Description: ${iface.description}`);
    lines.push(`  Hardware is ${name.startsWith('Vlan') ? 'EtherSVI' : 'Fast Ethernet'}, address is aabb.cc00.${String(Object.keys(state.interfaces).indexOf(name) + 1).padStart(4, '0')} (bia aabb.cc00.${String(Object.keys(state.interfaces).indexOf(name) + 1).padStart(4, '0')})`);
    if (iface.ipAddress !== 'unassigned') {
      lines.push(`  Internet address is ${iface.ipAddress}/${subnetToPrefix(iface.subnetMask)}`);
    }
    lines.push(`  MTU ${iface.mtu} bytes, BW ${iface.bandwidth} Kbit/sec, DLY 100 usec,`);
    lines.push(`     reliability 255/255, txload 1/255, rxload 1/255`);
    lines.push(`  Encapsulation ARPA, loopback not set`);
    if (iface.duplex) lines.push(`  ${iface.duplex}-duplex, ${iface.speed}, link type is auto, media type is 10/100BaseTX`);
    lines.push(`  input flow-control is off, output flow-control is unsupported`);
    lines.push(`     ${iface.inputPackets} packets input, ${iface.inputPackets * 64} bytes, 0 no buffer`);
    lines.push(`     Received 0 broadcasts (0 multicasts)`);
    lines.push(`     0 runts, 0 giants, ${iface.crc} CRC, 0 frame, 0 overrun, 0 ignored`);
    lines.push(`     0 watchdog, 0 multicast, 0 pause input`);
    lines.push(`     ${iface.outputPackets} packets output, ${iface.outputPackets * 64} bytes, 0 underruns`);
    lines.push(`     0 output errors, 0 collisions, 1 interface resets`);
    lines.push(`     0 unknown protocol drops`);
    lines.push('');
  }
  return lines.join('\n');
}

function subnetToPrefix(mask) {
  if (!mask) return '0';
  return mask.split('.').reduce((acc, octet) => {
    let n = parseInt(octet), bits = 0;
    while (n > 0) { bits += n & 1; n >>= 1; }
    return acc + bits;
  }, 0).toString();
}

export function showIpInterfaceBrief(state) {
  let output = 'Interface                  IP-Address      OK? Method Status                Protocol\n';
  for (const iface of Object.values(state.interfaces)) {
    const health = computePortHealth(iface, state);
    const name = iface.name.padEnd(27);
    const ip = (iface.ipAddress || 'unassigned').padEnd(16);
    const ok = 'YES'.padEnd(4);
    const method = (iface.ipAddress && iface.ipAddress !== 'unassigned' ? 'manual' : 'unset ').padEnd(7);
    const status = (iface.status === 'up' ? 'up' : 'administratively down').padEnd(22);
    const proto = health.protocol;
    output += `${name}${ip}${ok}${method}${status}${proto}\n`;
  }
  return output;
}

export function showVlanBrief(state) {
  let output = '\nVLAN Name                             Status    Ports\n';
  output += '---- -------------------------------- --------- -------------------------------\n';

  // Sort VLANs by ID for consistent display
  const sortedVlans = Object.values(state.vlans).sort((a, b) => a.id - b.id);

  for (const vlan of sortedVlans) {
    const id = String(vlan.id).padEnd(5);
    const name = vlan.name.slice(0, 32).padEnd(33);
    const status = vlan.status.padEnd(10);

    // Get short port names (Fa0/1, Gi0/1) and abbreviate them
    const allPorts = getVlanPorts(state, vlan.id).map(p =>
      p.replace('FastEthernet', 'Fa').replace('GigabitEthernet', 'Gi')
    );

    // Wrap ports at 31 chars per line, continuation lines indented
    const WRAP = 31;
    const portLines = [];
    let current = '';
    for (const port of allPorts) {
      const candidate = current ? `${current}, ${port}` : port;
      if (candidate.length > WRAP && current) {
        portLines.push(current);
        current = port;
      } else {
        current = candidate;
      }
    }
    if (current) portLines.push(current);

    if (portLines.length === 0) {
      output += `${id}${name}${status}\n`;
    } else {
      output += `${id}${name}${status}${portLines[0]}\n`;
      for (let i = 1; i < portLines.length; i++) {
        output += `${''.padEnd(49)}${portLines[i]}\n`;
      }
    }
  }
  return output;
}

export function showRunningConfig(state) {
  const lines = [
    'Building configuration...',
    '',
    'Current configuration : dynamic',
    '!',
    'version 15.2',
    `service timestamps log datetime msec`,
    `service timestamps debug datetime msec`,
    state.servicePasswordEncryption ? 'service password-encryption' : 'no service password-encryption',
    '!',
    `hostname ${state.hostname}`,
    '!',
    'boot-start-marker',
    'boot-end-marker',
    '!',
  ];

  if (state.enableSecret) {
    lines.push(`enable secret 5 $1$mERr$hx5rVt7rPNoS4wqbXKX7m0`);
    lines.push('!');
  }
  if (state.enablePassword && !state.enableSecret) {
    lines.push(`enable password ${state.servicePasswordEncryption ? '7 ' : ''}${state.enablePassword}`);
    lines.push('!');
  }

  if (state.aaa) {
    lines.push('aaa new-model');
    lines.push('!');
  }

  for (const [uname, u] of Object.entries(state.users || {})) {
    lines.push(`username ${uname} privilege ${u.privilege || 1} ${u.secret ? 'secret' : 'password'} ${u.password}`);
  }
  if (Object.keys(state.users || {}).length) lines.push('!');

  if (!state.ipDomainLookup) lines.push('no ip domain-lookup');
  if (state.domainName) lines.push(`ip domain-name ${state.domainName}`);
  if (state.ipRouting) lines.push('ip routing');
  if (state.defaultGateway) lines.push(`ip default-gateway ${state.defaultGateway}`);

  if (state.sshVersion) {
    lines.push(`ip ssh version ${state.sshVersion}`);
    if (state.sshTimeout) lines.push(`ip ssh time-out ${state.sshTimeout}`);
    if (state.sshAuthRetries) lines.push(`ip ssh authentication-retries ${state.sshAuthRetries}`);
  }
  lines.push('!');

  if (state.spanningTree !== false) {
    lines.push(`spanning-tree mode ${state.spanningTreeMode || 'pvst'}`);
    if (state.spanningTreeExtendSystemId) lines.push('spanning-tree extend system-id');
    if (state.spanningTreePortfastDefault) lines.push('spanning-tree portfast default');
    lines.push('!');
  }

  if (state.vtpDomain) {
    lines.push(`vtp domain ${state.vtpDomain}`);
    lines.push(`vtp mode ${state.vtpMode || 'server'}`);
    if (state.vtpVersion > 1) lines.push(`vtp version ${state.vtpVersion}`);
    if (state.vtpPassword) lines.push(`vtp password ${state.vtpPassword}`);
    lines.push('!');
  }

  // VLAN config
  for (const vlan of Object.values(state.vlans).sort((a, b) => a.id - b.id)) {
    if (vlan.id >= 1002) continue;
    if (vlan.id === 1) continue;
    lines.push(`vlan ${vlan.id}`);
    lines.push(` name ${vlan.name}`);
    lines.push('!');
  }

  // Interface config
  for (const iface of Object.values(state.interfaces)) {
    lines.push(`interface ${iface.name}`);
    if (iface.description) lines.push(` description ${iface.description}`);
    const isSVI = iface.name.startsWith('Vlan');
    const isPhysical = iface.name.startsWith('FastEthernet') || iface.name.startsWith('GigabitEthernet');

    if (isSVI) {
      if (iface.ipAddress && iface.ipAddress !== 'unassigned') lines.push(` ip address ${iface.ipAddress} ${iface.subnetMask}`);
      for (const h of (iface.helperAddresses || [])) lines.push(` ip helper-address ${h}`);
    }
    if (isPhysical) {
      if (iface.switchportMode === 'routed') {
        lines.push(` no switchport`);
        if (iface.ipAddress && iface.ipAddress !== 'unassigned') lines.push(` ip address ${iface.ipAddress} ${iface.subnetMask}`);
        for (const h of (iface.helperAddresses || [])) lines.push(` ip helper-address ${h}`);
      } else if (iface.switchportMode === 'trunk') {
        lines.push(` switchport trunk encapsulation dot1q`);
        lines.push(` switchport mode trunk`);
        if (iface.nativeVlan && iface.nativeVlan !== 1) lines.push(` switchport trunk native vlan ${iface.nativeVlan}`);
        if (iface.trunkAllowedVlans && iface.trunkAllowedVlans !== 'ALL') lines.push(` switchport trunk allowed vlan ${iface.trunkAllowedVlans}`);
        if (iface.nonegotiate) lines.push(` switchport nonegotiate`);
      } else {
        if (iface.accessVlan && iface.accessVlan !== 1) lines.push(` switchport access vlan ${iface.accessVlan}`);
        lines.push(` switchport mode access`);
        if (iface.nonegotiate) lines.push(` switchport nonegotiate`);
      }
      if (iface.channelGroup) lines.push(` channel-group ${iface.channelGroup} mode ${iface.channelGroupMode || 'on'}`);
      if (iface.spanningTreePortfast) lines.push(` spanning-tree portfast`);
      if (iface.spanningTreeBpduguard) lines.push(` spanning-tree bpduguard enable`);
      if (iface.stormControlBroadcast) lines.push(` storm-control broadcast level ${iface.stormControlBroadcast}`);
    }
    if (iface.status === 'down') lines.push(` shutdown`);
    lines.push('!');
  }

  // NTP
  if (state.ntpServer) {
    lines.push(`ntp server ${state.ntpServer}`);
    lines.push('!');
  }

  // SNMP
  if (state.snmpCommunity) {
    lines.push(`snmp-server community ${state.snmpCommunity.string} ${state.snmpCommunity.access}`);
    if (state.snmpLocation) lines.push(`snmp-server location ${state.snmpLocation}`);
    if (state.snmpContact) lines.push(`snmp-server contact ${state.snmpContact}`);
    lines.push('!');
  }

  // Logging
  if (state.loggingHost) lines.push(`logging host ${state.loggingHost}`);
  if (state.loggingTrap) lines.push(`logging trap ${state.loggingTrap}`);

  // Line config
  lines.push('line con 0');
  if (state.lines.console.password) {
    lines.push(` password ${state.lines.console.password}`);
    if (state.lines.console.login) lines.push(' login');
  }
  lines.push(' logging synchronous');
  lines.push('line vty 0 4');
  if (state.lines.vty.password) {
    lines.push(` password ${state.lines.vty.password}`);
  }
  if (state.lines.vty.login) lines.push(state.lines.vty.loginLocal ? ' login local' : ' login');
  lines.push(` transport input ${state.lines.vty.transport || 'ssh'}`);
  if (state.lines.vty.execTimeout) {
    const min = Math.floor(state.lines.vty.execTimeout / 60);
    const sec = state.lines.vty.execTimeout % 60;
    lines.push(` exec-timeout ${min} ${sec}`);
  }
  lines.push('!');
  lines.push('end');

  return lines.join('\n');
}

export function showStartupConfig(state) {
  if (!state.startupConfig) {
    return 'startup-config is not present';
  }
  return state.startupConfig;
}

export function showHistory(history) {
  return history.map((cmd, i) => `  ${i + 1}  ${cmd}`).join('\n');
}

export function showClock() {
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `*${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.000 UTC ${days[now.getDay()]} ${months[now.getMonth()]} ${now.getDate()} ${now.getFullYear()}`;
}

export function showSpanningTree(state, vlanId) {
  if (!state.spanningTree) return 'No spanning tree instance exists.';
  const vid = vlanId || '0001';
  return `VLAN0001
  Spanning tree enabled protocol ieee
  Root ID    Priority    32769
             Address     aabb.cc00.0100
             This bridge is the root
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec

  Bridge ID  Priority    32769  (priority 32768 sys-id-ext 1)
             Address     aabb.cc00.0100
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec
             Aging Time  300 sec

Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------
Fa0/1               Desg FWD 19        128.1    P2p
Fa0/2               Desg FWD 19        128.2    P2p
Gi0/1               Desg FWD 4         128.25   P2p
Gi0/2               Desg FWD 4         128.26   P2p`;
}

export function showMacAddressTable(state) {
  let out = `          Mac Address Table\n-------------------------------------------\n\nVlan    Mac Address       Type        Ports\n----    -----------       --------    -----\n`;
  const ports = state ? Object.values(state.interfaces).filter(i => !i.name.startsWith('Vlan') && i.switchportMode === 'access' && i.status === 'up') : [];
  if (ports.length === 0) {
    out += `   1    aabb.cc00.0001    DYNAMIC     Fa0/1\n   1    aabb.cc00.0002    DYNAMIC     Fa0/2\n   1    aabb.cc00.0003    DYNAMIC     Fa0/3\n`;
    out += `Total Mac Addresses for this criterion: 3`;
  } else {
    ports.slice(0, 10).forEach((p, i) => {
      out += `${String(p.accessVlan || 1).padStart(4)}    aabb.cc00.${String(i + 1).padStart(4, '0')}    DYNAMIC     ${p.shortName}\n`;
    });
    out += `Total Mac Addresses for this criterion: ${Math.min(ports.length, 10)}`;
  }
  return out;
}

export function showArp(state) {
  const svis = state ? Object.values(state.interfaces).filter(i => i.name.startsWith('Vlan') && i.ipAddress && i.ipAddress !== 'unassigned') : [];
  let out = `Protocol  Address          Age (min)  Hardware Addr   Type   Interface\n`;
  if (svis.length === 0) {
    out += `Internet  192.168.1.1             -   aabb.cc00.0100  ARPA   Vlan1\n`;
    out += `Internet  192.168.1.10            2   aabb.cc00.0001  ARPA   Vlan1`;
  } else {
    svis.forEach((svi, idx) => {
      out += `Internet  ${svi.ipAddress.padEnd(17)}      -   aabb.cc00.${String(idx + 1).padStart(4, '0')}  ARPA   ${svi.name}\n`;
    });
  }
  return out;
}

export function showInterfacesStatus(state) {
  let out = '\nPort      Name               Status       Vlan       Duplex  Speed Type\n';
  for (const iface of Object.values(state.interfaces)) {
    if (iface.name.startsWith('Vlan')) continue;
    const health = computePortHealth(iface, state);
    const short = iface.shortName.padEnd(10);
    const name = (iface.description || '').slice(0, 18).padEnd(19);
    const status = (iface.status === 'down' ? 'err-disabled' : health.protocol === 'up' ? 'connected' : 'notconnect').padEnd(13);
    const vlan = (iface.switchportMode === 'trunk' ? 'trunk' : iface.switchportMode === 'routed' ? 'routed' : String(iface.accessVlan || 1)).padEnd(11);
    const duplex = (iface.duplex || 'a-full').padEnd(8);
    const speed = (iface.speed || 'auto').padEnd(7);
    const type = iface.name.startsWith('Gigabit') ? '10/100/1000BaseTX' : '10/100BaseTX';
    out += `${short}${name}${status}${vlan}${duplex}${speed}${type}\n`;
  }
  return out;
}

export function showInterfacesTrunk(state) {
  const trunks = Object.values(state.interfaces).filter(i => i.switchportMode === 'trunk');
  if (trunks.length === 0) return '\nPort        Mode             Encapsulation  Status        Native vlan\n(no trunk interfaces configured)';
  let out = '\nPort        Mode             Encapsulation  Status        Native vlan\n';
  for (const t of trunks) {
    out += `${t.shortName.padEnd(12)}${'on'.padEnd(17)}${'802.1q'.padEnd(15)}${'trunking'.padEnd(14)}${t.nativeVlan || 1}\n`;
  }
  out += '\nPort        Vlans allowed on trunk\n';
  for (const t of trunks) {
    out += `${t.shortName.padEnd(12)}${t.trunkAllowedVlans || '1-4094'}\n`;
  }
  out += '\nPort        Vlans allowed and active in management domain\n';
  for (const t of trunks) {
    const activeVlans = Object.values(state.vlans).filter(v => v.status === 'active').map(v => v.id).join(',');
    out += `${t.shortName.padEnd(12)}${activeVlans}\n`;
  }
  out += '\nPort        Vlans in spanning tree forwarding state and not pruned\n';
  for (const t of trunks) {
    out += `${t.shortName.padEnd(12)}${Object.values(state.vlans).filter(v => v.status === 'active').map(v => v.id).join(',')}\n`;
  }
  return out;
}

export function showInterfacesSummary(state) {
  const up = Object.values(state.interfaces).filter(i => computePortHealth(i, state).protocol === 'up').length;
  const down = Object.values(state.interfaces).length - up;
  return `*: interface is up\nIHQ: pkts in input hold queue     IQD: pkts dropped from input queue\nOHQ: pkts in output hold queue    OQD: pkts dropped from output queue\nRXBS: rx rate (bits/sec)           RXPS: rx rate (pkts/sec)\nTXBS: tx rate (bits/sec)           TXPS: tx rate (pkts/sec)\nTRTL: throttle count\n\n  Interface          IHQ   IQD  OHQ   OQD  RXBS  RXPS  TXBS  TXPS  TRTL\n---------------------------------------------------------------------------\nTotal of ${Object.values(state.interfaces).length} interfaces, ${up} up, ${down} down`;
}

export function showInterfacesCounters(state) {
  let out = '';
  for (const iface of Object.values(state.interfaces)) {
    out += `${iface.name}\n`;
    out += `  InOctets          : ${iface.inputPackets * 64}\n`;
    out += `  InPkts            : ${iface.inputPackets}\n`;
    out += `  OutOctets         : ${iface.outputPackets * 64}\n`;
    out += `  OutPkts           : ${iface.outputPackets}\n\n`;
  }
  return out;
}

export function showIpInterfaceDetail(state, ifaceName) {
  const iface = state.interfaces[ifaceName];
  if (!iface) return '% Interface not found.';
  const health = computePortHealth(iface, state);
  const status = iface.status === 'up' ? 'up' : 'administratively down';
  const helpers = (iface.helperAddresses || []).map(h => `  Helper address is ${h}`).join('\n');
  return `${iface.name} is ${status}, line protocol is ${health.protocol}
  Internet address is ${iface.ipAddress !== 'unassigned' ? iface.ipAddress + '/' + subnetToPrefix(iface.subnetMask) : 'unassigned'}
  Broadcast address is 255.255.255.255
  MTU is ${iface.mtu} bytes
  Helper address is not set${helpers ? '\n' + helpers : ''}
  Directed broadcast forwarding is disabled
  Outgoing access list is not set
  Inbound  access list is not set
  Proxy ARP is ${iface.proxyArp ? 'enabled' : 'disabled'}
  Local Proxy ARP is disabled
  Security level is default
  Split horizon is enabled
  ICMP redirects are always sent
  ICMP unreachables are always sent
  ICMP mask replies are never sent
  IP fast switching is disabled
  IP CEF switching is enabled
  IP version 4`;
}

export function showIpRoute(state) {
  const svis = Object.values(state.interfaces).filter(i => i.status === 'up' && i.ipAddress && i.ipAddress !== 'unassigned' && i.subnetMask);
  if (svis.length === 0 && !(state.staticRoutes || []).length) {
    return `Codes: L - local, C - connected, S - static\n\nGateway of last resort is ${state.defaultGateway || 'not set'}\n\n(no routes)`;
  }
  let out = `Codes: L - local, C - connected, S - static, R - RIP, M - mobile\n       B - BGP, D - EIGRP, EX - EIGRP external, O - OSPF\n\nGateway of last resort is ${state.defaultGateway || 'not set'}\n\n`;
  for (const iface of svis) {
    const prefix = subnetToPrefix(iface.subnetMask);
    const network = getNetworkAddress(iface.ipAddress, iface.subnetMask);
    out += `C        ${network}/${prefix} is directly connected, ${iface.name}\n`;
    out += `L        ${iface.ipAddress}/32 is directly connected, ${iface.name}\n`;
  }
  for (const r of (state.staticRoutes || [])) {
    out += `S        ${r.network}/${subnetToPrefix(r.mask)}${r.nexthop ? ` [1/0] via ${r.nexthop}` : ' is directly connected'}\n`;
  }
  if (state.defaultGateway) {
    out += `S*       0.0.0.0/0 [1/0] via ${state.defaultGateway}\n`;
  }
  return out;
}

function getNetworkAddress(ip, mask) {
  const ipParts = ip.split('.').map(Number);
  const maskParts = mask.split('.').map(Number);
  return ipParts.map((o, i) => o & maskParts[i]).join('.');
}

export function showIpSsh(state) {
  return `SSH Enabled - version ${state.sshVersion || 2}.0
Authentication timeout: ${state.sshTimeout || 120} secs; Authentication retries: ${state.sshAuthRetries || 3}
Minimum expected Diffie Hellman key size : 1024 bits
IOS Keys in SECSH format(ssh-rsa, base64 encoded):`;
}

export function showIpAccessLists(state) {
  return `% There are no access lists configured.`;
}

export function showIpDhcp(state) {
  return `Pool Name              Total       Leased    Expired     Pending
DHCP database agent information is not configured.`;
}

export function showCdpNeighbors(state) {
  if (!state.cdp) return '% CDP is not enabled.';
  return `Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge
                  S - Switch, H - Host, I - IGMP, r - Repeater

Device ID        Local Intrfce     Holdtme    Capability  Platform  Port ID
(no cdp neighbors found)`;
}

export function showCdpInterface(state) {
  if (!state.cdp) return '% CDP is not enabled.';
  let out = '';
  for (const iface of Object.values(state.interfaces)) {
    if (!iface.name.startsWith('Vlan')) {
      out += `${iface.name} is ${iface.status === 'up' ? 'up' : 'down'}, line protocol is ${computePortHealth(iface, state).protocol}\n`;
      out += `  Encapsulation ARPA\n  Sending CDP packets every 60 seconds\n  Holdtime is 180 seconds\n`;
    }
  }
  return out;
}

export function showCdpTraffic() {
  return `CDP counters :\n        Total packets output: 0, Input: 0\n        Hdr syntax: 0, Chksum error: 0, Encaps failed: 0\n        No memory: 0, Invalid packet: 0, Fragmented: 0\n        CDP version 1 advertisements output: 0, Input: 0\n        CDP version 2 advertisements output: 0, Input: 0`;
}

export function showLldpNeighbors(state) {
  if (!state.lldp) return '% LLDP is not enabled.';
  return `Capability codes:\n    (R) Router, (B) Bridge, (T) Telephone, (C) DOCSIS Cable Device\n    (W) WLAN Access Point, (P) Repeater, (S) Station, (O) Other\n\nDevice ID           Local Intf     Hold-time  Capability      Port ID\n(no lldp neighbors found)\n\nTotal entries displayed: 0`;
}

export function showEtherchannelSummary(state) {
  const groups = {};
  for (const iface of Object.values(state.interfaces)) {
    if (iface.channelGroup) {
      if (!groups[iface.channelGroup]) groups[iface.channelGroup] = { id: iface.channelGroup, mode: iface.channelGroupMode, ports: [] };
      groups[iface.channelGroup].ports.push(iface.shortName);
    }
  }
  let out = `Flags:  D - down        P - bundled in port-channel\n        I - stand-alone s - suspended\n        H - Hot-standby (LACP only)\n        R - Layer3      S - Layer2\n        U - in use      f - failed to allocate aggregator\n\n        M - not in use, minimum links not met\n        u - unsuitable for bundling\n        w - waiting to be aggregated\n        d - default port\n\nNumber of channel-groups in use: ${Object.keys(groups).length}\nNumber of aggregators:           ${Object.keys(groups).length}\n\nGroup  Port-channel  Protocol    Ports\n------+-------------+-----------+-----------------------------------------------\n`;
  if (Object.keys(groups).length === 0) {
    out += '(no EtherChannels configured)';
  }
  for (const g of Object.values(groups)) {
    const proto = g.mode === 'active' || g.mode === 'passive' ? 'LACP' : g.mode === 'desirable' || g.mode === 'auto' ? 'PAgP' : '-';
    out += `${String(g.id).padEnd(7)}Po${g.id}(SU)${' '.repeat(7)}${proto.padEnd(12)}${g.ports.map(p => p + '(P)').join('   ')}\n`;
  }
  return out;
}

export function showEtherchannelDetail(state) {
  return showEtherchannelSummary(state);
}

export function showVtp(state) {
  return `VTP Version capable             : 1 to 3
VTP version running             : ${state.vtpVersion || 1}
VTP Domain Name                 : ${state.vtpDomain || ''}
VTP Pruning Mode                : ${state.vtpPruning ? 'Enabled' : 'Disabled'}
VTP Traps Generation            : Disabled
Device ID                       : aabb.cc00.0100
Configuration last modified by 0.0.0.0 at 0-0-00 00:00:00

Feature VLAN:
--------------
VTP Operating Mode                : ${state.vtpMode || 'Server'}
Maximum VLANs supported locally   : 1005
Number of existing VLANs          : ${Object.keys(state.vlans).length}
Configuration Revision            : 0
MD5 digest                        : 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00`;
}

export function showProcesses() {
  return `CPU utilization for five seconds: 2%/1%; one minute: 3%; five minutes: 2%
 PID QTy       PC Runtime(ms)     Invoked      uSecs    Stacks TTY Process
   1 Csp  80003720          0         156          0  2600/3000   0 Chunk Manager
   2 Lwe  80007ED8          8         100         80  2604/3000   0 Load Meter
   3 Mst  800192E4          0           1          0  2600/3000   0 Scheduler
   4 Lst  80002F44       1856       36124         51  2600/3000   0 Check heaps`;
}

export function showFlash() {
  return `Directory of flash:/\n\n    1  -rw-    11261779  Sep 14 2023 09:42:36 +00:00  c2960-lanbasek9-mz.152-7.E2.bin\n    2  -rw-       3096  Apr 29 2026 00:00:00 +00:00  config.text\n    3  -rw-       2560  Apr 29 2026 00:00:00 +00:00  vlan.dat\n\n57931776 bytes total (46669997 bytes free)`;
}

export function showBoot(state) {
  return `BOOT path-list      : flash:c2960-lanbasek9-mz.152-7.E2.bin
Config file         : flash:config.text
Private Config file : flash:private-config.text
Enable Break        : yes
Manual Boot         : no
Allow Dev Key       : yes
  HELPER path-list  :
  Auto upgrade      : yes
  Auto upgrade path :
NVRAM/Config file
      buffer size:   65536`;
}

export function showUsers(state) {
  return `    Line       User       Host(s)              Idle       Location\n*  0 con 0                 idle                 00:00:00\n\n  Interface    User               Mode         Idle     Peer Address`;
}

export function showSessions() {
  return `% No connections open`;
}

export function showTerminal() {
  return `Line 0, Location: "", Type: ""\nLength: 24 lines, Width: 80 columns\nBaud rate (TX/RX) is 9600/9600\nStatus: Ready, Active, No Exit Banner, Automore On\nCapabilities: none\nMofit: none`;
}

export function showControllers(state) {
  let out = '';
  for (const iface of Object.values(state.interfaces)) {
    if (iface.name.startsWith('Vlan')) continue;
    out += `Interface ${iface.name}\n  Hardware is ${iface.name.startsWith('Giga') ? 'Gigabit Ethernet' : 'Fast Ethernet'}\n  Loopback not set\n`;
  }
  return out;
}

export function showEnvironment() {
  return `Switch 1 FAN 1 is OK\nSwitch 1 FAN 2 is OK\nSW1    POWER 1 is OK\nSW1    POWER 2 is NOT PRESENT\n\nAmbient Temperature Value: 36 Celsius\nTemperature State: GREEN\nYellow Threshold : 46 Celsius\nRed Threshold    : 56 Celsius`;
}

export function showPower() {
  return `Switch: 1\nSystem Power Budget: 370.00W\nSystem Power Used:    15.40W (FAN+Switch)
Power supplies:
  PS1: OK 375W\n  PS2: Not Present\n\nPort    Admin  Oper       Power      Device              Class  Max\n(no powered devices detected)`;
}

export function showInventory() {
  return `NAME: "1", DESCR: "WS-C2960-24TT-L"\nPID: WS-C2960-24TT-L , VID: V02 , SN: FOC1234X5YZ\n\nNAME: "Power Supply 1", DESCR: "Power Supply"\nPID: PWR-C2-640WAC   , VID: V01 , SN: ABCD1234567`;
}

export function showModule() {
  return `Chassis type: WS-C2960-24TT-L\n\nMod Ports Card Type                              Model              Serial No.\n--- ----- -------------------------------------- ------------------ -----------\n  1    26 24 10/100 + 2 1000BaseTX               WS-C2960-24TT-L    FOC1234X5YZ`;
}

export function showPlatform(state) {
  return `Chassis type    : WS-C2960-24TT-L\nMac Address     : aabb.cc00.0100\nSystem uptime   : 2 days, 14 hours, 22 minutes\nSystem restarted at 00:00:00 UTC Wed Jan 1 2025\n\nManufacturing Info: WS-C2960-24TT-L, FOC1234X5YZ`;
}

export function showErrdisable(state) {
  const recovery = state.errdisableRecovery || {};
  let out = `Errdisable Reason            Timer Status\n----------------             --------------\nbpduguard                    ${recovery.bpduguard ? 'Enabled' : 'Disabled'}\nsecurity-violation           ${recovery['security-violation'] ? 'Enabled' : 'Disabled'}\nchannel-misconfig            ${recovery['channel-misconfig'] ? 'Enabled' : 'Disabled'}\nstorm-control                ${recovery['storm-control'] ? 'Enabled' : 'Disabled'}\nlink-flap                    ${recovery['link-flap'] ? 'Enabled' : 'Disabled'}\n\nTimer interval: 300 seconds\n\nInterfaces that will be enabled at the next timeout:\n(none)`;
  return out;
}

export function showUdld(state) {
  return `UDLD is ${state.udld ? 'globally enabled' : 'globally disabled'}\n\nInterface     Mode      Bidirectional State\n-----------   --------  -------------------\n(no udld entries)`;
}

export function showSpanningTreeSummary(state) {
  return `Switch is in ${state.spanningTreeMode || 'pvst'} mode (default is ${state.spanningTreeMode || 'pvst'})\nPortfast Default                      is ${state.spanningTreePortfastDefault ? 'enabled' : 'disabled'}\nPortFast BPDU Guard Default           is disabled\nPortfast BPDU Filter Default          is disabled\nLoopguard Default                     is disabled\nEtherChannel misconfig guard          is enabled\nUplinkFast                            is disabled\nBackboneFast                          is disabled\nConfigured Pathcost method used is short\n\nName                   Blocking Listening Learning Forwarding STP Active\n---------------------- -------- --------- -------- ---------- ----------\nVLAN0001                     0         0        0          4          4\n\n---------------------- -------- --------- -------- ---------- ----------\n1 vlan                       0         0        0          4          4`;
}