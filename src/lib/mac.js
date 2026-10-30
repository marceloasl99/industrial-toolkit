/* MAC address formatting and classification with a small embedded OUI table. */
export const ouiTable = {
  '00:00:0C': 'Cisco Systems', '00:1B:21': 'Intel Corporate', '3C:5A:B4': 'Google', '00:50:56': 'VMware', '00:0C:29': 'VMware',
  '00:15:5D': 'Microsoft (Hyper-V)', '52:54:00': 'QEMU / KVM', '08:00:27': 'Oracle VirtualBox', 'B8:27:EB': 'Raspberry Pi Foundation',
  'DC:A6:32': 'Raspberry Pi Trading', 'E4:5F:01': 'Raspberry Pi Trading', '00:1D:9C': 'Rockwell Automation', '00:00:BC': 'Rockwell Automation (Allen-Bradley)',
  '00:1C:06': 'Siemens Numerical Control', '00:0E:8C': 'Siemens AG A&D', '00:1B:1B': 'Siemens AG', '28:63:36': 'Siemens AG', '00:80:F4': 'Telemecanique / Schneider Electric',
  '00:00:54': 'Schneider Electric', '00:A0:45': 'Phoenix Contact', '00:0F:9E': 'Murrelektronik', '00:30:DE': 'WAGO Kontakttechnik', '00:01:05': 'Beckhoff Automation',
  '00:E0:4B': 'Omron', '00:09:F8': 'Mitsubishi Electric', '00:1A:D9': 'Beijer Electronics', '00:30:11': 'HMS Industrial Networks', '00:80:63': 'Hirschmann Automation',
  '00:0B:AB': 'Advantech', '00:D0:C9': 'Advantech', '00:90:E8': 'Moxa Technologies', '00:1E:C0': 'Microchip Technology', '00:04:A3': 'Microchip Technology',
  '24:0A:C4': 'Espressif (ESP32)', '30:AE:A4': 'Espressif', '84:F3:EB': 'Espressif', 'A4:CF:12': 'Espressif', '5C:CF:7F': 'Espressif', '18:FE:34': 'Espressif',
  '98:D3:31': 'Shenzhen Bilian / HC-05 BT', '00:1A:7D': 'Cyber-Blue (HC-05)', 'F0:9F:C2': 'Ubiquiti', '24:A4:3C': 'Ubiquiti', 'DC:9F:DB': 'Ubiquiti',
  '00:1E:58': 'D-Link', 'E8:DE:27': 'TP-Link', '50:C7:BF': 'TP-Link', '00:14:BF': 'Linksys', '00:17:88': 'Philips (Hue)', 'A4:C1:38': 'Telink (BLE sensors)',
  '00:1E:C2': 'Apple', 'F0:18:98': 'Apple', '3C:22:FB': 'Apple', '00:50:F2': 'Microsoft', '00:1A:11': 'Google', '00:1C:B3': 'Apple', '00:26:5E': 'Hon Hai (Foxconn)',
  '00:1F:3B': 'Intel', '00:21:6A': 'Intel', 'A0:36:9F': 'Intel', '00:1A:A0': 'Dell', '18:03:73': 'Dell', '00:0D:3A': 'Microsoft (Azure)', '02:42:AC': 'Docker (bridge, locally administered)',
  '00:1C:F0': 'D-Link', '00:0B:82': 'Grandstream', '00:04:F2': 'Polycom', '00:16:3E': 'Xen (locally administered)', '00:0A:DC': 'RuggedCom', '00:E0:B1': 'Hirschmann (Belden)',
};

export function parseMac(text) {
  const clean = String(text).trim().replace(/[^0-9a-f]/gi, '').toUpperCase();
  if (clean.length !== 12) throw new Error('A MAC address has 12 hexadecimal digits');
  return clean;
}

export function formatMac(hex12, style) {
  const pairs = hex12.match(/.{2}/g);
  switch (style) {
    case 'colon': return pairs.join(':');
    case 'hyphen': return pairs.join('-');
    case 'cisco': return hex12.match(/.{4}/g).join('.').toLowerCase();
    case 'plain': return hex12;
    case 'lower': return pairs.join(':').toLowerCase();
    default: throw new Error('Unknown style');
  }
}

export function macInfo(text) {
  const hex = parseMac(text);
  const first = parseInt(hex.slice(0, 2), 16);
  const oui = formatMac(hex, 'colon').slice(0, 8);
  const eui64 = (() => {
    const b = hex.match(/.{2}/g).map(h => parseInt(h, 16));
    b[0] ^= 0x02;
    const full = [b[0], b[1], b[2], 0xff, 0xfe, b[3], b[4], b[5]].map(x => x.toString(16).padStart(2, '0')).join('');
    return `fe80::${full.match(/.{4}/g).join(':').replace(/(^|:)0+(?=[0-9a-f])/g, '$1')}`;
  })();
  return {
    hex, oui, vendor: ouiTable[oui] || 'Unknown (not in the embedded table)',
    multicast: !!(first & 1), locallyAdministered: !!(first & 2),
    broadcast: hex === 'FFFFFFFFFFFF',
    formats: { colon: formatMac(hex, 'colon'), hyphen: formatMac(hex, 'hyphen'), cisco: formatMac(hex, 'cisco'), plain: hex, lower: formatMac(hex, 'lower') },
    eui64LinkLocal: eui64,
  };
}

export function randomMac(local = true) {
  const b = crypto.getRandomValues(new Uint8Array(6));
  b[0] = (b[0] & 0xfe) | (local ? 0x02 : 0);
  return [...b].map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(':');
}
