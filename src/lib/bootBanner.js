export const bootBanner = `
Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.2(7)E2
Technical Support: http://www.cisco.com/techsupport
Copyright (c) 1986-2023 by Cisco Systems, Inc.

Cisco WS-C2960-24TT-L (PowerPC405) processor with 131072K bytes of memory.
Processor board ID FOC1234X5YZ
Last reset from power-on

24 FastEthernet interfaces
2 Gigabit Ethernet interfaces
The password-recovery mechanism is enabled.

64K bytes of flash-simulated non-volatile configuration memory.
Base ethernet MAC Address       : AA:BB:CC:00:01:00
Motherboard assembly number     : 73-12346-09
Motherboard serial number       : FOC123456AB
Model revision number           : B0
System serial number            : FOC1234X5YZ
Top Assembly Part Number        : 800-12345-04
CLEI Code Number                : COM3K00BRA
Hardware Board Revision Number  : 0x01

Switch Ports Model              SW Version            SW Image
------ ----- -----              ----------            ----------
*    1 26    WS-C2960-24TT-L    15.2(7)E2             C2960-LANBASEK9-M


Press RETURN to get started.

`;

export const bootLines = bootBanner.split('\n');