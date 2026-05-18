# Kaggle Rules — Verified

Verified against the **Gemma 4 Good Hackathon** official rules at
<https://www.kaggle.com/competitions/gemma-4-good-hackathon> as posted by the
Competition Sponsor. Verbatim language pulled from the rules text below.

> Source: official Competition Rules. Last verified by us on 2026-05-17.

## 1. Track stacking

**Verbatim:**

> "These five prizes recognize outstanding technical achievement using specific
> tools and frameworks within the ecosystem. **Projects are eligible to win
> both a Main Track Prize and a Special Technology Prize.**"

**Interpretation:** Main + Special Tech explicitly stacks. Impact-Track
stacking is **not** mentioned and the submission flow requires selecting a
single primary track for the writeup, so Main and Impact are
mutually exclusive on a single submission.

**Our target:**

- Primary track for the writeup: **Main Track**
- Special Technology Track (auto-qualified by the technology used): **Cactus**
- Realistic ceiling: **$60,000** (Main 1st $50K + Cactus $10K)
- Realistic floor if we hit Main 4th: **$20,000** (Main 4th $10K + Cactus $10K)

## 2. Writeup word cap

**Verbatim:**

> "Your Writeup should not exceed 1,500 words. Submissions over this limit may
> be subject to penalty."

**Our writeup:** `docs/writeup.md` — **1,491 words** (verify with `wc -w`).

## 3. Video — YouTube + Public

**Verbatim:**

> "Videos must be 3 minutes or less, and should be published to YouTube. […]
> You have to post your video on YouTube and provide a direct link to the
> video. **It must be viewable by the judges without requiring a login.**"

**Action:** Set YouTube visibility to **Public** (not Unlisted, not Private).
Test the URL in an incognito window with no Google account signed in before
the deadline.

## 4. Code repository — Public, no login/paywall

**Verbatim:**

> "The 'Source of Truth'. Provide a link to a public repository (e.g., GitHub,
> Kaggle Notebook). The code must be well-documented and clearly show the
> implementation of Gemma 4. **This is non-negotiable** and will be used to
> validate the authenticity of your project. Your code repository should be
> **publicly accessible and not require a login or paywall**."

**Action:** Create `github.com/A-SHOJAEI/chw-companion` as **Public**. Verify with
`curl -sI https://github.com/A-SHOJAEI/chw-companion | head -1` → should return
`200`.

## 5. Live demo — URL or attached files

**Verbatim:**

> "A URL or files for your working demo. This allows judges to experience your
> project firsthand, if applicable. It should be publicly accessible and not
> require a login or paywall."

**Our plan:** Both. Web demo at `chw-companion.vercel.app` (Vercel) as
the URL, plus a signed APK attached to a GitHub Release as fallback files.

## 6. Cover image — required for Media Gallery

**Verbatim:**

> "A cover image is required to submit your Writeup."

**Our cover:** `docs/visual/cover-1280x720.png` (123 KB, terracotta + bone, hero
copy + miniature phone-frame triage). Backup full-res at `cover-1920x1080.png`.

## 7. Team rules

**Verbatim:**

> "a. The maximum Team size is five (5).
> b. Team mergers are allowed and can be performed by the Team leader. […]
> For Hackathons, each team is allowed one (1) Submission; any Submissions
> submitted by Participants before merging into a Team will be unsubmitted."

> "You cannot sign up to Kaggle from multiple accounts and therefore you cannot
> enter or submit from multiple accounts."

**Action:** Confirm any teammates have individual Kaggle accounts. Each
participant must be on **one team only**. If solo, this is moot.

## 8. Submission limit

**Verbatim:**

> "For Hackathons, each Team may submit one (1) Submission only."

**Action:** Submit once, definitively. Use the **edit and resubmit** flow if a
correction is needed before the deadline — the rules permit unsubmit/edit/
resubmit. No second-team-attempt safety net.

## 9. Winner license — CC-BY 4.0

**Verbatim:**

> "Open Source: You hereby license and will license your winning Submission
> and the source code used to generate the Submission under **CC-BY 4.0**, an
> Open Source Initiative-approved license."

**Our repo license:** Apache 2.0 — fine because the rules allow any
OSI-approved permissive license. If we win, the **winner additionally grants
CC-BY 4.0** to the Competition Sponsor for the winning Submission. No conflict
with our existing Apache 2.0; we just need to also grant CC-BY 4.0 at
prize-acceptance time. Noted in `release.md`.

## 10. Identity verification

**Verbatim (from §3.8.b–c of the foundational rules):**

> "If a potential winner (i) does not respond to the notification attempt
> within one (1) week from the first notification attempt […] such potential
> winner will not receive any Prize."

Identity verification is a Kaggle-standard step for prize disbursement.
**Action:** Verify the Kaggle account that will submit, **today**. The process
typically takes 24–48 hours. <https://www.kaggle.com/settings/account>

## 11. Submission deadline

**Verbatim:**

> "May 18, 2026 - Final Submission Deadline. All deadlines are at 11:59 PM UTC
> on the corresponding day."

**Our self-imposed cutoff:** **18:00 UTC** (5:59 hr safety buffer before
23:59 UTC).

## 12. Track selection at submission

**Verbatim:**

> "You must select a Track for your Writeup in order to submit."

**Our selection:** **Main Track** (per the strategy decision in §1 above).
Cactus Special Tech is auto-qualified by the project's technology.

## 13. External tools cost / reasonableness

**Verbatim:**

> "The use of external data and models is acceptable unless specifically
> prohibited by the Host. […] their use must be 'reasonably accessible to all'
> and of 'minimal cost'."

**Our external dependencies — all free + OSS:**

| Dep | License | Cost |
|---|---|---|
| `google/gemma-4-E4B-it` | Apache 2.0 (Gemma) | $0 |
| `cactus-react-native` 1.13.1 | Apache 2.0 | $0 |
| `react-native-nitro-modules` | MIT | $0 |
| `@op-engineering/op-sqlite` + SQLCipher | MIT + BSD-style | $0 |
| Expo SDK 54 (camera, av, speech, etc.) | MIT | $0 |
| WHO MCPC 2017 §3 (clinical thresholds) | WHO open content | $0 |

Every dep is OSI-approved with no commercial-use restrictions. Reasonableness
standard satisfied.

## 14. Required attestations in the writeup

The writeup must contain (verified by `grep`):

- [x] **"Built with Gemma"** literal phrase — present (line 1)
- [x] **Gemma Terms of Use** statement linking to <https://ai.google.dev/gemma/terms> — present (final line)
- [x] Apache 2.0 license attribution — present
- [x] WHO MCPC citation — present

## 15. What's NOT in scope per the rules

- "Competition Data will not be provided by Competition Sponsor for this
  Competition." — confirmed. No Kaggle dataset to download.
- No public/private leaderboard scoring. **Hackathon judging is rubric-based**
  (per Sec. 1: *"For Competitions designated as hackathons … your Submissions
  will be judged by the Competition Sponsor based on the evaluation rubric"*).

## Evaluation rubric weighting

Per the competition Overview page:

| Criteria | Points |
|---|---|
| **Impact & Vision** (real-world problem framing, clarity, scope of change) | **40** |
| **Video Pitch & Storytelling** | **30** |
| **Technical Depth & Execution** | **30** |

**Implication for our 24-hour push:** The video is **30 points** and is the
main vehicle for the **40 Impact & Vision points**. 70 of 100 points hinge on
the video. The repo + writeup back it up; they verify what the video claims.
