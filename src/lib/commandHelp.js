// Context-aware help for each CLI mode

export const helpData = {
  user: {
    'enable': 'Turn on privileged commands',
    'exit': 'Exit from the EXEC',
    'logout': 'Exit from the EXEC',
    'ping': 'Send echo messages',
    'show': 'Show running system information',
    'traceroute': 'Trace route to destination',
    'terminal': 'Set terminal line parameters',
  },
  privileged: {
    'configure': 'Enter configuration mode',
    'copy': 'Copy from one file to another',
    'debug': 'Debugging functions',
    'delete': 'Delete a file',
    'disable': 'Turn off privileged commands',
    'enable': 'Turn on privileged commands',
    'exit': 'Exit from the EXEC',
    'logout': 'Exit from the EXEC',
    'ping': 'Send echo messages',
    'reload': 'Halt and perform a cold restart',
    'show': 'Show running system information',
    'terminal': 'Set terminal line parameters',
    'traceroute': 'Trace route to destination',
    'write': 'Write running configuration to memory',
    'clear': 'Reset functions',
    'clock': 'Manage the system clock',
    'no': 'Negate a command or set its defaults',
    'vlan': 'VLAN commands',
  },
  globalConfig: {
    'banner': 'Define a login banner',
    'cdp': 'Global CDP configuration subcommands',
    'enable': 'Modify enable password parameters',
    'end': 'Exit from configure mode',
    'exit': 'Exit from configure mode',
    'hostname': 'Set system\'s network name',
    'interface': 'Select an interface to configure',
    'ip': 'Global IP configuration subcommands',
    'line': 'Configure a terminal line',
    'no': 'Negate a command or set its defaults',
    'service': 'Modify use of network based services',
    'spanning-tree': 'Spanning Tree Subsystem',
    'vlan': 'VLAN commands',
    'do': 'To run exec commands in config mode',
  },
  interfaceConfig: {
    'description': 'Interface specific description',
    'duplex': 'Configure duplex operation',
    'end': 'Exit from configure mode',
    'exit': 'Exit from interface configuration mode',
    'ip': 'Interface Internet Protocol config commands',
    'no': 'Negate a command or set its defaults',
    'shutdown': 'Shutdown the selected interface',
    'speed': 'Configure speed operation',
    'switchport': 'Set switching mode characteristics',
    'do': 'To run exec commands in config mode',
  },
  vlanConfig: {
    'end': 'Exit from configure mode',
    'exit': 'Exit from VLAN configuration mode',
    'name': 'Ascii name of the VLAN',
    'no': 'Negate a command or set its defaults',
    'state': 'Operational state of the VLAN',
  },
};

export const showHelp = {
  'arp': 'ARP table',
  'clock': 'Display the system clock',
  'history': 'Display the session command history',
  'interfaces': 'Interface status and configuration',
  'ip': 'IP information',
  'mac-address-table': 'MAC forwarding table',
  'running-config': 'Current operating configuration',
  'spanning-tree': 'Spanning tree topology',
  'startup-config': 'Contents of startup configuration',
  'version': 'System hardware and software status',
  'log': 'Display the contents of the logging buffer',
  'vlan': 'VTP VLAN status',
  'vtp': 'VTP information',
};

export function getHelpForMode(mode) {
  switch (mode) {
    case 'user': return helpData.user;
    case 'privileged': return helpData.privileged;
    case 'globalConfig': return helpData.globalConfig;
    case 'interfaceConfig': return helpData.interfaceConfig;
    case 'vlanConfig': return helpData.vlanConfig;
    default: return helpData.user;
  }
}

export function getCompletions(partial, mode) {
  const commands = getHelpForMode(mode);
  const lower = partial.toLowerCase();
  return Object.keys(commands).filter(cmd => cmd.startsWith(lower));
}