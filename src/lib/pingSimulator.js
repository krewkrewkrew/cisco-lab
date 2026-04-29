/**
 * Simulated ping utility.
 * Reachability rules:
 *  1. The switch itself: any SVI (Vlan interface) with an IP address acts as a layer-3 gateway.
 *     A target IP is "reachable" if it falls within the same subnet as any UP SVI.
 *  2. The switch's own SVI IPs always reply (ping to self).
 *  3. If no SVI has an IP configured, all pings time out (layer-2 only switch).
 *  4. If the target IP is a valid broadcast or the /32 host, it times out.
 */

// Convert dotted-decimal mask to prefix length
function maskToPrefix(mask) {
  if (!mask) return 0;
  return mask.split('.').reduce((acc, octet) => {
    let n = parseInt(octet);
    let bits = 0;
    while (n > 0) { bits += n & 1; n >>= 1; }
    return acc + bits;
  }, 0);
}

// Parse IP string to 32-bit integer
function ipToInt(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

// Validate dotted-decimal IPv4
function isValidIp(ip) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) &&
    ip.split('.').every(o => parseInt(o) >= 0 && parseInt(o) <= 255);
}

// Check if targetIp is in the same subnet as interfaceIp/mask
function inSameSubnet(targetIp, interfaceIp, mask) {
  const prefix = maskToPrefix(mask);
  if (prefix === 0) return false;
  const maskInt = prefix === 32 ? 0xffffffff : ~(0xffffffff >>> prefix) >>> 0;
  return (ipToInt(targetIp) & maskInt) === (ipToInt(interfaceIp) & maskInt);
}

// Get the network broadcast address for an interface
function getBroadcast(interfaceIp, mask) {
  const prefix = maskToPrefix(mask);
  const maskInt = prefix === 32 ? 0xffffffff : ~(0xffffffff >>> prefix) >>> 0;
  const hostMask = (~maskInt) >>> 0;
  return ((ipToInt(interfaceIp) & maskInt) | hostMask) >>> 0;
}

/**
 * Returns simulated ping output string.
 * @param {string} target - destination IP
 * @param {object} switchState - current switch state
 * @param {number} count - number of ping packets (default 5)
 */
export function simulatePing(target, switchState, count = 5) {
  const header = `Type escape sequence to abort.\nSending ${count}, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:`;

  if (!isValidIp(target)) {
    return `% Bad IP address: "${target}"`;
  }

  const targetInt = ipToInt(target);

  // Collect all UP SVIs with an assigned IP
  const svis = Object.values(switchState.interfaces).filter(
    iface =>
      iface.name.startsWith('Vlan') &&
      iface.status === 'up' &&
      iface.ipAddress &&
      iface.ipAddress !== 'unassigned' &&
      iface.subnetMask
  );

  if (svis.length === 0) {
    // No layer-3 config at all — can't route
    return `${header}\n${'.' .repeat(count)}\nSuccess rate is 0 percent (0/${count})`;
  }

  for (const svi of svis) {
    const sviInt = ipToInt(svi.ipAddress);

    // Ping to self (the SVI's own IP)
    if (targetInt === sviInt) {
      return buildSuccess(header, count);
    }

    if (inSameSubnet(target, svi.ipAddress, svi.subnetMask)) {
      // Check for broadcast address — no reply
      const bcast = getBroadcast(svi.ipAddress, svi.subnetMask);
      if (targetInt === bcast) {
        return `${header}\n${'.' .repeat(count)}\nSuccess rate is 0 percent (0/${count})\n% Broadcast address, no reply expected.`;
      }

      // Target is on a directly connected subnet — simulate as reachable
      return buildSuccess(header, count);
    }
  }

  // Target is not on any directly connected subnet
  return `${header}\n${'.' .repeat(count)}\nSuccess rate is 0 percent (0/${count})\n% Network not in routing table.`;
}

function buildSuccess(header, count) {
  const dots = '!'.repeat(count);
  const ms = () => (Math.floor(Math.random() * 4) + 1);
  const rtts = Array.from({ length: count }, ms);
  const min = Math.min(...rtts);
  const avg = Math.round(rtts.reduce((a, b) => a + b, 0) / count);
  const max = Math.max(...rtts);
  return `${header}\n${dots}\nSuccess rate is 100 percent (${count}/${count}), round-trip min/avg/max = ${min}/${avg}/${max} ms`;
}