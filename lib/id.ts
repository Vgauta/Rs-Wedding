const uuidTemplate = "10000000-1000-4000-8000-100000000000";

type RandomUuidCrypto = Crypto & { randomUUID?: () => string };

function getCrypto() {
  return globalThis.crypto as RandomUuidCrypto | undefined;
}

function randomByte() {
  const cryptoApi = getCrypto();
  if (cryptoApi?.getRandomValues) {
    return cryptoApi.getRandomValues(new Uint8Array(1))[0];
  }
  return Math.floor(Math.random() * 256);
}

export function createId() {
  const cryptoApi = getCrypto();
  const randomUuid = cryptoApi?.randomUUID?.bind(cryptoApi);
  if (typeof randomUuid === "function") {
    return randomUuid();
  }

  return uuidTemplate.replace(/[018]/g, (char) => {
    const value = Number(char);
    return (value ^ (randomByte() & (15 >> (value / 4)))).toString(16);
  });
}
