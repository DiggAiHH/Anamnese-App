const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const mode = argv?.mode ?? process.env.NODE_ENV ?? 'development';
  const isDev = mode !== 'production';

  return {
    mode,
    entry: path.join(__dirname, 'web', 'index.js'),
    output: {
      path: path.join(__dirname, 'web', 'dist'),
      filename: 'bundle.js',
      publicPath: '/',
      clean: true,
    },
    resolve: {
      alias: {
        'react-native$': 'react-native-web',
        'react-native-document-picker': path.join(
          __dirname,
          'web',
          'shims',
          'react-native-document-picker.js',
        ),
        'react-native-share': path.join(__dirname, 'web', 'shims', 'react-native-share.js'),
        'react-native-fs': path.join(__dirname, 'web', 'shims', 'react-native-fs.js'),
        'react-native-keychain': path.join(__dirname, 'web', 'shims', 'react-native-keychain.js'),
        'react-native-date-picker': path.join(
          __dirname,
          'web',
          'shims',
          'react-native-date-picker.js',
        ),
        'react-native-quick-crypto': path.join(
          __dirname,
          'web',
          'shims',
          'react-native-quick-crypto.js',
        ),
        'react-native-tts': path.join(__dirname, 'web', 'shims', 'react-native-tts.js'),
        '@react-native-voice/voice': path.join(__dirname, 'web', 'shims', 'voice.js'),
      },
      extensions: ['.web.js', '.js', '.jsx', '.ts', '.tsx', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          include: [
            path.join(__dirname, 'web'),
            path.join(__dirname, 'src'),
            path.join(__dirname, 'shared'),
          ],
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['module:@react-native/babel-preset'],
            },
          },
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      // CRITICAL: React Native libs expect __DEV__ global (e.g., react-native-gesture-handler)
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(isDev),
        'process.env.NODE_ENV': JSON.stringify(mode),
      }),
      new HtmlWebpackPlugin({
        template: path.join(__dirname, 'web', 'index.html'),
      }),
    ],
    devServer: {
      static: path.join(__dirname, 'web', 'dist'),
      historyApiFallback: true,
      port: 3000,
    },
  };
};