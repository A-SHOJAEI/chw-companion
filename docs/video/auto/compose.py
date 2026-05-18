#!/usr/bin/env python3
"""Compose final video: slides + audio + emulator B-roll on segment 05.

Each segment becomes one MP4 clip (slide.png looped over the duration of the
matching MP3 + pad_before + pad_after). Segment 05 splices in 5s of phone
footage in the middle as a cutaway.

All clips share 1920x1080, yuv420p, 24fps, libx264. Audio is encoded once at
the end via the concat demuxer to keep timing tight.
"""

import json
import shutil
import subprocess
from pathlib import Path

HERE = Path(__file__).parent
NARR = json.loads((HERE / "narration.json").read_text())
SLIDES = HERE / "slides"
AUDIO = HERE / "audio"
PHONE = HERE / "raw" / "demo_framed.mp4"
OUT = HERE / "out"
OUT.mkdir(exist_ok=True)
PARTS = HERE / "parts"
if PARTS.exists():
    shutil.rmtree(PARTS)
PARTS.mkdir()

W, H, FPS = 1920, 1080, 24


def probe_duration(path: Path) -> float:
    res = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "csv=p=0",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(res.stdout.strip())


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, capture_output=True, text=True)


def build_simple(seg: dict, total_dur: float) -> Path:
    """Slide + audio with silent pads. Outputs MP4 at PARTS/<id>.mp4."""
    out = PARTS / f"{seg['id']}.mp4"
    slide = SLIDES / seg["slide"]
    audio = AUDIO / f"{seg['id']}.mp3"
    pre = seg["pad_before_s"]
    post = seg["pad_after_s"]
    # adelay shifts the audio by pre seconds; apad extends the tail with silence
    # so the audio stream is exactly total_dur seconds long.
    af = f"adelay={int(pre*1000)}|{int(pre*1000)},apad,atrim=end={total_dur},asetpts=N/SR/TB"
    run([
        "ffmpeg", "-y",
        "-loop", "1", "-framerate", str(FPS), "-i", str(slide),
        "-i", str(audio),
        "-filter_complex", f"[1:a]{af}[a]",
        "-map", "0:v", "-map", "[a]",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-t", f"{total_dur:.3f}",
        "-r", str(FPS),
        str(out),
    ])
    return out


def build_demo(seg: dict, total_dur: float) -> Path:
    """Slide → phone cutaway → slide, with audio padded the same as simple.

    Audio plays continuously over both visual halves.
    """
    out = PARTS / f"{seg['id']}.mp4"
    slide = SLIDES / seg["slide"]
    audio = AUDIO / f"{seg['id']}.mp3"
    pre = seg["pad_before_s"]

    # Phone clip is ~5s. Center it in the segment.
    phone_dur = probe_duration(PHONE)
    half_pad = max(0.0, (total_dur - phone_dur) / 2.0)
    intro_dur = half_pad
    outro_dur = total_dur - phone_dur - intro_dur

    af = f"adelay={int(pre*1000)}|{int(pre*1000)},apad,atrim=end={total_dur},asetpts=N/SR/TB"

    # Build with filter_complex: concat 3 video segments, share one audio.
    fc = (
        f"[0:v]trim=duration={intro_dur:.3f},setpts=PTS-STARTPTS[v0];"
        f"[1:v]scale={W}:{H}:force_original_aspect_ratio=decrease,"
        f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=0xF4ECD8,"
        f"setsar=1,trim=duration={phone_dur:.3f},setpts=PTS-STARTPTS[v1];"
        f"[2:v]trim=duration={outro_dur:.3f},setpts=PTS-STARTPTS[v2];"
        f"[v0][v1][v2]concat=n=3:v=1:a=0[vout];"
        f"[3:a]{af}[a]"
    )

    run([
        "ffmpeg", "-y",
        "-loop", "1", "-framerate", str(FPS), "-i", str(slide),     # 0
        "-i", str(PHONE),                                            # 1
        "-loop", "1", "-framerate", str(FPS), "-i", str(slide),     # 2
        "-i", str(audio),                                            # 3
        "-filter_complex", fc,
        "-map", "[vout]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-t", f"{total_dur:.3f}",
        "-r", str(FPS),
        str(out),
    ])
    return out


def main() -> None:
    parts: list[Path] = []
    total = 0.0
    for seg in NARR["segments"]:
        audio_dur = probe_duration(AUDIO / f"{seg['id']}.mp3")
        seg_dur = seg["pad_before_s"] + audio_dur + seg["pad_after_s"]
        # The earlier "demo" splice put 5s of bone-on-bone Home screen mid-segment,
        # which read as dead air. The new slide 05 has a dark-backdrop phone card
        # that's stronger than the live emulator capture, so render it straight.
        mp4 = build_simple(seg, seg_dur)
        tag = "slide"
        actual = probe_duration(mp4)
        total += actual
        print(f"  {seg['id']:14s} {tag:5s}  audio={audio_dur:5.2f}s  segment={actual:5.2f}s")
        parts.append(mp4)

    # Write concat list and assemble
    concat_list = PARTS / "concat.txt"
    concat_list.write_text("\n".join(f"file '{p.name}'" for p in parts))

    final = OUT / "chw-companion.mp4"
    run([
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", str(concat_list),
        "-c", "copy",
        str(final),
    ])
    final_dur = probe_duration(final)
    print(f"\n✓ {final}  ({final_dur:.2f}s  ·  {final.stat().st_size//1024} KB)")
    if final_dur > 180.0:
        print(f"⚠ EXCEEDS 3:00 BY {final_dur-180:.2f}s — must trim before upload")


if __name__ == "__main__":
    main()
