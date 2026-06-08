import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAnalytics,
  isValidGa4MeasurementId
} from '../public_html/race-game/assets/js/integrations/analytics.js';
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
