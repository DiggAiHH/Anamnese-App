const noopPromise = () => Promise.resolve();

const Voice = {
  onSpeechStart: null,
  onSpeechEnd: null,
  onSpeechResults: null,
  onSpeechError: null,
  start: noopPromise,
  stop: noopPromise,
  destroy: noopPromise,
  removeAllListeners: noopPromise,
};

module.exports = Voice;
module.exports.default = Voice;
