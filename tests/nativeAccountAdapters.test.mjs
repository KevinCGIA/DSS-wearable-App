import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAdapter } from './loadAdapter.mjs';

test('native profile adapter reads the shared paths and merges updates without replacing extra fields', async () => {
  const records = new Map([
    ['users/one', { name: 'Old', height: '170', weight: '70', autoConnectDevice: false, profilePictureUrl: 'photo' }],
    ['users/one/private/avatarData', { imageData: 'avatar' }],
  ]);
  const { nativeAccountService: adapter } = loadAdapter('../src/features/profile/nativeAccountService.ts', {
    '@react-native-firebase/auth': { getAuth: () => ({ currentUser: { uid: 'one' } }) },
    '@react-native-firebase/firestore': {
      getFirestore: () => ({}), doc: (_, ...parts) => parts.join('/'),
      getDoc: async (path) => ({ data: () => records.get(path) }),
      setDoc: async (path, fields, options) => {
        assert.equal(options.merge, true);
        records.set(path, { ...records.get(path), ...fields });
      },
    },
    '@/features/auth/nativeAuthService': { nativeAuthService: { subscribe: () => () => {} } },
    './nativeAccountFlow': { createNativeAccountService: (deps) => deps },
    './nativeProfileWrites': {},
  });
  assert.equal((await adapter.readProfile('one')).name, 'Old');
  assert.equal((await adapter.readAvatar('one')).imageData, 'avatar');
  await adapter.mergeProfile('one', { name: 'New', height: '181', weight: '75' });
  assert.deepEqual(records.get('users/one'), {
    name: 'New', height: '181', weight: '75', autoConnectDevice: false, profilePictureUrl: 'photo',
  });
  await adapter.mergeProfile('missing', { name: 'New', height: '', weight: '' });
  assert.equal(records.get('users/missing').name, 'New');
});
