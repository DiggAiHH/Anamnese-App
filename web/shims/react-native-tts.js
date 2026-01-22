const noop = () => {};
const noopPromise = () => Promise.resolve();
const notSupported = () => Promise.reject(new Error('TTS is not supported on web'));

const Tts = {
  addEventListener: noop,
  removeEventListener: noop,
  setDefaultRate: noop,
  setDefaultPitch: noop,
  setDucking: noop,
  setDefaultLanguage: noop,
  getInitStatus: notSupported,
  speak: noop,
  stop: noop,
  voices: () => Promise.resolve([]),
};

module.exports = Tts;
module.exports.default = Tts;
