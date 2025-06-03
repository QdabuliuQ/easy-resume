module.exports = {
    types: [
      { value: 'feat', name: 'feat:     ✨  新功能', emoji: '✨' },
      { value: 'fix', name: 'fix:      🐛  修复', emoji: '🐛' },
      { value: 'docs', name: 'docs:     📝  文档', emoji: '📝' },
      { value: 'style', name: 'style:    💄  样式', emoji: '💄' },
      { value: 'refactor', name: 'refactor: ♻️  重构', emoji: '♻️' },
      { value: 'perf', name: 'perf:     ⚡️  性能优化', emoji: '⚡️' },
      { value: 'test', name: 'test:     ✅  测试', emoji: '✅' },
      { value: 'chore', name: 'chore:    🔧  构建/工具', emoji: '🔧' },
      { value: 'revert', name: 'revert:   ⏪️  回退', emoji: '⏪️' },
      { value: 'build', name: 'build:    📦️  打包', emoji: '📦️' }
    ],
    messages: {
      type: '请选择提交类型:',
      subject: '请简要描述提交 (必填):',
      body: '请输入详细描述 (可选):',
      confirmCommit: '确认提交?'
    },
    skipQuestions: ['scope', 'footer'],
    subjectLimit: 100
  };