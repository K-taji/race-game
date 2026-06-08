import { secureShuffle } from './random.js';

export const DEFAULT_APP_RULES = {
  minRunners: 2,
  maxRunners: 18
};

export class RaceValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RaceValidationError';
  }
}

export function normalizeRunnerCount(value, rules = DEFAULT_APP_RULES) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue)) {
    throw new RaceValidationError('出走頭数は整数で指定してください。');
  }

  if (numberValue < rules.minRunners || numberValue > rules.maxRunners) {
    throw new RaceValidationError(`出走頭数は${rules.minRunners}〜${rules.maxRunners}頭で指定してください。`);
  }

  return numberValue;
}

export function createRunnerNumbers(runnerCount) {
  return Array.from({ length: runnerCount }, (_, index) => index + 1);
}

export function createRaceResult(settings, cryptoObject = globalThis.crypto) {
  const runnerCount = normalizeRunnerCount(settings.runnerCount, settings.rules || DEFAULT_APP_RULES);
  const runners = createRunnerNumbers(runnerCount);

  if (!settings.favoriteModeEnabled) {
    const finalOrder = secureShuffle(runners, cryptoObject);
    return createResultPayload({ runnerCount, finalOrder, favoriteModeEnabled: false, favoriteRunner: null });
  }

  const favoriteRunner = Number(settings.favoriteRunner);

  if (!Number.isInteger(favoriteRunner) || favoriteRunner < 1 || favoriteRunner > runnerCount) {
    throw new RaceValidationError('推し馬指定をONにした場合は、範囲内の番号を1つ選択してください。');
  }

  const remainingRunners = runners.filter((runner) => runner !== favoriteRunner);
  const finalOrder = [favoriteRunner, ...secureShuffle(remainingRunners, cryptoObject)];

  return createResultPayload({ runnerCount, finalOrder, favoriteModeEnabled: true, favoriteRunner });
}

export function createResultPayload({ runnerCount, finalOrder, favoriteModeEnabled, favoriteRunner }) {
  return {
    runnerCount,
    mode: favoriteModeEnabled ? 'favorite' : 'normal',
    favoriteModeEnabled,
    favoriteRunner,
    finalOrder,
    topFive: finalOrder.slice(0, Math.min(5, finalOrder.length))
  };
}

export function createRaceStages(runnerCount, finalOrder) {
  const runners = createRunnerNumbers(runnerCount);
  const earlyOrder = rotateOrder(finalOrder, Math.min(2, finalOrder.length - 1));
  const middleOrder = weaveOrder(finalOrder);

  return [
    { name: 'start', order: runners, positions: createProgressMap(runners, 5, 8) },
    { name: 'early', order: earlyOrder, positions: createProgressMap(earlyOrder, 18, 38) },
    { name: 'middle', order: middleOrder, positions: createProgressMap(middleOrder, 35, 48) },
    { name: 'final', order: finalOrder, positions: createProgressMap(finalOrder, 60, 36) }
  ];
}

function rotateOrder(order, shift) {
  if (order.length < 2) {
    return [...order];
  }

  return [...order.slice(shift), ...order.slice(0, shift)];
}

function weaveOrder(order) {
  const woven = [];

  for (let index = 1; index < order.length; index += 2) {
    woven.push(order[index]);
  }

  for (let index = 0; index < order.length; index += 2) {
    woven.push(order[index]);
  }

  return woven;
}

function createProgressMap(order, minimum, spread) {
  const progressByRunner = new Map();
  const divisor = Math.max(1, order.length - 1);

  order.forEach((runner, rankIndex) => {
    const rankRatio = (order.length - 1 - rankIndex) / divisor;
    progressByRunner.set(runner, Math.round((minimum + rankRatio * spread) * 10) / 10);
  });

  return progressByRunner;
}
