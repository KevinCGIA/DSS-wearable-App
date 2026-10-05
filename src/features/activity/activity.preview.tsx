import React, { useState } from 'react';
import { heartRateHistory, mockDeviceA, mockDeviceB, mockRestingHrTrends, mockSleep, mockSleepTrends, stepsHistory } from '@/data/mocks';
import type { MockDevice } from '@/data/mocks';
import type { SensorReading } from '@/data/types';
import type { PreviewEntry } from '@/features/previews/types';
import { buildActivity, TEST_SOURCE } from './activityModel';
import type { ActivityInput, SleepView } from './activityModel';
import { ActivityScreen } from './ActivityScreen';
import type { ActivityScreenProps } from './ActivityScreen';

// Previews run the same model as the real tab, on mock readings.

const noop = () => undefined;
const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
const fullSleep: SleepView = { sleep: mockSleep, trends: mockSleepTrends };

// 24 h of heart rate and hourly steps, plus one total for each of the 6 days before.
function deviceReadings(device: MockDevice, hrOffset: number, todaySteps: number) {
  const now = Date.now();
  const heartRate = heartRateHistory(device, hrOffset).readings;
  const steps: SensorReading[] = [...stepsHistory(todaySteps, device).readings];
  for (let d = 2; d <= 6; d++) {
    const day = new Date(now - d * DAY);
    day.setHours(21, 0, 0, 0);
    steps.push({
      id: `week-${device.id}-${d}`,
      type: 'steps',
      value: 4200 + ((d * 1931 + hrOffset * 97) % 6100),
      unit: 'steps',
      timestamp: day,
      deviceId: device.id,
      deviceName: device.name,
      source: 'ble',
    });
  }
  return { heartRate, steps };
}

const asTestData = (readings: SensorReading[]): SensorReading[] =>
  readings.map((r) => ({ ...r, id: `test-${r.id}`, deviceId: null, deviceName: 'Test data', source: 'manual' }));

const olderThan = (readings: SensorReading[], ms: number) =>
  readings.filter((r) => r.timestamp.getTime() < Date.now() - ms);

type Setup = {
  heartRate?: SensorReading[];
  steps?: SensorReading[];
  sleep?: Record<string, SleepView>;
  resting?: string[];
  selected?: string;
  extra?: Partial<ActivityScreenProps>;
};

function Preview({ heartRate = [], steps = [], sleep = {}, resting = [], selected: initial, extra }: Setup) {
  const [selected, setSelected] = useState<string | null>(initial ?? null);
  const sort = (r: SensorReading[]) => [...r].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const input: ActivityInput = {
    now: Date.now(),
    heartRate: sort(heartRate),
    steps: sort(steps),
    names: { [mockDeviceA.id]: mockDeviceA.name, [mockDeviceB.id]: mockDeviceB.name },
    includeTest: true,
    selected,
    sleepFor: (key) => sleep[key] ?? null,
    restingTrendsFor: (key) => (resting.includes(key) ? mockRestingHrTrends : null),
  };
  return (
    <ActivityScreen
      now={Date.now()}
      loading={false}
      error={null}
      view={buildActivity(input)}
      bottomInset={0}
      scrollRequest={null}
      onSelect={setSelected}
      onScrollHandled={noop}
      {...extra}
    />
  );
}

const devTools: Partial<ActivityScreenProps> = { onAddTestReading: noop, onAddSampleData: noop, onAddTestSteps: noop };

export const activityPreview: PreviewEntry = {
  title: 'Activity',
  group: 'Screens',
  states: [
    { label: 'No data', render: () => <Preview extra={devTools} /> },
    {
      label: 'One device, full data',
      render: () => (
        <Preview
          {...deviceReadings(mockDeviceA, 0, 6842)}
          sleep={{ [mockDeviceA.id]: fullSleep }}
          resting={[mockDeviceA.id]}
        />
      ),
    },
    {
      label: 'Two devices (tap the chips)',
      render: () => {
        const a = deviceReadings(mockDeviceA, 0, 6842);
        const b = deviceReadings(mockDeviceB, 6, 3910);
        // The strap's newest reading is older, so the watch is first and selected.
        return (
          <Preview
            heartRate={[...a.heartRate, ...olderThan(b.heartRate, 20 * MIN)]}
            steps={[...a.steps, ...olderThan(b.steps, 20 * MIN)]}
            sleep={{ [mockDeviceA.id]: fullSleep }}
            resting={[mockDeviceA.id]}
          />
        );
      },
    },
    {
      label: 'Device missing sleep',
      render: () => <Preview {...deviceReadings(mockDeviceB, 6, 3910)} />,
    },
    {
      label: 'Stale (over 10 minutes old)',
      render: () => {
        const a = deviceReadings(mockDeviceA, 0, 6842);
        return (
          <Preview
            heartRate={olderThan(a.heartRate, 42 * MIN)}
            steps={olderThan(a.steps, 42 * MIN)}
            sleep={{ [mockDeviceA.id]: fullSleep }}
            resting={[mockDeviceA.id]}
          />
        );
      },
    },
    {
      label: 'Test data chip (dev)',
      render: () => {
        const a = deviceReadings(mockDeviceA, 0, 6842);
        const t = deviceReadings(mockDeviceA, 3, 2400);
        return (
          <Preview
            heartRate={[...olderThan(a.heartRate, 30 * MIN), ...asTestData(t.heartRate)]}
            steps={[...olderThan(a.steps, 30 * MIN), ...asTestData(t.steps)]}
            sleep={{ [TEST_SOURCE]: fullSleep }}
            selected={TEST_SOURCE}
            extra={devTools}
          />
        );
      },
    },
    { label: 'Loading', render: () => <Preview extra={{ loading: true }} /> },
    {
      label: 'Error',
      render: () => <Preview extra={{ error: "Couldn't load your history." }} />,
    },
  ],
};
