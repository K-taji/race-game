export function createAdsenseController(config = {}, doc = globalThis.document, win = globalThis.window) {
  let mounted = false;

  function show() {
    getSection()?.classList.remove('is-hidden');
  }

  function hide() {
    getSection()?.classList.add('is-hidden');
  }

  function mountAd() {
    show();

    const slot = getSlot();
    const placeholder = getPlaceholder();

    if (!slot) {
      return { mounted, status: 'missing-slot' };
    }

    if (mounted && config.mountOncePerPageView !== false) {
      return { mounted, status: 'already-mounted' };
    }

    if (!isReadyForProductionAd(config)) {
      if (placeholder) {
        placeholder.hidden = config.showDevelopmentPlaceholder === false;
      }

      return { mounted, status: 'placeholder' };
    }

    if (placeholder) {
      placeholder.hidden = true;
    }

    const adElement = doc.createElement('ins');
    adElement.className = 'adsbygoogle';
    adElement.style.display = 'block';
    adElement.dataset.adClient = config.client;
    adElement.dataset.adSlot = config.resultSlot;
    adElement.dataset.adFormat = 'auto';
    adElement.dataset.fullWidthResponsive = 'true';

    slot.replaceChildren(adElement);
    mounted = true;

    try {
      win.adsbygoogle = win.adsbygoogle || [];
      win.adsbygoogle.push({});
    } catch {
      return { mounted, status: 'push-failed' };
    }

    return { mounted, status: 'mounted' };
  }

  function getSection() {
    return doc?.getElementById('page-ad-section') || doc?.getElementById('result-ad-section') || null;
  }

  function getSlot() {
    return doc?.getElementById('adsense-page-slot') || doc?.getElementById('adsense-result-slot') || null;
  }

  function getPlaceholder() {
    return doc?.querySelector('#page-ad-section .adsense-placeholder') ||
      doc?.querySelector('#result-ad-section .adsense-placeholder') ||
      null;
  }

  return { show, hide, mountAd, mountResultAd: mountAd };
}

function isReadyForProductionAd(config) {
  return Boolean(
    config.enabled &&
      config.strategy === 'manual-result-slot' &&
      typeof config.client === 'string' &&
      config.client.startsWith('ca-pub-') &&
      typeof config.resultSlot === 'string' &&
      config.resultSlot.length > 0
  );
}
