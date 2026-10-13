import assert from 'node:assert/strict';
import test from 'node:test';
import { createNativeAccountService } from '../src/features/profile/nativeAccountFlow.ts';

const authUser = {
  uid: 'one', email: 'researcher@example.com', emailVerified: true,
  displayName: 'Auth Name', photoURL: 'https://example.com/auth.jpg', providerData: [{ providerId: 'google.com' }],
};

function fixture({ profile, avatar, user = authUser, overrides = {} } = {}) {
  let current = user;
  const writes = [];
  const service = createNativeAccountService({
    currentUser: () => current,
    readProfile: async (uid) => { assert.equal(uid, 'one'); return profile; },
    readAvatar: async (uid) => { assert.equal(uid, 'one'); return avatar; },
    mergeProfile: async (uid, fields) => { writes.push([uid, fields]); },
    saveAvatar: async (uid, uri) => { writes.push([uid, uri]); return 'data:image/jpeg;base64,saved'; },
    changeEmail: async () => {}, changePassword: async () => 'researcher@example.com',
    subscribeToUser: () => () => {},
    ...overrides,
  });
  return { service, writes, setUser: (next) => { current = next; } };
}

test('loads metric string measurements; email and verification always come from Auth', async () => {
  const f = fixture({
    profile: { name: 'Saved Name', height: '180', weight: '72.5', email: 'old@example.com', emailVerified: false },
    avatar: { imageData: 'data:image/jpeg;base64,custom' },
  });
  assert.deepEqual(await f.service.loadProfile('Fallback'), {
    uid: 'one', name: 'Saved Name', height: 180, weight: 72.5,
    email: authUser.email, emailVerified: true, avatarData: 'data:image/jpeg;base64,custom',
  });
  assert.deepEqual(f.writes, []);
});

test('missing documents return Auth fallbacks without creating or overwriting data', async () => {
  const f = fixture();
  const profile = await f.service.loadProfile('Fallback');
  assert.equal(profile.name, 'Auth Name');
  assert.equal(profile.avatarData, authUser.photoURL);
  assert.equal(profile.height, null);
  assert.equal(profile.weight, null);
  assert.deepEqual(f.writes, []);
});

test('custom avatar takes priority over Firestore Google photo, then Auth photo, then initials data', async () => {
  for (const [avatar, profile, user, expected] of [
    [{ imageData: 'custom' }, { profilePictureUrl: 'google' }, authUser, 'custom'],
    [undefined, { profilePictureUrl: 'google' }, authUser, 'google'],
    [{ imageData: '' }, { profilePictureUrl: '' }, authUser, authUser.photoURL],
    [undefined, undefined, { ...authUser, photoURL: null }, null],
  ]) {
    const result = await fixture({ avatar, profile, user }).service.loadProfile('Fallback');
    assert.equal(result.avatarData, expected);
    assert.ok(result.name.trim());
  }
  const result = await fixture({ user: { ...authUser, displayName: null, photoURL: null } }).service.loadProfile('');
  assert.equal(result.name, 'researcher');
});

test('missing/malformed measurements stay empty rather than becoming zero or NaN', async () => {
  for (const value of [undefined, null, '', ' ', 'abc', '1.8.5', true, {}, NaN, Infinity, -1, 0]) {
    const result = await fixture({ profile: { height: value, weight: value } }).service.loadProfile('');
    assert.equal(result.height, null);
    assert.equal(result.weight, null);
  }
  const result = await fixture({ profile: { height: 180, weight: 72.5 } }).service.loadProfile('');
  assert.equal(result.height, 180);
  assert.equal(result.weight, 72.5);
});

test('save writes only the three Kevin-compatible fields as metric strings', async () => {
  const f = fixture();
  await f.service.saveProfile({ name: ' Updated ', height: 180.3, weight: 72.5 });
  await f.service.saveProfile({ name: '', height: null, weight: null });
  assert.deepEqual(f.writes, [
    ['one', { name: 'Updated', height: '180.3', weight: '72.5' }],
    ['one', { name: '', height: '', weight: '' }],
  ]);
});

test('invalid save values never reach storage', async () => {
  const f = fixture();
  for (const value of [NaN, Infinity, -5, 0]) {
    await assert.rejects(f.service.saveProfile({ name: '', height: value, weight: null }), { code: 'profile/invalid-measurement' });
  }
  assert.deepEqual(f.writes, []);
});

test('avatar save returns durable stored data instead of the temporary picker URI', async () => {
  const f = fixture();
  assert.equal(await f.service.saveProfilePicture('file:///temporary.jpg'), 'data:image/jpeg;base64,saved');
  assert.deepEqual(f.writes, [['one', 'file:///temporary.jpg']]);
});

test('signed-out profile access fails without reading or writing storage', async () => {
  let reads = 0;
  const f = fixture({ user: null, overrides: { readProfile: async () => { reads++; } } });
  await assert.rejects(f.service.loadProfile(''), { code: 'auth/no-current-user' });
  await assert.rejects(f.service.saveProfile({ name: '', height: null, weight: null }), { code: 'auth/no-current-user' });
  await assert.rejects(f.service.saveProfilePicture('file:///avatar.jpg'), { code: 'auth/no-current-user' });
  assert.equal(reads, 0);
  assert.deepEqual(f.writes, []);
});

test('profile reads reject stale results when accounts switch while loading', async () => {
  let finish;
  const f = fixture({ overrides: { readProfile: () => new Promise((resolve) => { finish = resolve; }) } });
  const pending = f.service.loadProfile('');
  f.setUser({ ...authUser, uid: 'two' });
  finish({ name: 'Old account' });
  await assert.rejects(pending, { code: 'auth/user-mismatch' });
});

test('avatar saves do not report success for a different current account', async () => {
  let finish;
  const f = fixture({ overrides: { saveAvatar: () => new Promise((resolve) => { finish = resolve; }) } });
  const pending = f.service.saveProfilePicture('file:///temporary.jpg');
  f.setUser(null);
  finish('data:image/jpeg;base64,old-account');
  await assert.rejects(pending, { code: 'auth/user-mismatch' });
});

test('Firestore permission errors propagate instead of silently becoming missing profiles', async () => {
  const denied = Object.assign(new Error('Permission denied'), { code: 'firestore/permission-denied' });
  const f = fixture({ overrides: { readAvatar: async () => { throw denied; } } });
  await assert.rejects(f.service.loadProfile(''), (error) => error === denied);
});

test('deleting an account needs a recent sign-in, removes the data first and then the account', async () => {
  const steps = [];
  let signedInAt = 0;
  const f = fixture({ overrides: {
    lastSignIn: async () => signedInAt,
    now: () => 10 * 60 * 1000,
    deleteData: async (uid) => { steps.push(`data:${uid}`); },
    deleteUser: async () => { steps.push('user'); },
    eraseLocal: (uid) => { steps.push(`local:${uid}`); },
  } });
  // Signed in ten minutes ago: nothing is touched
  await assert.rejects(f.service.deleteAccount(), { code: 'auth/requires-recent-login' });
  assert.deepEqual(steps, []);
  signedInAt = 9 * 60 * 1000;
  await f.service.deleteAccount();
  assert.deepEqual(steps, ['data:one', 'user', 'local:one']);
});

test('a failed data deletion leaves the account in place', async () => {
  const steps = [];
  const f = fixture({ overrides: {
    lastSignIn: async () => 1000, now: () => 2000,
    deleteData: async () => { throw Object.assign(new Error('offline'), { code: 'firestore/unavailable' }); },
    deleteUser: async () => { steps.push('user'); },
    eraseLocal: () => { steps.push('local'); },
  } });
  await assert.rejects(f.service.deleteAccount(), { code: 'firestore/unavailable' });
  assert.deepEqual(steps, []);
});

test('nothing is deleted if the signed-in account changes part-way', async () => {
  const steps = [];
  const f = fixture({ overrides: {
    lastSignIn: async () => 1000, now: () => 2000,
    deleteData: async () => { steps.push('data'); f.setUser({ ...authUser, uid: 'two' }); },
    deleteUser: async () => { steps.push('user'); },
    eraseLocal: () => { steps.push('local'); },
  } });
  await assert.rejects(f.service.deleteAccount(), { code: 'auth/user-mismatch' });
  assert.deepEqual(steps, ['data']);
});
