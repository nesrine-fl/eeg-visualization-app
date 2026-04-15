module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Suppress warnings about missing source maps from third-party libraries
    'import/no-webpack-loader-syntax': 'off',
    'no-console': 'warn',
    'no-debugger': 'warn'
  },
  overrides: [
    {
      files: ['**/*.mjs'],
      rules: {
        // Suppress source map warnings for MediaPipe and other third-party modules
        'import/no-unresolved': 'off'
      }
    }
  ]
};
