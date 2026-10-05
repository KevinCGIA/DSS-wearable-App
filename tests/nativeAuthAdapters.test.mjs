import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAdapter } from './loadAdapter.mjs';

test('profile transaction creates missing docs but never replaces existing profile fields', async () => {
  const documents = new Map();
  let writes = 0;
  const firestore = {
    getFirestore: () => ({}),
    doc: (_, ...parts) => parts.join('/'),
    runTransaction: async (_, action) => action({
      get: async (path) => ({ exists: () => documents.has(path) }),
      set: (path, value) => { writes++; documents.set(path, value); },
    }),
  };
  const { ensureNativeProfile } = loadAdapter('../src/features/profile/nativeProfileWrites.ts', {
    '@react-native-firebase/firestore': firestore, 'expo-image-manipulator': {},
  });
  const original = { name: 'Saved name', height: '181', weight: '75', autoConnectDevice: false };
  documents.set('users/existing', original);
  await ensureNativeProfile('existing', { name: 'Google name', height: '', weight: '' });
  assert.equal(writes, 0);
  assert.equal(documents.get('users/existing'), original);
  const profile = { name: 'New user', height: '', weight: '' };
  await ensureNativeProfile('new', profile);
  assert.equal(writes, 1);
  assert.equal(documents.get('users/new'), profile);
});

test('avatar encoder writes Kevin-compatible JPEG data and releases native resources on success/failure', async () => {
  for (const failWrite of [false, true]) {
    const calls = [];
    let released = 0;
    const { saveNativeAvatar } = loadAdapter('../src/features/profile/nativeProfileWrites.ts', {
      '@react-native-firebase/firestore': {
        getFirestore: () => ({}), doc: (_, ...parts) => parts.join('/'),
        setDoc: async (path, value, options) => {
          assert.equal(path, 'users/user-1/private/avatarData');
          assert.equal(value.imageData, 'data:image/jpeg;base64,encoded');
          assert.equal(options.merge, true);
          if (failWrite) throw new Error('write failed');
        },
      },
      'expo-image-manipulator': {
        SaveFormat: { JPEG: 'jpeg' },
        ImageManipulator: {
          manipulate: (uri) => {
            assert.equal(uri, 'file:///avatar.jpg');
            const context = {
              resize: (size) => { calls.push(JSON.parse(JSON.stringify(size))); return context; },
              renderAsync: async () => ({
                saveAsync: async (options) => { calls.push(JSON.parse(JSON.stringify(options))); return { base64: 'encoded' }; },
                release: () => { released++; },
              }),
              release: () => { released++; },
            };
            return context;
          },
        },
      },
    });
    if (failWrite) await assert.rejects(saveNativeAvatar('user-1', 'file:///avatar.jpg'), /write failed/);
    else await saveNativeAvatar('user-1', 'file:///avatar.jpg');
    assert.deepEqual(calls, [{ width: 300, height: 300 }, { format: 'jpeg', compress: 0.5, base64: true }]);
    assert.equal(released, 2);
  }
});

function googleAdapter(platform, response) {
  const calls = [];
  const { nativeAuthService } = loadAdapter('../src/features/auth/nativeAuthService.ts', {
    'react-native': { Platform: { OS: platform } },
    '@react-native-firebase/auth': {
      getAuth: () => ({}),
      GoogleAuthProvider: { credential: (token) => { calls.push(['token', token]); return token; } },
      signInWithCredential: async () => ({ user: { uid: 'google-user' } }),
    },
    '@react-native-google-signin/google-signin': { GoogleSignin: {
      configure: (config) => calls.push(['configure', config]),
      hasPlayServices: async () => { calls.push(['playServices']); },
      signIn: async () => response,
    } },
    '@/features/profile/nativeProfileWrites': {},
    './googleClientConfig': { googleClientConfig: { webClientId: 'web', iosClientId: 'ios' } },
    './nativeAuthFlow': {
      createNativeAuthService: (deps) => deps,
      authError: (code) => Object.assign(new Error(code), { code }),
    },
  });
  return { adapter: nativeAuthService, calls };
}

test('Google checks Play Services only on Android and configures both clients once', async () => {
  for (const platform of ['ios', 'android']) {
    const { adapter, calls } = googleAdapter(platform, { type: 'success', data: { idToken: 'id-token' } });
    assert.equal((await adapter.signInGoogle()).uid, 'google-user');
    await adapter.signInGoogle();
    assert.equal(calls.filter(([kind]) => kind === 'configure').length, 1);
    assert.equal(calls.filter(([kind]) => kind === 'playServices').length, platform === 'android' ? 2 : 0);
    assert.deepEqual(calls[0], ['configure', { webClientId: 'web', iosClientId: 'ios' }]);
  }
});

test('Google cancellation and missing token never exchange a Firebase credential', async () => {
  for (const [response, code] of [
    [{ type: 'cancelled', data: null }, 'auth/cancelled'],
    [{ type: 'success', data: { idToken: null } }, 'auth/invalid-credential'],
  ]) {
    const { adapter, calls } = googleAdapter('ios', response);
    await assert.rejects(adapter.signInGoogle(), { code });
    assert.ok(!calls.some(([kind]) => kind === 'token'));
  }
});
