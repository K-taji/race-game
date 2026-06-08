import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { isValidDonationUrl } from '../public_html/race-game/assets/js/integrations/donation.js';
import { isValidGa4MeasurementId } from '../public_html/race-game/assets/js/integrations/analytics.js';
import { renderResultScreen, renderSetupScreen } from '../public_html/race-game/assets/js/ui/render.js';

const BASE_CONFIG = {
  app: {
    title: '競馬ランダム抽選',
    subtitle: 'レトロ競走シミュレーター',
    minRunners: 2,
    maxRunners: 18,
    defaultRunners: 12,
    raceDurationMs: 10000,
    quickRunnerOptions: [5, 8, 12, 18],
    savePreviousResult: true
  }
};

test('setup screen escapes configurable title text', () => {
  const html = renderSetupScreen({
    config: {
      ...BASE_CONFIG,
      app: {
        ...BASE_CONFIG.app,
        title: '<img src=x onerror=alert(1)>',
        subtitle: '<script>alert(1)</script>'
      }
    },
    state: {
      runnerCount: 12,
      favoriteModeEnabled: false,
      favoriteRunner: null,
      previousResult: null,
      notice: ''
    }
  });

  assert.equal(html.includes('<img src=x onerror=alert(1)>'), false);
  assert.equal(html.includes('<script>alert(1)</script>'), false);
  assert.equal(html.includes('&lt;img src=x onerror=alert(1)&gt;'), true);
});

test('previous result rendering escapes tampered storage-shaped values', () => {
  const html = renderSetupScreen({
    config: BASE_CONFIG,
    state: {
      runnerCount: 12,
      favoriteModeEnabled: false,
      favoriteRunner: null,
      previousResult: {
        runnerCount: '<svg onload=alert(1)>',
        mode: 'favorite',
        favoriteRunner: '<img src=x onerror=alert(1)>',
        topFive: ['<script>alert(1)</script>'],
        completedAt: '2026-06-07T03:34:56.000Z'
      },
      notice: ''
    }
  });

  assert.equal(html.includes('<svg onload=alert(1)>'), false);
  assert.equal(html.includes('<img src=x onerror=alert(1)>'), false);
  assert.equal(html.includes('<script>alert(1)</script>'), false);
  assert.equal(html.includes('&lt;img src=x onerror=alert(1)&gt;'), true);
});

test('donation link rendering escapes attributes and label text', () => {
  const html = renderResultScreen({
    donationModel: {
      provider: 'external-link',
      url: 'https://example.com/?q=" onmouseover="alert(1)',
      buttonLabel: '<script>alert(1)</script>',
      target: '_blank',
      rel: 'noopener noreferrer'
    },
    state: {
      raceResult: {
        topFive: [1, 2, 3, 4, 5],
        favoriteModeEnabled: false,
        favoriteRunner: null
      }
    }
  });

  assert.equal(html.includes('onmouseover="alert(1)'), false);
  assert.equal(html.includes('<script>alert(1)</script>'), false);
  assert.equal(html.includes('&quot; onmouseover=&quot;alert(1)'), true);
  assert.equal(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), true);
  assert.equal(html.includes('rel="noopener noreferrer"'), true);
});

test('external IDs and URLs reject common injection schemes', () => {
  assert.equal(isValidDonationUrl('javascript:alert(1)'), false);
  assert.equal(isValidDonationUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isValidDonationUrl('http://example.com/support'), false);
  assert.equal(isValidDonationUrl('https://example.com/support'), true);

  assert.equal(isValidGa4MeasurementId('G-ABC1234567'), true);
  assert.equal(isValidGa4MeasurementId('G-ABC1234567<script>'), false);
  assert.equal(isValidGa4MeasurementId('GTM-ABC123'), false);
});

test('public deployment tree excludes source and document files', () => {
  const files = listFiles(join(process.cwd(), 'public_html/race-game'));
  const forbiddenExtensions = ['.doc', '.docx', '.md', '.zip'];

  assert.equal(files.some((file) => file.includes('/source/')), false);
  assert.equal(files.some((file) => forbiddenExtensions.some((extension) => file.endsWith(extension))), false);
});

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(absolute) : [absolute];
  });
}
