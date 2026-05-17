# CHW Companion: A Midwife in Every Pocket
## Offline multimodal maternal-health triage with Gemma 4

**Built with Gemma 4. Apache 2.0. Submitted to the Gemma 4 Good Hackathon, May 2026.**

---

## The problem

It is 6:14 in the morning in northern Nigeria. Aisha Mohammed is the only health worker in her village. Today she walks two kilometres to see Fatima Bello, who is 32 weeks pregnant and complaining of a headache that will not stop. Aisha measures Fatima's blood pressure: 158 over 102. She presses on her ankle; her thumb leaves a dent. The urinalysis dipstick comes back 2+ on the protein pad. To anyone trained, this is severe pre-eclampsia per WHO MCPC §3 — a condition that kills 50,000 women a year in low-resource settings.

But Aisha is a community health worker, not a physician. The nearest doctor is four hours away. There is no signal in her village. Even when she gets back to town, Nigeria's NDPR data-protection law prohibits her from uploading Fatima's voice and photos to a cloud service. And a hosted multimodal API at the scale of 200,000 CHWs across Africa, dozens of visits each per month, would cost more than the entire annual training budget of most district programs.

The math doesn't work. **CHW Companion** runs Gemma 4 E4B directly on Aisha's $200 Android phone, fully offline, and turns the unstructured visit into a structured triage decision in roughly forty seconds.

## The solution

Aisha taps **Fara Ziyara** — *Start Visit*. She records a sixty-second voice note in Hausa: *"Fatima Bello, ciki na makonni 32, BP 158 a kan 102, ƙafafu sun kumbura, dipstick 2+, tana fama da ciwon kai."* She captures three photos — face, ankle, dipstick. She taps **Bincika** — *Review*. Gemma 4 ingests all three modalities in a single forward pass, matches the pattern against the WHO MCPC §3 severe pre-eclampsia criteria embedded in its 128K context, and emits a structured triage. The screen shows a red banner — **ZAFI** — with the recommendation: *"Ka tura Fatima zuwa Asibitin Janar na Kano cikin sa'a 12 don magani na MgSO4."* The app speaks the recommendation back to Aisha in Hausa via TTS. An encrypted record is written to local SQLite. A QR-coded form can be printed and handed to whoever scans her in at the receiving facility. The device is in airplane mode the entire time.

## Architecture

Four runtime layers carry the whole product:

**React Native with the new architecture** is the UI. We use Expo SDK 54 with `react-native-nitro-modules` to give us a zero-serialization JS→C++ bridge — critical, because we're passing an audio buffer and three image paths into a multimodal call on every visit.

**`cactus-react-native`** wraps the Cactus C++ inference engine via Nitro. One call carries everything: `CactusLM.complete({ messages, tools, audio, options })`. Audio goes in as a raw PCM byte array; images go in as filesystem paths on the message; the tool schema goes in as flat OpenAI-style JSON.

**Gemma 4 E4B-it (int4, ~3 GB)** is the model. The audio conformer encoder consumes the WAV bytes; the vision encoder consumes the JPEGs; both merge into the language model's context alongside a system prompt grounded in WHO MCPC 2017 §3 thresholds — verbatim, with `protocol_id` citations the user can audit. The model never returns prose. Every output is a JSON array of structured calls to `record_vitals`, `flag_danger_sign`, `recommend_action`, or `schedule_followup`. Each call is zod-validated; malformed shapes are caught at the boundary, not in the UI.

**SQLCipher-encrypted SQLite** is the store. The passphrase is generated on first launch and lives in the Android Keystore. Lose the device, lose the data — that is the intended security model. There is no server. There is no cloud account. There is no "share with cohort" toggle. The visit lives on the phone until the CHW chooses to print a QR-coded form and hand it to a clinician at the receiving facility.

See [`docs/visual/architecture.svg`](visual/architecture.svg) for the diagram.

## Why Gemma 4

Four constraints make this product only possible on an open multimodal model running locally.

**Signal.** Aisha's village is below the 4G coverage line. The cloud is not unreachable some of the time; it is unreachable during the call she has to make. An on-device model has 0 ms wall to "reachable" and a 100% availability guarantee. Not a feature — a precondition.

**Data sovereignty.** Nigeria's NDPR (2023) classifies clinical voice and imagery as personal data with strict cross-border transfer restrictions. A US-hosted cloud API would need per-visit explicit cross-border consent, a Standard Contractual Clauses addendum, and a regulator-reviewed Data Processing Agreement. Six to twelve months of paperwork before a single visit could legally use it. On-device sidesteps it entirely.

**Cost at scale.** WHO estimates 200,000 CHWs in sub-Saharan Africa. A frontier multimodal API at typical 2026 pricing runs roughly $0.05–$0.12 per visit; thirty visits per CHW per month works out to $4M–$9M per year in API fees alone. Nigeria's 2024 federal allocation for community-health training across all programs was around $60M USD-equivalent. We're not in the same order of magnitude. On-device Gemma 4 is $0 marginal cost. The math is not close.

**Hausa audio.** Gemma 4 has a native audio_conformer encoder and 140-language coverage. The cloud alternative is a three-stage pipeline — Whisper to text, a vision API for images, an LLM with tool calling on top — three round trips, three failure modes, three bills. Single-pass multimodal is not a luxury here; it is a fundamentally simpler product surface.

Swap Gemma 4 for any hosted alternative and four things break. Three of them are not technical defects but legal and operational impossibilities.

## What runs today

End-to-end validated across two surfaces. **macOS via the Cactus Python FFI**: text + image + audio → `schedule_followup` for Fatima at confidence 0.9998, in 24 seconds wall time. Reference output in [`spike-cactus/out/full.json`](../spike-cactus/out/full.json). **Android ARM64 emulator via cactus-react-native**: same JSON shape, same confidence, same tool call, in 42 seconds wall time online and 49 seconds with the device in airplane mode + Wi-Fi blocked at the kernel layer — `cloudHandoff: false` confirmed by the library's own self-report. Reference outputs in [`spike-cactus/out/android_online.json`](../spike-cactus/out/android_online.json) and [`spike-cactus/out/android_offline.json`](../spike-cactus/out/android_offline.json). The prefill token count tells the rest of the story: 165 tokens for text only, 437 with one image (+272 from the vision encoder), 514 with audio added (+77 — the audio conformer is doing real work, not a transcribe-then-LLM stand-in).

The codebase: 4 screens, 6 components, 4 tool handlers with zod validation, encrypted SQLite, Hausa-default i18n with English toggle, Hausa TTS speech-back, QR-coded PDF triage forms (`expo-print`), local notifications for scheduled follow-ups, a constrained-decoding fallback that automatically narrows to a 2-tool subset when recent decode failure rate exceeds 30%, and 25 vitest tests covering the tool-call contract end-to-end. A WebGPU browser fallback at `chwcompanion.pages.dev` mirrors the same flow with canned-replay JSON, for judges who cannot sideload an APK.

## Limitations we'll say out loud

We are not Nigerian midwives. Every clinical threshold in the system prompt is cited verbatim from WHO MCPC §3; we make zero clinical claims of our own. Field validation requires partnership with a credentialed clinical program — Last Mile Health, Living Goods, or a Nigerian Ministry of Health pilot — and that is the next step after this submission, not before. Hausa medical-vocabulary edge cases have been tested only against the WHO-translated protocols; real dialect coverage needs more native-speaker data. The sync pipeline to a clinic dashboard is specified in [`docs/SYNC_PROTOCOL.md`](SYNC_PROTOCOL.md) (envelope encryption, AES-GCM with a per-clinic key, QR fallback for offline handoff) but only the QR-printed handoff is implemented in v0.1.0 — the HTTPS sync endpoint is stubbed.

## How to run

```bash
git clone https://github.com/A-SHOJAEI/chw-companion
cd chw-companion && npm install && npx expo prebuild --platform android
npx expo run:android        # Android 12+ device with ≥ 8 GB RAM
# or for judges: scripts/sideload-weights.sh after a debug APK install
```

The first launch downloads weights from Hugging Face (`Cactus-Compute/gemma-4-E4B-it`, int4, ~6 GB compressed) and caches them on device. Subsequent launches are local. For judges with a connected Android phone but no patience for the download, [`scripts/sideload-weights.sh`](../scripts/sideload-weights.sh) does the whole thing via `adb push` in ~5 minutes.

The browser fallback at `chwcompanion.pages.dev` requires no install — open it in Chrome 113+ and tap *Run Test*.

## Links

- **Code:** <https://github.com/A-SHOJAEI/chw-companion> (Apache 2.0)
- **Video:** <https://youtube.com/watch?v={{YTID}}>
- **Live demo:** <https://chwcompanion.pages.dev>
- **APK:** <https://github.com/A-SHOJAEI/chw-companion/releases/tag/v0.1.0>
- **Model:** <https://huggingface.co/google/gemma-4-E4B-it>
- **WHO MCPC source:** <https://www.who.int/publications/i/item/9789241565493>

## Acknowledgements

Google DeepMind for Gemma 4. Henry Ndubuaku and the Cactus Compute team for `cactus-react-native`. Marc Rousavy for `react-native-nitro-modules`. The WHO Department of Maternal, Newborn, Child and Adolescent Health, whose MCPC manual is the clinical authority every `protocol_id` in this app points at. Every open-source library pinned in `package.json`.

---

*Submitted to the Main Track. The project also qualifies for the Cactus Special Technology prize via its use of `cactus-react-native` to run Gemma 4 fully on-device.*

*This project is built with Gemma 4 and complies with the Gemma Terms of Use and Prohibited Use Policy at <https://ai.google.dev/gemma/terms>.*
