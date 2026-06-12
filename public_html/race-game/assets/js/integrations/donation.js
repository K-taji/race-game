const CODOC_SCRIPT_SRC = 'https://codoc.jp/js/cms.js';
const CODOC_SCRIPT_SELECTOR = 'script[data-race-game-donation-script="codoc-widget"]';
const DEFAULT_CODOC_THEME = 'rainbow-square';

export function createDonationModel(config = {}) {
  if (!config.enabled) {
    return null;
  }

  const provider = config.provider || 'external-link';

  if (provider === 'codoc-widget') {
    if (!isValidCodocConfig(config)) {
      return null;
    }

    return {
      provider,
      scriptSrc: CODOC_SCRIPT_SRC,
      usercode: config.usercode.trim(),
      entryId: config.entryId.trim(),
      theme: normalizeCodocTheme(config.theme || config.css || config.dataCss),
      withoutBody: config.withoutBody !== false,
      supportMessage: config.supportMessage || ''
    };
  }

  if (provider !== 'external-link' || !isValidDonationUrl(config.url)) {
    return null;
  }

  return {
    provider,
    url: config.url,
    buttonLabel: config.buttonLabel || 'このゲームを応援する',
    target: config.openInNewTab === false ? '_self' : '_blank',
    rel: config.openInNewTab === false ? '' : 'noopener noreferrer'
  };
}

export function createDonationController(model = null, doc = globalThis.document) {
  function mount() {
    if (!model || model.provider !== 'codoc-widget') {
      return { mounted: false, status: 'unsupported-provider' };
    }

    if (!doc?.getElementById(model.entryId)) {
      return { mounted: false, status: 'missing-target' };
    }

    doc.querySelector?.(CODOC_SCRIPT_SELECTOR)?.remove?.();

    const script = doc.createElement('script');
    script.src = model.scriptSrc;
    script.charset = 'UTF-8';
    script.defer = true;
    script.dataset.css = model.theme;
    script.dataset.usercode = model.usercode;
    script.dataset.raceGameDonationScript = 'codoc-widget';

    const mountTarget = doc.body || doc.documentElement;
    if (!mountTarget) {
      return { mounted: false, status: 'missing-mount-target' };
    }

    mountTarget.appendChild(script);
    return { mounted: true, status: 'mounted' };
  }

  return { mount };
}

export function isValidDonationUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidCodocConfig(config = {}) {
  return Boolean(
    config.scriptSrc === CODOC_SCRIPT_SRC &&
      typeof config.usercode === 'string' &&
      /^[A-Za-z0-9_-]{6,64}$/.test(config.usercode.trim()) &&
      typeof config.entryId === 'string' &&
      /^codoc-entry-[A-Za-z0-9_-]{6,64}$/.test(config.entryId.trim())
  );
}

function normalizeCodocTheme(theme) {
  if (typeof theme !== 'string') {
    return DEFAULT_CODOC_THEME;
  }

  const trimmed = theme.trim();
  return /^[A-Za-z0-9_-]{1,50}$/.test(trimmed) ? trimmed : DEFAULT_CODOC_THEME;
}
