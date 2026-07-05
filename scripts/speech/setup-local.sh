#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VENV="$ROOT/scripts/speech/.venv"
MODEL_LINK="$ROOT/models/SenseVoiceSmall"
MODEL_CACHE="${MODELSCOPE_CACHE:-$HOME/.cache/modelscope}/hub/models/iic/SenseVoiceSmall"

strip_speech_env() {
  local f="$ROOT/.env.local"
  [[ -f "$f" ]] || return
  sed -i '/^SPEECH_PYTHON=/d;/^SPEECH_MODEL_DIR=/d;/^SPEECH_DAEMON_SCRIPT=/d' "$f"
  echo "[speech] 已清理 .env.local 中的 SPEECH_* 配置"
}

uninstall_speech() {
  echo "[speech] 卸载 SenseVoice 语音识别..."
  if [[ -d "$VENV" ]]; then
    rm -rf "$VENV"
    echo "[speech] 已删除 $VENV"
  fi
  if [[ -L "$MODEL_LINK" || -e "$MODEL_LINK" ]]; then
    rm -f "$MODEL_LINK"
    echo "[speech] 已删除 $MODEL_LINK"
  fi
  if [[ -d "$MODEL_CACHE" ]]; then
    rm -rf "$MODEL_CACHE"
    echo "[speech] 已删除模型缓存 $MODEL_CACHE"
  fi
  strip_speech_env
  if command -v pip3 >/dev/null 2>&1; then
    pip3 cache purge >/dev/null 2>&1 || true
  fi
  echo "[speech] 卸载完成"
}

usage() {
  echo "用法: bash scripts/speech/setup-local.sh uninstall"
  echo "  删除 venv、SenseVoiceSmall 模型缓存、.env.local 中的 SPEECH_*"
  echo "当前项目已禁用语音输入，无需 install。"
}

case "${1:-uninstall}" in
  uninstall|remove|clean)
    uninstall_speech
    ;;
  install)
    echo "[speech] 语音输入已暂时禁用，不再支持 install。" >&2
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
