import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAdapter } from './loadAdapter.mjs';
import * as measures from '../src/lib/measures.ts';

const { describeAuthError, passwordError, validateAuthInput } = loadAdapter('../src/features/auth/authErrors.ts', { '@/lib/measures': measures });
const form = (changes) => ({ name: '', height: '', weight: '', email: 'a@b.co', password: 'abc12345', confirmPassword: 'abc12345', ...changes });

test('a wrong email and a wrong password give the same message', () => {
  const messages = ['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].map((code) => describeAuthError({ code }));
  assert.equal(new Set(messages).size, 1);
  assert.doesNotMatch(messages[0], /register|find an account/i);
});

test('new passwords need 8 characters with a letter and a number', () => {
  assert.match(passwordError('abc123'), /at least 8/);
  assert.match(passwordError('abcdefgh'), /letter and one number/);
  assert.match(passwordError('12345678'), /letter and one number/);
  assert.equal(passwordError('abc12345'), null);
  assert.equal(validateAuthInput('register', form({})).password, undefined);
  assert.match(validateAuthInput('register', form({ password: 'short1', confirmPassword: 'short1' })).password, /at least 8/);
  // Logging in never applies the rule: older accounts keep their passwords
  assert.equal(validateAuthInput('login', form({ password: 'abc' })).password, undefined);
});
