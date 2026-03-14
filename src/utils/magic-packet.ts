const MAC_STRIP_REGEX = /[:-]/g;
const MAC_VALID_REGEX = /^[0-9A-Fa-f]+$/;
const MAC_PAIR_REGEX = /.{2}/g;

/**
 * Normalizes a MAC address string and builds a 102-byte Wake-on-LAN magic packet.
 * Accepts formats: AA:BB:CC:DD:EE:FF | AA-BB-CC-DD-EE-FF | AABBCCDDEEFF
 */
export function buildMagicPacket(macAddress: string): Buffer {
  const mac = macAddress.replace(MAC_STRIP_REGEX, "");

  if (mac.length !== 12 || !MAC_VALID_REGEX.test(mac)) {
    throw new Error("Invalid MAC address");
  }

  const macBytes: number[] = [];
  for (let i = 0; i < 12; i += 2) {
    macBytes.push(Number.parseInt(mac.substring(i, i + 2), 16));
  }

  // 6 × 0xFF header + MAC repeated 16 times = 102 bytes
  const packet: number[] = [];
  for (let i = 0; i < 6; i++) {
    packet.push(0xff);
  }
  for (let i = 0; i < 16; i++) {
    packet.push(...macBytes);
  }

  return Buffer.from(packet);
}

/** Normalizes MAC to AA:BB:CC:DD:EE:FF format. Returns original input if invalid. */
export function normalizeMac(mac: string): string {
  const clean = mac.replace(MAC_STRIP_REGEX, "").toUpperCase();
  if (clean.length !== 12 || !MAC_VALID_REGEX.test(clean)) {
    return mac;
  }
  return clean.match(MAC_PAIR_REGEX)?.join(":") ?? mac;
}
