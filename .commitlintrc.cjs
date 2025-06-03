module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0, 'never'],
    'type-empty': [0, 'never'],
    'subject-empty': [0, 'never'],
    'header-max-length': [0, 'always', 100],
    'body-leading-blank': [0, 'always'],
  },
  ignores: [
    (message) => message.includes('emoji')
  ]
}; 