export type DevicePlatform = 'ios' | 'android';

export function deviceKey(platform: DevicePlatform, id: string): string {
  return id.startsWith('ios:') || id.startsWith('android:') ? id : `${platform}:${id}`;
}

export function nativeDeviceId(key: string): string {
  return key.replace(/^(ios|android):/, '');
}

export function devicePlatform(key: string): DevicePlatform {
  return key.startsWith('ios:') ? 'ios' : 'android';
}
