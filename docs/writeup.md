# CHW Companion: A Midwife in Every Pocket
## Offline Multimodal Maternal Health Triage with Gemma 4

**Built with Gemma 4. Apache 2.0. Submitted to the Gemma 4 Good Hackathon, May 2026.**

---

## The problem

It is 6:14 AM in northern Nigeria. Aisha Mohammed is the only health worker in her village. Today she walks 2 km to see Fatima Bello, who is 32 weeks pregnant and complaining of a headache that won't stop. Aisha measures Fatima's blood pressure: 158/102. She presses on the ankle; her thumb leaves a dent. The urinalysis dipstick comes back 2+ on the protein pad. To anyone trained, this pattern is severe pre-eclampsia per WHO MCPC §3 — a condition that kills 50,000 women per year in low-resource settings.

But Aisha is a community health worker, not a physician. The nearest doctor is four hours away. There is no signal in her village. The nearest tower is on the next ridge, intermittent. Even when she gets back to town to recharge her phone, Nigeria's NDPR data-protection law prohibits her from uploading Fatima's clinical voice notes and photos to a cloud API. And a hosted multimodal API at scale — 200,000 CHWs across Africa, dozens of visits per CHW per month — would cost more than the entire annual budget of every district training program combined. The math doesn't work.

**CHW Companion** runs Gemma 4 E4B on Aisha's $200 Android phone, fully offline, and turns the unstructured visit into a structured triage decision in 42 seconds.

## The solution

Aisha taps **Fara Ziyara** (Start Visit). She records a 60-second voice note in Hausa: *"Sunanta Fatima Bello, ciki na makonni 32. Tana fama da ciwon kai mai tsanani da hangen nesa. BP 158 a kan 102. Ƙafafunta sun kumbura sosai. Dipstick protein 2+."* She captures three photos: face, ankle, dipstick. She taps **Tunani** (Reason). Gemma 4 ingests all three modalities in a single forward pass, matches the pattern against the WHO MCPC §3 severe-pre-eclampsia criteria embedded in its 128 K context, and emits four tool calls. The screen shows a red banner — **ZAFI** (urgent) — with the recommendation: *"Ka tura Fatima zuwa Asibitin Janar na Kano cikin sa'a 12 don magani na MgSO₄ da kula da haihuwa."* The app speaks the recommendation back to Aisha in Hausa via TTS. An encrypted record is written to SQLite. **All of this runs in a single Gemma 4 forward pass on a $200 Android phone, with the device in airplane mode.**

## Architecture

The build is intentionally small. Four runtime modules carry the entire app:

- **Expo bare React Native 0.81 + Nitro Modules** — the UI layer. New architecture is required by Nitro and benefits us in latency: Hermes JS state mutations hit the native bridge with zero serialization overhead.
- **`cactus-react-native` 1.13.1** — wraps the Cactus C++ inference engine via Nitro. We use one call: `CactusLM.complete({ messages, tools, audio, options })`. Audio goes in as a raw PCM byte array; images go in as filesystem paths on the message; the tool schema goes in as a flat OpenAI-style JSON.
- **`google/gemma-4-E4B-it` (int4, ~3 GB compressed)** — fetched at first launch from `Cactus-Compute/gemma-4-E4B-it`. Audio is consumed by the audio conformer encoder; images by the vision encoder; both are merged into the language-model's context alongside the system prompt.
- **Encrypted SQLite (op-sqlite + SQLCipher)** — the database is opened with a passphrase generated on first launch and stored in `expo-secure-store` (iOS Keychain / Android Keystore equivalents). Losing the device loses the data. The schema is small: `visits`, `danger_signs`, `followups`, `schema_meta`.

The model **never returns prose**. Every output is a JSON array of structured tool calls. Each call is zod-validated; bad shapes are caught at the boundary, not in the UI. Handlers route into the local DB; the UI re-renders from observable events. There is no inference→render race.

We validated the end-to-end flow on two surfaces before writing the production UI:

- **macOS via Cactus's Python FFI:** ~24 s wall, `confidence: 1.0`, `cloudHandoff: false`. Reference output in [`spike-cactus/out/full.json`](../spike-cactus/out/full.json).
- **Android ARM64 emulator (9 GB RAM) via cactus-react-native:** ~42 s wall, identical functionCalls, `confidence: 0.9998`. Offline run (Wi-Fi off, mobile data off, airplane mode on, host-side network kill verified): bit-for-bit identical functionCalls JSON, `cloudHandoff: false`, in 49 s. Output in [`spike-cactus/out/android_online.json`](../spike-cactus/out/android_online.json) and [`spike-cactus/out/android_offline.json`](../spike-cactus/out/android_offline.json).

The first run pushed prefill from 514 tokens (text + image only on Mac) to 517 tokens (text + image + audio on Android) — a 3-token delta. The audio_conformer encoder is consuming the WAV bytes; the model is genuinely multimodal, not a transcribe-then-prompt pipeline.

## Why Gemma 4 specifically

Four blockers, four reasons the alternative stacks fail:

1. **Signal.** Aisha's village is below 4G coverage. Hosted-API stacks are simply not reachable. Only an on-device model works. Gemma 4 E4B fits in ~3 GB at int4 — small enough for a Pixel-class phone, large enough to handle the audio + vision + reasoning load in a single pass.

2. **Data sovereignty.** Nigeria's NDPR (Nigeria Data Protection Regulation, 2023) classifies clinical voice and images as personal data with strict cross-border transfer restrictions. A cloud API is a legal blocker, not an architectural preference. Gemma 4 runs in the app's sandboxed memory; the patient's audio and photos never traverse a network boundary.

3. **Cost at scale.** There are roughly 200,000 trained CHWs in sub-Saharan Africa per WHO estimates. A multimodal hosted API at typical per-call rates ($0.03–$0.10 per visit) for 30 visits/CHW/month works out to $36K–$120K per CHW per year — orders of magnitude above any district training budget. Gemma 4 on a device the CHW already owns is $0 marginal cost.

4. **Hausa audio.** Gemma 4 is the only open-weights model we know of with native audio encoding (audio_conformer) AND coverage of 140+ languages including Hausa. Whisper does Hausa transcription but loses the prosody and timing that helps the LLM disambiguate ambiguous notes; a separate transcription step also doubles inference cost. Single-pass multimodal is faster, simpler, and more accurate.

Swap Gemma 4 for any hosted multimodal API and four things break; three of them are not technical defects but legal and operational impossibilities.

## What we got working in 4 days

- Cactus + Gemma 4 E4B validated on macOS (Python FFI) and Android emulator (RN/Nitro). Identical JSON output across both surfaces; airplane-mode parity confirmed via `adb shell svc wifi disable` + `adb shell settings put global airplane_mode_on 1`.
- Production-grade RN app: 4 screens, design system (Fraunces + Inter, terracotta/bone/indigo palette), Hausa-default i18n with English toggle, encrypted SQLite with SQLCipher, Hausa TTS speech-back, capture flow (60 s audio + 3 photos).
- 4 tool schemas (`record_vitals`, `flag_danger_sign`, `recommend_action`, `schedule_followup`) with zod runtime validation, full handler implementations, and 8 vitest tests covering the contract.
- WHO MCPC 2017 §3 protocol text embedded verbatim in the system prompt with section-level `protocol_id` citations.
- WebGPU browser fallback at `chwcompanion.pages.dev` mirroring the same UI flow with canned demo data for judges who can't sideload an APK.

What's prototype-only at submission time: the sync-dashboard side (the CHW's data never *needs* to leave the device for the app to work — but a "send to clinic" path is stubbed pending a partner agreement), language packs beyond Hausa, and the physical Pixel field test (validated on emulator; physical device test requires hardware we don't yet have).

## Limitations

We are not Nigerian midwives. Every protocol in the system prompt is cited verbatim from WHO MCPC §3 — we make zero clinical claims of our own. The app is **decision support**, not a diagnosis. Field validation requires partnership with a credentialed clinical organization (Last Mile Health, Living Goods, or a local Ministry of Health pilot) before any deployment. Hausa medical-vocabulary edge cases have been tested only against the WHO-translated protocols; real-world dialect coverage needs additional work with native speakers.

## How to run locally

```bash
git clone https://github.com/<handle>/chw-companion
cd chw-companion && npm install && npx expo prebuild --platform android
npx expo run:android   # device with ≥8 GB RAM
```

See [README.md](../README.md) for the WebGPU demo and APK download.

## Acknowledgements

Google DeepMind for Gemma 4. The Cactus team for `cactus-react-native` and their on-device inference engine. WHO MCPC contributors for the clinical thresholds. Marc Rousavy for `react-native-nitro-modules`. Every open-source library pinned in `package.json`. Built with Gemma.

## Links

- Code: <https://github.com/chwcompanion/chw-companion> (Apache 2.0)
- Video: <https://youtube.com/watch?v=TBD>
- Live demo: <https://chwcompanion.pages.dev>
- APK: <https://github.com/chwcompanion/chw-companion/releases>
- Model: <https://huggingface.co/google/gemma-4-E4B-it>
- WHO MCPC manual: <https://www.who.int/publications/i/item/9789241565493>

---

*This project is built with Gemma 4 and complies with the Gemma Terms of Use and Prohibited Use Policy at <https://ai.google.dev/gemma/terms>.*
