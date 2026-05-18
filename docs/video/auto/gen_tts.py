#!/usr/bin/env python3
"""Generate TTS clips from narration.json via OpenAI TTS API.

Reads OPENAI_API_KEY from env. Writes one MP3 per segment to audio/<id>.mp3.
"""

import json
import os
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent
NARR = json.loads((HERE / "narration.json").read_text())
OUT = HERE / "audio"
OUT.mkdir(exist_ok=True)

API_KEY = os.environ.get("OPENAI_API_KEY")
if not API_KEY:
    sys.exit("OPENAI_API_KEY not set")

URL = "https://api.openai.com/v1/audio/speech"
MODEL = NARR.get("model", "tts-1-hd")
VOICE = NARR.get("voice", "shimmer")
INSTRUCTIONS = NARR.get("instructions")


def synth(text: str, out_path: Path) -> None:
    body: dict = {
        "model": MODEL,
        "voice": VOICE,
        "input": text,
        "response_format": "mp3",
    }
    # gpt-4o-mini-tts supports a tone-control "instructions" field; tts-1-hd ignores it.
    if INSTRUCTIONS and MODEL.startswith("gpt-4o"):
        body["instructions"] = INSTRUCTIONS
    payload = json.dumps(body).encode()
    req = urllib.request.Request(
        URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        out_path.write_bytes(resp.read())


def main() -> None:
    segments = NARR["segments"]
    print(f"Synthesizing {len(segments)} segments with {MODEL} / voice={VOICE}")
    for seg in segments:
        out = OUT / f"{seg['id']}.mp3"
        try:
            synth(seg["text"], out)
            print(f"  ✓ {seg['id']:14s} {out.stat().st_size // 1024:>4} KB  '{seg['text'][:60]}...'")
        except Exception as exc:
            print(f"  ✗ {seg['id']:14s} {exc}", file=sys.stderr)
            raise
    print(f"\nDone. Audio in {OUT}")


if __name__ == "__main__":
    main()
