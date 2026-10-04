import React, { createContext, useContext, useMemo, useState } from 'react';

// Which device the Dashboard and its detail pages (Heart Rate, Steps, Sleep) show. null = all devices.
type DeviceFilterValue = {
  deviceId: string | null;
  setDeviceId: (deviceId: string | null) => void;
};

const DeviceFilterContext = createContext<DeviceFilterValue | null>(null);

export function DeviceFilterProvider({ children }: { children: React.ReactNode }) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const value = useMemo(() => ({ deviceId, setDeviceId }), [deviceId]);
  return <DeviceFilterContext.Provider value={value}>{children}</DeviceFilterContext.Provider>;
}

export function useDeviceFilter(): DeviceFilterValue {
  const context = useContext(DeviceFilterContext);
  if (!context) throw new Error('useDeviceFilter must be used inside DeviceFilterProvider');
  return context;
}
