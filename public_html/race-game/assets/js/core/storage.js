export const PREVIOUS_RESULT_STORAGE_KEY = 'umano_ie_race_game_previous_result_v1';

export function createPreviousResultRecord(result, completedAt = new Date()) {
  return {
    runnerCount: result.runnerCount,
    mode: result.mode,
    favoriteRunner: result.favoriteModeEnabled ? result.favoriteRunner : null,
    topFive: result.topFive,
    completedAt: completedAt.toISOString()
  };
}

export function readPreviousResult(storage = globalThis.localStorage) {
  try {
    const rawValue = storage?.getItem(PREVIOUS_RESULT_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);
    return isPreviousResult(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writePreviousResult(record, storage = globalThis.localStorage) {
  try {
    storage?.setItem(PREVIOUS_RESULT_STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

function isPreviousResult(value) {
  if (
    !value ||
    !Number.isInteger(value.runnerCount) ||
    value.runnerCount < 2 ||
    value.runnerCount > 18 ||
    (value.mode !== 'normal' && value.mode !== 'favorite') ||
    !isValidTopFive(value.topFive, value.runnerCount) ||
    typeof value.completedAt !== 'string'
  ) {
    return false;
  }

  if (value.mode === 'favorite') {
    return (
      Number.isInteger(value.favoriteRunner) &&
      value.favoriteRunner >= 1 &&
      value.favoriteRunner <= value.runnerCount &&
      value.topFive[0] === value.favoriteRunner
    );
  }

  return value.favoriteRunner === null;
}

function isValidTopFive(topFive, runnerCount) {
  if (
    !Array.isArray(topFive) ||
    topFive.length < 1 ||
    topFive.length > 5 ||
    !topFive.every((runner) => Number.isInteger(runner) && runner >= 1 && runner <= runnerCount)
  ) {
    return false;
  }

  return new Set(topFive).size === topFive.length;
}
