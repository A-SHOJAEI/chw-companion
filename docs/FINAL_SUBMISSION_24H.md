# Final submission runbook — 24 hours to deadline

Deadline: **2026-05-18 23:59 UTC**. Self-imposed cut-off: **18:00 UTC** (5:59 hr safety buffer).

This is a sequenced list. Do the items in order. Each one says what to do, the command/URL where it applies, and how to verify it landed.

---

## Tier 0 — start in parallel, right now (60 min wall)

These are async / external-service waits. Kick them off in the first hour so they're done by the time you need them.

### 0.1 — Start Kaggle identity verification

- Sign into <https://www.kaggle.com> with the account you'll submit from.
- Open <https://www.kaggle.com/settings/account> → **Phone Verification** + **Identity Verification**.
- Kaggle typically takes 24–48 hr. **Start now**. Without verification, the prize can't be disbursed and may be forfeited per §3.8.

### 0.2 — Create the public GitHub repo + push

```bash
gh repo create A-SHOJAEI/chw-companion --public --license=Apache-2.0 --description "A midwife in every pocket — offline multimodal maternal-health triage with Gemma 4." --homepage https://chwcompanion.pages.dev
cd /Users/alireza/Desktop/Hackathon/chw-companion
git remote add origin https://github.com/A-SHOJAEI/chw-companion.git
git push -u origin master
```

**Verify:** `curl -sI https://github.com/A-SHOJAEI/chw-companion | head -1` returns `200`.

---

## Tier 1 — must be done before the 18:00 UTC cutoff

### 1.1 — Sign and release the APK (~30 min)

```bash
# One-time keystore generation (or use existing if you have one)
keytool -genkeypair -v \
  -keystore ~/.android/keystores/chw-upload.jks \
  -alias chw-upload -keyalg RSA -keysize 2048 -validity 10000

# Add the keystore credentials to ~/.gradle/gradle.properties
# (see docs/release.md for the exact gradle.properties keys)

# Build
cd /Users/alireza/Desktop/Hackathon/chw-companion/android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a

# SHA-256 + upload
APK=app/build/outputs/apk/release/app-release.apk
shasum -a 256 "$APK"

git tag v0.1.0 && git push origin v0.1.0
gh release create v0.1.0 \
  --title "CHW Companion v0.1.0 — first submission build" \
  --notes-file ../docs/release-notes-v0.1.0.md \
  "$APK#chw-companion-v0.1.0.apk"
```

**Backup plan:** if signing fails, ship the **debug** APK from `app/build/outputs/apk/debug/app-debug.apk`. Judges will sideload either; mention "debug build" in the release notes.

**Verify:** `curl -sIL https://github.com/A-SHOJAEI/chw-companion/releases/download/v0.1.0/chw-companion-v0.1.0.apk | head -1` returns `200`.

### 1.2 — Deploy the web demo (~15 min)

Two options. Pick the faster one for your setup.

**Option A — Cloudflare Pages via wrangler:**

```bash
cd /Users/alireza/Desktop/Hackathon/chw-companion/web
npm install && npm run build
npx wrangler login                   # first time only
npx wrangler pages deploy dist --project-name chwcompanion
```

Returns a `*.pages.dev` URL. Custom domain `chwcompanion.pages.dev` requires either the exact project name or DNS setup — use whatever Cloudflare returns and update the writeup link accordingly.

**Option B — Vercel (faster, no DNS):**

```bash
cd /Users/alireza/Desktop/Hackathon/chw-companion/web
npm install && npm run build
npx vercel deploy --prod
```

**Verify:** `curl -sIL <deployed-url> | head -1` returns `200` in an incognito window.

If neither works in time: omit the live demo URL and attach the APK as the "Files" form of the live demo per Rule 1c of the submission requirements. The rules accept either.

### 1.3 — Shoot, edit, and upload the video (~6–10 hr — biggest time sink)

Storyboard is locked at [`docs/video/storyboard.md`](video/storyboard.md). 14 shots, 3 min runtime. **70 of 100 judging points hinge on this — don't skip.**

**Pragmatic 24-hour adaptation if you can't get the Hausa VO from Fiverr:**

- Skip the Hausa-VO section (0:00–1:25 in the storyboard).
- Use English narration throughout, with the same emotional beats.
- Reuse the existing UI screenshots (Home, Visit, Result) and the visual artifacts (`docs/visual/architecture-1920x1080.png`, `docs/visual/cover-1920x1080.png`) as B-roll.
- Capture the actual app running via `scrcpy` on the emulator: see [`docs/video/shot-list.md`](video/shot-list.md) for the precise demo capture instructions.

**Tools you'll need:**

- Video editor: DaVinci Resolve (free, Mac), CapCut, or iMovie.
- Audio: Quicktime / Voice Memos for the VO; export at 48 kHz mono.
- Music: a single track from Epidemic Sound or one of the CC0 sources noted in `docs/video/shot-list.md`. Save the license PDF.

**Required by the rules — re-check before upload:**

- **Public** YouTube visibility (not Unlisted)
- ≤ 3:00 runtime
- "Built with Gemma" literal phrase appears in the closing card AND the video description
- Description includes the attributions from [`docs/ATTRIBUTIONS.md`](ATTRIBUTIONS.md)

**Verify:** open the YouTube URL in an incognito window with no Google account → loads and plays.

### 1.4 — Final writeup polish

After 1.1–1.3 above land, replace the remaining placeholders in [`docs/writeup.md`](writeup.md):

```bash
cd /Users/alireza/Desktop/Hackathon/chw-companion
sed -i '' 's/{{YTID}}/<your-youtube-id>/g' docs/writeup.md
sed -i '' 's|https://chwcompanion.pages.dev|<your-deployed-url>|g' docs/writeup.md
wc -w docs/writeup.md                    # must be ≤ 1500
grep -c "Built with Gemma" docs/writeup.md # must be ≥ 1
grep -ic "Gemma Terms" docs/writeup.md     # must be ≥ 1
```

Commit + push.

---

## Tier 2 — at the Kaggle submission page (~30 min, do at 17:30 UTC)

Open the competition page, click **Submit Writeup**.

| Field | What to enter |
|---|---|
| **Title** | `CHW Companion: A Midwife in Every Pocket` |
| **Subtitle** | `Offline multimodal maternal-health triage with Gemma 4` |
| **Track** | **Main Track** (per `docs/RULES_VERIFIED.md` §1) |
| **Body** | Paste the entire contents of `docs/writeup.md` (1,491 words; minus the YAML title block — Kaggle has its own title/subtitle inputs) |
| **Cover image** | Upload `docs/visual/cover-1280x720.png` |
| **Gallery images** | Upload `docs/visual/architecture-1920x1080.png` and 1–2 of your best UI screenshots |
| **Video URL** | Your YouTube link (Public) |
| **Code repo URL** | `https://github.com/A-SHOJAEI/chw-companion` |
| **Live demo URL** | Your deployed web demo URL **or** attach the APK as Files |

**Pre-flight checks** (run these in an incognito browser before clicking Submit):

```bash
# 1) Repo public
curl -sI https://github.com/A-SHOJAEI/chw-companion | head -1
# 2) APK downloadable
curl -sIL https://github.com/A-SHOJAEI/chw-companion/releases/download/v0.1.0/chw-companion-v0.1.0.apk | head -1
# 3) Web demo (substitute the URL Cloudflare/Vercel returns)
curl -sIL <deployed-url> | head -1
# 4) YouTube public (substitute your video URL)
curl -sIL <youtube-url> | head -1
```

All four should return `200` or `301/302 → 200`.

Then click **Submit**. Screenshot the confirmation. Wait 5 min and reload to confirm persistence.

---

## Hard timing

- **00:00 UTC May 18** — you're inside the 24-hour window
- **06:00 UTC** — Hausa VO order placed (if doing one)
- **18:00 UTC** — submit
- **23:59 UTC** — deadline. Do not submit past 22:00 UTC unless you have a verified working draft.

If anything blocks past 22:00 UTC: post in the Kaggle Discussion forum at <https://www.kaggle.com/competitions/gemma-4-good-hackathon/discussion> tagging `@hostadmin`. The competition organizers explicitly reserve the right to handle late-window issues if they're notified before the deadline.

---

## What's already done (so you don't redo it)

- Repo code, 25/25 vitest tests, tsc clean, ESLint clean
- Writeup at 1,491 words with all required attestations
- Cover image PNG exports at 1280×720 and 1920×1080
- Architecture diagram PNG at 1920×1080
- UI mockups HTML, lower-thirds HTML, design tokens HTML (open in browser, screenshot for video B-roll)
- Storyboard, English VO script, Hausa VO script (for Fiverr), captions.srt, shot list
- Sideload script with the chcon / SELinux fix encoded
- Threat model, sync protocol, release runbook, attributions, submission checklist

## Track + prize math

- **Primary track:** Main Track ($10K–$50K)
- **Special Tech (auto-qualified):** Cactus ($10K)
- **Realistic ceiling:** $60K (Main 1st + Cactus)
- **Realistic floor if we hit Main 4th:** $20K (Main 4th + Cactus)
- Impact-track is not stackable; we leave that on the table by design
