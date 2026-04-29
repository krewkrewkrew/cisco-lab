import { getVlanPorts, computePortHealth } from './switchState';

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
  const map = { '255.255.255.0': '24', '255.255.0.0': '16', '255.0.0.0': '8', '255.255.255.128': '25', '255.255.255.192': '26', '255.255.255.252': '30' };
  return map[mask] || '24';
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
    `hostname ${state.hostname}`,
    '!',
  ];

  if (state.enableSecret) {
    lines.push(`enable secret 5 $1$mERr$hx5rVt7rPNoS4wqbXKX7m0`);
    lines.push('!');
  }
  if (state.enablePassword && !state.enableSecret) {
    lines.push(`enable password ${state.enablePassword}`);
    lines.push('!');
  }
  if (state.bannerMotd) {
    lines.push(`banner motd ^C${state.bannerMotd}^C`);
    lines.push('!');
  }

  // VLAN config
  for (const vlan of Object.values(state.vlans)) {
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
    if (iface.name.startsWith('Vlan') && iface.ipAddress !== 'unassigned') {
      lines.push(` ip address ${iface.ipAddress} ${iface.subnetMask}`);
    }
    if (!iface.name.startsWith('Vlan')) {
      if (iface.switchportMode === 'trunk') {
        lines.push(` switchport mode trunk`);
      } else {
        if (iface.accessVlan !== 1) {
          lines.push(` switchport access vlan ${iface.accessVlan}`);
        }
        lines.push(` switchport mode access`);
      }
    }
    if (iface.status === 'down') {
      lines.push(` shutdown`);
    }
    lines.push('!');
  }

  // Line config
  lines.push('line con 0');
  if (state.lines.console.password) {
    lines.push(` password ${state.lines.console.password}`);
    if (state.lines.console.login) lines.push(' login');
  }
  lines.push('line vty 0 4');
  if (state.lines.vty.password) {
    lines.push(` password ${state.lines.vty.password}`);
    if (state.lines.vty.login) lines.push(' login');
  }
  lines.push(' transport input ssh');
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

export function showSpanningTree(state) {
  if (!state.spanningTree) return 'No spanning tree instance exists.';
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

export function showMacAddressTable() {
  return `          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    aabb.cc00.0001    DYNAMIC     Fa0/1
   1    aabb.cc00.0002    DYNAMIC     Fa0/2
   1    aabb.cc00.0003    DYNAMIC     Fa0/3
Total Mac Addresses for this criterion: 3`;
}

export function showArp() {
  return `Protocol  Address          Age (min)  Hardware Addr   Type   Interface
Internet  192.168.1.1             -   aabb.cc00.0100  ARPA   Vlan1
Internet  192.168.1.10            2   aabb.cc00.0001  ARPA   Vlan1`;
}