import { resolveInterfaceName, computePortHealth, appendSyslog } from './switchState';
import { simulatePing } from './pingSimulator';
import { getHelpForMode, showHelp, getCompletions } from './commandHelp';
import {
  showVersion, showInterfaces, showIpInterfaceBrief, showIpInterfaceDetail,
  showVlanBrief, showRunningConfig, showStartupConfig,
  showHistory, showClock, showSpanningTree, showSpanningTreeSummary,
  showMacAddressTable, showArp, showLog,
  showInterfacesStatus, showInterfacesTrunk, showInterfacesSummary, showInterfacesCounters,
  showIpRoute, showIpSsh, showIpAccessLists, showIpDhcp,
  showCdpNeighbors, showCdpInterface, showCdpTraffic,
  showLldpNeighbors,
  showEtherchannelSummary, showEtherchannelDetail,
  showVtp, showProcesses, showFlash, showBoot, showUsers, showSessions,
  showTerminal, showControllers, showEnvironment, showPower, showInventory,
  showModule, showPlatform, showErrdisable, showUdld,
} from './showCommands';

// Parse and execute a command, return { output, newState, newMode, newCurrentInterface }
export function executeCommand(input, switchState, mode, currentInterface, commandHistory) {
  const trimmed = input.trim();
  if (!trimmed) return { output: '' };
  
  // Handle '?' anywhere
  if (trimmed.endsWith('?')) {
    const prefix = trimmed.slice(0, -1).trim();
    if (!prefix) return { output: formatHelp(getHelpForMode(mode)) };
    // Inline help for partial commands
    return { output: formatHelp(getHelpForMode(mode)) };
  }

  // Handle 'do' prefix in config modes
  if ((mode === 'globalConfig' || mode === 'interfaceConfig' || mode === 'vlanConfig' || mode === 'lineConfig') && trimmed.toLowerCase().startsWith('do ')) {
    const subCmd = trimmed.slice(3);
    return executeCommand(subCmd, switchState, 'privileged', currentInterface, commandHistory);
  }

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (mode) {
    case 'user': return executeUserMode(cmd, args, switchState, commandHistory);
    case 'privileged': return executePrivilegedMode(cmd, args, trimmed, switchState, commandHistory);
    case 'globalConfig': return executeGlobalConfig(cmd, args, trimmed, switchState);
    case 'interfaceConfig': return executeInterfaceConfig(cmd, args, trimmed, switchState, currentInterface);
    case 'vlanConfig': return executeVlanConfig(cmd, args, switchState, currentInterface);
    case 'lineConfig': return executeLineConfig(cmd, args, switchState);
    case 'rommonConfig': return { output: 'rommon 1 > ', newMode: 'rommonConfig' };
    default: return { output: invalidCommand(trimmed) };
  }
}

function executeUserMode(cmd, args, state, history) {
  if (cmd === 'enable' || cmd === 'en') {
    const newState = { ...state, visitedPrivileged: true };
    return { output: '', newMode: 'privileged', newState };
  }
  if (cmd === 'exit' || cmd === 'logout') {
    return { output: 'Connection closed.', newMode: 'user' };
  }
  if (cmd === 'show' || cmd === 'sh') {
    return handleShow(args, state, history);
  }
  if (cmd === 'ping') {
    if (args.length === 0) return { output: '% Incomplete command.' };
    return { output: simulatePing(args[0], state) };
  }
  return { output: invalidCommand(cmd) };
}

function executePrivilegedMode(cmd, args, raw, state, history) {
  if (cmd === 'configure' || cmd === 'conf') {
    if (args.length === 0 || args[0].startsWith('t')) {
      const newState = { ...state, visitedGlobalConfig: true };
      return { output: 'Enter configuration commands, one per line.  End with CNTL/Z.', newMode: 'globalConfig', newState };
    }
    return { output: '% Incomplete command.' };
  }
  if (cmd === 'disable' || cmd === 'dis') return { output: '', newMode: 'user' };
  if (cmd === 'exit' || cmd === 'logout') return { output: '', newMode: 'user' };
  if (cmd === 'show' || cmd === 'sh') return handleShow(args, state, history);
  if (cmd === 'copy') return handleCopy(args, state);
  if (cmd === 'write') {
    if (args.length === 0 || args[0] === 'memory' || args[0] === 'mem') {
      const newSyslog = appendSyslog(state, '%SYS-5-CONFIG_I', 'Configured from console by console');
      const newState = { ...state, startupConfig: generateRunConfig(state), configChanged: false, syslog: newSyslog };
      return { output: 'Building configuration...\n[OK]', newState, persist: true };
    }
    if (args[0] === 'erase') {
      const newState = { ...state, startupConfig: null };
      return { output: 'Erasing the nvram filesystem will remove all configuration files! Continue? [confirm]\n[OK]\nErase of nvram: complete', newState, persist: true };
    }
    return { output: '% Incomplete command.' };
  }
  if (cmd === 'erase') {
    if (args[0] === 'startup-config' || args[0] === 'nvram:') {
      const newState = { ...state, startupConfig: null };
      return { output: 'Erasing the nvram filesystem will remove all configuration files! Continue? [confirm]\n[OK]\nErase of nvram: complete', newState, persist: true };
    }
    return { output: '% Incomplete command.' };
  }
  if (cmd === 'reload') {
    return { output: 'Proceed with reload? [confirm]\n\nSystem Bootstrap, Version 15.2(7r)E2\n% Reload requested by console.' };
  }
  if (cmd === 'ping') {
    if (args.length === 0) return { output: '% Incomplete command.' };
    return { output: simulatePing(args[0], state) };
  }
  if (cmd === 'traceroute' || cmd === 'trace') {
    if (args.length === 0) return { output: '% Incomplete command.' };
    return { output: `Type escape sequence to abort.\nTracing the route to ${args[0]}\n\n  1  * * *\n  2  * * *\n  3  * * *\n\n% Destination host unreachable (no route)` };
  }
  if (cmd === 'clock') {
    if (args[0] === 'set') {
      if (args.length < 4) return { output: '% Incomplete command.\n  Usage: clock set HH:MM:SS DAY MONTH YEAR' };
      return { output: '' };
    }
    return { output: '% Incomplete command.' };
  }
  if (cmd === 'clear') {
    if (args[0] === 'mac' || (args[0] === 'mac-address-table')) return { output: '' };
    if (args[0] === 'counters') return { output: 'Clear "show interface" counters on all interfaces [confirm]' };
    if (args[0] === 'arp') return { output: 'Clearing ARP cache' };
    if (args[0] === 'ip' && args[1] === 'arp') return { output: 'Clearing ARP cache' };
    if (args[0] === 'spanning-tree' || args[0] === 'spanning') return { output: '' };
    if (args[0] === 'log') {
      const newState = { ...state, syslog: [] };
      return { output: '', newState };
    }
    if (args[0] === 'line') return { output: '' };
    return { output: '' };
  }
  if (cmd === 'vlan') {
    if (args[0] === 'database') {
      return { output: '% Warning: It is recommended to configure VLAN from config mode.', newMode: 'globalConfig' };
    }
  }
  if (cmd === 'terminal') {
    if (args[0] === 'length') return { output: '' };
    if (args[0] === 'width') return { output: '' };
    if (args[0] === 'monitor') return { output: '' };
    if (args[0] === 'no' && args[1] === 'monitor') return { output: '' };
    return { output: '' };
  }
  if (cmd === 'debug') {
    return { output: `% Debugging enabled for: ${args.join(' ') || 'all'}\n% Warning: debug output may impact device performance.` };
  }
  if (cmd === 'undebug' || cmd === 'un') {
    return { output: `All possible debugging has been turned off` };
  }
  if (cmd === 'no') {
    if (args[0] === 'debug' || args[0] === 'debugging') return { output: 'All possible debugging has been turned off' };
  }
  if (cmd === 'dir') {
    return { output: `Directory of flash:/\n\n    1  -rw-    11261779  Sep 14 2023 09:42:36 +00:00  c2960-lanbasek9-mz.152-7.E2.bin\n\n57931776 bytes total (46669997 bytes free)` };
  }
  if (cmd === 'more') {
    if (args[0] === 'flash:running-config' || args[0] === 'system:running-config') {
      return { output: generateRunConfig(state) };
    }
    return { output: '% File not found.' };
  }
  if (cmd === 'rename') return { output: '' };
  if (cmd === 'delete') return { output: '' };
  if (cmd === 'format') return { output: '% Format not supported in simulation.' };
  if (cmd === 'squeeze') return { output: '' };
  if (cmd === 'verify') return { output: `verify /md5 flash:c2960-lanbasek9-mz.152-7.E2.bin\n.............................\nDone!\nMD5 verified OK` };
  if (cmd === 'send') return { output: '% Not supported in simulation.' };
  if (cmd === 'ssh') return { output: '% SSH connection not available in simulation.' };
  if (cmd === 'telnet') return { output: '% Telnet connection not available in simulation.' };
  if (cmd === 'setup') return { output: '         --- System Configuration Dialog ---\n\n% Exiting setup mode.' };
  return { output: invalidCommand(cmd) };
}

function executeGlobalConfig(cmd, args, raw, state) {
  if (cmd === 'hostname') {
    if (args.length === 0) return { output: '% Incomplete command.' };
    return { output: '', newState: { ...state, hostname: args[0], configChanged: true } };
  }

  if (cmd === 'enable') {
    if (args[0] === 'secret') {
      if (args.length < 2) return { output: '% Incomplete command.' };
      return { output: '', newState: { ...state, enableSecret: args[1], configChanged: true } };
    }
    if (args[0] === 'password') {
      if (args.length < 2) return { output: '% Incomplete command.' };
      return { output: '', newState: { ...state, enablePassword: args[1], configChanged: true } };
    }
    return { output: '% Incomplete command.' };
  }

  if (cmd === 'username') {
    if (args.length < 3) return { output: '% Incomplete command.' };
    const users = { ...(state.users || {}) };
    const uname = args[0];
    const passIdx = args.findIndex(a => a === 'password' || a === 'secret');
    if (passIdx >= 0 && args[passIdx + 1]) {
      users[uname] = { username: uname, privilege: parseInt(args[args.findIndex(a => a === 'privilege') + 1] || '1'), password: args[passIdx + 1], secret: args[0] === 'secret' };
      return { output: '', newState: { ...state, users, configChanged: true } };
    }
    return { output: '% Incomplete command.' };
  }

  if (cmd === 'no' && args[0] === 'username') {
    const users = { ...(state.users || {}) };
    delete users[args[1]];
    return { output: '', newState: { ...state, users, configChanged: true } };
  }

  if (cmd === 'interface' || cmd === 'int') {
    // Handle interface range
    const rawArgs = args.join(' ');
    if (rawArgs.toLowerCase().startsWith('range ') || cmd === 'interface' && args[0] === 'range') {
      return { output: '% Interface range configuration not supported in this simulation.\n  Configure interfaces individually.' };
    }
    const ifaceName = resolveInterfaceName(args.join(''));
    if (!ifaceName || !state.interfaces[ifaceName]) {
      const vlanMatch = args.join('').match(/^vlan\s*(\d+)$/i);
      if (vlanMatch) {
        const vlanId = parseInt(vlanMatch[1]);
        const sviName = `Vlan${vlanId}`;
        if (!state.interfaces[sviName]) {
          const newInterfaces = { ...state.interfaces };
          newInterfaces[sviName] = {
            name: sviName, shortName: `Vl${vlanId}`, status: 'up', protocol: 'up',
            description: '', speed: '', duplex: '', switchportMode: 'svi', accessVlan: 0,
            trunkAllowedVlans: '', ipAddress: 'unassigned', subnetMask: '', mtu: 1500,
            bandwidth: 100000, inputPackets: 0, outputPackets: 0, inputErrors: 0, outputErrors: 0, crc: 0,
          };
          return { output: '', newMode: 'interfaceConfig', newCurrentInterface: sviName, newState: { ...state, interfaces: newInterfaces, configChanged: true } };
        }
        return { output: '', newMode: 'interfaceConfig', newCurrentInterface: sviName };
      }
      return { output: `% Invalid input detected at '^' marker.\n\n% Bad interface name.` };
    }
    return { output: '', newMode: 'interfaceConfig', newCurrentInterface: ifaceName };
  }

  if (cmd === 'vlan') {
    if (args.length === 0) return { output: '% Incomplete command.' };
    const vlanId = parseInt(args[0]);
    if (isNaN(vlanId) || vlanId < 2 || vlanId > 4094) {
      return { output: '% Invalid VLAN ID - valid range is 2-4094.' };
    }
    const newVlans = { ...state.vlans };
    if (!newVlans[vlanId]) {
      newVlans[vlanId] = { id: vlanId, name: `VLAN${String(vlanId).padStart(4, '0')}`, status: 'active', ports: [] };
    }
    return { output: '', newMode: 'vlanConfig', newCurrentInterface: String(vlanId), newState: { ...state, vlans: newVlans, configChanged: true } };
  }

  if (cmd === 'no') {
    if (args[0] === 'vlan' && args[1]) {
      const vlanId = parseInt(args[1]);
      if (state.vlans[vlanId] && vlanId !== 1 && vlanId < 1002) {
        const newVlans = { ...state.vlans };
        delete newVlans[vlanId];
        return { output: '', newState: { ...state, vlans: newVlans, configChanged: true } };
      }
      return { output: '% Default VLAN cannot be deleted.' };
    }
    if (args[0] === 'hostname') return { output: '', newState: { ...state, hostname: 'Switch', configChanged: true } };
    if (args[0] === 'enable') return { output: '', newState: { ...state, enableSecret: '', enablePassword: '', configChanged: true } };
    if (args[0] === 'banner') return { output: '', newState: { ...state, bannerMotd: '', configChanged: true } };
    if (args[0] === 'ip' && args[1] === 'routing') return { output: '', newState: { ...state, ipRouting: false, configChanged: true } };
    if (args[0] === 'ip' && args[1] === 'domain-lookup') return { output: '', newState: { ...state, ipDomainLookup: false, configChanged: true } };
    if (args[0] === 'cdp' && args[1] === 'run') return { output: '', newState: { ...state, cdp: false, configChanged: true } };
    if (args[0] === 'spanning-tree') return { output: '', newState: { ...state, spanningTree: false, configChanged: true } };
    if (args[0] === 'service' && args[1] === 'password-encryption') return { output: '', newState: { ...state, servicePasswordEncryption: false, configChanged: true } };
    if (args[0] === 'logging') return { output: '', newState: { ...state, loggingEnabled: false, configChanged: true } };
    return { output: '' };
  }

  if (cmd === 'banner') {
    if (args[0] === 'motd') {
      const motdText = args.slice(1).join(' ').replace(/^\^C/, '').replace(/\^C$/, '').replace(/^#/, '').replace(/#$/, '');
      return { output: '', newState: { ...state, bannerMotd: motdText, configChanged: true } };
    }
    if (args[0] === 'login') {
      const loginText = args.slice(1).join(' ').replace(/^\^C/, '').replace(/\^C$/, '');
      return { output: '', newState: { ...state, bannerLogin: loginText, configChanged: true } };
    }
    return { output: '% Incomplete command.' };
  }

  if (cmd === 'line') {
    if (args[0] === 'con' || args[0] === 'console') return { output: '', newMode: 'lineConfig', newCurrentInterface: 'con0' };
    if (args[0] === 'vty') return { output: '', newMode: 'lineConfig', newCurrentInterface: `vty${args[1] || '0'}` };
    if (args[0] === 'aux') return { output: '', newMode: 'lineConfig', newCurrentInterface: 'aux0' };
    return { output: '% Incomplete command.' };
  }

  if (cmd === 'service') {
    if (args[0] === 'password-encryption') return { output: '', newState: { ...state, servicePasswordEncryption: true, configChanged: true } };
    if (args[0] === 'timestamps') return { output: '', newState: { ...state, serviceTimestamps: args.slice(1).join(' '), configChanged: true } };
    if (args[0] === 'dhcp') return { output: '', newState: { ...state, dhcpEnabled: true, configChanged: true } };
    if (args[0] === 'compress-config') return { output: '' };
    return { output: '' };
  }

  if (cmd === 'ip') {
    if (args[0] === 'routing') return { output: '', newState: { ...state, ipRouting: true, configChanged: true } };
    if (args[0] === 'default-gateway') {
      if (!args[1]) return { output: '% Incomplete command.' };
      return { output: '', newState: { ...state, defaultGateway: args[1], configChanged: true } };
    }
    if (args[0] === 'domain-name') {
      if (!args[1]) return { output: '% Incomplete command.' };
      return { output: '', newState: { ...state, domainName: args[1], configChanged: true } };
    }
    if (args[0] === 'domain-lookup') return { output: '', newState: { ...state, ipDomainLookup: true, configChanged: true } };
    if (args[0] === 'name-server') {
      if (!args[1]) return { output: '% Incomplete command.' };
      return { output: '', newState: { ...state, nameServer: args[1], configChanged: true } };
    }
    if (args[0] === 'ssh') {
      if (args[1] === 'version') return { output: '', newState: { ...state, sshVersion: parseInt(args[2] || '2'), configChanged: true } };
      if (args[1] === 'time-out') return { output: '', newState: { ...state, sshTimeout: parseInt(args[2] || '120'), configChanged: true } };
      if (args[1] === 'authentication-retries') return { output: '', newState: { ...state, sshAuthRetries: parseInt(args[2] || '3'), configChanged: true } };
      return { output: '' };
    }
    if (args[0] === 'http') return { output: '' };
    if (args[0] === 'access-list') return { output: '', newState: { ...state, configChanged: true } };
    if (args[0] === 'route') {
      if (args.length < 3) return { output: '% Incomplete command.' };
      const routes = [...(state.staticRoutes || [])];
      routes.push({ network: args[1], mask: args[2], nexthop: args[3] || null });
      return { output: '', newState: { ...state, staticRoutes: routes, configChanged: true } };
    }
    return { output: '' };
  }

  if (cmd === 'spanning-tree') {
    if (args[0] === 'mode') {
      const mode = args[1];
      if (['pvst', 'rapid-pvst', 'mst'].includes(mode)) {
        return { output: '', newState: { ...state, spanningTreeMode: mode, configChanged: true } };
      }
      return { output: '% Invalid spanning-tree mode.' };
    }
    if (args[0] === 'vlan') {
      // spanning-tree vlan <id> priority <value>
      if (args[2] === 'priority') {
        const pri = parseInt(args[3]);
        if (isNaN(pri) || pri % 4096 !== 0) return { output: '% Bridge Priority must be in increments of 4096.' };
        return { output: '', newState: { ...state, configChanged: true } };
      }
      if (args[2] === 'root') {
        return { output: '', newState: { ...state, configChanged: true } };
      }
      return { output: '' };
    }
    if (args[0] === 'portfast' && args[1] === 'default') {
      return { output: '', newState: { ...state, spanningTreePortfastDefault: true, configChanged: true } };
    }
    if (args[0] === 'extend' && args[1] === 'system-id') {
      return { output: '', newState: { ...state, spanningTreeExtendSystemId: true, configChanged: true } };
    }
    return { output: '', newState: { ...state, spanningTree: true, configChanged: true } };
  }

  if (cmd === 'cdp') {
    if (args[0] === 'run') return { output: '', newState: { ...state, cdp: true, configChanged: true } };
    return { output: '' };
  }

  if (cmd === 'logging') {
    if (args[0] === 'on') return { output: '', newState: { ...state, loggingEnabled: true, configChanged: true } };
    if (args[0] === 'buffered') return { output: '', newState: { ...state, loggingBuffered: args[1] || '4096', configChanged: true } };
    if (args[0] === 'console') return { output: '', newState: { ...state, loggingConsole: args[1] || 'informational', configChanged: true } };
    if (args[0] === 'trap') return { output: '', newState: { ...state, loggingTrap: args[1], configChanged: true } };
    if (args[0] === 'host') return { output: '', newState: { ...state, loggingHost: args[1], configChanged: true } };
    if (args[0] === 'synchronous') return { output: '' };
    // logging <ip-address>
    return { output: '', newState: { ...state, loggingEnabled: true, configChanged: true } };
  }

  if (cmd === 'ntp') {
    if (args[0] === 'server') return { output: '', newState: { ...state, ntpServer: args[1], configChanged: true } };
    if (args[0] === 'master') return { output: '', newState: { ...state, ntpMaster: true, configChanged: true } };
    if (args[0] === 'source') return { output: '', newState: { ...state, ntpSource: args[1], configChanged: true } };
    return { output: '' };
  }

  if (cmd === 'snmp-server') {
    if (args[0] === 'community') return { output: '', newState: { ...state, snmpCommunity: { string: args[1], access: args[2] || 'RO' }, configChanged: true } };
    if (args[0] === 'host') return { output: '', newState: { ...state, snmpHost: args[1], configChanged: true } };
    if (args[0] === 'enable') return { output: '', newState: { ...state, snmpEnabled: true, configChanged: true } };
    if (args[0] === 'location') return { output: '', newState: { ...state, snmpLocation: args.slice(1).join(' '), configChanged: true } };
    if (args[0] === 'contact') return { output: '', newState: { ...state, snmpContact: args.slice(1).join(' '), configChanged: true } };
    return { output: '' };
  }

  if (cmd === 'aaa') {
    return { output: '', newState: { ...state, aaaEnabled: true, configChanged: true } };
  }

  if (cmd === 'crypto') {
    if (args[0] === 'key' && args[1] === 'generate' && args[2] === 'rsa') {
      const bits = parseInt(args[args.findIndex(a => a === 'modulus') + 1] || '1024');
      return { output: `The name for the keys will be: ${state.hostname}.${state.domainName || 'cisco.com'}\nChoosing the size of the key modulus in the range of 360 to 4096 for your\n  General Purpose Keys. Choosing a key modulus greater than 512 may take\n  a few minutes.\n\nHow many bits in the modulus [512]: ${bits}\n% Generating ${bits} bit RSA keys, keys will be non-exportable...\n[OK] (elapsed time was 1 seconds)` };
    }
    if (args[0] === 'key' && args[1] === 'zeroize') {
      return { output: '% Keys to be removed are named Switch.cisco.com.\nDo you really want to remove these keys? [yes/no]: yes\n% All RSA keys removed.' };
    }
    return { output: '' };
  }

  if (cmd === 'access-list') {
    return { output: '', newState: { ...state, configChanged: true } };
  }

  if (cmd === 'ip-access-list' || cmd === 'mac') return { output: '' };

  if (cmd === 'vtp') {
    if (args[0] === 'mode') {
      if (['server', 'client', 'transparent', 'off'].includes(args[1])) {
        return { output: `Setting device to VTP ${args[1]} mode.`, newState: { ...state, vtpMode: args[1], configChanged: true } };
      }
      return { output: '% Invalid VTP mode.' };
    }
    if (args[0] === 'domain') return { output: `Changing VTP domain name from NULL to ${args[1]}`, newState: { ...state, vtpDomain: args[1], configChanged: true } };
    if (args[0] === 'password') return { output: '', newState: { ...state, vtpPassword: args[1], configChanged: true } };
    if (args[0] === 'version') return { output: '', newState: { ...state, vtpVersion: parseInt(args[1] || '1'), configChanged: true } };
    if (args[0] === 'pruning') return { output: '', newState: { ...state, vtpPruning: true, configChanged: true } };
    return { output: '' };
  }

  if (cmd === 'errdisable') {
    if (args[0] === 'recovery') {
      const newState = { ...state, errdisableRecovery: { ...(state.errdisableRecovery || {}), [args[2]]: true }, configChanged: true };
      return { output: '', newState };
    }
    return { output: '' };
  }

  if (cmd === 'udld') return { output: '', newState: { ...state, udld: args[0] || 'enable', configChanged: true } };

  if (cmd === 'lldp') {
    if (args[0] === 'run') return { output: '', newState: { ...state, lldp: true, configChanged: true } };
    return { output: '' };
  }

  if (cmd === 'clock') {
    if (args[0] === 'timezone') return { output: '', newState: { ...state, clockTimezone: args[1], configChanged: true } };
    if (args[0] === 'summer-time') return { output: '', newState: { ...state, configChanged: true } };
    return { output: '' };
  }

  if (cmd === 'end') return { output: '', newMode: 'privileged', newState: { ...state, returnedToPrivileged: true } };
  if (cmd === 'exit') return { output: '', newMode: 'privileged' };

  return { output: invalidCommand(cmd) };
}

function executeInterfaceConfig(cmd, args, raw, state, currentInterface) {
  const iface = state.interfaces[currentInterface];
  if (!iface) return { output: '% Interface not found.' };

  const updateIface = (updates, extraOutput = '') => {
    const newInterfaces = { ...state.interfaces };
    const updatedIface = { ...iface, ...updates };
    newInterfaces[currentInterface] = updatedIface;
    let newState = { ...state, interfaces: newInterfaces, configChanged: true };

    // Compute health after change and emit syslog-style warning if protocol goes down
    const health = computePortHealth(updatedIface, newState);
    const shortName = updatedIface.shortName || currentInterface;
    let syslog = extraOutput;

    if (health.protocol === 'down' && updatedIface.status !== 'down') {
      const msg = `Line protocol on Interface ${shortName}, changed state to down`;
      newState = { ...newState, syslog: appendSyslog(newState, '%LINEPROTO-5-UPDOWN', msg) };
      syslog += `\n%LINEPROTO-5-UPDOWN: ${msg}${health.reason ? `\n  Reason: ${health.reason}` : ''}`;
    } else if (health.protocol === 'up' && iface.status === 'down' && updates.status === 'up') {
      const msg = `Line protocol on Interface ${shortName}, changed state to up`;
      newState = { ...newState, syslog: appendSyslog(newState, '%LINEPROTO-5-UPDOWN', msg) };
      syslog += `\n%LINEPROTO-5-UPDOWN: ${msg}`;
    }

    // Log shutdown/no shutdown as LINK events
    if (updates.status === 'down') {
      const msg = `Interface ${shortName}, changed state to administratively down`;
      newState = { ...newState, syslog: appendSyslog(newState, '%LINK-5-CHANGED', msg) };
    } else if (updates.status === 'up' && iface.status === 'down') {
      const msg = `Interface ${shortName}, changed state to up`;
      newState = { ...newState, syslog: appendSyslog(newState, '%LINK-3-UPDOWN', msg) };
    }

    return { output: syslog.trim(), newState };
  };

  if (cmd === 'shutdown') {
    return updateIface({ status: 'down', protocol: 'down' });
  }
  if (cmd === 'no') {
    if (args[0] === 'shutdown') {
      return updateIface({ status: 'up', protocol: 'up' });
    }
    if (args[0] === 'switchport' && args.length === 1) {
      // Convert physical interface to routed (layer-3) mode
      return updateIface({ switchportMode: 'routed', accessVlan: 0, trunkAllowedVlans: '' });
    }
    if (args[0] === 'switchport' && args[1] === 'access' && args[2] === 'vlan') {
      return updateIface({ accessVlan: 1 });
    }
    if (args[0] === 'ip' && args[1] === 'address') {
      return updateIface({ ipAddress: 'unassigned', subnetMask: '' });
    }
    if (args[0] === 'description') {
      return updateIface({ description: '' });
    }
    return { output: '' };
  }
  if (cmd === 'switchport' && args.length === 0) {
    // Re-enable switchport mode on a routed interface
    return updateIface({ switchportMode: 'access', accessVlan: 1, ipAddress: 'unassigned', subnetMask: '' });
  }
  if (cmd === 'description') {
    return updateIface({ description: args.join(' ') });
  }
  if (cmd === 'switchport') {
    if (args[0] === 'mode') {
      if (args[1] === 'access') return updateIface({ switchportMode: 'access' });
      if (args[1] === 'trunk') return updateIface({ switchportMode: 'trunk' });
      if (args[1] === 'dynamic') {
        if (args[2] === 'auto') return updateIface({ switchportMode: 'dynamic auto' });
        if (args[2] === 'desirable') return updateIface({ switchportMode: 'dynamic desirable' });
      }
      return { output: '% Incomplete command.' };
    }
    if (args[0] === 'access') {
      if (args[1] === 'vlan') {
        const vlanId = parseInt(args[2]);
        if (isNaN(vlanId) || !state.vlans[vlanId]) return { output: `% Access VLAN does not exist.` };
        return updateIface({ accessVlan: vlanId });
      }
      return { output: '% Incomplete command.' };
    }
    if (args[0] === 'trunk') {
      if (args[1] === 'encapsulation') {
        if (['dot1q', 'isl', 'negotiate'].includes(args[2])) return updateIface({ trunkEncapsulation: args[2] });
        return { output: '% Invalid encapsulation type.' };
      }
      if (args[1] === 'allowed' && args[2] === 'vlan') {
        const vlanStr = args.slice(3).join('');
        if (vlanStr === 'all') return updateIface({ trunkAllowedVlans: 'ALL' });
        if (vlanStr === 'none') return updateIface({ trunkAllowedVlans: 'NONE' });
        // add / remove / except
        if (args[3] === 'add') return updateIface({ trunkAllowedVlans: (iface.trunkAllowedVlans && iface.trunkAllowedVlans !== 'ALL' ? iface.trunkAllowedVlans + ',' : '') + args.slice(4).join('') });
        if (args[3] === 'remove') return updateIface({ trunkAllowedVlans: iface.trunkAllowedVlans }); // simplified
        if (args[3] === 'except') return updateIface({ trunkAllowedVlans: `except ${args.slice(4).join('')}` });
        return updateIface({ trunkAllowedVlans: args.slice(3).join('') });
      }
      if (args[1] === 'native' && args[2] === 'vlan') {
        const nativeVlan = parseInt(args[3]);
        if (isNaN(nativeVlan) || nativeVlan < 1 || nativeVlan > 4094) return { output: '% Invalid VLAN ID.' };
        return updateIface({ nativeVlan });
      }
      if (args[1] === 'pruning' && args[2] === 'vlan') {
        return updateIface({ trunkPruningVlans: args.slice(3).join('') });
      }
      return { output: '% Incomplete command.' };
    }
    if (args[0] === 'nonegotiate') return updateIface({ nonegotiate: true });
    if (args[0] === 'voice') {
      if (args[1] === 'vlan') {
        const voiceVlan = parseInt(args[2]);
        if (isNaN(voiceVlan)) return { output: '% Incomplete command.' };
        if (!state.vlans[voiceVlan] && voiceVlan !== 1) return { output: `% Voice VLAN does not exist.` };
        return updateIface({ voiceVlan });
      }
      return { output: '% Incomplete command.' };
    }
    if (args[0] === 'protected') return updateIface({ switchportProtected: true });
    if (args[0] === 'block') return updateIface({ [`switchportBlock_${args[1]}`]: true });
    if (args[0] === 'port-security') return handlePortSecurity(args.slice(1), iface, updateIface);
    return { output: '% Incomplete command.' };
  }
  if (cmd === 'speed') {
    const valid = ['10', '100', '1000', 'auto', 'nonegotiate'];
    if (valid.includes(args[0])) return updateIface({ speed: args[0] === 'auto' ? 'auto' : args[0] + 'Mb/s' });
    return { output: '% Invalid input.' };
  }
  if (cmd === 'duplex') {
    const valid = ['full', 'half', 'auto'];
    if (valid.includes(args[0]?.toLowerCase())) return updateIface({ duplex: args[0].toLowerCase() });
    return { output: '% Invalid input.' };
  }
  if (cmd === 'mtu') {
    const mtu = parseInt(args[0]);
    if (isNaN(mtu) || mtu < 1500 || mtu > 9000) return { output: '% Invalid MTU value. Valid range is 1500-9000.' };
    return updateIface({ mtu });
  }
  if (cmd === 'spanning-tree') {
    if (args[0] === 'portfast') {
      const enabled = args[1] !== 'disable';
      return updateIface({ spanningTreePortfast: enabled });
    }
    if (args[0] === 'bpduguard') {
      const enabled = args[1] === 'enable';
      return updateIface({ spanningTreeBpduguard: enabled });
    }
    if (args[0] === 'bpdufilter') {
      return updateIface({ spanningTreeBpdufilter: args[1] === 'enable' });
    }
    if (args[0] === 'guard') {
      return updateIface({ spanningTreeGuard: args[1] || 'root' });
    }
    if (args[0] === 'cost') return updateIface({ spanningTreeCost: parseInt(args[1]) });
    if (args[0] === 'port-priority') return updateIface({ spanningTreePortPriority: parseInt(args[1]) });
    if (args[0] === 'vlan') return { output: '' };
    return { output: '' };
  }
  if (cmd === 'storm-control') {
    if (args[0] === 'broadcast' || args[0] === 'multicast' || args[0] === 'unicast') {
      if (args[1] === 'level') {
        return updateIface({ [`stormControl${args[0].charAt(0).toUpperCase() + args[0].slice(1)}`]: args[2] });
      }
      if (args[1] === 'action') {
        return updateIface({ stormControlAction: args[2] || 'shutdown' });
      }
      return { output: '% Incomplete command.' };
    }
    if (args[0] === 'action') {
      return updateIface({ stormControlAction: args[1] || 'shutdown' });
    }
    return { output: '% Incomplete command.' };
  }
  if (cmd === 'channel-group') {
    const id = parseInt(args[0]);
    if (isNaN(id) || id < 1 || id > 48) return { output: '% Invalid channel-group number. Valid range: 1-48.' };
    const mode = args[2] || 'on';
    const validModes = ['active', 'passive', 'on', 'desirable', 'auto'];
    if (args[1] === 'mode' && !validModes.includes(mode)) return { output: `% Invalid channel-group mode. Valid: ${validModes.join(', ')}` };
    return updateIface({ channelGroup: id, channelGroupMode: args[1] === 'mode' ? mode : 'on' });
  }
  if (cmd === 'channel-protocol') {
    if (args[0] === 'lacp' || args[0] === 'pagp') return updateIface({ channelProtocol: args[0] });
    return { output: '% Invalid protocol. Use lacp or pagp.' };
  }
  if (cmd === 'flowcontrol') {
    if (args[0] === 'receive' || args[0] === 'send') {
      const val = args[1];
      if (!['on', 'off', 'desired'].includes(val)) return { output: '% Invalid flowcontrol value.' };
      return updateIface({ [`flowcontrol_${args[0]}`]: val });
    }
    return { output: '% Incomplete command.' };
  }
  if (cmd === 'carrier-delay') {
    return updateIface({ carrierDelay: parseInt(args[0] || '2') });
  }
  if (cmd === 'keepalive') {
    return updateIface({ keepalive: parseInt(args[0] || '10') });
  }
  if (cmd === 'cdp') {
    if (args[0] === 'enable') return updateIface({ cdpEnabled: true });
    return { output: '' };
  }
  if (cmd === 'ip') {
    if (args[0] === 'address') {
      if (args.length < 3) return { output: '% Incomplete command.' };
      const isPhysical = currentInterface.startsWith('FastEthernet') || currentInterface.startsWith('GigabitEthernet');
      if (isPhysical && iface.switchportMode !== 'routed') {
        return { output: '% IP addresses may not be configured on L2 links.\n  Use "no switchport" to convert this to a routed interface first.' };
      }
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(args[1]) || !ipRegex.test(args[2])) return { output: '% Invalid IP address or subnet mask.' };
      const secondary = args[3] === 'secondary';
      if (secondary) {
        const secondaries = [...(iface.secondaryIps || []), { ip: args[1], mask: args[2] }];
        return updateIface({ secondaryIps: secondaries });
      }
      return updateIface({ ipAddress: args[1], subnetMask: args[2] });
    }
    if (args[0] === 'access-group') return updateIface({ [`ipAccessGroup_${args[2] || 'in'}`]: args[1] });
    if (args[0] === 'helper-address') {
      if (!args[1]) return { output: '% Incomplete command.' };
      const helpers = [...(iface.helperAddresses || []), args[1]];
      return updateIface({ helperAddresses: helpers });
    }
    if (args[0] === 'proxy-arp') return updateIface({ proxyArp: true });
    if (args[0] === 'directed-broadcast') return updateIface({ directedBroadcast: true });
    if (args[0] === 'ospf') return { output: '' };
    if (args[0] === 'dhcp') return { output: '' };
    return { output: '% Incomplete command.' };
  }
  if (cmd === 'no') {
    if (args[0] === 'shutdown') return updateIface({ status: 'up', protocol: 'up' });
    if (args[0] === 'switchport' && args.length === 1) return updateIface({ switchportMode: 'routed', accessVlan: 0, trunkAllowedVlans: '' });
    if (args[0] === 'switchport' && args[1] === 'access' && args[2] === 'vlan') return updateIface({ accessVlan: 1 });
    if (args[0] === 'switchport' && args[1] === 'trunk' && args[2] === 'native' && args[3] === 'vlan') return updateIface({ nativeVlan: 1 });
    if (args[0] === 'switchport' && args[1] === 'trunk' && args[2] === 'allowed') return updateIface({ trunkAllowedVlans: 'ALL' });
    if (args[0] === 'switchport' && args[1] === 'nonegotiate') return updateIface({ nonegotiate: false });
    if (args[0] === 'ip' && args[1] === 'address') return updateIface({ ipAddress: 'unassigned', subnetMask: '', secondaryIps: [] });
    if (args[0] === 'ip' && args[1] === 'proxy-arp') return updateIface({ proxyArp: false });
    if (args[0] === 'ip' && args[1] === 'helper-address') return updateIface({ helperAddresses: [] });
    if (args[0] === 'description') return updateIface({ description: '' });
    if (args[0] === 'spanning-tree' && args[1] === 'portfast') return updateIface({ spanningTreePortfast: false });
    if (args[0] === 'spanning-tree' && args[1] === 'bpduguard') return updateIface({ spanningTreeBpduguard: false });
    if (args[0] === 'spanning-tree' && args[1] === 'bpdufilter') return updateIface({ spanningTreeBpdufilter: false });
    if (args[0] === 'channel-group') return updateIface({ channelGroup: null, channelGroupMode: null });
    if (args[0] === 'storm-control') return updateIface({ stormControlBroadcast: null, stormControlMulticast: null, stormControlUnicast: null });
    if (args[0] === 'cdp') return updateIface({ cdpEnabled: false });
    if (args[0] === 'keepalive') return updateIface({ keepalive: null });
    return { output: '' };
  }
  if (cmd === 'exit') return { output: '', newMode: 'globalConfig', newCurrentInterface: null };
  if (cmd === 'end') return { output: '', newMode: 'privileged', newCurrentInterface: null };
  return { output: invalidCommand(cmd) };
}

function handlePortSecurity(args, iface, updateIface) {
  if (args.length === 0) return updateIface({ portSecurityEnabled: true });
  if (args[0] === 'maximum') return updateIface({ portSecurityMaximum: parseInt(args[1] || '1') });
  if (args[0] === 'violation') {
    const mode = args[1];
    if (!['protect', 'restrict', 'shutdown'].includes(mode)) return { output: '% Invalid violation mode.' };
    return updateIface({ portSecurityViolation: mode });
  }
  if (args[0] === 'mac-address') {
    if (args[1] === 'sticky') return updateIface({ portSecuritySticky: true });
    return updateIface({ portSecurityMacAddress: args[1] });
  }
  if (args[0] === 'aging') return updateIface({ portSecurityAging: args[1] === 'time' ? parseInt(args[2] || '0') : null });
  return { output: '% Incomplete command.' };
}

function executeLineConfig(cmd, args, state) {
  if (cmd === 'password') {
    if (!args[0]) return { output: '% Incomplete command.' };
    return { output: '', newState: { ...state, lines: { ...state.lines, vty: { ...state.lines.vty, password: args[0] } }, configChanged: true } };
  }
  if (cmd === 'login') {
    const local = args[0] === 'local';
    return { output: '', newState: { ...state, lines: { ...state.lines, vty: { ...state.lines.vty, login: true, loginLocal: local } }, configChanged: true } };
  }
  if (cmd === 'no') {
    if (args[0] === 'login') return { output: '', newState: { ...state, lines: { ...state.lines, vty: { ...state.lines.vty, login: false } }, configChanged: true } };
    if (args[0] === 'password') return { output: '', newState: { ...state, lines: { ...state.lines, vty: { ...state.lines.vty, password: '' } }, configChanged: true } };
    if (args[0] === 'exec-timeout') return { output: '', newState: { ...state, configChanged: true } };
    return { output: '' };
  }
  if (cmd === 'transport') {
    if (args[0] === 'input') return { output: '', newState: { ...state, lines: { ...state.lines, vty: { ...state.lines.vty, transport: args.slice(1).join(' ') } }, configChanged: true } };
    if (args[0] === 'output') return { output: '' };
    return { output: '% Incomplete command.' };
  }
  if (cmd === 'exec-timeout') {
    const min = parseInt(args[0] || '10');
    const sec = parseInt(args[1] || '0');
    return { output: '', newState: { ...state, lines: { ...state.lines, vty: { ...state.lines.vty, execTimeout: min * 60 + sec } }, configChanged: true } };
  }
  if (cmd === 'logging') {
    if (args[0] === 'synchronous') return { output: '', newState: { ...state, configChanged: true } };
    return { output: '' };
  }
  if (cmd === 'privilege') {
    if (args[0] === 'level') return { output: '', newState: { ...state, configChanged: true } };
    return { output: '' };
  }
  if (cmd === 'length') return { output: '' };
  if (cmd === 'width') return { output: '' };
  if (cmd === 'stopbits') return { output: '' };
  if (cmd === 'speed') return { output: '' };
  if (cmd === 'flowcontrol') return { output: '' };
  if (cmd === 'history') return { output: '' };
  if (cmd === 'session-timeout') return { output: '' };
  if (cmd === 'exit') return { output: '', newMode: 'globalConfig', newCurrentInterface: null };
  if (cmd === 'end') return { output: '', newMode: 'privileged', newCurrentInterface: null };
  return { output: invalidCommand(cmd) };
}

function executeVlanConfig(cmd, args, state, currentVlanId) {
  const vlanId = parseInt(currentVlanId);

  if (cmd === 'name') {
    if (args.length === 0) return { output: '% Incomplete command.' };
    const newVlans = { ...state.vlans };
    newVlans[vlanId] = { ...newVlans[vlanId], name: args.join(' ') };
    return { output: '', newState: { ...state, vlans: newVlans, configChanged: true } };
  }
  if (cmd === 'state') {
    if (args[0] === 'active' || args[0] === 'suspend') {
      const newVlans = { ...state.vlans };
      newVlans[vlanId] = { ...newVlans[vlanId], status: args[0] };
      return { output: '', newState: { ...state, vlans: newVlans, configChanged: true } };
    }
    return { output: '% Invalid input.' };
  }
  if (cmd === 'no') {
    if (args[0] === 'name') {
      const newVlans = { ...state.vlans };
      newVlans[vlanId] = { ...newVlans[vlanId], name: `VLAN${String(vlanId).padStart(4, '0')}` };
      return { output: '', newState: { ...state, vlans: newVlans, configChanged: true } };
    }
    return { output: '' };
  }
  if (cmd === 'mtu') return { output: '' };
  if (cmd === 'exit') return { output: '', newMode: 'globalConfig', newCurrentInterface: null };
  if (cmd === 'end') return { output: '', newMode: 'privileged', newCurrentInterface: null };
  return { output: invalidCommand(cmd) };
}

function handleShow(args, state, history) {
  if (args.length === 0) {
    return { output: '% Incomplete command.\nType "show ?" for a list of subcommands.' };
  }
  const sub = args[0].toLowerCase();

  if (sub === '?') return { output: formatHelp(showHelp) };
  if (sub === 'version' || sub === 'ver') return { output: showVersion(state) };
  if (sub === 'running-config' || sub === 'run') return { output: showRunningConfig(state), newState: { ...state, viewedRunningConfig: true } };
  if (sub === 'startup-config' || sub === 'start') return { output: showStartupConfig(state) };

  if (sub === 'interfaces' || sub === 'int') {
    const rest = args.slice(1);
    if (rest.length > 0) {
      // show interfaces status / trunk / summary
      if (rest[0] === 'status') return { output: showInterfacesStatus(state) };
      if (rest[0] === 'trunk') return { output: showInterfacesTrunk(state) };
      if (rest[0] === 'summary') return { output: showInterfacesSummary(state) };
      if (rest[0] === 'counters') return { output: showInterfacesCounters(state) };
      const ifaceName = resolveInterfaceName(rest.join(''));
      if (ifaceName && state.interfaces[ifaceName]) return { output: showInterfaces(state, ifaceName) };
      return { output: `% Invalid input detected at '^' marker.` };
    }
    return { output: showInterfaces(state) };
  }

  if (sub === 'ip') {
    const sub2 = args[1]?.toLowerCase();
    if (sub2 === 'interface') {
      if (args[2] === 'brief' || args[2] === 'br' || !args[2]) return { output: showIpInterfaceBrief(state) };
      const ifaceName = resolveInterfaceName(args.slice(2).join(''));
      if (ifaceName && state.interfaces[ifaceName]) return { output: showIpInterfaceDetail(state, ifaceName) };
      return { output: showIpInterfaceBrief(state) };
    }
    if (sub2 === 'route') return { output: showIpRoute(state) };
    if (sub2 === 'arp') return { output: showArp(state) };
    if (sub2 === 'ssh') return { output: showIpSsh(state) };
    if (sub2 === 'access-lists' || sub2 === 'access-list') return { output: showIpAccessLists(state) };
    if (sub2 === 'dhcp') return { output: showIpDhcp(state) };
    return { output: '% Incomplete command.' };
  }

  if (sub === 'vlan' || sub === 'vl') return { output: showVlanBrief(state) };

  if (sub === 'history' || sub === 'hist') return { output: showHistory(history) };
  if (sub === 'clock') return { output: showClock() };
  if (sub === 'spanning-tree' || sub === 'span') {
    if (args[1] === 'vlan') return { output: showSpanningTree(state, args[2]) };
    if (args[1] === 'detail') return { output: showSpanningTree(state) };
    if (args[1] === 'summary') return { output: showSpanningTreeSummary(state) };
    return { output: showSpanningTree(state) };
  }
  if (sub === 'mac-address-table' || sub === 'mac') return { output: showMacAddressTable(state) };
  if (sub === 'arp') return { output: showArp(state) };
  if (sub === 'log' || sub === 'logging') return { output: showLog(state) };

  if (sub === 'cdp') {
    if (!args[1] || args[1] === 'neighbors') return { output: showCdpNeighbors(state) };
    if (args[1] === 'entry') return { output: showCdpNeighbors(state) };
    if (args[1] === 'interface') return { output: showCdpInterface(state) };
    if (args[1] === 'traffic') return { output: showCdpTraffic() };
    return { output: showCdpNeighbors(state) };
  }

  if (sub === 'lldp') {
    if (!args[1] || args[1] === 'neighbors') return { output: showLldpNeighbors(state) };
    return { output: showLldpNeighbors(state) };
  }

  if (sub === 'etherchannel') {
    if (!args[1] || args[1] === 'summary') return { output: showEtherchannelSummary(state) };
    if (args[1] === 'detail') return { output: showEtherchannelDetail(state) };
    if (args[1] === 'port-channel') return { output: showEtherchannelSummary(state) };
    if (args[1] === 'load-balance') return { output: 'EtherChannel Load-Balancing Configuration:\n        src-dst-ip' };
    return { output: showEtherchannelSummary(state) };
  }

  if (sub === 'vtp') return { output: showVtp(state) };

  if (sub === 'processes') return { output: showProcesses() };
  if (sub === 'flash' || sub === 'flash:') return { output: showFlash() };
  if (sub === 'boot') return { output: showBoot(state) };
  if (sub === 'users') return { output: showUsers(state) };
  if (sub === 'sessions') return { output: showSessions() };
  if (sub === 'terminal') return { output: showTerminal() };
  if (sub === 'privilege') return { output: 'Current privilege level is 15' };
  if (sub === 'controllers') return { output: showControllers(state) };
  if (sub === 'environment') return { output: showEnvironment() };
  if (sub === 'power') return { output: showPower() };
  if (sub === 'inventory') return { output: showInventory() };
  if (sub === 'module') return { output: showModule() };
  if (sub === 'platform') return { output: showPlatform(state) };
  if (sub === 'diagnostic') return { output: 'No diagnostic tests have been run.' };
  if (sub === 'facility-alarm') return { output: 'No facility alarms.' };
  if (sub === 'errdisable') return { output: showErrdisable(state) };
  if (sub === 'udld') return { output: showUdld(state) };

  return { output: `% Invalid input detected at '^' marker.` };
}

function handleCopy(args, state) {
  if (args.length >= 2) {
    const src = args[0].toLowerCase();
    const dst = args[1].toLowerCase();
    if ((src === 'running-config' || src === 'run') && (dst === 'startup-config' || dst === 'start')) {
      const newSyslog = appendSyslog(state, '%SYS-5-CONFIG_I', 'Configured from console by console');
      const newState = { ...state, startupConfig: generateRunConfig(state), configChanged: false, syslog: newSyslog };
      return { output: 'Destination filename [startup-config]? \nBuilding configuration...\n[OK]', newState, persist: true };
    }
  }
  return { output: '% Incomplete command.' };
}

function generateRunConfig(state) {
  // Reuse showRunningConfig for consistency
  return showRunningConfig(state);
}

function formatHelp(helpMap) {
  const entries = Object.entries(helpMap);
  const maxLen = Math.max(...entries.map(([k]) => k.length));
  return entries.map(([cmd, desc]) => `  ${cmd.padEnd(maxLen + 2)}${desc}`).join('\n');
}

function invalidCommand(cmd) {
  return `% Invalid input detected at '^' marker.\n\n% Ambiguous command:  "${cmd}"`;
}

// Tab completion
export function tabComplete(partial, mode) {
  const parts = partial.split(/\s+/);
  const lastWord = parts[parts.length - 1];
  if (!lastWord) return partial;
  
  const completions = getCompletions(lastWord, mode);
  if (completions.length === 1) {
    parts[parts.length - 1] = completions[0];
    return parts.join(' ') + ' ';
  }
  return partial;
}

// Get prompt string based on mode
export function getPrompt(hostname, mode, currentInterface) {
  switch (mode) {
    case 'user': return `${hostname}>`;
    case 'privileged': return `${hostname}#`;
    case 'globalConfig': return `${hostname}(config)#`;
    case 'interfaceConfig': {
      const ifName = currentInterface || '';
      const shortMap = {
        'FastEthernet': 'if',
        'GigabitEthernet': 'if',
        'Vlan': 'if',
      };
      return `${hostname}(config-if)#`;
    }
    case 'vlanConfig': return `${hostname}(config-vlan)#`;
    case 'lineConfig': return `${hostname}(config-line)#`;
    default: return `${hostname}>`;
  }
}