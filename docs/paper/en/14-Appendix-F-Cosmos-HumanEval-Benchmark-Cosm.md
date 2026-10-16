# Appendix F Cosmos-HumanEval Benchmark (Cosmos-HUE)

**Cosmos-HumanEval** (Cosmos-HUE or HUE) is an evaluation benchmark for video generation introduced in the main results section. HUE provides a human-reference signal via atomic binary questions generated per video by a Vision-Language Model (VLM) pipeline and scored along the four HUE dimensions (Semantic Alignment, Physical Laws, Geometric Reasoning, Visual Integrity). This appendix complements that overview with the formal binary scoring scheme, the annotation protocol and reliability estimates, and the per-dimension and per-domain Text-to-Video (T2V) and Image-to-Video (I2V) leaderboards.

#### Binary response schema and scoring.

Each Layer 3 question elicits **Yes** (criterion met), **No** (clear violation), or **Unclear** (e.g., the region is occluded or the motion is too fast to assess, or the video fails to depict the event the question presupposes, e.g., the prompt calls for a right turn but the lead vehicle never turns, so the follow-up question about a smooth curved arc has no clear Yes or No). *Unclear is treated as No* : a model is not rewarded for failing to produce the prompted action, and a non-confident annotator is conservatively counted against the model. Concretely, Unclear does not contribute to the Yes numerator but remains in the denominator, so a video that is mostly Unclear cannot score above one with the same number of explicit Yes answers. Let $\mathcal{Q}_{v}$ denote the set of questions issued for video $v$; the per-video HUE score is

$$\mathrm{HUE}(v)\;=\;\frac{\sum_{q\in\mathcal{Q}_{v}}\mathbf{1}\!\left[\mathrm{ans}(v,q)=\textsc{Yes}\right]}{\lvert\mathcal{Q}_{v}\rvert}\times 100\%,$$

with $\mathrm{HUE}(v)\in[0,100]\%$ since “Yes” is always the desirable outcome. Model-level scores aggregate over $V$ test videos:

$$\mathrm{HUE}(m)\;=\;\frac{\sum_{v=1}^{V}\sum_{q\in\mathcal{Q}_{v}}\mathbf{1}\!\left[\mathrm{ans}(v,q)=\textsc{Yes}\right]}{\sum_{v=1}^{V}\lvert\mathcal{Q}_{v}\rvert}\times 100\%.$$

The grand mean weights every answered (video, question) observation equally, avoiding inflation from videos that happen to receive fewer applicable questions. Dimension-level scores are computed identically by restricting the sums to questions belonging to each dimension.

#### Annotation protocol.

Each video receives up to 16 atomic binary questions from the three-layer pipeline above, and each (video, question) pair is independently rated by *two* human annotators. If the two annotators agree, the consensus answer is recorded as the canonical response; if they disagree, the question is escalated to a third *quality-control (QC) reviewer* , whose answer is final. This double-rating + QC-tiebreaker workflow yields a single canonical answer per (video, question) pair, bounds the contribution of any single annotator, and produces the auditable response stream that the scoring formulas in Equations 12–13 operate on.

#### Question design and iteration.

Authoring and refining atomic questions targets two goals: **low variance** (re-running the same model on the same prompts produces a similar score), and **GT saturation** (real videos paired with the prompts score at or near $100\%$). We use these criteria to evaluate candidate questions and to iterate the question bank, revising or dropping items that fail any criterion. The process is ongoing: the GT score remains below $100\%$ (Tabs. 32 and 33), so question-bank refinement continues.

#### Reliability and confidence intervals.

The current T2V evaluation pool samples 100 prompts from PAIBench-G, with 5 random-seed generations per prompt and up to 20 questions per video, yielding up to 10,000 binary observations per model checkpoint. Treating each as an independent Bernoulli trial with underlying Yes-rate $p=\mathrm{HUE}(m)/100$, the 95% confidence interval on the model-level HUE score (in percentage points) is $\mathrm{HUE}(m)\pm 100\cdot 1.96\sqrt{p(1-p)/N}$ with $N$ the observation count; in practice this gives CI*95* widths around $\pm 0.6$ points for top-tier scores on the scale of Tab. 32. Atomic binary judgments reduce within-annotator variance compared to Likert-scale grading, where the annotator must integrate multiple observations, weigh them, and map onto an arbitrary scale. Each of these three operations introduces noise. The *Real video GT* row scores 93.6 on T2V prompts and 94.4 on I2V prompts, reflecting (i) minor residual prompt–video mismatches in the sampled PAIBench-G pairs despite manual review, and (ii) imperfections in the auto-generated question set, where overly strict, ambiguous, or off-target questions can yield No or Unclear on a real video. We treat the gap from GT to $100\%$ as a north-star for ongoing question-bank refinement.

#### T2V leaderboard.

Tab. 32 reports current T2V results across our model panel and the strongest external T2V baselines. Veo-3.1 leads overall (91.3) and Seedance-1.5-Pro is second (90.0); Cosmos3-Super is the best open-source generator at 89.3, ahead of Wan2.2-A14B (88.2) and Cosmos3-Nano (87.6). The per-dimension picture is more favorable to Cosmos3-Super: it is the best open-source model on 9 of 12 axes, and beats every generator, including closed-source, on AV (87.7) and Physics (91.5). The gap from the strongest generator to real video (*Real video GT* , 93.6) is $\sim$2.3 points overall, leaving meaningful headroom for the next round.

#### I2V leaderboard.

Tab. 33 reports the parallel I2V evaluation. Veo-3.1 leads overall (89.7), with Cosmos3-Super trailing by only $0.1$ points (89.6); Cosmos3-Nano (88.6) edges Wan2.2-A14B (88.4) and Seedance-1.5-Pro (87.6). Cosmos3-Super beats every generator outright on Visual Integrity (94.2), Robotics (91.1), and Miscellaneous (94.8), and ties Veo-3.1 for the lead on Semantic Alignment (both 90.3); Cosmos3-Nano wins AV (87.6) outright; Wan2.2-A14B wins Physics (91.9). The full I2V slate spans $\sim$9 points across generators.

> Table 32: **Cosmos HUE T2V leaderboard. Per-dimension and per-domain breakdowns (%; higher is better). Left block: Overall HUE plus the four dimensions (Semantic Alignment, Physical Laws, Geometric Reasoning, Visual Integrity). Right block (after the rule): Overall HUE restricted to each PAIBench-G prompt domain (C.S., AV, Rob., Ind., Hum., Phy., Misc. abbreviate Common Sense, Autonomous Vehicle, Robotics, Industry, Human, Physics, Miscellaneous). Cosmos 3 generators (ours) are shaded green; *Real video GT* is the upper reference. Bold marks the best in the column, underline the second best. Cosmos3-Super leads open-source on 9 of 12 axes and beats every generator, including closed-source, on AV (87.7) and Physics (91.5).**

| **Model** | **Type** | **Overall** | **Sem.** **Align.** | **Phys.** **Laws** | **Geo.** **Reas.** | **Vis.** **Integ.** | **C.S.** | **AV** | **Rob.** | **Ind.** | **Hum.** | **Phy.** | **Misc.** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| *Real video GT (PAI-Bench)* | — | 93.6 | 95.0 | 90.5 | 94.1 | 94.8 | 92.0 | 93.7 | 94.9 | 94.4 | 93.2 | 93.1 | 93.6 |
| **Cosmos3-Super** | Open-sourced | 89.3 | 92.4 | 85.4 | 86.6 | 93.7 | 89.5 | **87.7** | 88.4 | 89.4 | 88.6 | **91.5** | 93.0 |
| **Cosmos3-Nano** | Open-sourced | 87.6 | 91.5 | 83.6 | 84.1 | 92.5 | 89.5 | 87.0 | 86.6 | 85.8 | 86.2 | 87.9 | 94.0 |
| Wan2.2-A14B | Open-sourced | 88.2 | 92.1 | 83.4 | 85.6 | 92.6 | 87.8 | 84.9 | 83.7 | 91.1 | 89.9 | 87.5 | 93.4 |
| HunyuanVideo-1.5 | Open-sourced | 86.5 | 88.4 | 81.8 | 83.6 | 93.6 | 88.3 | 81.0 | 81.3 | 88.0 | 87.9 | 87.4 | 93.3 |
| Wan2.1-14B | Open-sourced | 84.0 | 87.7 | 77.1 | 78.5 | 92.7 | 85.3 | 79.1 | 78.2 | 87.0 | 85.1 | 85.8 | 90.7 |
| Wan2.2-5B | Open-sourced | 80.8 | 86.9 | 73.8 | 73.6 | 89.9 | 83.4 | 73.5 | 76.0 | 84.4 | 81.3 | 82.8 | 87.9 |
| Cosmos-Predict2.5-14B | Open-sourced | 82.1 | 88.1 | 74.6 | 75.8 | 90.7 | 81.3 | 84.4 | 76.8 | 82.4 | 81.3 | 84.5 | 90.2 |
| Cosmos-Predict2.5-2B | Open-sourced | 81.8 | 88.1 | 74.0 | 75.1 | 90.6 | 81.5 | 81.8 | 79.5 | 82.7 | 80.3 | 82.7 | 89.8 |
| Veo-3.1 | Closed-sourced | **91.3** | **94.3** | 87.7 | **91.0** | **93.9** | **92.7** | 85.6 | **91.5** | **94.7** | 90.3 | 90.4 | **95.8** |
| Seedance-1.5-Pro | Closed-sourced | 90.0 | 91.2 | **88.4** | 89.8 | 92.8 | 90.5 | 83.6 | 89.0 | 92.9 | **90.7** | 91.4 | 91.7 |

> Table 33: **Cosmos HUE I2V leaderboard. Per-dimension and per-domain breakdowns (%; same protocol as Tab. 32, with image conditioning). Layout, domain abbreviations, color shading, and bold/underline conventions match Tab. 32.**

| **Model** | **Type** | **Overall** | **Sem.** **Align.** | **Phys.** **Laws** | **Geo.** **Reas.** | **Vis.** **Integ.** | **C.S.** | **AV** | **Rob.** | **Ind.** | **Hum.** | **Phy.** | **Misc.** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| *Real video GT (PAI-Bench)* | — | 94.4 | 94.8 | 93.2 | 95.1 | 95.4 | 94.2 | 96.0 | 94.9 | 93.4 | 92.1 | 96.3 | 98.1 |
| **Cosmos3-Super** | Open-sourced | 89.6 | **90.3** | 87.5 | 87.0 | **94.2** | 90.7 | 86.2 | **91.1** | 89.6 | 87.1 | 91.5 | **94.8** |
| **Cosmos3-Nano** | Open-sourced | 88.6 | 89.2 | 86.4 | 86.3 | 93.5 | 90.6 | **87.6** | 90.6 | 88.0 | 84.7 | 91.0 | 93.9 |
| Wan2.2-A14B | Open-sourced | 88.4 | 88.6 | 86.0 | 85.7 | 93.5 | 90.1 | 84.7 | 84.8 | 92.0 | 86.5 | **91.9** | 92.5 |
| HunyuanVideo-1.5 | Open-sourced | 85.6 | 87.1 | 80.8 | 83.0 | 92.5 | 90.0 | 81.7 | 77.2 | 89.6 | 85.2 | 89.5 | 91.8 |
| Wan2.1-14B | Open-sourced | 83.9 | 85.0 | 80.2 | 80.6 | 91.2 | 88.1 | 76.8 | 74.8 | 89.9 | 84.3 | 85.8 | 93.2 |
| Wan2.2-5B | Open-sourced | 80.4 | 83.4 | 74.6 | 75.7 | 89.5 | 86.1 | 74.3 | 68.6 | 88.4 | 79.6 | 84.8 | 90.5 |
| Cosmos-Predict2.5-14B | Open-sourced | 83.0 | 85.0 | 77.9 | 77.5 | 92.4 | 88.1 | 85.2 | 78.4 | 83.0 | 78.5 | 84.8 | 93.2 |
| Cosmos-Predict2.5-2B | Open-sourced | 82.6 | 86.1 | 77.3 | 78.2 | 90.2 | 85.6 | 86.0 | 79.0 | 85.6 | 77.1 | 85.1 | 92.4 |
| Veo-3.1 | Closed-sourced | **89.7** | **90.3** | **87.7** | **89.2** | 93.2 | **92.3** | 86.0 | 88.6 | **93.4** | **87.2** | 91.2 | 94.3 |
| Seedance-1.5-Pro | Closed-sourced | 87.6 | 87.7 | 85.4 | 86.5 | 91.8 | 89.5 | 82.9 | 85.7 | 90.6 | 85.7 | 90.6 | 93.0 |
