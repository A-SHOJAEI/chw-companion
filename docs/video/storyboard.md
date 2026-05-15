# Storyboard — CHW Companion (3:00, 1080p, H.264, YouTube Public)

Locked. Hand this verbatim to any editor.

> Production rules:
> - **24 fps**, 1920×1080, H.264, AAC stereo 48 kHz
> - VO **Hausa with burned-in English subs 0:00–1:25**, switch to English VO at 1:25 for tech content
> - Music: open with single kora or balafon (West African), build mid-tempo strings at 2:10, return to single instrument at 2:40
> - Closing card **must** contain the literal phrase "Built with Gemma"
> - Captions: see `captions.srt` — burn into video, do not rely on YouTube auto-CC

## Frame ledger

| # | T-in | T-out | Dur | Shot | Source | VO line | On-screen text | Notes |
|---|------|-------|-----|------|--------|---------|----------------|-------|
| 1 | 0:00 | 0:08 | 0:08 | Red-dirt road at sunrise; woman walking toward camera | Original OR Pexels "African village morning" | (Ambient only — wind, distant birds) | "Northern Nigeria. 6:14 AM." | Hold the silence. Let the audience settle. |
| 2 | 0:08 | 0:18 | 0:10 | Macro on her hand holding a battered phone — cracked screen, taped corners | Original; phone in shot must NOT show any branded logos | **HA:** "Sunana Aisha. Ni ce kaɗai mai aikin lafiya a ƙauye nan." (English sub: "I am Aisha. I am the only health worker in my village.") | — | Identification. Macro forces the audience to look at the phone. |
| 3 | 0:18 | 0:30 | 0:12 | Cut to a pregnant woman sitting on a woven mat; Aisha kneels beside her | Cast or stock ("African midwife home visit" / "pregnant woman rural Africa") | **HA:** "Yau zan ga Fatima. Ƙafafunta sun kumbura." (English sub: "Today I see Fatima. Her ankles are swollen.") | **Caption (lower-third):** "Pre-eclampsia kills 50,000 women a year. (WHO, 2023)" | Hard stakes. Show the patient, not the tech. |
| 4 | 0:30 | 0:45 | 0:15 | Aisha unlocks her phone; screen recording shows the **Fara Ziyara** button | scrcpy recording: open chw-companion, hold steady on Home screen for 3s, tap **Fara Ziyara** | **HA:** "Babu hanyar yanar gizo a nan. Likita yana da nisan sa'o'i huɗu." (English sub: "There is no signal here. The nearest doctor is four hours away.") | Top-right of frame: **airplane mode icon** (the moat) | The constraint stated. The airplane icon must be visible. |
| 5 | 0:45 | 1:10 | 0:25 | Hero demo — screen recording of full visit: Hausa audio waveform → 3 photo captures → "Tunani" spinner → red triage card appears | Real on-device screen capture | **HA:** "Yanzu wayata ta na saurara. Tana gani. Tana tunani. Duk ba tare da intanet ba." (English sub: "Now my phone listens. It sees. It thinks. All without the internet.") | — | This is the **money shot**. Hold on each step for ≥3s. Show the airplane icon in the same frame. |
| 6 | 1:10 | 1:25 | 0:15 | Tight crop on the triage card: **ZAFI** banner, BP 158/102, the recommendation sentence | Same screen recording, slow zoom-in 1.2× over the 15s | **HA:** "Tana kira ga kayan aiki da suka dace. Tana rubuta takarda da ta dace. Tana magana da Hausa." (English sub: "It calls the right tools. It writes the right form. It speaks back — in my language.") | — | Resolution. The model becomes the protagonist for 15s. |
| 7 | 1:25 | 1:38 | 0:13 | Architecture diagram animated — components fade in left-to-right | `docs/visual/architecture.svg` exported as 3-state PNG sequence, dissolve transitions in DaVinci | **EN VO:** "This is Gemma 4. Open weights. 140 languages. Audio, vision, and text in one forward pass. Running on the device." | Lower-third: **"GEMMA 4 E4B · 4.5B params · audio + vision + text · 140 languages · 128K context"** (from lower-thirds frame 3) | Tech credibility. Switch to English VO here. |
| 8 | 1:38 | 1:55 | 0:17 | Split screen — left: cloud LLM tower with red X; right: phone with green ✓ — three labels animate in | Motion graphic (After Effects or DaVinci Fusion). Build asset off `docs/visual/architecture.svg` palette | **EN VO:** "A cloud API can't help Aisha. No signal in her village. Nigerian law says patient data can't leave the country. And the API fees alone would exceed her training budget." | Lower-third (frame 4): "✓ No signal needed   ✓ Patient data stays on device   ✓ $0 per visit at scale" | The moat. The strongest 17 seconds of the video. |
| 9 | 1:55 | 2:10 | 0:15 | Wide — Aisha walking back to motorbike, dust trail | Original OR stock | **EN VO:** "When Aisha gets back to town, the visit syncs. The hospital in Kano knows Fatima is coming." | — | Closure for Fatima's case. |
| 10 | 2:10 | 2:25 | 0:15 | Animated Mapbox map of Africa, dots bloom across rural villages from Lagos outward | Mapbox studio export + animated overlay | **EN VO:** "Two hundred thousand community health workers in Africa. One-point-eight billion people more than two hours from a hospital." | — | Scale. Music builds here. |
| 11 | 2:25 | 2:40 | 0:15 | Three CHWs from different regions — Kenya, India, Peru — same app on their phones, three different languages on screen | Stock (Pexels "community health worker [region]") + UI mocks from `docs/visual/ui-mockups.html` localized to Swahili / Hindi / Quechua | **EN VO:** "Gemma 4 speaks one hundred and forty languages. Hausa today. Swahili, Quechua, Bambara — next week." | — | Universality. Same product, different patients. |
| 12 | 2:40 | 2:52 | 0:12 | Fatima holding her newborn at home, days later | Stock ("African mother newborn home") | **EN VO:** "Aisha told us something we won't forget: 'Now I don't have to guess.'" | — | Heart. Music returns to single instrument. |
| 13 | 2:52 | 3:00 | 0:08 | Closing card | `docs/visual/lower-thirds.html` frame 5 | (Single piano note — no VO) | **"CHW COMPANION — A midwife in every pocket. Built with Gemma. Apache 2.0. github.com/<handle>/chw-companion"** | Memorable. The phrase "Built with Gemma" must be present on this card. |

## Timing checks

| Anchor | Target | Why |
|---|---|---|
| End of "stakes" beat | 0:30 | If the audience isn't bought in by 30s, the rest doesn't matter |
| Switch to English VO | 1:25 | Hausa for human story, English for tech moat — judges don't speak Hausa |
| Architecture beat | 1:25–1:38 | Cite Gemma 4 by name and parameter count |
| Moat beat | 1:38–1:55 | The 17 seconds that win the Cactus Special Tech and Impact tracks |
| Scale beat | 2:10–2:25 | 200K CHWs, 1.8B people — the multiplier |
| Closing card | 2:52–3:00 | Must read "Built with Gemma" literally |

## Source requirements

- Every stock clip must have a `.LICENSE.txt` sibling in `/03-VIDEO/b-roll/stock/` per `docs/ATTRIBUTIONS.md`
- Music license PDF in `/03-VIDEO/music/`
- Hausa VO audio file in `/03-VIDEO/vo/vo-hausa.wav`; English VO in `/03-VIDEO/vo/vo-english.wav`
- Captions burned IN (not relying on YouTube auto-CC); source `.srt` at `docs/video/captions.srt`

## DaVinci Resolve project structure

```
project.drp
├── 00_audio
│   ├── vo-hausa.wav
│   ├── vo-english.wav
│   └── music_kora.mp3
├── 01_screen-rec
│   ├── visit-demo-final.mp4
│   └── home-screen-3s.mp4
├── 02_b-roll
│   ├── 0:00_road.mp4
│   ├── 0:08_phone-macro.mp4
│   ├── 0:18_kneel.mp4
│   ├── 1:55_motorbike.mp4
│   ├── 2:10_map.mp4
│   ├── 2:25_three-chws.mp4
│   └── 2:40_newborn.mp4
├── 03_motion-graphics
│   ├── architecture-fade-in.mov (alpha channel)
│   ├── moat-splitscreen.mov
│   └── closing-card.mov
└── 04_subtitles
    └── captions.srt
```

## Final QC before upload

- [ ] No frame shows "Gemini" instead of "Gemma" (or vice versa) — common confusable
- [ ] Closing card includes literal "Built with Gemma"
- [ ] Description includes literal "Built with Gemma"
- [ ] Description includes every attribution from `docs/ATTRIBUTIONS.md`
- [ ] Video privacy = **Public** (not Unlisted, not Private — verify per `RULES_VERIFIED.md`)
- [ ] Runtime ≤ 3:00
- [ ] Thumbnail = `docs/cover-1920x1080.png`
- [ ] Captions burned in for 0:00–1:25 Hausa segments
