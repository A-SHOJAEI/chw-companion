# Sync protocol — envelope + clinic ingest API

The product works **entirely without sync.** The CHW completes a visit,
prints a QR-coded triage form if needed, and the data stays on the device.

When the phone reaches Wi-Fi at the end of the day OR a clinic scans the
printed QR, the visit envelope reaches the clinic dashboard. This document
specifies that handoff.

## Design goals

1. **No envelope content is readable by any party other than the receiving
   clinic.** The clinic provisions a symmetric key at onboarding; that key
   is the only one that can decrypt. Even if the dashboard host is
   compromised, the envelope at rest is opaque.
2. **The CHW's device never holds the clinic's key.** It only holds the
   public half (Curve25519 or RSA-OAEP wrapping key).
3. **No identifying metadata at the transport layer beyond device pseudonym.**
4. **Failure is local.** If sync fails, the device retries; nothing is
   blocked on it.

## Envelope JSON

The QR payload and the HTTP sync body are the **same JSON**, schema:

```json
{
  "schema": "chw-companion/triage-envelope/v1",
  "visit_id": "uuid",
  "patient_name": "string",
  "gestational_age_weeks": 32,
  "vitals": {
    "bp_sys": 158,
    "bp_dia": 102,
    "edema_grade": "pitting",
    "proteinuria": "2+"
  },
  "severity": "urgent",
  "recommendation": {
    "action": "Ka tura Fatima zuwa Asibitin Janar na Kano cikin sa'a 12.",
    "facility": "district_hospital",
    "timeframe_hours": 12,
    "refer_immediately": true
  },
  "danger_signs": [
    { "sign": "BP 158/102", "severity": "urgent", "protocol_id": "MCPC-2017-§3-severe-preeclampsia" },
    { "sign": "pitting edema", "severity": "urgent", "protocol_id": "MCPC-2017-§3-severe-preeclampsia" }
  ],
  "captured_at": "2026-05-15T09:43:11.000Z"
}
```

`buildEnvelope(visit, signs)` in `src/lib/triage-pdf.ts` is the single
source of truth for this shape.

## Encryption (in transit)

Both the QR-encoded handoff and the HTTPS POST use the same encrypted form:

1. **CHW device** generates a 256-bit AES-GCM data-encryption key (DEK) per
   envelope.
2. The DEK encrypts the envelope JSON (AES-256-GCM, random 96-bit nonce,
   16-byte authentication tag).
3. The DEK is then wrapped (encrypted) with the **clinic's public key**
   provisioned at onboarding. Curve25519 + HPKE (RFC 9180) is preferred;
   RSA-OAEP-256 is the fallback for clinics whose dashboards can't yet do
   HPKE.
4. The transport packet is:

   ```
   {
     "version": 1,
     "wrapped_dek_b64": "...",     // RSA-OAEP / HPKE wrap of the 32-byte DEK
     "nonce_b64": "...",            // 12 bytes
     "ciphertext_b64": "...",       // envelope JSON, encrypted
     "tag_b64": "...",              // 16 bytes
     "device_pseudonym": "device-xxxxx-xxxxx"  // never the CHW's name
   }
   ```

5. `device_pseudonym` is a one-way hash of `(device_install_id + clinic_id)`
   so the clinic can dedupe / count visits per CHW without learning the
   CHW's name.

## HTTPS sync (optional, when the device gets connectivity)

When the device sees a network AND the user has a clinic onboarded:

```
POST https://<clinic>.chwcompanion.health/ingest/v1
Content-Type: application/json
X-Clinic-Id: <opaque-uuid>
X-Device-Pseudonym: device-xxxxx-xxxxx
Body: <transport packet, see above>
```

Response:
- `204 No Content` on success
- `400` if the envelope's schema is unknown
- `409` if the same `visit_id` is already on file (idempotent — client treats
  as success)
- `5xx` retry with exponential backoff (5s, 30s, 5m, 30m, 6h, 24h, fail)

The client marks `visits.synced_at = ISO timestamp` only on 2xx or 409.

## QR handoff (when offline, in-person at the facility)

The printed PDF (see `src/lib/triage-pdf.ts`) carries the **same
transport packet** rendered as a QR code. The receiving clinic scans it
into the same `/ingest/v1` endpoint as if it came in over HTTPS.

The QR payload size is the main constraint:
- Envelope JSON is typically 1–2 KB
- After AES-GCM + base64, ~2.5 KB
- A QR Code Version 40 at error-correction level Q encodes up to ~1.85 KB
  of base64 — borderline. The TRUE production path is to print 2 QR codes
  ("part 1 of 2") if the envelope exceeds 1.5 KB, or to print a
  shorter-URL referent to a one-time-fetch local-network endpoint.

For the v0.1.0 demo build, we print a single QR with the envelope's
load-bearing fields only (`visit_id`, severity, facility, timeframe,
top-3 danger signs). The full envelope reaches the clinic via the next
HTTPS sync.

## Clinic onboarding

A clinic is added to a device via:

1. Clinic admin generates a Curve25519 keypair on the dashboard.
2. The public key is rendered as a QR on the dashboard.
3. The CHW supervisor scans it from `Settings → Add Clinic` in the app
   (TODO: not yet built; current build supports zero clinics).
4. Device stores `(clinic_id, clinic_pubkey, ingest_url)` in encrypted
   SQLite as a row in a (future) `clinics` table.

A device can be onboarded to multiple clinics; the CHW picks the target
clinic per visit. Default = the most recently active.

## What we did not build for v0.1.0

- The actual clinic dashboard (Cloudflare Pages stub, but no DB / Auth /
  patient-search wired)
- The `clinics` SQLite table and `Settings → Add Clinic` flow
- The multi-QR splitting code for envelopes >1.5 KB
- Background sync via `expo-background-fetch`

These are documented in `docs/USER_RUNBOOK.md` as Day-1+ work. The encryption
contract above is the design we'd implement against.

## Worked example: severe pre-eclampsia visit → clinic

1. CHW does the visit on `2026-05-15T09:43Z` in airplane mode.
2. App writes the visit row + 5 danger_signs to encrypted SQLite.
3. CHW taps **Buga Takarda** ("Print form") on ResultScreen. PDF is
   generated locally; QR encodes the short-form transport packet.
4. CHW drives to the district hospital.
5. Clinic scans the QR at intake. Their dashboard decrypts with the
   clinic private key, validates the schema, displays Fatima's record
   alongside the projected ETA.
6. Receiving clinician confirms blood pressure on arrival, starts
   MgSO₄ within minutes of arrival rather than after a 20-minute
   re-intake.

The CHW's phone never reached the network. The visit data only ever
moved as a printed QR. NDPR-compliant by construction.
