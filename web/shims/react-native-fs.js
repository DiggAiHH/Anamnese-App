const error = new Error('RNFS is not supported on web');

const readFile = async () => {
  throw error;
};

module.exports = {
  readFile,
  default: {
    readFile,
  },
};
