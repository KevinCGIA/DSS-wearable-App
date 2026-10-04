import assert from 'node:assert/strict';
import test from 'node:test';
import { createNativeAuthService } from '../src/features/auth/nativeAuthFlow.ts';

const passwordUser = (verified = false) => ({
  uid: 'user-1', email: 'researcher@example.com', emailVerified: verified,
  displayName: 'Test Researcher', photoURL: null, providerData: [{ providerId: 'password' }],
});
const googleUser = {
  ...passwordUser(true), photoURL: 'https://example.com/avatar.jpg',
  providerData: [{ providerId: 'google.com' }],
};
const registration = {
  email: ' researcher@example.com ', password: 'test-password', name: ' Test Researcher ',
  height: 180, weight: 72.5, avatarUri: 'file:///avatar.jpg',
};

function fixture({ initialUser = null, loginUser = passwordUser(), overrides = {} } = {}) {
  let user = initialUser;
  let observer;
  let unsubscribeCount = 0;
  const calls = [];
  const setUser = (next) => { user = next; observer?.(next); return next; };
  const deps = {
    currentUser: () => user,
    observeAuth: (callback) => {
      observer = callback;
      callback(user);
      return () => { unsubscribeCount++; observer = undefined; };
    },
    signInEmail: async (email, password) => {
      calls.push(['login', email, password]); return setUser(loginUser);
    },
    createUser: async (email, password) => {
      calls.push(['create', email, password]); return setUser(passwordUser());
    },
    signInGoogle: async () => setUser(googleUser),
    signOut: async () => { calls.push(['logout']); setUser(null); },
    updateDisplayName: async (name) => { calls.push(['displayName', name]); },
    sendVerification: async () => { calls.push(['verification']); },
    sendPasswordReset: async (email) => { calls.push(['reset', email]); },
    changeEmail: async (email) => { calls.push(['changeEmail', email]); },
    ensureProfile: async (uid, profile) => { calls.push(['profile', uid, profile]); },
    saveAvatar: async (uid, uri) => { calls.push(['avatar', uid, uri]); },
    ...overrides,
  };
  const service = createNativeAuthService(deps);
  const sessions = [];
  const unsubscribe = service.subscribe((value) => sessions.push(value));
  return { service, calls, sessions, unsubscribe, setUser, get unsubscribeCount() { return unsubscribeCount; } };
}

test('registration preserves Kevin field types, saves avatar before verification and never exposes a session', async () => {
  const f = fixture();
  await f.service.signUp(registration);
  assert.deepEqual(f.calls, [
    ['create', 'researcher@example.com', 'test-password'],
    ['profile', 'user-1', { name: 'Test Researcher', height: '180', weight: '72.5' }],
    ['displayName', 'Test Researcher'], ['avatar', 'user-1', 'file:///avatar.jpg'],
    ['verification'], ['logout'],
  ]);
  assert.ok(f.sessions.every((value) => value === null));
});

test('registration keeps optional measurements as empty strings and skips absent avatar', async () => {
  const f = fixture();
  await f.service.signUp({ ...registration, height: null, weight: null, avatarUri: null });
  assert.deepEqual(f.calls.find(([kind]) => kind === 'profile')[2], {
    name: 'Test Researcher', height: '', weight: '',
  });
  assert.ok(!f.calls.some(([kind]) => kind === 'avatar'));
});

test('profile/avatar failures sign out and never report registration success', async () => {
  for (const failedAction of ['ensureProfile', 'saveAvatar']) {
    const failure = new Error(`${failedAction} failed`);
    const f = fixture({ overrides: { [failedAction]: async () => { throw failure; } } });
    await assert.rejects(f.service.signUp(registration), (error) => error === failure);
    assert.deepEqual(f.calls.at(-1), ['logout']);
    assert.ok(!f.calls.some(([kind]) => kind === 'verification'));
    assert.ok(f.sessions.every((value) => value === null));
  }
});

test('unverified email login and restored password sessions are blocked', async () => {
  const f = fixture({ initialUser: passwordUser() });
  assert.equal(await f.service.signIn(' researcher@example.com ', 'password'), 'unverified');
  assert.deepEqual(f.calls.at(-1), ['logout']);
  assert.ok(f.sessions.every((value) => value === null));
});

test('verified login publishes a session and logout clears it', async () => {
  const f = fixture({ loginUser: passwordUser(true) });
  assert.equal(await f.service.signIn('researcher@example.com', 'password'), 'signed-in');
  assert.equal(f.sessions.at(-1).uid, 'user-1');
  await f.service.signOut();
  assert.equal(f.sessions.at(-1), null);
});

test('both Google actions await profile creation before exposing a session', async () => {
  for (const action of ['signInWithGoogle', 'signUpWithGoogle']) {
    let finishProfile;
    const f = fixture({ overrides: {
      ensureProfile: async (uid, profile) => {
        assert.equal(uid, 'user-1');
        assert.deepEqual(profile, {
          name: 'Test', height: '', weight: '', profilePictureUrl: googleUser.photoURL,
        });
        await new Promise((resolve) => { finishProfile = resolve; });
      },
    } });
    const pending = f.service[action]();
    await Promise.resolve();
    assert.ok(f.sessions.every((value) => value === null));
    finishProfile();
    await pending;
    assert.equal(f.sessions.at(-1).uid, 'user-1');
  }
});

test('a failed Google profile write signs out and does not expose a session', async () => {
  const f = fixture({ overrides: { ensureProfile: async () => { throw new Error('offline'); } } });
  await assert.rejects(f.service.signInWithGoogle(), /offline/);
  assert.deepEqual(f.calls.at(-1), ['logout']);
  assert.ok(f.sessions.every((value) => value === null));
});

test('even failed sign-out cleanup cannot expose a failed Google session', async () => {
  const f = fixture({ overrides: {
    ensureProfile: async () => { throw new Error('offline'); },
    signOut: async () => { throw new Error('cleanup failed'); },
  } });
  await assert.rejects(f.service.signInWithGoogle(), /cleanup failed/);
  f.setUser(googleUser);
  assert.ok(f.sessions.every((value) => value === null));
});

test('reset, verified email change and password change use the appropriate addresses', async () => {
  const f = fixture({ initialUser: passwordUser(true) });
  await f.service.sendPasswordReset(' reset@example.com ');
  await f.service.changeEmail(' new@example.com ');
  assert.equal(await f.service.changePassword(), 'researcher@example.com');
  assert.deepEqual(f.calls, [
    ['reset', 'reset@example.com'], ['changeEmail', 'new@example.com'], ['reset', 'researcher@example.com'],
  ]);
});

test('account changes require a current user and nonempty email', async () => {
  const f = fixture();
  await assert.rejects(f.service.changeEmail('new@example.com'), { code: 'auth/no-current-user' });
  await assert.rejects(f.service.changePassword(), { code: 'auth/no-current-user' });
  f.setUser(passwordUser(true));
  await assert.rejects(f.service.changeEmail('  '), { code: 'auth/missing-email' });
  assert.deepEqual(f.calls, []);
});

test('overlapping auth actions are rejected and subscription cleanup detaches the observer', async () => {
  let finish;
  const f = fixture({ overrides: { signInGoogle: () => new Promise((resolve) => { finish = resolve; }) } });
  const pending = f.service.signInWithGoogle();
  await assert.rejects(f.service.signUpWithGoogle(), { code: 'auth/operation-in-progress' });
  finish(googleUser);
  await pending;
  const secondUnsubscribe = f.service.subscribe(() => {});
  f.unsubscribe();
  assert.equal(f.unsubscribeCount, 0);
  secondUnsubscribe();
  assert.equal(f.unsubscribeCount, 1);
});
