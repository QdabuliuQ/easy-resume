module.exports = {
    types: [
      { value: 'feat', name: 'feat:     ✨  新功能', emoji: '✨' },
      { value: 'fix', name: 'fix:      🐛  修复bug', emoji: '🐛' },
      { value: 'docs', name: 'docs:     📝  文档', emoji: '📝' },
      { value: 'style', name: 'style:    💄  样式', emoji: '💄' },
      { value: 'refactor', name: 'refactor: ♻️  重构', emoji: '♻️' },
      { value: 'perf', name: 'perf:     ⚡️  性能优化', emoji: '⚡️' },
      { value: 'test', name: 'test:     ✅  测试', emoji: '✅' },
      { value: 'chore', name: 'chore:    🔧  构建/工具', emoji: '🔧' },
      { value: 'revert', name: 'revert:   ⏪️  回退', emoji: '⏪️' },
      { value: 'build', name: 'build:    📦️  打包', emoji: '📦️' },
      { value: 'init', name: 'init:     🎉  初始化', emoji: '��' }
    ],
    
    // 覆盖提交信息格式
    format: '{type}{scope}: {emoji} {subject}',
    
    messages: {
      type: '选择提交类型:',
      scope: '变更范围 (可选):',
      customScope: '自定义变更范围:',
      subject: '简短描述:',
      body: '详细描述 (可选，按回车跳过):\n',
      breaking: '破坏性变更 (可选，按回车跳过):\n',
      footer: '关联的issue (可选，按回车跳过):\n',
      confirmCommit: '确认以上信息提交? (y/n)'
    },
    
    skipQuestions: ['breaking', 'footer'],
    
    subjectLimit: 100,
    
    // 自定义提交信息格式
    formatMessageCb: function (options) {
      const emoji = options.type === 'init' ? '🎉' :
                    options.type === 'feat' ? '✨' :
                    options.type === 'fix' ? '🐛' :
                    options.type === 'docs' ? '📝' :
                    options.type === 'style' ? '💄' :
                    options.type === 'refactor' ? '♻️' :
                    options.type === 'perf' ? '⚡️' :
                    options.type === 'test' ? '✅' :
                    options.type === 'chore' ? '🔧' :
                    options.type === 'revert' ? '⏪️' :
                    options.type === 'build' ? '📦️' : '';
      
      const scope = options.scope ? `(${options.scope})` : '';
      return `${options.type}${scope}: ${emoji} ${options.subject}`;
    }
  };