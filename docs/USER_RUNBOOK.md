# USER RUNBOOK — What only you can do

The code (Android app, web demo, tests, docs) is shipped. The work in this file
**cannot be automated** and is the path to a submitted entry.

Estimated total wall time over 4 days: ~25 hours, mostly Day 3 (video shoot/edit).

---

## DAY 0 (tonight, May 14) — 60 min

1. **Verify Kaggle rules in a browser**  
   Open <https://www.kaggle.com/competitions/gemma-4-good-hackathon/rules> in a logged-in browser.
   Paste verbatim rule text into [docs/RULES_VERIFIED.md](RULES_VERIFIED.md) for each TODO.  
   The five questions to answer:
   - Can a single project win Main + Impact + Special Tech?
   - Word cap on the writeup?
   - YouTube Unlisted vs Public?
   - Team rules?
   - Identity verification required?

2. **Start Kaggle identity verification**  
   This can take 24–48 hours. Start it now even if the rules tab says it's
   not strictly required — verification status appears on your profile and
   judges have been known to deprioritize unverified submissions.

3. **Create the public GitHub repo**  
   `gh repo create chwcompanion/chw-companion --public --license=Apache-2.0`  
   Push this entire directory: `cd chw-companion && git remote add origin … && git push -u origin main`.

4. **Confirm you can build the APK on your machine**  
   ```
   cd chw-companion
   npm install
   npx expo prebuild --platform android
   JAVA_HOME=/path/to/jdk17 ANDROID_HOME=/path/to/sdk npx expo run:android
   ```

---

## DAY 1 (Fri May 15) — 4–6 hours

- **Render visual artifacts** per build plan §7.1, 7.2, 7.4, 7.5:
  - Design tokens HTML (§7.1)
  - SVG architecture diagram (§7.2) — save to `docs/architecture.svg`
  - UI mockups React artifact (§7.4) — screenshot 3 phones, save to `docs/screenshots/`
  - Video lower-thirds (§7.5) — 5 HTML frames, screenshot each
- **Run the app on a real Android device** if you have one. If not, the emulator
  validation from the spike is sufficient — note the limitation explicitly in
  the writeup (already done at line "Real Pixel/Samsung device validation pending").

---

## DAY 2 (Sat May 16) — 4–6 hours

- **Deploy the WebGPU demo to Cloudflare Pages**:
  ```
  cd web
  npm install
  npm run build
  npx wrangler pages deploy dist --project-name=chwcompanion
  ```
  This requires a Cloudflare account with the `Pages` permission. Set
  `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repo secrets on GitHub so
  the workflow in `.github/workflows/deploy-web.yml` auto-deploys on push.
- **Generate the cover image** using build plan §7.3 prompts. Three variants;
  pick the strongest. Add the "CHW Companion" wordmark and "Built with Gemma"
  lockup in Figma/Photoshop. Export 1280×720 (Kaggle) and 1920×1080 (YouTube
  thumbnail) to `docs/cover-1280x720.png` and `docs/cover-1920x1080.png`.
- **Sign the APK**:
  ```
  cd android
  ./gradlew assembleRelease
  # Outputs APK at android/app/build/outputs/apk/release/app-release.apk
  ```
  Set up a signing keystore once; commit `android/app/build.gradle` config
  pointing at it; never commit the keystore itself. Test the APK installs and
  launches on a real device or emulator.

---

## DAY 3 (Sun May 17) — 10–14 hours, the heaviest day

This is the video. The video is 70 of 100 prize points.

- **Post the Fiverr Hausa VO gig at 06:00 UTC** per build plan §9.2.
  Attach your Hausa script (which you write today from the storyboard).
  24-hour delivery requirement.
- **Shoot or assemble B-roll** per the storyboard in build plan §9.1:
  - 0:00–0:30 Aisha walking / kneeling next to patient → original footage or
    Pexels footage of an African CHW (search "community health worker
    nigeria", "midwife africa rural", "sahel village morning").
  - 0:30–1:25 the demo — capture using `scrcpy` per §9.3, three takes, pick
    the cleanest:
    ```
    brew install scrcpy
    scrcpy --record demo-raw.mp4 --max-fps 30
    ```
    Important: capture a frame with airplane-mode icon visible for the
    1:38–1:55 moat segment.
  - 1:25–1:38 architecture diagram — animate the SVG from §7.2 with simple
    fade-ins in DaVinci Resolve.
  - 1:38–2:25 motion graphics — moat side-by-side (cloud vs. on-device), map of
    Africa with dots blooming, three-CHWs grid.
  - 2:25–2:40 stock — newborn / mother stock from Pexels or Pond5.
  - 2:40–3:00 closing card from §7.5 frame 5.
- **Edit in DaVinci Resolve.** 24fps, 1080p, H.264, AAC. Project at
  `/03-VIDEO/edit/project.drp`. Music: a single kora/balafon track (Epidemic
  Sound or Artlist). Burn in English subtitles 0:00–1:25; switch to English VO
  at 1:25. Render `final-1080p.mp4`.
- **Upload to YouTube as PUBLIC** (not Unlisted). Set the title, description
  (must contain "Built with Gemma" + every attribution from
  [docs/ATTRIBUTIONS.md](ATTRIBUTIONS.md)), and thumbnail (the 1920×1080 cover
  variant). Add captions (the `captions.srt` from your script).

---

## DAY 4 (Mon May 18) — 3–5 hours, then SUBMIT

- **Final repo polish** per build plan §6.6:
  - Verify README is clean, contains hero image link, badges, links.
  - Tag `v0.1.0` and attach the signed APK to the GitHub release.
  - Run `git secrets --scan-history` (or `gitleaks detect`) to confirm no
    secrets in history.
  - Verify all URLs in `docs/submission-checklist.md` return 200 in incognito.
- **Walk the submission checklist** at [docs/submission-checklist.md](submission-checklist.md). Every box ticked.
- **Submit at 18:00 UTC** (5:59 hr before the 23:59 UTC deadline). Take the
  confirmation screenshot. Wait 5 min, reload, take another screenshot to
  confirm persistence.
- **Post-submit:** breathe.

---

## What's not on this list (because I built it for you)

- All app code: scaffolding, screens, components, library code, Cactus wrapper,
  4 tool schemas + handlers, encrypted DB, i18n, system prompt with verbatim
  WHO content + few-shot examples
- All tests (vitest, 8 passing)
- TypeScript typecheck (clean)
- Web fallback subproject
- All docs in `docs/`
- Sample data (audio + image) for the demo flow
