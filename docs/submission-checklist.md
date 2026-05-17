# Submission Checklist — Gemma 4 Good Hackathon

Walk top-to-bottom by **Monday 2026-05-18, 12:00 UTC**. Each gate is binary.
For the time-boxed plan see [`docs/FINAL_SUBMISSION_24H.md`](FINAL_SUBMISSION_24H.md).

## Pre-deadline gates

- [ ] **Identity verification complete** on the Kaggle account that will submit (24–48 hr; start immediately)
- [x] **`docs/RULES_VERIFIED.md`** filled in with verbatim rule text
- [ ] **GitHub repo is public** (verified in incognito)
- [x] **`LICENSE` (Apache 2.0)** at repo root
- [x] **`README.md`** finalised — surfaces live URLs + APK + license note about the CC-BY 4.0 winner-grant
- [ ] **No API keys / secrets** in git history (`git secrets --scan-history` or `gitleaks detect`)
- [ ] **APK release v0.1.0** on GitHub Releases, ≤ 100 MB. Signed if keystore is ready; debug-signed otherwise — judges will sideload either
- [x] **Model weights NOT in repo** — linked to Hugging Face (`Cactus-Compute/gemma-4-E4B-it`)
- [ ] **WebGPU demo deployed** (Cloudflare Pages or Vercel) — returns `200` in incognito
- [ ] **YouTube video** uploaded as **Public** (not Unlisted, not Private), ≤ 3:00 runtime
- [ ] **Video description** contains the literal phrase `"Built with Gemma"` plus every attribution line from `docs/ATTRIBUTIONS.md`
- [x] **Writeup** (`docs/writeup.md`) ≤ 1500 words; contains `"Built with Gemma"`; contains the Gemma Terms-of-Use statement
- [x] **Cover image** at `docs/visual/cover-1280x720.png` (123 KB) and `cover-1920x1080.png`
- [x] **≥ 2 gallery images**: `docs/visual/architecture-1920x1080.png` + a UI screenshot (capture from the running app or `docs/visual/ui-mockups.html`)
- [ ] **Track selected: Main Track** (primary). Cactus Special Tech is auto-qualified by the technology used
- [ ] **Live demo URL** + **APK download link** both in the writeup attachments
- [ ] **Team size** ≤ 5, all on individual Kaggle accounts (or solo)
- [ ] **No participant on multiple teams**
- [ ] **"Submit" button visible** on the competition Writeup page

## Verification probes (run before clicking Submit)

Replace `{{GH}}` with your actual handle, `{{YTID}}` with the YouTube video ID, `{{DEMO}}` with the deployed web URL:

```bash
# 1) Public repo
curl -sI https://github.com/{{GH}}/chw-companion | head -1                                # 200

# 2) APK download (handles GitHub LFS redirects with -L)
curl -sIL https://github.com/{{GH}}/chw-companion/releases/download/v0.1.0/chw-companion-v0.1.0.apk | tail -1   # 200

# 3) Web demo
curl -sIL {{DEMO}} | tail -1                                                              # 200

# 4) YouTube public
curl -sIL https://www.youtube.com/watch?v={{YTID}} | tail -1                              # 200

# 5) Writeup word count
wc -w docs/writeup.md                                                                     # ≤ 1500

# 6) "Built with Gemma" appears
grep -c "Built with Gemma" docs/writeup.md                                                # ≥ 1

# 7) Gemma TOU statement
grep -ic "Gemma Terms" docs/writeup.md                                                    # ≥ 1
```

All six should hit; if any fails do not click Submit.

## Submission sequence on Kaggle (manual, checkbox per step)

1. [ ] Log into Kaggle on a stable network
2. [ ] Open competition page → click **New Writeup** → click **Submit**
3. [ ] **Title:** `CHW Companion: A Midwife in Every Pocket`
4. [ ] **Subtitle:** `Offline multimodal maternal-health triage with Gemma 4`
5. [ ] **Body:** paste from `docs/writeup.md` (omit the duplicate title/subtitle block — Kaggle has its own fields)
6. [ ] **Cover image:** upload `docs/visual/cover-1280x720.png`
7. [ ] **Gallery images:** upload `docs/visual/architecture-1920x1080.png` plus one UI screenshot
8. [ ] **Video URL:** YouTube link (Public)
9. [ ] **Code repo URL:** `https://github.com/<your-handle>/chw-companion`
10. [ ] **Live demo URL** OR **attached APK file** as Files
11. [ ] **Track:** select **Main Track**
12. [ ] Confirm identity-verification status shows green
13. [ ] Click **Submit**
14. [ ] Screenshot the confirmation page → save to `submitted.png`
15. [ ] Wait 5 min, reload the submission page, re-screenshot to confirm persistence

## Hard deadlines

- **18:00 UTC May 18** — submit (5:59 hr safety buffer)
- **22:00 UTC May 18** — if anything still blocks: post in the Kaggle Discussion forum at <https://www.kaggle.com/competitions/gemma-4-good-hackathon/discussion> tagging `@hostadmin`
- **23:59 UTC May 18** — hard cutoff per the competition rules

## Risk register (the ones that can still bite us)

| # | Risk | Mitigation |
|---|------|-----------|
| 1 | Identity verification slow | Started immediately; if blocked at submission time, submit anyway, fix after — but a winner can be disqualified for unverified status |
| 2 | Hausa VO unavailable | Documentary mode with English VO + stock B-roll. Storyboard works either way |
| 3 | WebGPU live demo flakes | Web demo's canned-replay path always works; if even that breaks, attach APK as the demo |
| 4 | APK signing fails Day 4 | Ship debug APK (judges will sideload either) |
| 5 | YouTube takedown for music | Only licensed music (Epidemic / Artlist / CC0) — license PDFs saved alongside the project file |
| 6 | Kaggle server timeout at submission | Submit at 18:00 UTC, 6 hr before deadline |
