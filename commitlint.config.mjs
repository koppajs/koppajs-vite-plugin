export default {
  extends: ['@commitlint/config-conventional'],
  // Optional custom rules, such as header length:
  rules: {
    'header-max-length': [2, 'always', 72],
    // Custom types, if you want to allow values such as "plugin":
    // 'type-enum': [2, 'always', [
    //   'build', 'chore', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test'
    // ]]
  },
}
