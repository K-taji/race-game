import assert from 'node:assert/strict';
import test from 'node:test';
import { createPreviousResultRecord, PREVIOUS_RESULT_STORAGE_KEY, readPreviousResult, writePreviousResult } from '../public_html/race-game/assets/js/core/storage.js';

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    }
  };
}

test('previous result record stores only the latest public summary', () => {
  const record = createPreviousResultRecord(
    {
      runnerCount: 12,
      mode: 'favorite',
      favoriteModeEnabled: true,
      favoriteRunner: 7,
      topFive: [7, 12, 3, 10, 5]
    },
    new Date('2026-06-07T03:34:56.000Z')
  );

  assert.deepEqual(record, {
    runnerCount: 12,
    mode: 'favorite',
    favoriteRunner: 7,
    topFive: [7, 12, 3, 10, 5],
    completedAt: '2026-06-07T03:34:56.000Z'
  });
});

test('previous result can be written and read', () => {
  const storage = createMemoryStorage();
  const record = {
    runnerCount: 8,
    mode: 'normal',
    favoriteRunner: null,
    topFive: [2, 5, 1, 7, 8],
    completedAt: '2026-06-07T03:34:56.000Z'
  };

  assert.equal(writePreviousResult(record, storage), true);
  assert.equal(storage.getItem(PREVIOUS_RESULT_STORAGE_KEY).includes('"runnerCount":8'), true);
  assert.deepEqual(readPreviousResult(storage), record);
});

test('storage failures do not stop the game', () => {
  const brokenStorage = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    }
  };

  assert.equal(readPreviousResult(brokenStorage), null);
  assert.equal(writePreviousResult({ runnerCount: 2, mode: 'normal', topFive: [1, 2], completedAt: 'x' }, brokenStorage), false);
});

test('previous result rejects tampered favorite runner values', () => {
  const storage = createMemoryStorage();
  storage.setItem(PREVIOUS_RESULT_STORAGE_KEY, JSON.stringify({
    runnerCount: 8,
    mode: 'favorite',
    favoriteRunner: '<img src=x onerror=alert(1)>',
    topFive: [2, 5, 1, 7, 8],
    completedAt: '2026-06-07T03:34:56.000Z'
  }));

  assert.equal(readPreviousResult(storage), null);
});

test('previous result rejects oversized or out-of-range runner lists', () => {
  const storage = createMemoryStorage();
  storage.setItem(PREVIOUS_RESULT_STORAGE_KEY, JSON.stringify({
    runnerCount: 8,
    mode: 'normal',
    favoriteRunner: null,
    topFive: [2, 5, 1, 7, 8, 99],
    completedAt: '2026-06-07T03:34:56.000Z'
  }));

  assert.equal(readPreviousResult(storage), null);
});

test('previous result rejects duplicated runner lists', () => {
  const storage = createMemoryStorage();
  storage.setItem(PREVIOUS_RESULT_STORAGE_KEY, JSON.stringify({
    runnerCount: 8,
    mode: 'normal',
    favoriteRunner: null,
    topFive: [2, 5, 1, 5, 8],
    completedAt: '2026-06-07T03:34:56.000Z'
  }));

  assert.equal(readPreviousResult(storage), null);
});

test('previous result rejects favorite records that do not put the favorite first', () => {
  const storage = createMemoryStorage();
  storage.setItem(PREVIOUS_RESULT_STORAGE_KEY, JSON.stringify({
    runnerCount: 8,
    mode: 'favorite',
    favoriteRunner: 7,
    topFive: [2, 7, 1, 5, 8],
    completedAt: '2026-06-07T03:34:56.000Z'
  }));

  assert.equal(readPreviousResult(storage), null);
});
