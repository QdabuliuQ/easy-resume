#!/usr/bin/env python3
import json
import os
import sys

from funasr_onnx import SenseVoiceSmall
from funasr_onnx.utils.postprocess_utils import rich_transcription_postprocess


def load_model_dir() -> str:
    env_dir = os.environ.get("SPEECH_MODEL_DIR", "").strip()
    if env_dir and os.path.isdir(env_dir):
        return env_dir
    try:
        from modelscope.hub.snapshot_download import snapshot_download

        return snapshot_download("iic/SenseVoiceSmall", revision="master")
    except Exception:
        return "iic/SenseVoiceSmall"


def main() -> None:
    model_dir = load_model_dir()
    model = SenseVoiceSmall(model_dir, batch_size=1, quantize=True)
    print(json.dumps({"ready": True, "modelDir": model_dir}), flush=True)
    for line in sys.stdin:
        path = line.strip()
        if not path:
            continue
        try:
            res = model([path], language="zh", use_itn=True)
            text = rich_transcription_postprocess(res[0]) if res else ""
            print(json.dumps({"ok": True, "text": text}), flush=True)
        except Exception as e:
            print(json.dumps({"ok": False, "error": str(e)}), flush=True)


if __name__ == "__main__":
    main()
