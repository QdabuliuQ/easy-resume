#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
  echo -e "${BLUE}使用方法:${NC}"
  echo -e "  ./commit.sh <类型> <提交信息>"
  echo
  echo -e "${BLUE}可用的提交类型:${NC}"
  echo -e "  ${YELLOW}feat${NC}     - ✨ 新功能"
  echo -e "  ${YELLOW}fix${NC}      - 🐛 修复bug"
  echo -e "  ${YELLOW}docs${NC}     - 📝 文档"
  echo -e "  ${YELLOW}style${NC}    - 💄 样式"
  echo -e "  ${YELLOW}refactor${NC} - ♻️  重构"
  echo -e "  ${YELLOW}perf${NC}     - ⚡️ 性能优化"
  echo -e "  ${YELLOW}test${NC}     - ✅ 测试"
  echo -e "  ${YELLOW}chore${NC}    - 🔧 构建/工具"
  echo -e "  ${YELLOW}revert${NC}   - ⏪️ 回退"
  echo -e "  ${YELLOW}build${NC}    - 📦️ 打包"
  echo -e "  ${YELLOW}init${NC}     - 🎉 初始化"
  echo
  echo -e "${BLUE}示例:${NC}"
  echo -e "  ./commit.sh feat \"添加登录功能\""
}

# 如果没有参数或者是帮助选项，显示帮助
if [ $# -lt 2 ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
  show_help
  exit 0
fi

# 获取提交类型和消息
TYPE=$1
MESSAGE=$2

# 根据类型选择emoji
case "$TYPE" in
  "feat") EMOJI="✨";;
  "fix") EMOJI="🐛";;
  "docs") EMOJI="📝";;
  "style") EMOJI="💄";;
  "refactor") EMOJI="♻️";;
  "perf") EMOJI="⚡️";;
  "test") EMOJI="✅";;
  "chore") EMOJI="🔧";;
  "revert") EMOJI="⏪️";;
  "build") EMOJI="📦️";;
  "init") EMOJI="🎉";;
  *) echo -e "${YELLOW}警告:${NC} 未知的提交类型 '$TYPE'"; show_help; exit 1;;
esac

# 执行提交
echo -e "${GREEN}正在提交:${NC} $TYPE: $EMOJI $MESSAGE"
git commit -m "$TYPE: $EMOJI $MESSAGE" 