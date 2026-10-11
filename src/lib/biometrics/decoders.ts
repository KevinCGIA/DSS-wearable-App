// Decoders for standard Bluetooth health measurements. Formats follow the Bluetooth SIG
// GATT Specification Supplement (public YAML: bitbucket.org/bluetooth-SIG/public, gss/).
// Every decoder takes the base64 value ble-plx delivers and returns null for malformed or
// truncated packets instead of throwing. No imports so tests can load this file directly.

class Reader {
  private offset = 0;
  private readonly bytes: Uint8Array;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  get remaining() {
    return this.bytes.length - this.offset;
  }

  has(count: number) {
    return this.remaining >= count;
  }

  uint8() {
    return this.bytes[this.offset++];
  }

  uint16() {
    const value = this.bytes[this.offset] | (this.bytes[this.offset + 1] << 8);
    this.offset += 2;
    return value;
  }

  int16() {
    const value = this.uint16();
    return value & 0x8000 ? value - 0x10000 : value;
  }

  uint32() {
    const value =
      (this.bytes[this.offset] |
        (this.bytes[this.offset + 1] << 8) |
        (this.bytes[this.offset + 2] << 16) |
        (this.bytes[this.offset + 3] << 24)) >>>
      0;
    this.offset += 4;
    return value;
  }

  skip(count: number) {
    this.offset += count;
  }
}

function toBytes(base64: string): Uint8Array | null {
  try {
    const raw = atob(base64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

// IEEE 11073-20601 SFLOAT (medfloat16): 4-bit signed exponent, 12-bit signed mantissa.
// NaN, NRes and ±infinity come back as null.
export function sfloat(raw: number): number | null {
  const mantissaRaw = raw & 0x0fff;
  if ([0x07ff, 0x0800, 0x07fe, 0x0802, 0x0801].includes(mantissaRaw)) return null;
  const mantissa = mantissaRaw & 0x0800 ? mantissaRaw - 0x1000 : mantissaRaw;
  const exponentRaw = (raw >> 12) & 0x0f;
  const exponent = exponentRaw & 0x08 ? exponentRaw - 0x10 : exponentRaw;
  return round(mantissa * Math.pow(10, exponent));
}

// IEEE 11073-20601 FLOAT (medfloat32): 8-bit signed exponent, 24-bit signed mantissa.
export function float32(raw: number): number | null {
  const mantissaRaw = raw & 0x00ffffff;
  if ([0x007fffff, 0x00800000, 0x007ffffe, 0x00800002, 0x00800001].includes(mantissaRaw)) return null;
  const mantissa = mantissaRaw & 0x00800000 ? mantissaRaw - 0x01000000 : mantissaRaw;
  const exponentRaw = (raw >>> 24) & 0xff;
  const exponent = exponentRaw & 0x80 ? exponentRaw - 0x100 : exponentRaw;
  return round(mantissa * Math.pow(10, exponent));
}

function round(value: number) {
  return Math.round(value * 1e6) / 1e6;
}

// Date Time characteristic (7 octets: year, month, day, hours, minutes, seconds). A zero
// year, month or day means "not known".
function dateTime(reader: Reader): Date | null {
  const year = reader.uint16();
  const month = reader.uint8();
  const day = reader.uint8();
  const hours = reader.uint8();
  const minutes = reader.uint8();
  const seconds = reader.uint8();
  if (!year || !month || !day || month > 12 || day > 31 || hours > 23 || minutes > 59 || seconds > 59) {
    return null;
  }
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

const KJ_TO_KCAL = 1 / 4.184;
const LB_TO_KG = 0.45359237;
const INCH_TO_M = 0.0254;
const KPA_TO_MMHG = 7.50061683;

// ----- Heart Rate Measurement (0x2A37) -----

export type HeartRateMeasurement = {
  bpm: number | null;
  // Accumulated since the sensor last reset it (kilojoules on the wire)
  energyKcal: number | null;
  // Oldest first, in milliseconds
  rrIntervalsMs: number[];
};

export function decodeHeartRateMeasurement(base64: string): HeartRateMeasurement | null {
  const bytes = toBytes(base64);
  if (!bytes || bytes.length < 2) return null;
  const reader = new Reader(bytes);
  const flags = reader.uint8();
  const is16Bit = (flags & 0x01) !== 0;
  if (!reader.has(is16Bit ? 2 : 1)) return null;
  const bpm = is16Bit ? reader.uint16() : reader.uint8();

  let energyKcal: number | null = null;
  if (flags & 0x08) {
    if (!reader.has(2)) return null;
    energyKcal = round(reader.uint16() * KJ_TO_KCAL);
  }

  const rrIntervalsMs: number[] = [];
  if (flags & 0x10) {
    while (reader.has(2)) rrIntervalsMs.push(round((reader.uint16() / 1024) * 1000));
  }

  return { bpm: bpm > 0 ? bpm : null, energyKcal, rrIntervalsMs };
}

// RMSSD (root mean square of successive differences) over RR intervals, the standard
// short-term HRV measure. Needs at least 3 intervals; implausible intervals are dropped.
export function rmssd(rrIntervalsMs: number[]): number | null {
  const valid = rrIntervalsMs.filter((rr) => rr >= 300 && rr <= 2000);
  if (valid.length < 3) return null;
  let sum = 0;
  for (let i = 1; i < valid.length; i += 1) sum += (valid[i] - valid[i - 1]) ** 2;
  return Math.round(Math.sqrt(sum / (valid.length - 1)) * 10) / 10;
}

// ----- Temperature Measurement (0x2A1C) -----

export type TemperatureMeasurement = { celsius: number; timestamp: Date | null };

export function decodeTemperatureMeasurement(base64: string): TemperatureMeasurement | null {
  const bytes = toBytes(base64);
  if (!bytes || bytes.length < 5) return null;
  const reader = new Reader(bytes);
  const flags = reader.uint8();
  const value = float32(reader.uint32());
  if (value === null) return null;
  const celsius = flags & 0x01 ? ((value - 32) * 5) / 9 : value;
  const timestamp = flags & 0x02 && reader.has(7) ? dateTime(reader) : null;
  return { celsius: Math.round(celsius * 100) / 100, timestamp };
}

// ----- Blood Pressure Measurement (0x2A35) -----

export type BloodPressureMeasurement = {
  systolic: number;
  diastolic: number;
  meanArterial: number | null;
  pulse: number | null;
  timestamp: Date | null;
};

export function decodeBloodPressureMeasurement(base64: string): BloodPressureMeasurement | null {
  const bytes = toBytes(base64);
  if (!bytes || bytes.length < 7) return null;
  const reader = new Reader(bytes);
  const flags = reader.uint8();
  const factor = flags & 0x01 ? KPA_TO_MMHG : 1;
  const systolic = sfloat(reader.uint16());
  const diastolic = sfloat(reader.uint16());
  const mean = sfloat(reader.uint16());
  if (systolic === null || diastolic === null) return null;

  if (flags & 0x02 && !reader.has(7)) return null;
  const timestamp = flags & 0x02 ? dateTime(reader) : null;
  if (flags & 0x04 && !reader.has(2)) return null;
  const pulse = flags & 0x04 ? sfloat(reader.uint16()) : null;

  const mmHg = (value: number) => Math.round(value * factor);
  return {
    systolic: mmHg(systolic),
    diastolic: mmHg(diastolic),
    meanArterial: mean === null ? null : mmHg(mean),
    pulse: pulse === null ? null : Math.round(pulse),
    timestamp,
  };
}

// ----- Pulse Oximeter: PLX Continuous (0x2A5F) and Spot-Check (0x2A5E) -----

export type PulseOximetryMeasurement = { spo2: number; pulse: number | null; timestamp: Date | null };

export function decodePlxContinuous(base64: string): PulseOximetryMeasurement | null {
  const bytes = toBytes(base64);
  if (!bytes || bytes.length < 5) return null;
  const reader = new Reader(bytes);
  reader.uint8();
  const spo2 = sfloat(reader.uint16());
  const pulse = sfloat(reader.uint16());
  if (spo2 === null || spo2 <= 0 || spo2 > 100) return null;
  return { spo2, pulse: pulse === null ? null : Math.round(pulse), timestamp: null };
}

export function decodePlxSpotCheck(base64: string): PulseOximetryMeasurement | null {
  const bytes = toBytes(base64);
  if (!bytes || bytes.length < 5) return null;
  const reader = new Reader(bytes);
  const flags = reader.uint8();
  const spo2 = sfloat(reader.uint16());
  const pulse = sfloat(reader.uint16());
  if (spo2 === null || spo2 <= 0 || spo2 > 100) return null;
  const timestamp = flags & 0x01 && reader.has(7) ? dateTime(reader) : null;
  return { spo2, pulse: pulse === null ? null : Math.round(pulse), timestamp };
}

// ----- Running Speed and Cadence Measurement (0x2A53) -----

export type RscMeasurement = {
  speedKmh: number;
  cadence: number;
  strideLengthM: number | null;
  // Accumulated by the sensor
  totalDistanceM: number | null;
  running: boolean;
};

export function decodeRscMeasurement(base64: string): RscMeasurement | null {
  const bytes = toBytes(base64);
  if (!bytes || bytes.length < 4) return null;
  const reader = new Reader(bytes);
  const flags = reader.uint8();
  const speedMps = reader.uint16() / 256;
  const cadence = reader.uint8();
  let strideLengthM: number | null = null;
  if (flags & 0x01) {
    if (!reader.has(2)) return null;
    strideLengthM = reader.uint16() / 100;
  }
  let totalDistanceM: number | null = null;
  if (flags & 0x02) {
    if (!reader.has(4)) return null;
    totalDistanceM = reader.uint32() / 10;
  }
  return {
    speedKmh: Math.round(speedMps * 3.6 * 100) / 100,
    cadence,
    strideLengthM,
    totalDistanceM,
    running: (flags & 0x04) !== 0,
  };
}

// ----- Weight Measurement (0x2A9D) -----

export type WeightMeasurement = {
  kg: number;
  bmi: number | null;
  heightM: number | null;
  timestamp: Date | null;
};

export function decodeWeightMeasurement(base64: string): WeightMeasurement | null {
  const bytes = toBytes(base64);
  if (!bytes || bytes.length < 3) return null;
  const reader = new Reader(bytes);
  const flags = reader.uint8();
  const imperial = (flags & 0x01) !== 0;
  const raw = reader.uint16();
  // 0xFFFF = measurement unsuccessful
  if (raw === 0xffff) return null;
  const kg = imperial ? raw * 0.01 * LB_TO_KG : raw * 0.005;

  const timestamp = flags & 0x02 && reader.has(7) ? dateTime(reader) : null;
  if (flags & 0x04 && reader.has(1)) reader.skip(1);
  let bmi: number | null = null;
  let heightM: number | null = null;
  if (flags & 0x08 && reader.has(4)) {
    bmi = reader.uint16() / 10;
    const height = reader.uint16();
    heightM = imperial ? height * 0.1 * INCH_TO_M : height * 0.001;
  }
  return {
    kg: Math.round(kg * 100) / 100,
    bmi,
    heightM: heightM === null ? null : Math.round(heightM * 1000) / 1000,
    timestamp,
  };
}

// ----- Body Composition Measurement (0x2A9C) -----

export type BodyCompositionMeasurement = {
  bodyFatPercent: number;
  musclePercent: number | null;
  weightKg: number | null;
  timestamp: Date | null;
};

export function decodeBodyCompositionMeasurement(base64: string): BodyCompositionMeasurement | null {
  const bytes = toBytes(base64);
  if (!bytes || bytes.length < 4) return null;
  const reader = new Reader(bytes);
  const flags = reader.uint16();
  // Multiple Packet Measurement (bit 12): this decoder handles single packets only
  if (flags & 0x1000) return null;
  const imperial = (flags & 0x0001) !== 0;
  const mass = (raw: number) => (imperial ? raw * 0.01 * LB_TO_KG : raw * 0.005);
  const fatRaw = reader.uint16();
  if (fatRaw === 0xffff) return null;

  const timestamp = flags & 0x0002 && reader.has(7) ? dateTime(reader) : null;
  if (flags & 0x0004 && reader.has(1)) reader.skip(1);
  if (flags & 0x0008 && reader.has(2)) reader.skip(2);
  const musclePercent = flags & 0x0010 && reader.has(2) ? reader.uint16() / 10 : null;
  // Muscle mass, fat free mass, soft lean mass, body water mass, impedance
  for (const bit of [0x0020, 0x0040, 0x0080, 0x0100, 0x0200]) {
    if (flags & bit && reader.has(2)) reader.skip(2);
  }
  const weightKg = flags & 0x0400 && reader.has(2) ? Math.round(mass(reader.uint16()) * 100) / 100 : null;

  return { bodyFatPercent: fatRaw / 10, musclePercent, weightKg, timestamp };
}

// ----- Glucose Measurement (0x2A18) -----

export type GlucoseMeasurement = {
  sequenceNumber: number;
  mmolPerL: number | null;
  timestamp: Date | null;
};

const MG_DL_PER_MMOL_L = 18.0182;

export function decodeGlucoseMeasurement(base64: string): GlucoseMeasurement | null {
  const bytes = toBytes(base64);
  if (!bytes || bytes.length < 10) return null;
  const reader = new Reader(bytes);
  const flags = reader.uint8();
  const sequenceNumber = reader.uint16();
  let timestamp = dateTime(reader);
  if (flags & 0x01) {
    if (!reader.has(2)) return null;
    const offsetMinutes = reader.int16();
    if (timestamp) timestamp = new Date(timestamp.getTime() + offsetMinutes * 60000);
  }

  let mmolPerL: number | null = null;
  if (flags & 0x02) {
    if (!reader.has(3)) return null;
    const value = sfloat(reader.uint16());
    if (value !== null && value > 0) {
      // Bit 2 picks the unit family. Devices usually send base SI units (kg/L or mol/L)
      // with a negative exponent; some send mg/dL or mmol/L directly.
      if (flags & 0x04) mmolPerL = value < 1 ? value * 1000 : value;
      else mmolPerL = (value < 1 ? value * 100000 : value) / MG_DL_PER_MMOL_L;
      mmolPerL = Math.round(mmolPerL * 10) / 10;
    }
  }
  return { sequenceNumber, mmolPerL, timestamp };
}

// Record Access Control Point request: "Report stored records" (0x01), "All records" (0x01)
export const RACP_REPORT_ALL_RECORDS = btoaBytes([0x01, 0x01]);

function btoaBytes(bytes: number[]) {
  return btoa(String.fromCharCode(...bytes));
}
