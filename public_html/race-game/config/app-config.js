window.RACE_GAME_CONFIG = {
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
