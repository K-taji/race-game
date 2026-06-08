export class CryptoUnavailableError extends Error {
  constructor(message = '安全な乱数を利用できません。HTTPS環境または対応ブラウザで開いてください。') {
    super(message);
    this.name = 'CryptoUnavailableError';
  }
}

function resolveCrypto(cryptoObject = globalThis.crypto) {
  if (!cryptoObject || typeof cryptoObject.getRandomValues !== 'function') {
    throw new CryptoUnavailableError();
  }

  return cryptoObject;
}

export function getSecureRandomInt(maxExclusive, cryptoObject = globalThis.crypto) {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > 0x100000000) {
    throw new RangeError('maxExclusive must be an integer between 1 and 2^32.');
  }

  const secureCrypto = resolveCrypto(cryptoObject);
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  const bucket = new Uint32Array(1);

  do {
    secureCrypto.getRandomValues(bucket);
  } while (bucket[0] >= limit);

  return bucket[0] % maxExclusive;
}

export function secureShuffle(items, cryptoObject = globalThis.crypto) {
  if (!Array.isArray(items)) {
    throw new TypeError('items must be an array.');
  }

  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = getSecureRandomInt(index + 1, cryptoObject);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}
