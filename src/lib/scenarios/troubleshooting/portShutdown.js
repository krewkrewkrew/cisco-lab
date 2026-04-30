import { createDefaultSwitchState } from '../../switchState';

export default {
  id: 'ts-port-shutdown',
  title: "Port Won't Come Up",
  category: 'troubleshooting',
  difficulty: 'Beginner',
  duration: '10 min',
  description: 'A user reports their workstation lost network connectivity. Ports Fa0/3 and Fa0/5 are administratively shut down. Diagnose the problem and bring the ports back up.',
  objectives: [
    'Bring Fa0/3 back up with "no shutdown"',
    'Bring Fa0/5 back up with "no shutdown"',
  ],
  hints: [
    '"show ip interface brief" shows all ports and their status at a glance',
    'Look for "administratively down" in the Status column',
    'Enter interface config: "interface fa0/3" then "no shutdown"',
    'Repeat the process for Fa0/5',
  ],
  commands: [
    { cmd: 'show ip interface brief', why: 'First step in port troubleshooting — shows every interface status. "administratively down" means someone ran the shutdown command on it.' },
    { cmd: 'enable', why: 'You must be in Privileged EXEC mode to enter configuration mode.' },
    { cmd: 'configure terminal', why: 'Enter Global Configuration mode so you can modify interface settings.' },
    { cmd: 'interface FastEthernet0/3', why: 'Target the first broken port to fix it.' },
    { cmd: 'no shutdown', why: 'Administratively enables the port. The opposite of the "shutdown" command. The port will return to up/up.' },
    { cmd: 'exit', why: 'Return to Global Configuration mode.' },
    { cmd: 'interface FastEthernet0/5', why: 'Target the second broken port.' },
    { cmd: 'no shutdown', why: 'Brings Fa0/5 back up.' },
    { cmd: 'end', why: 'Return to Privileged EXEC mode.' },
    { cmd: 'show interfaces status', why: 'Confirms both ports now show "connected" status.' },
    { cmd: 'show ip interface brief', why: 'Second verification — both Fa0/3 and Fa0/5 should now show "up/up".' },
  ],
  validation: (state) => [
    { label: 'Fa0/3 is back up', pass: state.interfaces['FastEthernet0/3']?.status === 'up' },
    { label: 'Fa0/5 is back up', pass: state.interfaces['FastEthernet0/5']?.status === 'up' },
  ],
  initialState: (() => {
    const base = createDefaultSwitchState();
    return {
      ...base,
      interfaces: {
        ...base.interfaces,
        'FastEthernet0/3': { ...base.interfaces['FastEthernet0/3'], status: 'down' },
        'FastEthernet0/5': { ...base.interfaces['FastEthernet0/5'], status: 'down' },
      },
    };
  })(),
};