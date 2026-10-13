import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decodeBloodPressureMeasurement,
  decodeBodyCompositionMeasurement,
  decodeGlucoseMeasurement,
  decodeHeartRateMeasurement,
  decodePlxContinuous,
  decodePlxSpotCheck,
  decodeRscMeasurement,
  decodeTemperatureMeasurement,
  decodeWeightMeasurement,
  float32,
  rmssd,
  sfloat,
} from '../src/lib/biometrics/decoders.ts';

const b64 = (bytes) => Buffer.from(bytes).toString('base64');
// 2026-10-10 08:30:00 as a Date Time characteristic
const STAMP = [0xea, 0x07, 0x0a, 0x0a, 0x08, 0x1e, 0x00];

test('IEEE 11073 SFLOAT and FLOAT', () => {
  assert.equal(sfloat(0x0072), 114);
  assert.equal(sfloat(0xf16d), 36.5);
  assert.equal(sfloat(0x07ff), null); // NaN
  assert.equal(sfloat(0x0800), null); // NRes
  assert.equal(float32(0xff00016e), 36.6);
  assert.equal(float32(0x007fffff), null);
});

test('heart rate with energy expended and RR intervals', () => {
  const m = decodeHeartRateMeasurement(b64([0x18, 72, 0x64, 0x00, 0x00, 0x04, 0x33, 0x03]));
  assert.equal(m.bpm, 72);
  assert.equal(Math.round(m.energyKcal * 10) / 10, 23.9); // 100 kJ
  assert.deepEqual(m.rrIntervalsMs.map((v) => Math.round(v)), [1000, 800]);
  assert.equal(decodeHeartRateMeasurement(b64([0x01, 0x2c, 0x01])).bpm, 300);
  assert.equal(decodeHeartRateMeasurement(b64([0x01, 0x2c])), null);
  assert.equal(decodeHeartRateMeasurement('not base64!'), null);
});

test('RMSSD heart rate variability', () => {
  assert.equal(rmssd([800, 810, 790, 800]), 14.1);
  assert.equal(rmssd([800, 810]), null);
  assert.equal(rmssd([800, 5000, 810, 790, 800]), 14.1); // implausible interval dropped
});

test('temperature in Celsius and Fahrenheit, with time stamp', () => {
  assert.equal(decodeTemperatureMeasurement(b64([0x00, 0x6e, 0x01, 0x00, 0xff])).celsius, 36.6);
  assert.equal(decodeTemperatureMeasurement(b64([0x01, 0xda, 0x03, 0x00, 0xff])).celsius, 37);
  const stamped = decodeTemperatureMeasurement(b64([0x02, 0x6e, 0x01, 0x00, 0xff, ...STAMP]));
  assert.equal(stamped.timestamp.getFullYear(), 2026);
  assert.equal(stamped.timestamp.getHours(), 8);
  assert.equal(decodeTemperatureMeasurement(b64([0x00, 0xff, 0xff, 0x7f, 0x00])), null);
});

test('blood pressure in mmHg and kPa', () => {
  const m = decodeBloodPressureMeasurement(
    b64([0x06, 0x78, 0x00, 0x50, 0x00, 0x5d, 0x00, ...STAMP, 0x46, 0x00]),
  );
  assert.deepEqual(
    { systolic: m.systolic, diastolic: m.diastolic, meanArterial: m.meanArterial, pulse: m.pulse },
    { systolic: 120, diastolic: 80, meanArterial: 93, pulse: 70 },
  );
  assert.equal(m.timestamp.getMinutes(), 30);
  const kpa = decodeBloodPressureMeasurement(b64([0x01, 0xa0, 0xf0, 0x6b, 0xf0, 0xff, 0x07]));
  assert.deepEqual([kpa.systolic, kpa.diastolic, kpa.meanArterial], [120, 80, null]);
  assert.equal(decodeBloodPressureMeasurement(b64([0x02, 0x78, 0x00, 0x50, 0x00, 0x5d, 0x00, 0xea])), null);
});

test('pulse oximeter continuous and spot-check', () => {
  assert.deepEqual(decodePlxContinuous(b64([0x00, 0x62, 0x00, 0x48, 0x00])), { spo2: 98, pulse: 72, timestamp: null });
  const spot = decodePlxSpotCheck(b64([0x01, 0x61, 0x00, 0x4b, 0x00, ...STAMP]));
  assert.equal(spot.spo2, 97);
  assert.equal(spot.pulse, 75);
  assert.equal(spot.timestamp.getDate(), 10);
  assert.equal(decodePlxContinuous(b64([0x00, 0xff, 0x07, 0x48, 0x00])), null);
});

test('running speed and cadence', () => {
  const m = decodeRscMeasurement(b64([0x03, 0x00, 0x03, 170, 0x69, 0x00, 0x40, 0xe2, 0x01, 0x00]));
  assert.deepEqual(m, { speedKmh: 10.8, cadence: 170, strideLengthM: 1.05, totalDistanceM: 12345.6, running: false });
  assert.equal(decodeRscMeasurement(b64([0x04, 0x00, 0x02, 90])).running, true);
  assert.equal(decodeRscMeasurement(b64([0x02, 0x00, 0x03, 170, 0x40])), null);
});

test('weight in kg and lb with BMI and height', () => {
  assert.deepEqual(decodeWeightMeasurement(b64([0x08, 0xa4, 0x38, 0xed, 0x00, 0xd6, 0x06])), {
    kg: 72.5,
    bmi: 23.7,
    heightM: 1.75,
    timestamp: null,
  });
  assert.equal(decodeWeightMeasurement(b64([0x01, 0x80, 0x3e])).kg, 72.57);
  assert.equal(decodeWeightMeasurement(b64([0x00, 0xff, 0xff])), null);
});

test('body composition', () => {
  assert.deepEqual(decodeBodyCompositionMeasurement(b64([0x10, 0x04, 0xd5, 0x00, 0x95, 0x01, 0xa4, 0x38])), {
    bodyFatPercent: 21.3,
    musclePercent: 40.5,
    weightKg: 72.5,
    timestamp: null,
  });
  assert.equal(decodeBodyCompositionMeasurement(b64([0x00, 0x10, 0xd5, 0x00])), null); // multi-packet
});

test('glucose in mg/dL and mmol/L families', () => {
  const mg = decodeGlucoseMeasurement(b64([0x02, 0x05, 0x00, 0xea, 0x07, 0x0a, 0x0a, 0x07, 0x0f, 0x00, 0x5f, 0xb0, 0x11]));
  assert.equal(mg.sequenceNumber, 5);
  assert.equal(mg.mmolPerL, 5.3); // 95 mg/dL
  assert.equal(mg.timestamp.getHours(), 7);
  const mmol = decodeGlucoseMeasurement(b64([0x06, 0x06, 0x00, 0xea, 0x07, 0x0a, 0x0a, 0x07, 0x0f, 0x00, 0x37, 0xc0, 0x11]));
  assert.equal(mmol.mmolPerL, 5.5);
  const offset = decodeGlucoseMeasurement(b64([0x03, 0x07, 0x00, 0xea, 0x07, 0x0a, 0x0a, 0x07, 0x0f, 0x00, 0x1e, 0x00, 0x5f, 0xb0, 0x11]));
  assert.equal(offset.timestamp.getMinutes(), 45); // +30 min time offset
  assert.equal(decodeGlucoseMeasurement(b64([0x02, 0x05, 0x00])), null);
});
