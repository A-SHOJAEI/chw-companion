# CHW Companion v0.1.0 — first submission build

## What's here

- Full multimodal visit flow on Android (60 s audio + 3 photos + tool schema in a single Gemma 4 forward pass)
- WHO MCPC 2017 §3 thresholds embedded verbatim in the system prompt with `protocol_id` citations
- 4 tool schemas (`record_vitals`, `flag_danger_sign`, `recommend_action`, `schedule_followup`) with zod validation
- Constrained-decoding fallback: 2-tool subset auto-selected when recent decode failure rate > 30%
- Encrypted SQLite via SQLCipher; key in `expo-secure-store` (Android Keystore-backed)
- Hausa-default i18n with English toggle; TTS speech-back
- QR-coded triage form PDF (expo-print) — offline-printable handoff to the receiving facility
- Local notifications for `schedule_followup`
- Browser WebGPU fallback at `chw-companion.vercel.app` for judges who cannot sideload an APK
- Demo data seeder (3 historical visits + 1 upcoming follow-up) behind a long-press on the History header

## Install

1. Download `chw-companion-v0.1.0.apk` from this release.
2. Enable "Install unknown apps" for your file manager.
3. Open the APK and install.
4. On first launch, weights download (~6.4 GB compressed) from Hugging Face. Plan for ~10 GB free on the device.
   To skip the download for demo purposes, run `scripts/sideload-weights.sh` from a connected laptop.

## SHA-256

```
456d7d29d32cdc295e8a01181d990a30a10ffbebbdbf1c1170a957907868a166  chw-companion-v0.1.0.apk
```

> If you build the same commit (`master` HEAD as of v0.1.0) yourself, the hash should match. Verify with `shasum -a 256 chw-companion-v0.1.0.apk`.

## Build flavor

This v0.1.0 is built with `assembleDebug -PreactNativeArchitectures=arm64-v8a` and signed with the Android debug keystore. Judges sideloading the APK should expect the standard "install from unknown sources" prompt; the package is `org.chwcompanion.app` and targets Android 12+. A production-signed release will follow once the upload keystore is generated per [`docs/release.md`](release.md).

## Known limitations

- Not field-validated. Decision support, not a diagnosis.
- The browser demo uses canned-replay JSON until a Gemma 4 ONNX bundle ships for WebGPU.
- `docs/SYNC_PROTOCOL.md` specifies the clinic handoff path; only the PDF + QR step is implemented in v0.1.0. The HTTPS sync endpoint is stubbed.

## Built with Gemma

This project is built with Gemma 4 and complies with the Gemma Terms of Use and Prohibited Use Policy at <https://ai.google.dev/gemma/terms>.
