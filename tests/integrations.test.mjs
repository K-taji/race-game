import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAnalytics,
  isValidGa4MeasurementId
} from '../public_html/race-game/assets/js/integrations/analytics.js';
import { createAdsenseController } from '../public_html/race-game/assets/js/integrations/adsense.js';
import { createDonationModel, isValidDonationUrl } from '../public_html/race-game/assets/js/integrations/donation.js';

test('donation URL accepts HTTPS only', () => {
  assert.equal(isValidDonationUrl('https://example.com/support'), true);
  assert.equal(isValidDonationUrl('http://example.com/support'), false);
  assert.equal(isValidDonationUrl('javascript:alert(1)'), false);
  assert.equal(isValidDonationUrl(''), false);
});

test('donation model is hidden when disabled or invalid', () => {
  assert.equal(createDonationModel({ enabled: false, url: 'https://example.com' }), null);
  assert.equal(createDonationModel({ enabled: true, url: 'http://example.com' }), null);
});

test('donation model uses safe external-link attributes', () => {
  const model = createDonationModel({
    enabled: true,
    provider: 'external-link',
    url: 'https://example.com/support',
    buttonLabel: '応援する',
    openInNewTab: true
  });

  assert.deepEqual(model, {
    provider: 'external-link',
    url: 'https://example.com/support',
    buttonLabel: '応援する',
    target: '_blank',
    rel: 'noopener noreferrer'
  });
});

test('analytics gtag mode sends events only when configured', () => {
  const calls = [];
  const analytics = createAnalytics({ enabled: true, mode: 'gtag' }, {
    gtag(...args) {
      calls.push(args);
    }
  });

  assert.equal(analytics.track('game_start', { runner_count: 12, favorite_runner: undefined }), true);
  assert.deepEqual(calls, [['event', 'game_start', { runner_count: 12 }]]);
});

test('analytics gtag mode initializes GA4 when measurement ID is configured', () => {
  const scripts = [];
  const win = {};
  const doc = createFakeDocument(scripts);

  const analytics = createAnalytics(
    { enabled: true, mode: 'gtag', measurementId: 'G-ABC1234567' },
    win,
    doc
  );

  assert.equal(typeof win.gtag, 'function');
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].async, true);
  assert.equal(scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-ABC1234567');
  assert.equal(scripts[0].getAttribute('data-race-game-ga4'), 'G-ABC1234567');

  const initCalls = win.dataLayer.map((args) => Array.from(args));
  assert.equal(initCalls[0][0], 'js');
  assert.ok(initCalls[0][1] instanceof Date);
  assert.deepEqual(initCalls[1], ['config', 'G-ABC1234567', { send_page_view: true }]);
  assert.equal(analytics.track('game_start', { runner_count: 12 }), true);
});

test('analytics does not inject GA4 script for invalid measurement ID', () => {
  const scripts = [];
  const analytics = createAnalytics(
    { enabled: true, mode: 'gtag', measurementId: 'UA-123456-1' },
    {},
    createFakeDocument(scripts)
  );

  assert.equal(scripts.length, 0);
  assert.equal(analytics.track('game_start', { runner_count: 12 }), false);
});

test('GA4 measurement ID accepts only G-prefixed IDs', () => {
  assert.equal(isValidGa4MeasurementId('G-ABC1234567'), true);
  assert.equal(isValidGa4MeasurementId(' G-ABC1234567 '), true);
  assert.equal(isValidGa4MeasurementId('UA-123456-1'), false);
  assert.equal(isValidGa4MeasurementId('GTM-ABC123'), false);
});

test('analytics stays silent when unset', () => {
  const analytics = createAnalytics({ enabled: false, mode: 'gtag' }, {});

  assert.equal(analytics.track('game_start', { runner_count: 12 }), false);
});

test('adsense shows development placeholder until production IDs are configured', () => {
  const view = createFakeAdsenseDocument();
  const adsense = createAdsenseController(
    { enabled: false, showDevelopmentPlaceholder: true },
    view.doc,
    {}
  );

  const result = adsense.mountResultAd();

  assert.equal(result.status, 'placeholder');
  assert.equal(view.placeholder.hidden, false);
  assert.equal(view.section.hasClass('is-hidden'), false);
  assert.equal(view.slot.children.length, 0);
});

test('adsense mounts production unit only once per page view', () => {
  const view = createFakeAdsenseDocument();
  const win = { adsbygoogle: [] };
  const adsense = createAdsenseController(
    {
      enabled: true,
      strategy: 'manual-result-slot',
      client: 'ca-pub-1234567890123456',
      resultSlot: '1234567890',
      mountOncePerPageView: true
    },
    view.doc,
    win
  );

  const firstResult = adsense.mountResultAd();
  const secondResult = adsense.mountResultAd();

  assert.equal(firstResult.status, 'mounted');
  assert.equal(secondResult.status, 'already-mounted');
  assert.equal(view.placeholder.hidden, true);
  assert.equal(view.slot.children.length, 1);
  assert.equal(view.slot.children[0].className, 'adsbygoogle');
  assert.equal(view.slot.children[0].dataset.adClient, 'ca-pub-1234567890123456');
  assert.equal(view.slot.children[0].dataset.adSlot, '1234567890');
  assert.equal(win.adsbygoogle.length, 1);
});

function createFakeDocument(scripts) {
  return {
    createElement(tagName) {
      assert.equal(tagName, 'script');

      const attributes = new Map();

      return {
        async: false,
        src: '',
        getAttribute(name) {
          return attributes.get(name);
        },
        setAttribute(name, value) {
          attributes.set(name, value);
        }
      };
    },
    head: {
      appendChild(script) {
        scripts.push(script);
      }
    },
    querySelectorAll() {
      return scripts;
    }
  };
}

function createFakeAdsenseDocument() {
  const sectionClasses = new Set(['is-hidden']);
  const section = {
    classList: {
      add(name) {
        sectionClasses.add(name);
      },
      remove(name) {
        sectionClasses.delete(name);
      }
    },
    hasClass(name) {
      return sectionClasses.has(name);
    }
  };
  const slot = {
    children: [],
    replaceChildren(...children) {
      this.children = children;
    }
  };
  const placeholder = { hidden: true };

  return {
    section,
    slot,
    placeholder,
    doc: {
      createElement(tagName) {
        assert.equal(tagName, 'ins');
        return {
          className: '',
          style: {},
          dataset: {}
        };
      },
      getElementById(id) {
        if (id === 'result-ad-section') {
          return section;
        }

        if (id === 'adsense-result-slot') {
          return slot;
        }

        return null;
      },
      querySelector(selector) {
        return selector === '#result-ad-section .adsense-placeholder' ? placeholder : null;
      }
    }
  };
}
