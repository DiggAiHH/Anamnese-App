module.exports = {
  root: true,
  extends: [
    '@react-native',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: [
        'jest.setup.js',
        'metro.config.js',
        'babel.config.js',
        'webpack.config.js',
        'scripts/**/*.{js,jsx,ts,tsx}',
        '**/__mocks__/**/*.{js,jsx,ts,tsx}',
        '**/__tests__/**/*.{js,jsx,ts,tsx}',
        'e2e/**/*.{js,jsx,ts,tsx}',
      ],
      env: {
        node: true,
        jest: true,
        es2021: true,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['shared/encryption.js'],
      env: {
        node: true,
        browser: true,
        es2021: true,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-undef': 'off',
      },
    },
  ],
  rules: {
    'prettier/prettier': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'react-hooks/exhaustive-deps': 'warn',
  },
};
