import assert from 'node:assert/strict';
import test from 'node:test';
import { CryptoUnavailableError, getSecureRandomInt, secureShuffle } from '../public_html/race-game/assets/js/core/random.js';

function createSequenceCrypto(values) {
  let index = 0;

  return {
    getRandomValues(bucket) {
      bucket[0] = values[index % values.length];
      index += 1;
      return bucket;
    }
  };
}

test('secureShuffle keeps every item exactly once', () => {
  const shuffled = secureShuffle([1, 2, 3, 4, 5], createSequenceCrypto([4, 3, 2, 1]));

  assert.deepEqual([...shuffled].sort((a, b) => a - b), [1, 2, 3, 4, 5]);
  assert.equal(new Set(shuffled).size, 5);
});

test('getSecureRandomInt rejects values outside the unbiased bucket', () => {
  const value = getSecureRandomInt(10, createSequenceCrypto([0xffffffff, 12]));

  assert.equal(value, 2);
});

test('secureShuffle does not mutate the original array', () => {
  const original = [1, 2, 3, 4];

  secureShuffle(original, createSequenceCrypto([0, 0, 0]));

  assert.deepEqual(original, [1, 2, 3, 4]);
});

test('secureShuffle fails when Crypto API is unavailable', () => {
  assert.throws(() => secureShuffle([1, 2, 3], null), CryptoUnavailableError);
});
