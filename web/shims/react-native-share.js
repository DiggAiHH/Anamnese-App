const error = new Error('Share is not supported on web');

const open = async () => {
  throw error;
};

module.exports = {
  open,
  default: {
    open,
  },
};
