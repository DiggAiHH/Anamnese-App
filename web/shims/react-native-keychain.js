const error = new Error('Keychain is not supported on web');

const ACCESSIBLE = {
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
};

const setGenericPassword = async () => {
  throw error;
};

const getGenericPassword = async () => false;

const resetGenericPassword = async () => false;

module.exports = {
  ACCESSIBLE,
  setGenericPassword,
  getGenericPassword,
  resetGenericPassword,
  default: {
    ACCESSIBLE,
    setGenericPassword,
    getGenericPassword,
    resetGenericPassword,
  },
};
