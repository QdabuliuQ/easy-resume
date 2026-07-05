#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VENV="$ROOT/scripts/speech/.venv"

if ! command -v python3 >/dev/null 2>&1; then
  echo "[speech] 未找到 python3，请先安装：sudo apt install -y python3 python3-venv python3-pip" >&2
  exit 1
fi

if ! python3 -c 'import venv' 2>/dev/null; then
  echo "[speech] 缺少 python3-venv，请执行：sudo apt install -y python3-venv" >&2
  exit 1
fi

resolve_venv_python() {
  if [[ -x "$VENV/bin/python3" ]]; then
    echo "$VENV/bin/python3"
    return
  fi
  if [[ -x "$VENV/bin/python" ]]; then
    echo "$VENV/bin/python"
    return
  fi
  echo "[speech] venv 创建失败，未找到 $VENV/bin/python3" >&2
  exit 1
}

echo "[speech] create venv..."
if [[ -d "$VENV" ]]; then
  echo "[speech] 移除旧 venv（勿从 Mac 拷贝 .venv 到 Linux）..."
  rm -rf "$VENV"
fi
python3 -m venv "$VENV"
PY="$(resolve_venv_python)"

echo "[speech] pip install..."
"$PY" -m pip install -U pip
"$PY" -m pip install -r "$ROOT/scripts/speech/requirements.txt"

echo "[speech] download model from ModelScope..."
MODEL_DIR="$("$PY" -c "from modelscope.hub.snapshot_download import snapshot_download; print(snapshot_download('iic/SenseVoiceSmall', revision='master'))")"
mkdir -p "$ROOT/models"
ln -sfn "$MODEL_DIR" "$ROOT/models/SenseVoiceSmall"

ENV_FILE="$ROOT/.env.local"
touch "$ENV_FILE"
if grep -q '^SPEECH_PYTHON=' "$ENV_FILE"; then
  sed -i "s|^SPEECH_PYTHON=.*|SPEECH_PYTHON=$PY|" "$ENV_FILE"
else
  echo "SPEECH_PYTHON=$PY" >> "$ENV_FILE"
fi
if grep -q '^SPEECH_MODEL_DIR=' "$ENV_FILE"; then
  sed -i "s|^SPEECH_MODEL_DIR=.*|SPEECH_MODEL_DIR=$MODEL_DIR|" "$ENV_FILE"
else
  echo "SPEECH_MODEL_DIR=$MODEL_DIR" >> "$ENV_FILE"
fi

echo "[speech] export onnx (first run only, ~1 min)..."
"$PY" -c "from funasr_onnx import SenseVoiceSmall; SenseVoiceSmall('$MODEL_DIR', batch_size=1, quantize=True); print('onnx ok')"

echo "[speech] done"
echo "  SPEECH_PYTHON=$PY"
echo "  SPEECH_MODEL_DIR=$MODEL_DIR"
echo "Run: npm run dev"
