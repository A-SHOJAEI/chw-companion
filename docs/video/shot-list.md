# Shot List — CHW Companion

One row per shot. Source preference order: original > Pexels CC0 > stock paid.
Every paid clip must have a `.LICENSE.txt` sibling in `/03-VIDEO/b-roll/stock/`.

## Original footage (shoot if possible, stock otherwise)

| ID | Time | Subject | Direction | Equipment |
|----|------|---------|-----------|-----------|
| O-1 | 0:00–0:08 | Wide: woman walking on red-dirt road, golden hour | Camera low, ~30m back. She walks toward camera. Don't get her face. | iPhone or any 4K/24fps phone, on a tripod at knee height |
| O-2 | 0:08–0:18 | Macro: her hand holding a battered Android phone — taped corners, cracked screen | Side-light from a window. Manual focus on the cracks. | Macro phone lens or 50mm prime |
| O-3 | 0:45–1:25 | Phone screen — full CHW Companion demo flow, real time, in airplane mode | Use `scrcpy --record demo-raw.mp4 --max-fps 30`. Three takes; pick the cleanest. **Make sure airplane-mode icon is in the top status bar in every frame.** | Mac + USB-C cable + Android phone in airplane mode |

## Pexels / stock (CC0 or paid)

| ID | Time | Subject | Search terms (Pexels first) | License req |
|----|------|---------|-----------------------------|-------------|
| S-1 | 0:00–0:08 fallback | African village sunrise wide | "african village sunrise" "sahel morning" "northern nigeria countryside" | CC0 |
| S-2 | 0:18–0:30 | Pregnant African woman on a mat, midwife kneeling | "african midwife home visit" "pregnant woman home rural" | Pexels CC0 if available; Pond5 RF if not |
| S-3 | 1:55–2:10 | Motorbike on dust road, woman riding away | "motorbike africa dust road" "rural nigeria transport" | Pexels CC0 |
| S-4 | 2:10–2:25 | Map of Africa animation | Build in Mapbox Studio with custom warm-bone style + dot bloom in After Effects | n/a (we build) |
| S-5 | 2:25–2:40a | CHW in Kenya with phone | "community health worker kenya phone" | Pexels CC0 |
| S-5 | 2:25–2:40b | CHW in India with phone | "asha worker india phone" "community health worker india" | Pexels CC0 |
| S-5 | 2:25–2:40c | Health worker in Peru | "rural peru health worker andes" | Pexels CC0 |
| S-6 | 2:40–2:52 | African mother with newborn at home | "african mother newborn home" | Pexels CC0 |

## Motion graphics (build in After Effects or DaVinci Fusion)

| ID | Time | Source asset | Build instructions |
|----|------|--------------|--------------------|
| M-1 | 1:25–1:38 | `docs/visual/architecture.svg` | 3-state PNG sequence with fade-in dissolves: state 1 = inputs only, state 2 = + device box, state 3 = + outputs. 4s per dissolve. |
| M-2 | 1:38–1:55 | New asset, use design tokens | Left half = cloud tower icon in clinic-red with red X overlay. Right half = phone in terracotta with green ✓. Three labels animate up from bottom: "✓ No signal needed", "✓ Patient data stays on device", "✓ $0 per visit at scale". 1080p. Alpha channel for keying over bone background. |
| M-3 | 2:52–3:00 | `docs/visual/lower-thirds.html` frame 5 | Screenshot the closing card, key it over bone background, single piano note as audio. 8s static, slow zoom-in 1.05× over the duration. |

## Lower-thirds (key over B-roll)

Source: screenshot each frame from `docs/visual/lower-thirds.html`.

| ID | Time | Label | Frame # |
|----|------|-------|---------|
| L-1 | 0:08–0:18 | "AISHA MOHAMMED · Community Health Worker, Northern Nigeria" | 1 |
| L-2 | 0:18–0:30 | "50,000 deaths/year — from pre-eclampsia in low-resource settings (WHO, 2023)" | 2 |
| L-3 | 1:25–1:38 | "GEMMA 4 E4B · 4.5B params · audio + vision + text · 140 languages · 128K context" | 3 |
| L-4 | 1:38–1:55 | "✓ No signal needed   ✓ Patient data stays on device   ✓ $0 per visit at scale" | 4 |
| L-5 | 2:52–3:00 | "CHW COMPANION — A midwife in every pocket. Built with Gemma · Apache 2.0" | 5 |

## Audio

- Music: single track (Epidemic Sound or Artlist). Open with kora or balafon at 0:00; build to mid-tempo strings at 2:10; return to single instrument at 2:40; piano note at 2:52.
- Hausa VO: `docs/video/vo-hausa.txt` → recorded `/03-VIDEO/vo/vo-hausa.wav`
- English VO: `docs/video/vo-english.txt` → recorded `/03-VIDEO/vo/vo-english.wav`
- SFX: light wind ambient under 0:00–0:08; phone tap-click during demo; single piano note on closing card.
