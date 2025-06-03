module.exports = {
  parserPreset: {
    parserOpts: {
      headerPattern: /^(?::\w*:|(?:\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]))\s?(?<type>\w*)(?:\((?<scope>.*)\))?!?:\s(?<subject>(?:(?!#).)*(?:(?!\s).))\s?(?<ticket>#\d*)?$/,
      headerCorrespondence: ['type', 'scope', 'subject', 'ticket'],
    }
  },
  rules: {
    'subject-case': [0, 'never'],
    'type-empty': [0, 'never'],
    'subject-empty': [0, 'never'],
    'type-enum': [
      2,
      'always',
      [
        'feat', // ✨ 新功能
        'fix', // 🐛 修复bug
        'docs', // 📝 文档更新
        'style', // 💄 代码样式更新
        'refactor', // ♻️ 代码重构
        'perf', // ⚡️ 性能优化
        'test', // ✅ 测试
        'chore', // 🔧 构建过程或辅助工具的变动
        'revert', // ⏪️ 回滚
        'build', // 📦️ 打包
        'init', // 🎉 初始化
      ],
    ],
  },
};