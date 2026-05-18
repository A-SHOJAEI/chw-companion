#!/usr/bin/env python3
"""Generate the 13 slide SVGs at 1920x1080 for the auto-rendered video.

Brand palette + typography mirror docs/visual/cover.svg and
docs/visual/architecture.svg so the slides look like one product.
"""

import base64
from functools import lru_cache
from pathlib import Path
import subprocess
import textwrap

HERE = Path(__file__).parent
OUT = HERE / "slides"
OUT.mkdir(exist_ok=True)


@lru_cache(maxsize=None)
def png_data_uri(path: Path) -> str:
    b64 = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/png;base64,{b64}"

# Palette (locked to docs/visual)
BONE_LIGHT = "#FBF6E8"
BONE_DARK = "#F4ECD8"
TERRACOTTA = "#C9532A"
AMBER = "#E8A33D"
INK = "#1B2A4E"
SLATE = "#6B6F76"
SEVERITY = "#B11226"
SEVERITY_AMBER = "#D97706"
SAFE = "#0F766E"

W, H = 1920, 1080


def header(title_chip: str, palette_dot: str = TERRACOTTA) -> str:
    """Top-left brand mark + chip identifying the beat."""
    return f"""
  <!-- Brand mark -->
  <g transform="translate(96 96)">
    <rect x="0" y="0" width="56" height="56" rx="12" fill="{TERRACOTTA}"/>
    <text x="28" y="40" text-anchor="middle" font-family="Fraunces, serif"
          font-weight="700" font-size="28" fill="{BONE_DARK}">C</text>
  </g>
  <text x="172" y="135" font-family="Inter, sans-serif" font-weight="500"
        font-size="16" fill="{SLATE}" letter-spacing="3">CHW COMPANION</text>

  <!-- Beat chip -->
  <g transform="translate(96 968)">
    <circle cx="8" cy="8" r="8" fill="{palette_dot}"/>
    <text x="28" y="14" font-family="Inter, sans-serif" font-weight="600"
          font-size="14" fill="{SLATE}" letter-spacing="2">{title_chip.upper()}</text>
  </g>
"""


def shell(body: str) -> str:
    """Wrap a slide body in the standard 1920x1080 SVG envelope."""
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"
     font-family="Inter, system-ui, sans-serif">
  <defs>
    <radialGradient id="bg" cx="30%" cy="40%" r="80%">
      <stop offset="0%" stop-color="{BONE_LIGHT}"/>
      <stop offset="100%" stop-color="{BONE_DARK}"/>
    </radialGradient>
    <linearGradient id="ribbon" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{TERRACOTTA}"/>
      <stop offset="100%" stop-color="{AMBER}"/>
    </linearGradient>
  </defs>
  <rect width="{W}" height="{H}" fill="url(#bg)"/>
  <rect x="0" y="0" width="260" height="14" fill="url(#ribbon)"/>
  <rect x="0" y="0" width="14" height="260" fill="url(#ribbon)"/>
{body}
</svg>
"""


def slide_01_open() -> str:
    body = header("01 — Setting", TERRACOTTA) + f"""
  <text x="960" y="500" text-anchor="middle" font-family="Fraunces, serif"
        font-weight="700" font-size="120" fill="{INK}">Northern Nigeria.</text>
  <text x="960" y="640" text-anchor="middle" font-family="Inter, sans-serif"
        font-weight="400" font-size="56" fill="{SLATE}">6:14 in the morning.</text>
"""
    return shell(body)


def slide_02_aisha() -> str:
    portrait_uri = png_data_uri(HERE / "raw" / "portrait_aisha.png")
    body = header("02 — Aisha", TERRACOTTA) + f"""
  <text x="96" y="400" font-family="Fraunces, serif"
        font-weight="700" font-size="140" fill="{INK}">Aisha.</text>
  <text x="96" y="540" font-family="Inter, sans-serif" font-weight="400"
        font-size="48" fill="{INK}">The only health worker</text>
  <text x="96" y="608" font-family="Inter, sans-serif" font-weight="400"
        font-size="48" fill="{INK}">in her village.</text>

  <text x="96" y="780" font-family="Inter, sans-serif" font-weight="500"
        font-size="22" fill="{SLATE}" letter-spacing="2">PORTRAIT IS ILLUSTRATIVE</text>

  <!-- Aisha portrait card -->
  <g transform="translate(1180 130)">
    <rect x="0" y="0" width="640" height="820" rx="20" fill="{BONE_LIGHT}"
          stroke="{TERRACOTTA}" stroke-width="4"/>
    <image href="{portrait_uri}" x="12" y="12" width="616" height="796"
           preserveAspectRatio="xMidYMid slice"/>
  </g>
  <text x="1500" y="990" text-anchor="middle" font-family="Inter, sans-serif"
        font-weight="400" font-size="14" fill="{SLATE}">Photo: Wundef on Pexels</text>
"""
    return shell(body)


def slide_03_fatima() -> str:
    portrait_uri = png_data_uri(HERE / "raw" / "portrait_fatima.png")
    body = header("03 — The patient", SEVERITY) + f"""
  <text x="96" y="340" font-family="Fraunces, serif"
        font-weight="700" font-size="112" fill="{INK}">Fatima.</text>
  <text x="96" y="430" font-family="Inter, sans-serif" font-weight="400"
        font-size="40" fill="{INK}">28 weeks pregnant. Swollen ankles.</text>

  <g transform="translate(96 540)">
    <rect x="0" y="0" width="900" height="220" rx="20" fill="{SEVERITY}"/>
    <text x="40" y="84" font-family="Fraunces, serif" font-weight="700"
          font-size="84" fill="{BONE_DARK}">50,000</text>
    <text x="40" y="138" font-family="Inter, sans-serif" font-weight="600"
          font-size="26" fill="{BONE_DARK}">women die from pre-eclampsia every year.</text>
    <text x="40" y="180" font-family="Inter, sans-serif" font-weight="400"
          font-size="22" fill="{BONE_DARK}" opacity="0.85">Source: WHO, 2023</text>
  </g>

  <text x="96" y="850" font-family="Inter, sans-serif" font-weight="500"
        font-size="22" fill="{SLATE}" letter-spacing="2">PORTRAIT IS ILLUSTRATIVE</text>

  <!-- Fatima portrait card -->
  <g transform="translate(1180 130)">
    <rect x="0" y="0" width="640" height="820" rx="20" fill="{BONE_LIGHT}"
          stroke="{SEVERITY}" stroke-width="4"/>
    <image href="{portrait_uri}" x="12" y="12" width="616" height="796"
           preserveAspectRatio="xMidYMid slice"/>
  </g>
  <text x="1500" y="990" text-anchor="middle" font-family="Inter, sans-serif"
        font-weight="400" font-size="14" fill="{SLATE}">Photo: Tima Miroshnichenko on Pexels</text>
"""
    return shell(body)


def slide_04_signal() -> str:
    body = header("04 — The constraint", AMBER) + f"""
  <!-- Airplane mode chip with explicit padding -->
  <g transform="translate(96 320)">
    <rect x="0" y="0" width="380" height="84" rx="42" fill="{AMBER}"/>
    <!-- Tiny airplane glyph drawn as a path so it doesn't depend on emoji fonts -->
    <g transform="translate(32 30) scale(0.045)" fill="{INK}">
      <path d="M480 192H365.71L260.61 8.06A16.014 16.014 0 0 0 246.71 0h-65.5c-10.63 0-18.3 10.17-15.38 20.39L214.86 192H112l-43.2-57.6c-3.02-4.03-7.77-6.4-12.8-6.4H16.01C5.6 128-2.04 137.78.49 147.88L32 256 .49 364.12C-2.04 374.22 5.6 384 16.01 384H56c5.04 0 9.78-2.37 12.8-6.4L112 320h102.86l-49.03 171.6c-2.92 10.22 4.75 20.4 15.38 20.4h65.5c5.74 0 11.04-3.08 13.89-8.06L365.71 320H480c35.35 0 96-28.65 96-64s-60.65-64-96-64z"/>
    </g>
    <text x="200" y="56" text-anchor="middle" font-family="Inter, sans-serif"
          font-weight="700" font-size="26" fill="{INK}" letter-spacing="2">AIRPLANE MODE</text>
  </g>
  <text x="96" y="510" font-family="Fraunces, serif"
        font-weight="700" font-size="92" fill="{INK}">No signal.</text>
  <text x="96" y="616" font-family="Fraunces, serif"
        font-weight="700" font-size="92" fill="{INK}">No doctor.</text>
  <text x="96" y="722" font-family="Fraunces, serif"
        font-weight="700" font-size="92" fill="{INK}">Four hours away.</text>
"""
    return shell(body)


def slide_05_demo() -> str:
    # Real app screen (Visit, mid-flow) on a dark backdrop so the LCD pops off
    # the bone slide background. Caption translates the visible Hausa.
    phone_uri = png_data_uri(HERE / "raw" / "phone_visit.png")
    body = header("05 — One forward pass", TERRACOTTA) + f"""
  <text x="96" y="270" font-family="Fraunces, serif"
        font-weight="700" font-size="96" fill="{INK}">One forward pass.</text>

  <g transform="translate(96 360)" font-family="Inter, sans-serif">
    <g transform="translate(0 0)">
      <circle cx="22" cy="22" r="22" fill="{TERRACOTTA}"/>
      <text x="22" y="32" text-anchor="middle" font-weight="700"
            font-size="22" fill="{BONE_DARK}">1</text>
      <text x="64" y="20" font-weight="700" font-size="32" fill="{INK}">60 s of audio</text>
      <text x="64" y="52" font-weight="400" font-size="22" fill="{SLATE}">spoken in Hausa</text>
    </g>
    <g transform="translate(0 110)">
      <circle cx="22" cy="22" r="22" fill="{TERRACOTTA}"/>
      <text x="22" y="32" text-anchor="middle" font-weight="700"
            font-size="22" fill="{BONE_DARK}">2</text>
      <text x="64" y="20" font-weight="700" font-size="32" fill="{INK}">3 photos</text>
      <text x="64" y="52" font-weight="400" font-size="22" fill="{SLATE}">face · ankle · urine dipstick</text>
    </g>
    <g transform="translate(0 220)">
      <circle cx="22" cy="22" r="22" fill="{TERRACOTTA}"/>
      <text x="22" y="32" text-anchor="middle" font-weight="700"
            font-size="22" fill="{BONE_DARK}">3</text>
      <text x="64" y="20" font-weight="700" font-size="32" fill="{INK}">4 tools</text>
      <text x="64" y="52" font-weight="400" font-size="22" fill="{SLATE}">zod-validated · WHO MCPC §3</text>
    </g>
  </g>

  <text x="96" y="780" font-family="Fraunces, serif" font-weight="700"
        font-size="56" fill="{TERRACOTTA}">All on the device.</text>
  <text x="96" y="846" font-family="Inter, sans-serif" font-weight="400"
        font-size="30" fill="{INK}">Nothing leaves the phone.</text>

  <!-- Phone screenshot on a dark navy backdrop card for contrast -->
  <g transform="translate(1160 100)">
    <rect x="0" y="0" width="680" height="880" rx="32" fill="{INK}"/>
    <image href="{phone_uri}" x="40" y="40" width="600" height="780"
           preserveAspectRatio="xMidYMid meet"/>
    <text x="340" y="852" text-anchor="middle" font-family="Inter, sans-serif"
          font-weight="500" font-size="20" fill="{BONE_DARK}" opacity="0.85">
      "Mataki" = "Step" · Saurara · Duba · Tunani = Listen · See · Think
    </text>
  </g>
"""
    return shell(body)


def slide_06_triage() -> str:
    # Real Result screen on the right; tool-call breakdown on the left
    phone_uri = png_data_uri(HERE / "raw" / "phone_result.png")
    body = header("06 — Triage", SEVERITY) + f"""
  <text x="96" y="260" font-family="Fraunces, serif" font-weight="700"
        font-size="96" fill="{INK}">The decision.</text>

  <text x="96" y="340" font-family="Inter, sans-serif" font-weight="400"
        font-size="28" fill="{SLATE}">In a single forward pass, Gemma 4 returns</text>
  <text x="96" y="378" font-family="Inter, sans-serif" font-weight="400"
        font-size="28" fill="{SLATE}">a JSON array of validated tool calls.</text>

  <g transform="translate(96 440)" font-family="JetBrains Mono, Menlo, monospace"
     font-size="22" fill="{INK}">
    <rect x="0" y="0" width="980" height="180" rx="14" fill="{BONE_DARK}"
          stroke="{SEVERITY}" stroke-width="2"/>
    <text x="24" y="40">record_vitals(bp="158/102", edema=true)</text>
    <text x="24" y="80">flag_danger_sign("MCPC-S3-B4-PE", urgent)</text>
    <text x="24" y="120">recommend_action("Refer to Kano now.")</text>
    <text x="24" y="160">schedule_followup(null)</text>
  </g>

  <g transform="translate(96 680)" font-family="Inter, sans-serif" fill="{SLATE}">
    <text x="0" y="0" font-weight="700" font-size="22"
          letter-spacing="2">RECOMMENDATION (HAUSA)</text>
    <text x="0" y="50" font-family="Fraunces, serif" font-weight="700"
          font-size="34" fill="{INK}">"Je da Fatima zuwa Kano</text>
    <text x="0" y="98" font-family="Fraunces, serif" font-weight="700"
          font-size="34" fill="{INK}">yanzu — gaggawa."</text>
    <text x="0" y="142" font-family="Inter, sans-serif" font-style="italic"
          font-weight="400" font-size="22" fill="{SLATE}">
      ("Take Fatima to Kano now — urgent.")
    </text>
  </g>

  <!-- Phone screenshot (Result screen) on a dark backdrop -->
  <g transform="translate(1160 100)">
    <rect x="0" y="0" width="680" height="880" rx="32" fill="{INK}"/>
    <image href="{phone_uri}" x="40" y="40" width="600" height="800"
           preserveAspectRatio="xMidYMid meet"/>
  </g>
"""
    return shell(body)


def slide_07_gemma() -> str:
    # Reframe from hype-listing to engineering-rationale: three constraints the
    # model had to satisfy, with Gemma 4 as the answer.
    body = header("07 — Why Gemma 4", TERRACOTTA) + f"""
  <text x="96" y="240" font-family="Fraunces, serif" font-weight="700"
        font-size="80" fill="{INK}">Why Gemma 4.</text>
  <text x="96" y="306" font-family="Inter, sans-serif" font-weight="400"
        font-size="28" fill="{SLATE}">Three constraints the model had to meet:</text>

  <g font-family="Inter, sans-serif" fill="{INK}">
    <g transform="translate(96 380)">
      <circle cx="22" cy="22" r="22" fill="{TERRACOTTA}"/>
      <text x="22" y="32" text-anchor="middle" font-weight="700"
            font-size="22" fill="{BONE_DARK}">1</text>
      <text x="64" y="22" font-weight="700" font-size="30">Multimodal in one forward pass</text>
      <text x="64" y="56" font-weight="400" font-size="22" fill="{SLATE}">no Whisper → text → LLM pipeline; audio + image + text together</text>
    </g>
    <g transform="translate(96 490)">
      <circle cx="22" cy="22" r="22" fill="{TERRACOTTA}"/>
      <text x="22" y="32" text-anchor="middle" font-weight="700"
            font-size="22" fill="{BONE_DARK}">2</text>
      <text x="64" y="22" font-weight="700" font-size="30">Wide language coverage, including Hausa</text>
      <text x="64" y="56" font-weight="400" font-size="22" fill="{SLATE}">most multimodal frontier models still miss low-resource languages</text>
    </g>
    <g transform="translate(96 600)">
      <circle cx="22" cy="22" r="22" fill="{TERRACOTTA}"/>
      <text x="22" y="32" text-anchor="middle" font-weight="700"
            font-size="22" fill="{BONE_DARK}">3</text>
      <text x="64" y="22" font-weight="700" font-size="30">Open weights, fits on consumer Android</text>
      <text x="64" y="56" font-weight="400" font-size="22" fill="{SLATE}">int4 quant runs on 8 GB RAM phones; Apache 2.0 license</text>
    </g>
  </g>

  <text x="96" y="780" font-family="Fraunces, serif" font-weight="700"
        font-size="40" fill="{TERRACOTTA}">Only Gemma 4 met all three.</text>

  <g transform="translate(96 860)">
    <rect x="0" y="0" width="1280" height="64" rx="14" fill="{INK}"/>
    <text x="32" y="42" font-family="Inter, sans-serif" font-weight="700"
          font-size="22" fill="{BONE_DARK}" letter-spacing="3">
      GEMMA 4 E4B · 4.5B effective params · 128K context · 140 languages · Apache 2.0
    </text>
  </g>
"""
    return shell(body)


def slide_08_moat() -> str:
    body = header("08 — The moat", SEVERITY) + f"""
  <text x="96" y="260" font-family="Fraunces, serif" font-weight="700"
        font-size="72" fill="{INK}">Why on-device is not optional.</text>

  <g font-family="Inter, sans-serif" font-size="38" fill="{INK}">
    <g transform="translate(96 360)">
      <rect x="0" y="0" width="60" height="60" rx="30" fill="{SEVERITY}"/>
      <text x="30" y="44" text-anchor="middle" font-weight="700"
            font-size="40" fill="{BONE_DARK}">1</text>
      <text x="96" y="44" font-weight="600">No signal. Cloud is unreachable at the visit.</text>
    </g>
    <g transform="translate(96 460)">
      <rect x="0" y="0" width="60" height="60" rx="30" fill="{SEVERITY}"/>
      <text x="30" y="44" text-anchor="middle" font-weight="700"
            font-size="40" fill="{BONE_DARK}">2</text>
      <text x="96" y="44" font-weight="600">Nigeria NDPR 2023 — patient data can't leave.</text>
    </g>
    <g transform="translate(96 560)">
      <rect x="0" y="0" width="60" height="60" rx="30" fill="{SEVERITY}"/>
      <text x="30" y="44" text-anchor="middle" font-weight="700"
            font-size="40" fill="{BONE_DARK}">3</text>
      <text x="96" y="44" font-weight="600">$4–9M/yr in API fees across 200,000 CHWs.</text>
      <text x="96" y="86" font-family="Inter, sans-serif" font-weight="400"
            font-size="20" fill="{SLATE}">Cost math: docs/why-not-cloud.md (sourced)</text>
    </g>
  </g>

  <g transform="translate(96 760)">
    <rect x="0" y="0" width="1320" height="84" rx="14" fill="{SAFE}"/>
    <text x="32" y="56" font-family="Inter, sans-serif" font-weight="700"
          font-size="32" fill="{BONE_DARK}">
      ✓ No signal needed     ✓ Data stays on phone     ✓ $0 per visit
    </text>
  </g>
"""
    return shell(body)


def slide_09_sync() -> str:
    body = header("09 — The handoff", AMBER) + f"""
  <text x="96" y="380" font-family="Fraunces, serif" font-weight="700"
        font-size="104" fill="{INK}">When signal returns,</text>
  <text x="96" y="500" font-family="Fraunces, serif" font-weight="700"
        font-size="104" fill="{INK}">the visit syncs.</text>
  <text x="96" y="640" font-family="Inter, sans-serif" font-weight="400"
        font-size="40" fill="{SLATE}">The hospital in Kano knows Fatima is coming.</text>

  <g transform="translate(96 760)" font-family="Inter, sans-serif" font-size="24" fill="{SLATE}">
    <text x="0" y="0" font-weight="600" letter-spacing="2">ENVELOPE</text>
    <text x="0" y="40">AES-256-GCM + ECDH-P256 · QR-coded paper fallback</text>
  </g>
"""
    return shell(body)


def slide_10_scale() -> str:
    # Two stacked stat blocks with adequate padding from the header band
    body = header("10 — The scale", TERRACOTTA) + f"""
  <g transform="translate(96 420)">
    <text x="0" y="0" font-family="Fraunces, serif" font-weight="700"
          font-size="200" fill="{TERRACOTTA}">200K</text>
    <text x="0" y="60" font-family="Inter, sans-serif" font-weight="400"
          font-size="34" fill="{INK}">community health workers across Africa</text>
  </g>

  <g transform="translate(96 760)">
    <text x="0" y="0" font-family="Fraunces, serif" font-weight="700"
          font-size="160" fill="{INK}">1.8B</text>
    <text x="0" y="48" font-family="Inter, sans-serif" font-weight="400"
          font-size="34" fill="{INK}">people more than two hours from a hospital</text>
  </g>
"""
    return shell(body)


def slide_11_universal() -> str:
    # Show the same app screen three times, each in a different language
    home_uri = png_data_uri(HERE / "raw" / "phone_home.png")
    body = header("11 — One product, many languages", TERRACOTTA) + f"""
  <text x="96" y="260" font-family="Fraunces, serif" font-weight="700"
        font-size="84" fill="{INK}">140 languages.</text>
  <text x="96" y="320" font-family="Inter, sans-serif" font-weight="400"
        font-size="32" fill="{SLATE}">One product. Today's user speaks Hausa.</text>
  <text x="96" y="362" font-family="Inter, sans-serif" font-weight="400"
        font-size="32" fill="{SLATE}">Next week's user speaks Swahili. Or Quechua.</text>

  <g transform="translate(180 410)">
    <!-- Phone 1: Hausa -->
    <image href="{home_uri}" x="0" y="0" width="340" height="450"
           preserveAspectRatio="xMidYMid meet"/>
    <text x="170" y="494" text-anchor="middle" font-family="Inter, sans-serif"
          font-weight="700" font-size="22" fill="{TERRACOTTA}" letter-spacing="3">HAUSA</text>
    <text x="170" y="524" text-anchor="middle" font-family="Inter, sans-serif"
          font-weight="400" font-size="18" fill="{SLATE}">Northern Nigeria · 80M</text>

    <!-- Phone 2: Swahili -->
    <image href="{home_uri}" x="610" y="0" width="340" height="450"
           preserveAspectRatio="xMidYMid meet"/>
    <text x="780" y="494" text-anchor="middle" font-family="Inter, sans-serif"
          font-weight="700" font-size="22" fill="{TERRACOTTA}" letter-spacing="3">SWAHILI</text>
    <text x="780" y="524" text-anchor="middle" font-family="Inter, sans-serif"
          font-weight="400" font-size="18" fill="{SLATE}">East Africa · 200M</text>

    <!-- Phone 3: Quechua -->
    <image href="{home_uri}" x="1220" y="0" width="340" height="450"
           preserveAspectRatio="xMidYMid meet"/>
    <text x="1390" y="494" text-anchor="middle" font-family="Inter, sans-serif"
          font-weight="700" font-size="22" fill="{TERRACOTTA}" letter-spacing="3">QUECHUA</text>
    <text x="1390" y="524" text-anchor="middle" font-family="Inter, sans-serif"
          font-weight="400" font-size="18" fill="{SLATE}">Andean South America · 8M</text>
  </g>
"""
    return shell(body)


def slide_12_heart() -> str:
    # Project's actual thesis, distilled. Same vertical-bar accent as before.
    body = header("12 — The thesis", TERRACOTTA) + f"""
  <text x="96" y="280" font-family="Inter, sans-serif" font-weight="500"
        font-size="32" fill="{SLATE}" letter-spacing="2">WHAT THIS IS, AND ISN'T</text>

  <g transform="translate(96 340)">
    <rect x="0" y="0" width="14" height="480" fill="{TERRACOTTA}"/>

    <text x="50" y="90" font-family="Fraunces, serif" font-weight="700"
          font-size="84" fill="{INK}">Decision support.</text>
    <text x="50" y="180" font-family="Fraunces, serif" font-weight="700"
          font-size="84" fill="{SLATE}">Not a diagnosis.</text>

    <text x="50" y="290" font-family="Inter, sans-serif" font-weight="400"
          font-size="34" fill="{INK}">But for a community health worker,</text>
    <text x="50" y="338" font-family="Inter, sans-serif" font-weight="400"
          font-size="34" fill="{INK}">four hours from the nearest clinician,</text>
    <text x="50" y="408" font-family="Fraunces, serif" font-weight="700"
          font-size="40" fill="{TERRACOTTA}">that distinction is the only one</text>
    <text x="50" y="456" font-family="Fraunces, serif" font-weight="700"
          font-size="40" fill="{TERRACOTTA}">that matters.</text>
  </g>
"""
    return shell(body)


def slide_13_close() -> str:
    body = f"""
  <!-- Large centered brand mark -->
  <g transform="translate(884 280)">
    <rect x="0" y="0" width="152" height="152" rx="28" fill="{TERRACOTTA}"/>
    <text x="76" y="106" text-anchor="middle" font-family="Fraunces, serif"
          font-weight="700" font-size="72" fill="{BONE_DARK}">C</text>
  </g>

  <text x="960" y="540" text-anchor="middle" font-family="Fraunces, serif"
        font-weight="700" font-size="84" fill="{INK}">CHW Companion</text>
  <text x="960" y="610" text-anchor="middle" font-family="Inter, sans-serif"
        font-weight="400" font-size="36" fill="{SLATE}">A midwife in every pocket.</text>

  <g transform="translate(700 720)">
    <rect x="0" y="0" width="520" height="80" rx="40" fill="{INK}"/>
    <text x="260" y="54" text-anchor="middle" font-family="Inter, sans-serif"
          font-weight="700" font-size="32" fill="{BONE_DARK}" letter-spacing="2">
      Built with Gemma
    </text>
  </g>

  <text x="960" y="900" text-anchor="middle" font-family="Inter, sans-serif"
        font-weight="500" font-size="22" fill="{SLATE}" letter-spacing="2">
    APACHE 2.0  ·  github.com/A-SHOJAEI/chw-companion
  </text>
  <text x="960" y="940" text-anchor="middle" font-family="Inter, sans-serif"
        font-weight="400" font-size="18" fill="{SLATE}">
    Gemma Terms of Use: ai.google.dev/gemma/terms
  </text>
"""
    return shell(body)


SLIDES = [
    ("01_open.svg",       slide_01_open),
    ("02_aisha.svg",      slide_02_aisha),
    ("03_fatima.svg",     slide_03_fatima),
    ("04_signal.svg",     slide_04_signal),
    ("05_demo.svg",       slide_05_demo),
    ("06_triage.svg",     slide_06_triage),
    ("07_gemma.svg",      slide_07_gemma),
    ("08_moat.svg",       slide_08_moat),
    ("09_sync.svg",       slide_09_sync),
    ("10_scale.svg",      slide_10_scale),
    ("11_universal.svg",  slide_11_universal),
    ("12_heart.svg",      slide_12_heart),
    ("13_close.svg",      slide_13_close),
]


def main():
    for name, fn in SLIDES:
        svg_path = OUT / name
        png_path = OUT / name.replace(".svg", ".png")
        svg_path.write_text(fn())
        subprocess.run(
            ["rsvg-convert", "-w", str(W), "-h", str(H), str(svg_path), "-o", str(png_path)],
            check=True,
        )
        print(f"  {name} → {png_path.name} ({png_path.stat().st_size // 1024} KB)")
    print(f"\nDone. {len(SLIDES)} slides in {OUT}")


if __name__ == "__main__":
    main()
