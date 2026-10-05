import assert from 'node:assert/strict';
import test from 'node:test';
import { displayNameFor } from '../src/features/auth/authSessionModel.ts';

const user = (fields = {}) => ({
  uid: 'user-1', email: 'researcher@example.com', emailVerified: true,
  displayName: null, photoURL: null, providerData: [], ...fields,
});

test('session greeting prefers the first display name', () => {
  assert.equal(displayNameFor(user({ displayName: '  Alex Chen  ' })), 'Alex');
});

test('session greeting falls back to the email prefix and a research-neutral label', () => {
  assert.equal(displayNameFor(user()), 'researcher');
  assert.equal(displayNameFor(user({ email: null })), 'Researcher');
  assert.equal(displayNameFor(null), 'Researcher');
});
