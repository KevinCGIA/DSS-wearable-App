// Bluetooth SIG 0x2A37: flags bit 0 selects an 8-bit or little-endian 16-bit BPM.
export function parseHeartRateMeasurement(base64: string): number | null {
  let bytes: string;
  try { bytes = atob(base64); } catch { return null; }
  if (bytes.length < 2) return null;
  const is16Bit = (bytes.charCodeAt(0) & 0x01) !== 0;
  if (is16Bit && bytes.length < 3) return null;
  const bpm = is16Bit
    ? bytes.charCodeAt(1) | (bytes.charCodeAt(2) << 8)
    : bytes.charCodeAt(1);
  return bpm > 0 ? bpm : null;
}
