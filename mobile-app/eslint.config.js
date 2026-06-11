const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', '.expo 2/*', 'ios/*'],
  },
  {
    // G0-8 : interdire console.* en dehors du wrapper src/utils/logger.ts,
    // pour éviter que des logs verbeux (PII, payloads Firestore) finissent en prod.
    rules: {
      'no-console': 'error',
    },
  },
  {
    files: ['src/utils/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
])
