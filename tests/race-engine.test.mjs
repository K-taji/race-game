import assert from 'node:assert/strict';
import test from 'node:test';
import { createRaceResult, createRaceStages, normalizeRunnerCount, RaceValidationError } from '../public_html/race-game/assets/js/core/race-engine.js';

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

test('normal mode creates a complete final order without duplicates', () => {
  const result = createRaceResult({ runnerCount: 12, favoriteModeEnabled: false }, createSequenceCrypto([1, 2, 3, 4, 5, 6]));

  assert.equal(result.finalOrder.length, 12);
  assert.equal(new Set(result.finalOrder).size, 12);
  assert.deepEqual([...result.finalOrder].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.equal(result.topFive.length, 5);
  assert.equal(result.mode, 'normal');
});

test('favorite mode always puts the selected runner first', () => {
  const result = createRaceResult(
    { runnerCount: 12, favoriteModeEnabled: true, favoriteRunner: 7 },
    createSequenceCrypto([1, 2, 3, 4, 5, 6])
  );

  assert.equal(result.finalOrder[0], 7);
  assert.equal(new Set(result.finalOrder).size, 12);
  assert.equal(result.mode, 'favorite');
  assert.equal(result.favoriteRunner, 7);
});

test('favorite mode requires a selected runner in range', () => {
  assert.throws(
    () => createRaceResult({ runnerCount: 12, favoriteModeEnabled: true, favoriteRunner: null }, createSequenceCrypto([0])),
    RaceValidationError
  );
});

test('runner count must be an integer between 2 and 18', () => {
  assert.equal(normalizeRunnerCount(2), 2);
  assert.equal(normalizeRunnerCount(18), 18);
  assert.throws(() => normalizeRunnerCount(1), RaceValidationError);
  assert.throws(() => normalizeRunnerCount(19), RaceValidationError);
  assert.throws(() => normalizeRunnerCount(2.5), RaceValidationError);
});

test('race stages end with the final order', () => {
  const finalOrder = [3, 1, 2, 4];
  const stages = createRaceStages(4, finalOrder);

  assert.deepEqual(stages.at(-1).order, finalOrder);
  assert.equal(stages.at(-1).positions.get(3) > stages.at(-1).positions.get(4), true);
  assert.equal(stages.at(-1).positions.get(3), 96);
});
