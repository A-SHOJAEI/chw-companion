# Attributions

Required text for the YouTube description and Kaggle writeup.

## Model

- **Gemma 4 E4B-it** — Google DeepMind, Apache 2.0.  
  <https://huggingface.co/google/gemma-4-E4B-it>  
  Quantized + on-device-converted artifact: `Cactus-Compute/gemma-4-E4B-it` (Apache 2.0).  
  This project is built with Gemma 4 and complies with the Gemma Terms of Use
  and Prohibited Use Policy at <https://ai.google.dev/gemma/terms>.

## Clinical content

- **WHO Managing Complications in Pregnancy and Childbirth (MCPC) — 2nd Edition (2017)**, WHO/MCA/17.02.
  Boxes 4–5, Figures 1–2, Tables 3–5 used verbatim with section-level citation.
  <https://www.who.int/publications/i/item/9789241565493>
- **WHO Pre-eclampsia fact sheet.** <https://www.who.int/news-room/fact-sheets/detail/pre-eclampsia>

## Runtime libraries

- **`cactus-react-native`** 1.13.1 — Cactus Compute, Apache 2.0.
- **`react-native-nitro-modules`** 0.33.x — Marc Rousavy, MIT.
- **`@op-engineering/op-sqlite`** — Oscar Franco, MIT (SQLCipher add-on under SQLCipher's BSD-style license).
- **Expo SDK 54** (`expo-camera`, `expo-av`, `expo-speech`, `expo-secure-store`, `expo-file-system`, `expo-asset`, `expo-haptics`) — Expo, MIT.
- **`react-native-svg`** — Software Mansion, MIT.
- **`zod`** — Colin McDonnell, MIT.
- **`react`** 19 / **`react-native`** 0.81 — Meta, MIT.
- **`@huggingface/transformers`** (web demo only) — Hugging Face, Apache 2.0.

## Design assets

- **Fraunces** — Google Fonts, SIL Open Font License 1.1.
- **Inter** — Rasmus Andersson, SIL Open Font License 1.1.
- **JetBrains Mono** — JetBrains, SIL Open Font License 1.1.

## B-roll / stock (when used in video)

> For each clip dropped into `/03-VIDEO/b-roll/stock/`, add a `<filename>.LICENSE.txt`
> recording: source URL, license type (CC0, Pexels, Pond5 RF, etc.), attribution
> requirement (and exact attribution text if yes), date downloaded, price paid.

> At the end of Day 3, consolidate the required attributions from each LICENSE.txt
> into this file under the heading "B-roll attributions (per clip)" below.

## B-roll attributions (per clip)

Used in the auto-rendered submission video (`docs/video/auto/out/chw-companion.mp4`).
Both images are illustrative — Aisha and Fatima are named characters in the storyboard,
not real people we interviewed (the slides also carry a "PORTRAIT IS ILLUSTRATIVE" label).

- **Healthcare-worker portrait** (slide 02). Photo by **Wundef** on Pexels.
  <https://www.pexels.com/photo/5430213/> · Pexels Free License (free commercial use, no
  attribution required, attribution provided as courtesy). Downloaded 2026-05-17.
- **Pregnant-woman portrait** (slide 03). Photo by **Tima Miroshnichenko** on Pexels.
  <https://www.pexels.com/photo/6463623/> · Pexels Free License. Downloaded 2026-05-17.

## Music

- None. The submission video uses voice-over only (gpt-4o-mini-tts, coral voice).

## Voice-over

- English VO: synthesized via OpenAI's `gpt-4o-mini-tts` API (coral voice) on 2026-05-17.
  Source text in `docs/video/auto/narration.json`. Per OpenAI's usage policies,
  generated audio is owned by the user. No human VO; nothing to attribute.

## Footnote required on every submission medium

> **Built with Gemma. Apache 2.0. © 2026 CHW Companion contributors.**
