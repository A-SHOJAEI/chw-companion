# Threat Model — CHW Companion

This document defines what CHW Companion protects, from whom, and how. It is
written so a clinical-program lead can sign off on a deployment without
asking us follow-up questions.

## Assets

| Asset | Sensitivity | Where it lives |
|-------|-------------|----------------|
| Patient voice notes (Hausa or English audio, ~60 s per visit) | **High** — personal data, clinical content, dialect identifies village | RAM during inference; written to encrypted SQLite as `raw_function_calls_json` payload meta only (NOT the raw audio bytes); raw audio file deleted after `complete()` returns |
| Patient photos (face, ankle, dipstick) | **High** — biometric (face), clinical (ankle/dipstick) | Same RAM-only lifetime as audio; the file path passed to Cactus is the captured-photo URI, deleted at the end of the visit |
| Triage card (patient name, vitals, danger signs, recommendation) | **Medium-High** — clinical PHI | Encrypted SQLite (`visits`, `danger_signs`, `followups`) |
| Visit envelope QR (when printed) | **Medium** — opaque JSON until scanned | Generated only on user-initiated "Print form"; scanned at receiving facility |
| Inference results JSON (functionCalls + confidence) | **Low** — no patient identifiers in the call shape itself, but tied to a visit | Encrypted SQLite as `raw_function_calls_json` |
| Sync envelope (if syncing online later) | **Medium-High** — same as triage card, but in transit | Symmetric-encrypted before leaving device; see `docs/SYNC_PROTOCOL.md` |

## Adversaries we explicitly protect against

1. **Lost or stolen phone.** SQLCipher passphrase is in `expo-secure-store`
   (Android Keystore-backed). Without unlocking the phone, the DB is opaque.
   Capture-time photo and audio files are deleted after `complete()` returns.
2. **Government data-localization mandate.** Nigeria's NDPR (2023) restricts
   cross-border transfer of personal data. Our default flow never moves
   patient data off the device. The optional sync path encrypts the envelope
   with a key the clinic controls (per `docs/SYNC_PROTOCOL.md`), so the
   sovereign-data argument is preserved even when sync is enabled.
3. **Network-layer attacker (Wi-Fi MITM, captive portal).** Inference path
   makes zero network calls. Even with airplane mode off, no patient data
   touches the network unless the user explicitly initiates sync.
4. **Inference-side prompt injection from the audio/image stream.** The
   system prompt is loaded from a signed bundle (TODO: actually sign in
   release build); the model only sees user content prefixed with role:'user'.
   Tool-call outputs are zod-validated; any malformed call is dropped without
   side effect.
5. **Reverse-engineering the APK.** The app is open source; there are no
   secrets in the APK. The only sensitive runtime state is the SQLCipher
   passphrase, which is in the Android Keystore — not in the APK binary.

## Adversaries we do NOT protect against (acknowledged limitations)

1. **Compromised device firmware / rooted device.** A rooted Android device
   can extract Keystore entries with sufficient effort. CHW Companion is not
   a defense-grade product. If the phone is rooted by an adversary with
   physical access, the data is at risk.
2. **Forensic seizure with the phone unlocked.** If the device is unlocked
   and seized by an adversary, the SQLite passphrase is loaded into the
   running process and the data is readable. We do not implement a
   per-visit "panic wipe."
3. **Coercion of the CHW.** Social engineering or duress is out of scope.
4. **Adversarial clinical input.** If a malicious user puts something other
   than a real patient in front of the camera and microphone, the model will
   still emit a tool call. CHW Companion is decision support, not
   gatekeeping.

## Encryption surface

- **At rest:** SQLite encrypted with SQLCipher; 32 random bytes generated on
  first launch, base64-encoded, stored as `chw.sqlcipher.key` in
  expo-secure-store with `keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
  Losing the key = losing the data. Intentional.
- **In transit (sync only):** symmetric AES-GCM with a key provisioned by the
  clinic at onboarding. See `docs/SYNC_PROTOCOL.md`.
- **In RAM:** unencrypted by necessity (Cactus reads mmap'd weight files and
  the model context contains decoded audio/image tensors). Mitigation:
  delete the source files immediately after `complete()` and call
  `cactus.stop()`/dispose if the app is backgrounded.

## Privacy posture stated to the patient

> When the CHW asks for consent before each visit, the script reads:
> "This phone listens to you and looks at you so I can decide your care.
> Nothing leaves the phone. It will only travel to the clinic if I print a
> paper form and someone there scans it. You can ask me to stop at any
> time."

The consent script is intentionally short and concrete; we deliberately do
not say "the AI" or "the model."

## Audit log

Every tool call is persisted with the visit. The full `raw_function_calls_json`
field on a visit row contains the model's raw output for that visit — so any
audit (clinician, partner ministry, ethics board) can reconstruct exactly
what was emitted and validate it against the WHO protocol_id the model cited.

## What changes if we add live sync

If sync is enabled in a future build, the threat surface grows by exactly
one connector — the HTTPS POST to the clinic's ingest endpoint. We mitigate
that with:
- AES-GCM envelope (key per clinic, key rotated quarterly).
- Refusal to send if the device cannot verify the clinic's TLS certificate
  against a pinned fingerprint (no fallback to system roots).
- Server returns a `204 No Content` on success — no data echo, no PII in
  response headers.
- Local row is marked `synced_at = <ISO>` only on `2xx`; on retry, the
  same envelope ID is used so the clinic side dedupes.

## What's out of scope

- HIPAA. This project targets sub-Saharan African deployments under their
  respective frameworks (NDPR in Nigeria, equivalent local rules in Kenya /
  Uganda / etc.) HIPAA compatibility is a separate engineering project.
- IRB. Field deployment requires institutional review board sign-off from
  the partner clinical program. Not in scope for the hackathon submission.
