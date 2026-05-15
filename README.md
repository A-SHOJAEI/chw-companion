# CHW Companion

> A midwife in every pocket — offline multimodal maternal-health triage with Gemma 4.

**Built with Gemma 4. Apache 2.0. Submitted to the Gemma 4 Good Hackathon, May 2026.**

CHW Companion ("Sahel") runs `google/gemma-4-E4B-it` directly on a $200 Android phone via [Cactus](https://github.com/cactus-compute/cactus). A community health worker (CHW) records a 60-second voice note in Hausa, captures three photos (face, ankle, dipstick), and the model emits a structured triage decision — `record_vitals`, `flag_danger_sign`, `recommend_action`, `schedule_followup` — entirely on-device. No signal required. No patient data leaves the phone.

## Why this exists

Three things have to be true at once for community health workers to actually use AI in the field:

1. **It has to work without signal.** Rural Nigeria has the lowest mobile-coverage density of any country with a hospital network. The CHW visits the patient. The cloud doesn't.
2. **Patient data can't leave the phone.** Nigeria's NDPR data-protection law treats clinical voice and images as protected personal data. Pushing them to a cloud API is not a workflow choice; it's a legal blocker.
3. **It has to cost $0 per visit.** A CHW carries 30–50 patients in their catchment. $30K/year in API fees per CHW exceeds the entire training budget of most district programs.

The only stack today that satisfies all three is an open-weights multimodal model with native function-calling, running locally on hardware that already exists in the field. Gemma 4 E4B with Cactus is that stack.

## What this is

This repo ships:

- **Android app (Expo bare RN + Nitro)** — single-screen guided visit, 4 screens, encrypted SQLite, Hausa-default i18n, TTS speech-back. Source: [`src/`](src/).
- **WebGPU browser demo** at `chwcompanion.pages.dev` — same UI flow, same JSON contract, deployable to Cloudflare Pages. Source: [`web/`](web/).
- **The system prompt** — WHO MCPC 2017 §3 clinical thresholds embedded verbatim with citation. Source: [`src/assets/prompts/system.md`](src/assets/prompts/system.md).
- **Vitest tests** covering the tool-call → DB-mutation contract for all 4 tools. Source: [`__tests__/`](__tests__/).

The Gemma 4 weights themselves are NOT in this repo — they're pulled from [Cactus-Compute/gemma-4-E4B-it](https://huggingface.co/Cactus-Compute/gemma-4-E4B-it) on first launch (~6.4 GB compressed, ~8.2 GB unzipped on device).

## Architecture

```
┌──────────────────────┐   ┌──────────────────────────────┐   ┌──────────────────────┐
│   CHW inputs         │   │  Android phone (offline)     │   │   Outputs (on phone)  │
│   ─────────          │   │  ──────────────────────       │   │   ─────────           │
│   60s Hausa audio    │──▶│  RN UI (Expo bare, Nitro)    │──▶│   Triage card         │
│   3 photos           │   │  cactus-react-native 1.13.1  │   │   TTS Hausa speech    │
│                      │   │  Gemma 4 E4B-it (int4 ~3GB)  │   │   Encrypted SQLite    │
│                      │   │  WHO IMPAC §3 (128K context) │   │   QR-coded form       │
└──────────────────────┘   └──────────────┬───────────────┘   └──────────────────────┘
                                          │
                              dotted line (only when online):
                                          │
                                          ▼
                              encrypted record → clinic dashboard
```

The model receives the audio, all three images, and the tool schema **in a single forward pass**. It returns a JSON array of function calls. Each call is zod-validated and routed to a handler that mutates the encrypted SQLite store. No round-trips. No Whisper → text → LLM → tools pipeline. We validated this end-to-end on macOS via Cactus's Python FFI and on Android via Cactus's React Native bridge — same JSON tool call, same confidence (0.9998), no `cloudHandoff`.

## The tool surface

Four tools, exact JSON shapes in [`src/lib/tools.ts`](src/lib/tools.ts):

| Tool | Purpose | Severity hook |
|------|---------|---------------|
| `record_vitals` | Persist measured vitals + patient name | none |
| `flag_danger_sign` | Match a finding to a WHO MCPC protocol section | `urgent` forces immediate referral |
| `recommend_action` | One imperative sentence in patient's language | drives the action card |
| `schedule_followup` | Routine return-visit reminder | clear/watch cases only |

## Quick start

### Run the Android app

```bash
git clone https://github.com/<you>/chw-companion.git
cd chw-companion
npm install
npx expo prebuild --platform android

# Build + install on a connected Android 12+ device or emulator with ≥8 GB RAM:
npx expo run:android
```

First-launch behaviour:

1. SQLCipher key generated and stored in `expo-secure-store` (lost-with-the-device security model).
2. Gemma 4 weights either downloaded from Hugging Face (~6.4 GB), OR — for hackathon judges' convenience — sideloaded via the script in `scripts/sideload-weights.sh` (recommended path; cactus-react-native's registry resolver doesn't yet have a tagged release of gemma-4-E4B-it).

### Run the WebGPU demo

```bash
cd web
npm install
npm run dev
# open http://localhost:5173
```

Deploys to Cloudflare Pages via `wrangler pages deploy dist`. GitHub Actions workflow at [`.github/workflows/deploy-web.yml`](.github/workflows/deploy-web.yml) deploys on push to `main`.

### Run the tests

```bash
npm test       # vitest — 8 tool-handler contract tests
npm run typecheck
```

## Model attribution

Uses `google/gemma-4-E4B-it` (Apache 2.0) via the Cactus-Compute conversion at [Cactus-Compute/gemma-4-E4B-it](https://huggingface.co/Cactus-Compute/gemma-4-E4B-it). This project is built with Gemma 4 and complies with the [Gemma Terms of Use](https://ai.google.dev/gemma/terms) and [Prohibited Use Policy](https://ai.google.dev/gemma/prohibited_use_policy).

## Clinical content attribution

Danger-sign thresholds verbatim from:

- World Health Organization, **Managing Complications in Pregnancy and Childbirth: A guide for midwives and doctors** (Second Edition, 2017, WHO/MCA/17.02), Boxes 4–5, Figures 1–2, Tables 3–5. <https://www.who.int/publications/i/item/9789241565493>

CHW Companion is **decision support**, not a medical diagnosis. Field validation requires partnership with a credentialed organization (Last Mile Health, Living Goods, or equivalent) before any clinical deployment.

## Acknowledgements

- **Gemma 4** — Google DeepMind (open weights, Apache 2.0)
- **Cactus** — Henry Ndubuaku and the Cactus Compute team
- **Nitro Modules** — Marc Rousavy
- **Expo** — for `expo-camera`, `expo-av`, `expo-speech`, `expo-secure-store`, `expo-file-system`
- **WHO IMPAC** — for the protocols that ground every clinical decision in this app
- **WHO MCPC 2017 contributors** — listed in the manual's acknowledgements section
- All open-source libraries pinned in `package.json`

## License

Apache License 2.0 — see [LICENSE](LICENSE).

## Status

- ✅ Mac validation (Cactus + Python FFI) — text+image+audio → tool call, ~24s wall
- ✅ Android emulator validation (cactus-react-native + Nitro) — same JSON output, ~42s wall, identical offline (airplane mode)
- 🟡 Real Pixel/Samsung device validation pending — needs physical hardware (sideload procedure tested on emulator carries over)
- 🟡 Field validation with a clinical partner — required before any deployment

See [docs/writeup.md](docs/writeup.md) for the Kaggle submission writeup and [docs/USER_RUNBOOK.md](docs/USER_RUNBOOK.md) for the submission-week runbook.
