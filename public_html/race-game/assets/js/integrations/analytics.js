const GA4_SCRIPT_BASE_URL = 'https://www.googletagmanager.com/gtag/js';
const GA4_MEASUREMENT_ID_PATTERN = /^G-[A-Za-z0-9]+$/;
const INITIALIZED_IDS_KEY = '__raceGameGa4InitializedIds';

export function createAnalytics(config = {}, win = globalThis.window, doc = globalThis.document) {
  const enabled = Boolean(config.enabled);
  const mode = config.mode || 'gtag';
  const measurementId = normalizeGa4MeasurementId(config.measurementId);

  if (enabled && mode === 'gtag' && measurementId) {
    initializeGtag({ measurementId, win, doc, sendPageView: config.sendPageView !== false });
  }

  return {
    track(eventName, params = {}) {
      if (!enabled || !eventName) {
        return false;
      }

      const eventParams = removeUndefinedValues(params);

      if (mode === 'gtag' && typeof win?.gtag === 'function') {
        win.gtag('event', eventName, eventParams);
        return true;
      }

      if (mode === 'gtm' && Array.isArray(win?.dataLayer)) {
        win.dataLayer.push({ event: eventName, ...eventParams });
        return true;
      }

      return false;
    }
  };
}

export function isValidGa4MeasurementId(measurementId) {
  return GA4_MEASUREMENT_ID_PATTERN.test(String(measurementId || '').trim());
}

function initializeGtag({ measurementId, win, doc, sendPageView }) {
  if (!win) {
    return false;
  }

  win.dataLayer = Array.isArray(win.dataLayer) ? win.dataLayer : [];

  if (typeof win.gtag !== 'function') {
    win.gtag = function gtag() {
      win.dataLayer.push(arguments);
    };
  }

  const initializedIds = getInitializedMeasurementIds(win);

  if (initializedIds.has(measurementId)) {
    return true;
  }

  appendGtagScript({ measurementId, doc });
  win.gtag('js', new Date());
  win.gtag('config', measurementId, { send_page_view: sendPageView });
  initializedIds.add(measurementId);

  return true;
}

function appendGtagScript({ measurementId, doc }) {
  if (!doc?.createElement) {
    return false;
  }

  const scriptSrc = `${GA4_SCRIPT_BASE_URL}?id=${encodeURIComponent(measurementId)}`;

  if (hasExistingScript(doc, measurementId, scriptSrc)) {
    return false;
  }

  const script = doc.createElement('script');
  script.async = true;
  script.src = scriptSrc;
  script.setAttribute?.('data-race-game-ga4', measurementId);

  const mountTarget = doc.head || doc.documentElement || doc.body;
  mountTarget?.appendChild?.(script);

  return true;
}

function hasExistingScript(doc, measurementId, scriptSrc) {
  const scripts = doc.querySelectorAll ? Array.from(doc.querySelectorAll('script')) : [];

  return scripts.some((script) => {
    const dataId = script.getAttribute?.('data-race-game-ga4');
    return dataId === measurementId || script.src === scriptSrc;
  });
}

function getInitializedMeasurementIds(win) {
  if (!(win[INITIALIZED_IDS_KEY] instanceof Set)) {
    win[INITIALIZED_IDS_KEY] = new Set();
  }

  return win[INITIALIZED_IDS_KEY];
}

function normalizeGa4MeasurementId(measurementId) {
  const normalized = String(measurementId || '').trim();

  return isValidGa4MeasurementId(normalized) ? normalized : '';
}

function removeUndefinedValues(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
}
