#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VENV="$ROOT/scripts/speech/.venv"
MODEL_CACHE="${MODELSCOPE_CACHE:-$HOME/.cache/modelscope}/hub/models/iic/SenseVoiceSmall"
LEGACY_MODEL_LINK="$ROOT/models/SenseVoiceSmall"

strip_speech_env() {
  local f="$ROOT/.env.local"
  [[ -f "$f" ]] || return
  sed -i '/^SPEECH_PYTHON=/d;/^SPEECH_MODEL_DIR=/d;/^SPEECH_DAEMON_SCRIPT=/d' "$f"
}

uninstall_legacy_local() {
  echo "[speech] 清理旧版本地 SenseVoice 安装..."
  [[ -d "$VENV" ]] && rm -rf "$VENV" && echo "[speech] 已删除 $VENV"
  [[ -L "$LEGACY_MODEL_LINK" || -e "$LEGACY_MODEL_LINK" ]] && rm -f "$LEGACY_MODEL_LINK" && echo "[speech] 已删除 $LEGACY_MODEL_LINK"
  [[ -d "$MODEL_CACHE" ]] && rm -rf "$MODEL_CACHE" && echo "[speech] 已删除 $MODEL_CACHE"
  strip_speech_env
}

usage() {
  echo "语音输入已改为百度短语音识别 API，服务器仅需 ffmpeg。"
  echo ""
  echo "用法:"
  echo "  bash scripts/speech/setup-local.sh check     # 检查 ffmpeg"
  echo "  bash scripts/speech/setup-local.sh uninstall # 删除旧版本地模型/venv"
}

check_deps() {
  if command -v ffmpeg >/dev/null 2>&1; then
    echo "[speech] ffmpeg 已安装: $(ffmpeg -version | head -1)"
  else
    echo "[speech] 缺少 ffmpeg，请执行: sudo apt install -y ffmpeg" >&2
    exit 1
  fi
  echo "[speech] 请在百度智能云开通「短语音识别」并配置 API Key"
  echo "[speech] 环境变量: BAIDU_SPEECH_API_KEY / BAIDU_SPEECH_SECRET_KEY"
  echo "[speech] 或与 OCR 共用: BAIDU_OCR_API_KEY / BAIDU_OCR_SECRET_KEY"
}

case "${1:-check}" in
  check)
    check_deps
    ;;
  uninstall|remove|clean)
    uninstall_legacy_local
    check_deps
    ;;
  install)
    echo "[speech] 已改用百度 API，无需 install。执行 check 或 uninstall。" >&2
    exit 1
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    echo "[speech] 未知参数: $1" >&2
    usage
    exit 1
    ;;
esac
