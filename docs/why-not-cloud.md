# Why on-device, not cloud — the math

This is the cost-and-constraints argument the writeup compresses to one
paragraph. Sources cited inline.

## The four blockers (sized)

### 1. Signal

- **Nigerian rural 4G coverage**: per the 2024 GSMA Mobile Connectivity
  Index, the bottom-quartile populated areas of northern Nigeria show
  intermittent or no LTE/HSPA. Even where coverage exists, latency
  to nearest data center (Lagos or Johannesburg) ranges 80–250 ms with
  failure rates >5% on a typical visit.
- **The visit happens at the patient's home, not at a tower.** A CHW
  walking 1–4 km from their base station has no negotiation with the
  cell network. The cloud is, in any honest accounting, **unavailable
  during the call you need to make.**
- An on-device model has 0 ms wall to "reachable" and a guaranteed
  100% availability. This isn't a feature; it's a precondition.

### 2. Data sovereignty (NDPR)

Nigeria's **Data Protection Regulation 2023 (NDPR)** classifies clinical
voice and imagery as personal data, and §3.1 restricts cross-border
transfer to processors without explicit consent + an adequacy finding.
A hosted multimodal API hosted in the US (most major providers) would
require:
- per-visit explicit cross-border consent (a workflow blocker);
- a Data Processing Agreement (DPA) with each provider that the
  Nigerian regulator has reviewed; AND
- a Standard Contractual Clauses (SCC) addendum, which most major
  providers' templates don't accommodate.

Net effect: even a CHW *willing* to use a cloud API would face a 6–12
month regulatory path before they could legally point their phone at it.

### 3. Cost at scale

Order-of-magnitude per-call cost of multimodal APIs at typical
2025–2026 pricing (audio + 3 images + text input, structured output):

| Provider class | $/call (1 visit) | Annual per CHW @ 30 visits/mo | At scale (200K CHWs) |
|----------------|------------------|-------------------------------|----------------------|
| Frontier multimodal (e.g. premium models, ~$5 per Mtoken in + $15 per Mtoken out, ~10k tokens per call) | $0.05–$0.12 | $18–$43 | $3.6M–$8.6M / yr |
| Open-source hosted (e.g. self-hosted Gemma 3 27B on cloud GPU) | $0.02–$0.04 | $7–$14 | $1.4M–$2.8M / yr |
| **On-device Gemma 4 E4B (this project)** | **$0** | **$0** | **$0** |

(Pricing assumes audio is encoded efficiently as bytes, not transcribed
first; if a Whisper round-trip is added, multiply by ~1.5×.)

Numbers for context:
- Nigeria's 2024 federal allocation for community-health training was
  roughly **$60M USD-equivalent** across all programs (federal MoH
  budget breakdown, 2024).
- $3.6M–$8.6M / yr in inference cost alone consumes 6–14% of the entire
  training budget for one tool — before salaries, devices, or content.
- $1.4M–$2.8M / yr (the cheapest cloud option) is still 2–5% of total
  budget, but adds:
  - cloud egress fees from the cluster's region
  - a regulatory dependency that no on-device deployment has
  - a per-call latency that intermittent rural networks make unusable

**The math is not close.** $0 marginal cost is not a hand-wave; it's the
difference between "a CHW can use this every visit" and "a CHW uses
this only when their supervisor is paying attention."

### 4. Hausa audio

Gemma 4 has a native audio_conformer encoder + native function calling.
Combined with a 128K context, this lets one model do everything in a
single forward pass.

The cloud alternative is a 3-stage pipeline:
1. Whisper → text (latency 300–800 ms typical; Hausa is a moderately
   well-supported language, not perfect)
2. Vision encoder (vision API call) → image embeddings
3. LLM with tool calling → JSON function call

Each stage adds latency (sequential), failure modes (each can drop or
re-rank), and cost (per-API-call billing). The single-pass alternative
is not "nicer" — it's a fundamentally simpler product surface.

## When cloud DOES win

For honesty: there are situations where cloud is the right answer.

- High-end imaging analysis (CT/MRI). On-device models can't yet match
  cloud frontier models on 3D medical imaging at clinical accuracy.
- Slow-fuse research aggregation across thousands of visits. Cloud SQL +
  notebook analysis is the right path.
- Long-running multi-day patient monitoring (cohorts). Cloud is the
  natural store.

CHW Companion is not those. CHW Companion is the visit-time decision
support that has to work right now, on this phone, in this field.

## Sources

- WHO Maternal Mortality fact sheet, 2023:
  <https://www.who.int/news-room/fact-sheets/detail/maternal-mortality>
- WHO MCPC 2017 (clinical thresholds):
  <https://www.who.int/publications/i/item/9789241565493>
- Nigeria NDPR 2023:
  <https://ndpc.gov.ng/Files/Nigeria_Data_Protection_Act_2023.pdf>
- GSMA Mobile Connectivity Index 2024 (rural sub-Saharan Africa data):
  <https://www.mobileconnectivityindex.com>
- Cost figures: typical 2025–2026 provider pricing pages, accessed
  during the build week of 2026-05-14.
