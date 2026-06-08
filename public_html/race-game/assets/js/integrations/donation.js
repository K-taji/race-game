export function createDonationModel(config = {}) {
  if (!config.enabled || !isValidDonationUrl(config.url)) {
    return null;
  }

  return {
    provider: config.provider || 'external-link',
    url: config.url,
    buttonLabel: config.buttonLabel || 'このゲームを応援する',
    target: config.openInNewTab === false ? '_self' : '_blank',
    rel: config.openInNewTab === false ? '' : 'noopener noreferrer'
  };
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
