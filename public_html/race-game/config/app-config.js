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
    enabled: true,
    strategy: 'manual-result-slot',
    client: 'ca-pub-7797843965278219',
    resultSlot: '2794718712',
    showDevelopmentPlaceholder: false,
    mountOncePerPageView: true
  },
  analytics: {
    enabled: true,
    mode: 'gtag',
    measurementId: 'G-GW1P90GHX8',
    sendPageView: true
  }
};
