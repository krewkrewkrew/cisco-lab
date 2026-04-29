import { resolveInterfaceName, computePortHealth } from './switchState';
import { simulatePing } from './pingSimulator';
import { getHelpForMode, showHelp, getCompletions } from './commandHelp';
import {
  showVersion, showInterfaces, showIpInterfaceBrief,
  showVlanBrief, showRunningConfig, showStartupConfig,
  showHistory, showClock, showSpanningTree, showMacAddressTable, showArp,
} from './showCommands';

// Parse and execute a command, return { output, newState, newMode, newCurrentInterface }
export function executeCommand(input, switchState, mode, currentInterface, commandHistory) {
  const trimmed = input.trim();
  if (!trimmed) return { output: '' };
  
  // Handle '?' anywhere
  if (trimmed === '?') {
    return { output: formatHelp(getHelpForMode(mode)) };
  }

  // Handle 'do' prefix in config modes
  if ((mode === 'globalConfig' || mode === 'interfaceConfig' || mode === 'vlanConfig') && trimmed.toLowerCase().startsWith('do ')) {
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
  if (cmd === 'disable' || cmd === 'dis') {
    return { output: '', newMode: 'user' };
  }
  if (cmd === 'exit' || cmd === 'logout') {
    return { output: '', newMode: 'user' };
  }
  if (cmd === 'show' || cmd === 'sh') {
    return handleShow(args, state, history);
  }
  if (cmd === 'copy') {
    return handleCopy(args, state);
  }
  if (cmd === 'write') {
    if (args.length === 0 || args[0] === 'memory' || args[0] === 'mem') {
      const newState = { ...state, startupConfig: generateRunConfig(state), configChanged: false };
      return { output: 'Building configuration...\n[OK]', newState, persist: true };
    }
    return { output: '% Incomplete command.' };
  }
  if (cmd === 'reload') {
    return { output: 'System configuration has been modified. Save? [yes/no]: \n% Reload requested.' };
  }
  if (cmd === 'ping') {
    if (args.length === 0) return { output: '% Incomplete command.' };
    return { output: simulatePing(args[0], state) };
  }
  if (cmd === 'traceroute') {
    if (args.length === 0) return { output: '% Incomplete command.' };
    return { output: `Type escape sequence to abort.\nTracing the route to ${args[0]}\n  1  * * *\n  2  * * *\n  3  * * *` };
  }
  if (cmd === 'clock') {
    if (args[0] === 'set') {
      return { output: '' };
    }
    return { output: '% Incomplete command.' };
  }
  if (cmd === 'clear') {
    return { output: '' };
  }
  if (cmd === 'vlan') {
    if (args[0] === 'database') {
      return { output: '% Warning: It is recommended to configure VLAN from config mode.', newMode: 'globalConfig' };
    }
  }
  return { output: invalidCommand(cmd) };
}

function executeGlobalConfig(cmd, args, raw, state) {
  if (cmd === 'hostname') {
    if (args.length === 0) return { output: '% Incomplete command.' };
    const newState = { ...state, hostname: args[0], configChanged: true };
    return { output: '', newState };
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
  if (cmd === 'interface' || cmd === 'int') {
    const ifaceName = resolveInterfaceName(args.join(''));
    if (!ifaceName || !state.interfaces[ifaceName]) {
      // Check if it's a VLAN SVI that needs creation
      const vlanMatch = args.join('').match(/^vlan\s*(\d+)$/i);
      if (vlanMatch) {
        const vlanId = parseInt(vlanMatch[1]);
        const sviName = `Vlan${vlanId}`;
        if (!state.interfaces[sviName]) {
          const newInterfaces = { ...state.interfaces };
          newInterfaces[sviName] = {
            name: sviName, shortName: `Vl${vlanId}`, status: 'up', protocol: 'up',
            description: '', speed: '', duplex: '', switchportMode: '', accessVlan: 0,
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
    if (isNaN(vlanId) || vlanId < 2 || vlanId > 1001) {
      return { output: '% Invalid VLAN ID - valid range is 2-1001.' };
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
    }
    return { output: '' };
  }
  if (cmd === 'banner') {
    if (args[0] === 'motd') {
      const motdText = args.slice(1).join(' ').replace(/^\^C/, '').replace(/\^C$/, '');
      return { output: '', newState: { ...state, bannerMotd: motdText, configChanged: true } };
    }
    return { output: '% Incomplete command.' };
  }
  if (cmd === 'line') {
    if (args[0] === 'con' || args[0] === 'console') {
      return { output: '', newMode: 'lineConfig' };
    }
    if (args[0] === 'vty') {
      return { output: '', newMode: 'lineConfig' };
    }
    return { output: '% Incomplete command.' };
  }
  if (cmd === 'service') {
    return { output: '' };
  }
  if (cmd === 'ip') {
    return { output: '' };
  }
  if (cmd === 'spanning-tree') {
    return { output: '' };
  }
  if (cmd === 'end') {
    return { output: '', newMode: 'privileged', newState: { ...state, returnedToPrivileged: true } };
  }
  if (cmd === 'exit') {
    return { output: '', newMode: 'privileged' };
  }
  return { output: invalidCommand(cmd) };
}

function executeInterfaceConfig(cmd, args, raw, state, currentInterface) {
  const iface = state.interfaces[currentInterface];
  if (!iface) return { output: '% Interface not found.' };

  const updateIface = (updates, extraOutput = '') => {
    const newInterfaces = { ...state.interfaces };
    const updatedIface = { ...iface, ...updates };
    newInterfaces[currentInterface] = updatedIface;
    const newState = { ...state, interfaces: newInterfaces, configChanged: true };

    // Compute health after change and emit syslog-style warning if protocol goes down
    const health = computePortHealth(updatedIface, newState);
    let syslog = extraOutput;
    if (health.protocol === 'down' && updatedIface.status !== 'down') {
      const shortName = updatedIface.shortName || currentInterface;
      syslog += `\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${shortName}, changed state to down\n${health.reason ? `  Reason: ${health.reason}` : ''}`;
    } else if (health.protocol === 'up' && iface.status === 'down' && updates.status === 'up') {
      const shortName = updatedIface.shortName || currentInterface;
      syslog += `\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${shortName}, changed state to up`;
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
    const desc = args.join(' ');
    return updateIface({ description: desc });
  }
  if (cmd === 'switchport') {
    if (args[0] === 'mode') {
      if (args[1] === 'access') return updateIface({ switchportMode: 'access' });
      if (args[1] === 'trunk') return updateIface({ switchportMode: 'trunk' });
      return { output: '% Incomplete command.' };
    }
    if (args[0] === 'access') {
      if (args[1] === 'vlan') {
        const vlanId = parseInt(args[2]);
        if (isNaN(vlanId) || !state.vlans[vlanId]) {
          return { output: `% Access VLAN does not exist.` };
        }
        return updateIface({ accessVlan: vlanId });
      }
      return { output: '% Incomplete command.' };
    }
    if (args[0] === 'trunk') {
      if (args[1] === 'allowed' && args[2] === 'vlan') {
        return updateIface({ trunkAllowedVlans: args.slice(3).join(' ') });
      }
    }
    return { output: '% Incomplete command.' };
  }
  if (cmd === 'ip') {
    if (args[0] === 'address') {
      if (args.length < 3) return { output: '% Incomplete command.' };
      // Physical switchport interfaces need 'no switchport' first
      const isPhysical = currentInterface.startsWith('FastEthernet') || currentInterface.startsWith('GigabitEthernet');
      if (isPhysical && iface.switchportMode !== 'routed') {
        return { output: '% IP addresses may not be configured on L2 links.\n  Use "no switchport" to convert this to a routed interface first.' };
      }
      // Basic IP/mask validation
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(args[1]) || !ipRegex.test(args[2])) {
        return { output: '% Invalid IP address or subnet mask.' };
      }
      return updateIface({ ipAddress: args[1], subnetMask: args[2] });
    }
    return { output: '% Incomplete command.' };
  }
  if (cmd === 'speed') {
    const valid = ['10', '100', '1000', 'auto'];
    if (valid.includes(args[0])) return updateIface({ speed: args[0] + 'Mb/s' });
    return { output: '% Invalid input.' };
  }
  if (cmd === 'duplex') {
    const valid = ['full', 'half', 'auto'];
    if (valid.includes(args[0]?.toLowerCase())) return updateIface({ duplex: args[0] });
    return { output: '% Invalid input.' };
  }
  if (cmd === 'exit') {
    return { output: '', newMode: 'globalConfig', newCurrentInterface: null };
  }
  if (cmd === 'end') {
    return { output: '', newMode: 'privileged', newCurrentInterface: null };
  }
  return { output: invalidCommand(cmd) };
}

function executeLineConfig(cmd, args, state) {
  if (cmd === 'password') {
    return { output: '' };
  }
  if (cmd === 'login') {
    return { output: '' };
  }
  if (cmd === 'exit') {
    return { output: '', newMode: 'globalConfig' };
  }
  if (cmd === 'end') {
    return { output: '', newMode: 'privileged' };
  }
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
      return { output: '', newState: { ...state, vlans: newVlans } };
    }
    return { output: '% Invalid input.' };
  }
  if (cmd === 'exit') {
    return { output: '', newMode: 'globalConfig', newCurrentInterface: null };
  }
  if (cmd === 'end') {
    return { output: '', newMode: 'privileged', newCurrentInterface: null };
  }
  return { output: invalidCommand(cmd) };
}

function handleShow(args, state, history) {
  if (args.length === 0) {
    return { output: '% Incomplete command.\nType "show ?" for a list of subcommands.' };
  }
  const sub = args[0].toLowerCase();
  
  if (sub === '?') {
    return { output: formatHelp(showHelp) };
  }
  if (sub === 'version' || sub === 'ver') return { output: showVersion(state) };
  if (sub === 'running-config' || sub === 'run') return { output: showRunningConfig(state), newState: { ...state, viewedRunningConfig: true } };
  if (sub === 'startup-config' || sub === 'start') return { output: showStartupConfig(state) };
  if (sub === 'interfaces' || sub === 'int') {
    if (args[1]) {
      const ifaceName = resolveInterfaceName(args.slice(1).join(''));
      if (ifaceName && state.interfaces[ifaceName]) {
        return { output: showInterfaces(state, ifaceName) };
      }
      return { output: `% Invalid input detected at '^' marker.` };
    }
    return { output: showInterfaces(state) };
  }
  if (sub === 'ip') {
    if (args[1] === 'interface' && (args[2] === 'brief' || args[2] === 'br')) {
      return { output: showIpInterfaceBrief(state) };
    }
    if (args[1] === 'interface') return { output: showIpInterfaceBrief(state) };
    return { output: '% Incomplete command.' };
  }
  if (sub === 'vlan' || sub === 'vl') {
    if (args.length === 1 || args[1] === 'brief' || args[1] === 'br') {
      return { output: showVlanBrief(state) };
    }
    return { output: showVlanBrief(state) };
  }
  if (sub === 'history' || sub === 'hist') {
    return { output: showHistory(history) };
  }
  if (sub === 'clock') return { output: showClock() };
  if (sub === 'spanning-tree' || sub === 'span') return { output: showSpanningTree(state) };
  if (sub === 'mac-address-table' || sub === 'mac') return { output: showMacAddressTable() };
  if (sub === 'arp') return { output: showArp() };
  
  return { output: `% Invalid input detected at '^' marker.` };
}

function handleCopy(args, state) {
  if (args.length >= 2) {
    const src = args[0].toLowerCase();
    const dst = args[1].toLowerCase();
    if ((src === 'running-config' || src === 'run') && (dst === 'startup-config' || dst === 'start')) {
      const newState = { ...state, startupConfig: generateRunConfig(state), configChanged: false };
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