module.exports = {
    extends: ['react-app'],
    plugins: [],
    rules: {
      'import/no-unresolved': 'off',
      'import/extensions': 'off'
    },
    overrides: [
      {
        files: ['**/*.js'],
        settings: {
          jest: {
            version: 'latest'
          }
        }
      }
    ]
  };