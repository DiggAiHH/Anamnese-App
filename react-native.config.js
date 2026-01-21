module.exports = {
  dependencies: {
    'react-native-fs': {
      platforms: {
        windows: null, // SECURITY: disable Windows autolink; avoids invalid config and unintended file access
      },
    },
    'react-native-document-picker': {
      platforms: {
        windows: null, // WORKAROUND: C# module requires CLRHost.dll which is not being generated. Disabled until .NET hosting issue resolved.
      },
    },
  },
};
