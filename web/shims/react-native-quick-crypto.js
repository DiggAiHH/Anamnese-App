const webcrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;

module.exports = {
  webcrypto,
  default: {
    webcrypto,
  },
};
