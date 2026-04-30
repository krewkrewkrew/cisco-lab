// Test scenarios
import officeVlan from './tests/officeVlan';
import branchUplink from './tests/branchUplink';
import secureRemoteAccess from './tests/secureRemoteAccess';
import fullOutage from './tests/fullOutage';

// Config labs
import basicNavigation from './config/basicNavigation';
import vlanConfig from './config/vlanConfig';
import trunkConfig from './config/trunkConfig';
import interfaceManagement from './config/interfaceManagement';
import saveConfig from './config/saveConfig';
import sshSetup from './config/sshSetup';
import portSecurity from './config/portSecurity';
import spanningTree from './config/spanningTree';
import vtpConfig from './config/vtpConfig';
import etherChannel from './config/etherChannel';

// Troubleshooting labs
import portShutdown from './troubleshooting/portShutdown';
import wrongVlan from './troubleshooting/wrongVlan';
import trunkMisconfigured from './troubleshooting/trunkMisconfigured';
import sviNoIp from './troubleshooting/sviNoIp';
import nativeVlanMismatch from './troubleshooting/nativeVlanMismatch';
import securityHardening from './troubleshooting/securityHardening';

export const scenarios = [
  basicNavigation,
  vlanConfig,
  trunkConfig,
  interfaceManagement,
  saveConfig,
  sshSetup,
  portSecurity,
  spanningTree,
  vtpConfig,
  etherChannel,
];

export const troubleshootingScenarios = [
  portShutdown,
  wrongVlan,
  trunkMisconfigured,
  sviNoIp,
  nativeVlanMismatch,
  securityHardening,
];

export const testScenarios = [
  officeVlan,
  branchUplink,
  secureRemoteAccess,
  fullOutage,
];