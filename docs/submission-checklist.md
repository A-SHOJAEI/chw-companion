# Submission Checklist — Gemma 4 Good Hackathon

Walk top-to-bottom by **Monday May 18, 12:00 UTC**. Each gate is binary.

## Pre-deadline gates

- [ ] **Identity verification complete** on the Kaggle account that will submit (started Day 0; typically 24–48 hr)
- [ ] **`docs/RULES_VERIFIED.md`** has every TODO replaced with verbatim rule text
- [ ] **Repo is public** — verified in an incognito window
- [ ] **`LICENSE` (Apache 2.0)** at repo root
- [ ] **`README.md`** updated per §6.6 of the build plan
- [ ] **No API keys / secrets** in git history (`git secrets --scan-history` clean, or `gitleaks detect`)
- [ ] **APK release v0.1.0** on GitHub Releases — signed APK ≤ 100 MB
- [ ] **Model weights NOT in repo** — linked to Hugging Face (`Cactus-Compute/gemma-4-E4B-it`)
- [ ] **WebGPU demo** at `chwcompanion.pages.dev` returns 200 in incognito
- [ ] **YouTube video** uploaded as **Public** (not Unlisted, not Private), ≤ 3:00 runtime
- [ ] **Video description** contains `"Built with Gemma"` + every attribution from `docs/ATTRIBUTIONS.md`
- [ ] **Writeup** (`docs/writeup.md`) ≤ 1500 words; contains `"Built with Gemma"`; contains the Gemma Terms-of-Use statement
- [ ] **Cover image** ≥ 1280×720, hero shot, ≤ 10 MB
- [ ] **≥ 2 gallery images** (architecture diagram + UI screenshot at minimum)
- [ ] **Impact Track tag** selected: **Health & Sciences**
- [ ] **Special Technology Track tag** selected: **Cactus**
- [ ] **Live demo URL** + **APK download link** both in writeup attachments
- [ ] **Team size** ≤ 5; all members identity-verified
- [ ] **No participant on multiple teams**
- [ ] **Submission window opens** — confirm "Submit" button is enabled on the competition page

## Verification probes (run before clicking Submit)

```bash
# 1) Public-repo check
curl -sI https://github.com/<you>/chw-companion | head -1     # 200

# 2) Public-video check (page is reachable without auth)
curl -sI https://www.youtube.com/watch?v=<id> | head -1       # 200

# 3) APK download check (no auth)
curl -sI https://github.com/<you>/chw-companion/releases/download/v0.1.0/chw-companion-v0.1.0.apk | head -1   # 200 or 302

# 4) Web demo
curl -sI https://chwcompanion.pages.dev | head -1             # 200

# 5) Writeup word count
wc -w docs/writeup.md                                          # ≤ 1500

# 6) "Built with Gemma" appears
grep -c "Built with Gemma" docs/writeup.md                     # ≥ 1
```

## Submission sequence (manual, checkbox per step)

- [ ] Log into Kaggle on a stable network
- [ ] Open competition page → click **Submit**
- [ ] Paste writeup, attach cover image, attach gallery images
- [ ] Add video URL
- [ ] Add repo URL
- [ ] Add live demo URL
- [ ] Tag Impact Track: **Health & Sciences**
- [ ] Tag Special Technology Track: **Cactus**
- [ ] Confirm identity-verification status shows **GREEN**
- [ ] Click **Submit**
- [ ] Screenshot the confirmation page → save to `submitted.png`
- [ ] Wait 5 min, reload the submission page, re-screenshot to confirm persistence

## Hard deadlines

- **18:00 UTC May 18** — submitted (5:59 buffer)
- **22:00 UTC May 18** — if anything still blocks: post in Kaggle Discussion, tag `@hostadmin`
- **23:59 UTC May 18** — hard cutoff per competition rules

## Risk register (truncated; see build plan §12 for full)

| # | Risk | Mitigation |
|---|------|-----------|
| 1 | Cactus RN+Android audio bug | Validated on emulator; sideload procedure documented |
| 2 | Function-calling reliability on E4B | `forceTools: true` set in `Gemma4Engine.infer` |
| 3 | Hausa VO unavailable | Documentary-recreation w/ English VO + stock |
| 4 | WebGPU build flakes | `web/` falls back to canned-replay JSON automatically |
| 7 | Identity verification slow | **Start Day 0** |
| 9 | Last-minute APK signing failure | Sign & test Day 3, not Day 4 |
| 10 | Kaggle server timeout | Submit at 18:00 UTC, 6 hr before deadline |
