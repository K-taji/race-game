import { createRaceResult, createRaceStages, normalizeRunnerCount, RaceValidationError } from './core/race-engine.js';
import { CryptoUnavailableError } from './core/random.js';
import { createPreviousResultRecord, readPreviousResult, writePreviousResult } from './core/storage.js';
import { createAdsenseController } from './integrations/adsense.js';
import { createAnalytics } from './integrations/analytics.js';
import { createDonationModel } from './integrations/donation.js';
import { renderRaceScreen, renderResultScreen, renderSetupScreen } from './ui/render.js?v=horse-face-png-20260608';

const DEFAULT_CONFIG = {
  app: {
    title: '競馬ランダム抽選',
    subtitle: 'レトロ競走シミュレーター',
    minRunners: 2,
    maxRunners: 18,
    defaultRunners: 12,
    raceDurationMs: 10000,
    quickRunnerOptions: [5, 8, 12, 18],
    savePreviousResult: true
  },
  donation: {
    enabled: false,
    provider: 'external-link',
    url: '',
    buttonLabel: 'このゲームを応援する',
    openInNewTab: true
  },
  adsense: {
    enabled: false,
    strategy: 'manual-result-slot',
    client: '',
    resultSlot: '',
    showDevelopmentPlaceholder: true,
    mountOncePerPageView: true
  },
  analytics: {
    enabled: false,
    mode: 'gtag',
    measurementId: '',
    sendPageView: true
  }
};

const COMMENTARY_TEMPLATES = {
  start: [
    () => '各馬一斉にスタートしました！',
    () => 'ゲートが開きました。まずは先行争いです！',
    () => 'スタートしました。横一線からレースが始まります！',
    () => '序盤から各馬スピードに乗っていきます！'
  ],
  early: [
    ({ leader }) => `${leader}番、好スタートから前へ出ます！`,
    ({ leader }) => `先頭は${leader}番、軽快な走りです！`,
    ({ leader, chaser }) => `${leader}番が先頭、${chaser}番もすぐ後ろです！`,
    ({ leader }) => `${leader}番がじわりとリードを広げています！`,
    ({ leader, chaser }) => `序盤は${leader}番と${chaser}番がレースを引っ張ります！`
  ],
  middle: [
    ({ leader }) => `中盤、${leader}番を中心に隊列が動いています。`,
    ({ leader, chaser }) => `${chaser}番が差を詰めます。先頭${leader}番は粘っています！`,
    ({ leader, third }) => `${leader}番が先頭、${third}番も外から伸びてきました！`,
    () => '中盤で順位が入れ替わっています。',
    ({ chaser }) => `${chaser}番が勢いよく追い上げます！`
  ],
  final: [
    ({ leader, chaser }) => `最後の直線、${leader}番と${chaser}番が接戦です！`,
    ({ leader }) => `${leader}番が先頭で直線へ。後続も迫ります！`,
    ({ leader, chaser }) => `直線勝負、${chaser}番が${leader}番に並びかけます！`,
    ({ leader, third }) => `${leader}番が抜け出すか、${third}番も伸びています！`,
    () => '最後の直線、接戦です！'
  ],
  goal: [
    () => '各馬がゴール板を通過しました。結果を確認しています。',
    () => '全馬がゴールへ。着順を集計しています。',
    () => '最後まで駆け抜けました。結果画面で着順を確認します。',
    () => 'レースが終了しました。結果を確認しています。'
  ]
};

const COMMENTARY_STRATEGIES = [
  {
    name: '逃げ',
    templates: {
      start: [
        () => '今日は逃げの展開。序盤から前へ行く馬に注目です！',
        () => 'スタート直後から逃げの形を作りにいきます！'
      ],
      early: [
        ({ leader }) => `${leader}番が逃げの形、後続を引き連れます！`,
        ({ leader, chaser }) => `逃げる${leader}番、${chaser}番がぴったり追走します！`
      ],
      middle: [
        ({ leader }) => `逃げ馬のペースで中盤へ。${leader}番はまだ余力がありそうです。`,
        ({ leader, chaser }) => `${leader}番が前で粘ります。${chaser}番は射程圏です！`
      ],
      final: [
        ({ leader, chaser }) => `逃げ粘る${leader}番、${chaser}番が迫ります！`,
        ({ leader }) => `${leader}番が先頭で直線へ。逃げ切るか、後続が届くか！`
      ]
    }
  },
  {
    name: '先行',
    templates: {
      start: [
        () => '先行勢がすっと前へ。好位を取りにいきます！',
        () => '今日は先行タイプの流れ。前めの位置取りが鍵になりそうです！'
      ],
      early: [
        ({ leader, chaser }) => `${leader}番が前、${chaser}番は好位で折り合っています！`,
        ({ chaser }) => `${chaser}番、前を見る形でリズムよく進みます！`
      ],
      middle: [
        ({ leader, chaser }) => `先行勢が隊列を作ります。${leader}番、${chaser}番が安定した走りです！`,
        ({ chaser, third }) => `${chaser}番と${third}番、好位からじわっと動きます。`
      ],
      final: [
        ({ leader, chaser }) => `先行勢が直線で踏ん張ります。${leader}番、${chaser}番が並んできます！`,
        ({ chaser }) => `${chaser}番、好位から脚を伸ばしてきました！`
      ]
    }
  },
  {
    name: '差し',
    templates: {
      start: [
        () => '差し脚をためる展開。中団の動きにも注目です！',
        () => '序盤は無理をせず、差しに構える馬もいます！'
      ],
      early: [
        ({ leader, third }) => `${leader}番が前へ。${third}番は中団で脚をためます！`,
        ({ chaser }) => `${chaser}番は前を見ながら、差しのタイミングをうかがいます。`
      ],
      middle: [
        ({ third }) => `${third}番が中団から進出開始。差し脚を伸ばします！`,
        ({ chaser, third }) => `${chaser}番、${third}番が差を詰めてきました！`
      ],
      final: [
        ({ chaser, third }) => `直線で差し勢が加速。${chaser}番、${third}番が伸びます！`,
        ({ third }) => `${third}番が外から差を詰めます。まだ分かりません！`
      ]
    }
  },
  {
    name: '追い込み',
    templates: {
      start: [
        () => '追い込み勢はじっくり構えます。終盤の脚に期待です！',
        () => '序盤は落ち着いた入り。後方からの追い込みにも注目です！'
      ],
      early: [
        ({ leader }) => `${leader}番が前、後方勢はまだ動きません。`,
        ({ third }) => `${third}番は後半勝負を意識した走りです。`
      ],
      middle: [
        ({ chaser, third }) => `中盤を過ぎて${chaser}番、${third}番が徐々に進出します！`,
        ({ third }) => `${third}番が外へ持ち出します。追い込みの準備です！`
      ],
      final: [
        ({ chaser, third }) => `大外から${third}番、内から${chaser}番も伸びてきます！`,
        ({ third }) => `${third}番が一気に追い込んできました。直線は混戦です！`
      ]
    }
  }
];

const config = mergeConfig(DEFAULT_CONFIG, window.RACE_GAME_CONFIG || {});
const root = document.getElementById('race-game-root');
const analytics = createAnalytics(config.analytics, window);
const donationModel = createDonationModel(config.donation);
const adsense = createAdsenseController(config.adsense, document, window);

const state = {
  screen: 'setup',
  runnerCount: config.app.defaultRunners,
  favoriteModeEnabled: false,
  favoriteRunner: null,
  raceResult: null,
  previousResult: readPreviousResult(),
  raceStartedAt: null,
  skipped: false,
  completed: false,
  notice: ''
};

let raceTimers = [];

render();

function render() {
  if (!root) {
    return;
  }

  if (state.screen !== 'result') {
    adsense.hide();
  }

  if (state.screen === 'setup') {
    root.innerHTML = renderSetupScreen({ state, config });
    bindSetupEvents();
    return;
  }

  if (state.screen === 'race') {
    root.innerHTML = renderRaceScreen({ state, config });
    bindRaceEvents();
    return;
  }

  root.innerHTML = renderResultScreen({ state, config, donationModel });
  bindResultEvents();
  adsense.mountResultAd();
}

function bindSetupEvents() {
  root.querySelectorAll('[data-runner-step]').forEach((button) => {
    button.addEventListener('click', () => {
      setRunnerCount(state.runnerCount + Number(button.dataset.runnerStep), 'stepper');
    });
  });

  root.querySelectorAll('[data-runner-quick]').forEach((button) => {
    button.addEventListener('click', () => {
      setRunnerCount(Number(button.dataset.runnerQuick), 'quick');
    });
  });

  root.querySelector('[data-runner-input]')?.addEventListener('change', (event) => {
    setRunnerCount(event.currentTarget.valueAsNumber, 'input');
  });

  root.querySelector('[data-favorite-toggle]')?.addEventListener('change', (event) => {
    state.favoriteModeEnabled = event.currentTarget.checked;

    if (!state.favoriteModeEnabled) {
      state.favoriteRunner = null;
    }

    state.notice = '';
    analytics.track('favorite_horse_toggle', { enabled: state.favoriteModeEnabled });
    render();
  });

  root.querySelectorAll('[data-favorite-runner]').forEach((button) => {
    button.addEventListener('click', () => {
      state.favoriteRunner = Number(button.dataset.favoriteRunner);
      state.notice = '';
      analytics.track('favorite_horse_select', { favorite_runner: state.favoriteRunner });
      render();
    });
  });

  root.querySelector('[data-start-race]')?.addEventListener('click', startRace);
}

function bindRaceEvents() {
  root.querySelector('[data-skip-race]')?.addEventListener('click', skipRace);
}

function bindResultEvents() {
  root.querySelector('[data-replay]')?.addEventListener('click', () => {
    analytics.track('replay', {
      runner_count: state.runnerCount,
      mode: state.favoriteModeEnabled ? 'favorite' : 'normal'
    });
    startRace();
  });

  root.querySelector('[data-change-settings]')?.addEventListener('click', () => {
    clearRaceTimers();
    state.screen = 'setup';
    state.raceResult = null;
    state.notice = '';
    render();
  });

  root.querySelector('[data-donation-link]')?.addEventListener('click', () => {
    analytics.track('donation_button_click', {
      location: 'result',
      provider: donationModel?.provider
    });
  });
}

function setRunnerCount(nextValue, inputMethod) {
  try {
    const normalized = normalizeRunnerCount(nextValue, config.app);
    state.runnerCount = normalized;

    if (state.favoriteRunner && state.favoriteRunner > normalized) {
      state.favoriteRunner = null;
    }

    state.notice = '';
    analytics.track('runner_count_select', {
      runner_count: normalized,
      input_method: inputMethod
    });
  } catch (error) {
    state.notice = error instanceof RaceValidationError ? error.message : '出走頭数を確認してください。';
  }

  render();
}

function startRace() {
  clearRaceTimers();

  try {
    state.raceResult = createRaceResult(
      {
        runnerCount: state.runnerCount,
        favoriteModeEnabled: state.favoriteModeEnabled,
        favoriteRunner: state.favoriteRunner,
        rules: config.app
      },
      window.crypto
    );
  } catch (error) {
    state.notice = getStartErrorMessage(error);
    state.screen = 'setup';
    render();
    return;
  }

  state.screen = 'race';
  state.raceStartedAt = performance.now();
  state.skipped = false;
  state.completed = false;
  state.notice = '';

  analytics.track('game_start', {
    runner_count: state.raceResult.runnerCount,
    mode: state.raceResult.mode,
    favorite_runner: state.raceResult.favoriteRunner ?? undefined
  });

  render();
  startRaceAnimation();
}

function startRaceAnimation() {
  const durationMs = getRaceDurationMs();
  const finishPauseMs = getFinishPauseMs();
  const finalTransitionMs = Math.round(durationMs * 0.18);
  const finalStageStartMs = Math.max(80, durationMs - finishPauseMs - finalTransitionMs);
  const finalCrossingMs = durationMs - finishPauseMs;
  const stages = createRaceStages(state.raceResult.runnerCount, state.raceResult.finalOrder);
  const commentaryStrategy = getRandomCommentaryStrategy();

  applyRaceStage(stages[0], 0);
  updateCommentary(getCommentary('start', {}, commentaryStrategy));

  raceTimers = [
    window.setTimeout(() => {
      applyRaceStage(stages[1], durationMs * 0.3);
      updateCommentary(getCommentary('early', createCommentaryContext(stages[1].order), commentaryStrategy));
    }, 80),
    window.setTimeout(() => {
      applyRaceStage(stages[2], durationMs * 0.28);
      updateCommentary(getCommentary('middle', createCommentaryContext(stages[2].order), commentaryStrategy));
    }, durationMs * 0.38),
    window.setTimeout(() => {
      applyRaceStage(stages[3], finalTransitionMs);
      updateCommentary(getCommentary('final', createCommentaryContext(stages[3].order), commentaryStrategy));
    }, finalStageStartMs),
    window.setTimeout(() => {
      updateCommentary(getCommentary('goal'));
    }, finalCrossingMs),
    window.setTimeout(() => {
      completeRace(false);
    }, durationMs)
  ];
}

function applyRaceStage(stage, transitionMs) {
  root.querySelectorAll('[data-runner-token]').forEach((token) => {
    const runner = Number(token.dataset.runnerToken);
    const progress = stage.positions.get(runner);

    token.style.transitionDuration = `${Math.max(0, Math.round(transitionMs))}ms`;
    token.style.setProperty('--progress', progress);
  });
}

function updateCommentary(text) {
  const commentary = root.querySelector('[data-commentary-text]');

  if (commentary) {
    commentary.textContent = text;
  }
}

function getCommentary(phase, context = {}, commentaryStrategy = null) {
  const strategyTemplates = commentaryStrategy?.templates?.[phase] || [];
  const templates = strategyTemplates.length ? strategyTemplates : COMMENTARY_TEMPLATES[phase] || COMMENTARY_TEMPLATES.start;
  const template = templates[Math.floor(Math.random() * templates.length)];

  return template(context);
}

function createCommentaryContext(order) {
  const [leader, runnerUp, third] = order;

  return {
    leader,
    chaser: runnerUp ?? leader,
    runnerUp: runnerUp ?? leader,
    third: third ?? runnerUp ?? leader
  };
}

function getRandomCommentaryStrategy() {
  return COMMENTARY_STRATEGIES[Math.floor(Math.random() * COMMENTARY_STRATEGIES.length)];
}

function skipRace() {
  if (state.screen !== 'race' || state.completed) {
    return;
  }

  const elapsedMs = Math.round(performance.now() - state.raceStartedAt);
  analytics.track('skip_animation', {
    runner_count: state.raceResult.runnerCount,
    elapsed_ms: elapsedMs
  });

  completeRace(true);
}

function completeRace(skipped) {
  if (state.completed) {
    return;
  }

  clearRaceTimers();
  state.completed = true;
  state.skipped = skipped;
  state.screen = 'result';

  if (config.app.savePreviousResult) {
    const record = createPreviousResultRecord(state.raceResult);
    const saved = writePreviousResult(record);
    state.previousResult = saved ? record : state.previousResult;
  }

  analytics.track('game_complete', {
    runner_count: state.raceResult.runnerCount,
    mode: state.raceResult.mode,
    favorite_runner: state.raceResult.favoriteRunner ?? undefined,
    skipped
  });

  render();
}

function clearRaceTimers() {
  raceTimers.forEach((timerId) => window.clearTimeout(timerId));
  raceTimers = [];
}

function getRaceDurationMs() {
  const configuredDuration = Number(config.app.raceDurationMs);
  const clampedDuration = Number.isFinite(configuredDuration)
    ? Math.min(12000, Math.max(8000, configuredDuration))
    : 10000;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return reducedMotion ? 1800 : clampedDuration;
}

function getFinishPauseMs() {
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return reducedMotion ? 450 : 900;
}

function getStartErrorMessage(error) {
  if (error instanceof CryptoUnavailableError) {
    return error.message;
  }

  if (error instanceof RaceValidationError) {
    return error.message;
  }

  return 'レースを開始できませんでした。設定を確認してください。';
}

function mergeConfig(baseConfig, overrideConfig) {
  return {
    app: { ...baseConfig.app, ...(overrideConfig.app || {}) },
    donation: { ...baseConfig.donation, ...(overrideConfig.donation || {}) },
    adsense: { ...baseConfig.adsense, ...(overrideConfig.adsense || {}) },
    analytics: { ...baseConfig.analytics, ...(overrideConfig.analytics || {}) }
  };
}
