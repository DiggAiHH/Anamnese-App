const error = new Error('Document picker is not supported on web');

const types = {
  allFiles: '*/*',
};

const pick = async () => {
  throw error;
};

const isCancel = () => false;

module.exports = {
  types,
  pick,
  isCancel,
  default: {
    types,
    pick,
    isCancel,
  },
};
