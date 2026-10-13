import type { Preferences, SensorType } from '@/data/types';

// One place that describes every biometric the app can record: how it's labelled, which
// icon and unit it uses, and how it's shown. Screens build their cards from this list, so
// adding a metric here (plus a decoder) is enough for it to appear wherever data exists.

// live: a stream of values (show latest + 24 h chart)
// spot: separate measurements taken now and then (show latest + 7-day trend)
// total: a running total the device accumulates (show today's increase + per-hour bars)
export type MetricKind = 'live' | 'spot' | 'total';

export type FeatherIcon =
  | 'heart'
  | 'activity'
  | 'zap'
  | 'droplet'
  | 'thermometer'
  | 'repeat'
  | 'navigation'
  | 'maximize-2'
  | 'map-pin'
  | 'user'
  | 'pie-chart'
  | 'trending-up'
  | 'moon';

export type MetricId = Exclude<SensorType, 'bp_systolic' | 'bp_diastolic'> | 'blood_pressure';

export type MetricDefinition = {
  id: MetricId;
  label: string;
  shortLabel: string;
  icon: FeatherIcon;
  kind: MetricKind;
  // Sensor types this metric is stored as (blood pressure is two)
  types: SensorType[];
};

export const METRICS: MetricDefinition[] = [
  { id: 'heart_rate', label: 'Heart Rate', shortLabel: 'Heart rate', icon: 'heart', kind: 'live', types: ['heart_rate'] },
  { id: 'hrv', label: 'Heart Rate Variability', shortLabel: 'HRV', icon: 'activity', kind: 'live', types: ['hrv'] },
  { id: 'spo2', label: 'Blood Oxygen', shortLabel: 'SpO₂', icon: 'droplet', kind: 'live', types: ['spo2'] },
  {
    id: 'blood_pressure',
    label: 'Blood Pressure',
    shortLabel: 'BP',
    icon: 'activity',
    kind: 'spot',
    types: ['bp_systolic', 'bp_diastolic'],
  },
  {
    id: 'body_temperature',
    label: 'Body Temperature',
    shortLabel: 'Temp',
    icon: 'thermometer',
    kind: 'spot',
    types: ['body_temperature'],
  },
  { id: 'glucose', label: 'Blood Glucose', shortLabel: 'Glucose', icon: 'droplet', kind: 'spot', types: ['glucose'] },
  { id: 'weight', label: 'Weight', shortLabel: 'Weight', icon: 'user', kind: 'spot', types: ['weight'] },
  { id: 'bmi', label: 'BMI', shortLabel: 'BMI', icon: 'user', kind: 'spot', types: ['bmi'] },
  { id: 'body_fat', label: 'Body Fat', shortLabel: 'Body fat', icon: 'pie-chart', kind: 'spot', types: ['body_fat'] },
  { id: 'energy', label: 'Energy Burned', shortLabel: 'Energy', icon: 'zap', kind: 'total', types: ['energy'] },
  { id: 'steps', label: 'Steps', shortLabel: 'Steps', icon: 'trending-up', kind: 'total', types: ['steps'] },
  { id: 'distance', label: 'Distance', shortLabel: 'Distance', icon: 'map-pin', kind: 'total', types: ['distance'] },
  { id: 'cadence', label: 'Cadence', shortLabel: 'Cadence', icon: 'repeat', kind: 'live', types: ['cadence'] },
  { id: 'speed', label: 'Speed', shortLabel: 'Speed', icon: 'navigation', kind: 'live', types: ['speed'] },
  {
    id: 'stride_length',
    label: 'Stride Length',
    shortLabel: 'Stride',
    icon: 'maximize-2',
    kind: 'live',
    types: ['stride_length'],
  },
];

export const METRIC_BY_ID = Object.fromEntries(METRICS.map((m) => [m.id, m])) as Record<MetricId, MetricDefinition>;

// Shown in their own Activity sections already
export const SECTION_METRICS: MetricId[] = ['heart_rate', 'steps'];

// Shown in "More vitals", in this order
export const VITAL_METRICS = METRICS.filter((m) => !SECTION_METRICS.includes(m.id));

// Unit stored in Firestore for each sensor type (always metric/SI)
export const STORED_UNITS: Record<SensorType, string> = {
  heart_rate: 'bpm',
  steps: 'steps',
  hrv: 'ms',
  energy: 'kcal',
  spo2: '%',
  body_temperature: '°C',
  bp_systolic: 'mmHg',
  bp_diastolic: 'mmHg',
  cadence: 'spm',
  speed: 'km/h',
  stride_length: 'm',
  distance: 'm',
  weight: 'kg',
  bmi: 'kg/m²',
  body_fat: '%',
  glucose: 'mmol/L',
};

export const SENSOR_TYPES = Object.keys(STORED_UNITS) as SensorType[];

export function isSensorType(value: unknown): value is SensorType {
  return typeof value === 'string' && value in STORED_UNITS;
}

type Units = Preferences['units'];

export type FormattedValue = { value: string; unit: string };

const KM_PER_MILE = 1.609344;

// A stored value in the unit to show (follows the Preferences units setting)
export function formatMetric(type: SensorType, value: number, units: Units): FormattedValue {
  const imperial = units === 'imperial';
  switch (type) {
    case 'body_temperature':
      return imperial ? { value: ((value * 9) / 5 + 32).toFixed(1), unit: '°F' } : { value: value.toFixed(1), unit: '°C' };
    case 'weight':
      return imperial ? { value: (value / 0.45359237).toFixed(1), unit: 'lb' } : { value: value.toFixed(1), unit: 'kg' };
    case 'glucose':
      return imperial ? { value: Math.round(value * 18.0182).toString(), unit: 'mg/dL' } : { value: value.toFixed(1), unit: 'mmol/L' };
    case 'speed':
      return imperial ? { value: (value / KM_PER_MILE).toFixed(1), unit: 'mph' } : { value: value.toFixed(1), unit: 'km/h' };
    case 'distance':
      return imperial
        ? { value: (value / 1000 / KM_PER_MILE).toFixed(2), unit: 'mi' }
        : { value: (value / 1000).toFixed(2), unit: 'km' };
    case 'stride_length':
      return imperial ? { value: (value / 0.0254).toFixed(0), unit: 'in' } : { value: value.toFixed(2), unit: 'm' };
    case 'bmi':
      return { value: value.toFixed(1), unit: '' };
    case 'body_fat':
      return { value: value.toFixed(1), unit: '%' };
    case 'spo2':
      return { value: Math.round(value).toString(), unit: '%' };
    case 'steps':
      return { value: Math.round(value).toLocaleString(), unit: 'steps' };
    default:
      return { value: Math.round(value).toLocaleString(), unit: STORED_UNITS[type] };
  }
}

// ----- What a device measures, from its standard Bluetooth services -----

export const SERVICE_UUIDS = {
  HEART_RATE: '0000180d-0000-1000-8000-00805f9b34fb',
  PULSE_OXIMETER: '00001822-0000-1000-8000-00805f9b34fb',
  HEALTH_THERMOMETER: '00001809-0000-1000-8000-00805f9b34fb',
  BLOOD_PRESSURE: '00001810-0000-1000-8000-00805f9b34fb',
  RUNNING_SPEED_CADENCE: '00001814-0000-1000-8000-00805f9b34fb',
  WEIGHT_SCALE: '0000181d-0000-1000-8000-00805f9b34fb',
  BODY_COMPOSITION: '0000181b-0000-1000-8000-00805f9b34fb',
  GLUCOSE: '00001808-0000-1000-8000-00805f9b34fb',
  PHYSICAL_ACTIVITY_MONITOR: '0000183e-0000-1000-8000-00805f9b34fb',
} as const;

// Things a device can report. 'activity_monitor' is the Physical Activity Monitor service
// (steps and sleep): detected, but its data isn't decoded yet.
export type DeviceMeasure = MetricId | 'activity_monitor';

const SERVICE_MEASURES: Record<string, DeviceMeasure[]> = {
  [SERVICE_UUIDS.HEART_RATE]: ['heart_rate'],
  [SERVICE_UUIDS.PULSE_OXIMETER]: ['spo2', 'heart_rate'],
  [SERVICE_UUIDS.HEALTH_THERMOMETER]: ['body_temperature'],
  [SERVICE_UUIDS.BLOOD_PRESSURE]: ['blood_pressure'],
  [SERVICE_UUIDS.RUNNING_SPEED_CADENCE]: ['cadence', 'speed'],
  [SERVICE_UUIDS.WEIGHT_SCALE]: ['weight'],
  [SERVICE_UUIDS.BODY_COMPOSITION]: ['body_fat'],
  [SERVICE_UUIDS.GLUCOSE]: ['glucose'],
  [SERVICE_UUIDS.PHYSICAL_ACTIVITY_MONITOR]: ['activity_monitor'],
};

// Measures implied by a device's services (canonical 128-bit lowercase UUIDs)
export function measuresForServices(serviceUuids: string[]): DeviceMeasure[] {
  const found = new Set<DeviceMeasure>();
  for (const uuid of serviceUuids) for (const measure of SERVICE_MEASURES[uuid] ?? []) found.add(measure);
  return orderMeasures([...found]);
}

const MEASURE_ORDER: DeviceMeasure[] = [...METRICS.map((m) => m.id), 'activity_monitor'];

// Also drops ids this version doesn't know (e.g. written by a newer app)
export function orderMeasures(measures: readonly string[]): DeviceMeasure[] {
  return [...new Set(measures)]
    .filter((m): m is DeviceMeasure => MEASURE_ORDER.includes(m as DeviceMeasure))
    .sort((a, b) => MEASURE_ORDER.indexOf(a) - MEASURE_ORDER.indexOf(b));
}

export function measureLabel(measure: DeviceMeasure): string {
  return measure === 'activity_monitor' ? 'Steps & sleep (not supported yet)' : METRIC_BY_ID[measure].shortLabel;
}

// The metric a stored sensor type belongs to
export function metricForType(type: SensorType): MetricId {
  return type === 'bp_systolic' || type === 'bp_diastolic' ? 'blood_pressure' : type;
}
