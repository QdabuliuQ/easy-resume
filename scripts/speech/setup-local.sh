#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VENV="$ROOT/scripts/speech/.venv"
PY="$VENV/bin/python3"

echo "[speech] create venv..."
python3 -m venv "$VENV"
"$PY" -m pip install -U pip
"$PY" -m pip install -r "$ROOT/scripts/speech/requirements.txt"

echo "[speech] download model from ModelScope..."
MODEL_DIR="$("$PY" -c "from modelscope.hub.snapshot_download import snapshot_download; print(snapshot_download('iic/SenseVoiceSmall', revision='master'))")"
mkdir -p "$ROOT/models"
ln -sfn "$MODEL_DIR" "$ROOT/models/SenseVoiceSmall"

ENV_FILE="$ROOT/.env.local"
touch "$ENV_FILE"
grep -q '^SPEECH_PYTHON=' "$ENV_FILE" || echo "SPEECH_PYTHON=$PY" >> "$ENV_FILE"
grep -q '^SPEECH_MODEL_DIR=' "$ENV_FILE" || echo "SPEECH_MODEL_DIR=$MODEL_DIR" >> "$ENV_FILE"

echo "[speech] export onnx (first run only, ~1 min)..."
"$PY" -c "from funasr_onnx import SenseVoiceSmall; SenseVoiceSmall('$MODEL_DIR', batch_size=1, quantize=True); print('onnx ok')"

echo "[speech] done"
echo "  SPEECH_PYTHON=$PY"
echo "  SPEECH_MODEL_DIR=$MODEL_DIR"
echo "Run: npm run dev"
