# 6 Results

We evaluate Cosmos 3 across a broad spectrum of understanding and generation tasks that are central to Physical AI. Unlike prior systems that focus on a single modality or capability, Cosmos 3 is designed as a unified omnimodal world model that jointly supports reasoning, perception, simulation, and action generation. Our evaluation therefore spans both the Reasoner and Generator components, covering multimodal understanding, spatial and temporal reasoning, image and video generation, audio-visual generation, transfer generation, forward and inverse dynamics, and robot policy learning. Across these diverse benchmarks, Cosmos 3 consistently demonstrates strong results relative to both specialized open-source models and leading proprietary systems, highlighting the benefits of a unified world-model architecture for Physical AI. The following sections present detailed results for the Reasoner and Generator, together with analyses of their capabilities across robotics, autonomous driving, smart infrastructure, and general multimodal domains.

## 6.1 Reasoner Evaluation

> Table 10: **Reasoner benchmark results** for Cosmos 3 variants and comparison models across general multimodal understanding, robotics, smart-infrastructure, and autonomous-driving benchmarks. Rows report individual benchmarks or group averages, and columns report model scores. Within each separated model block, best and second-best scores per row are shown in **bold** and underlined. † denotes a closed model.

Cosmos 3 Reasoner is evaluated on a total of **48** benchmarks. The results are aggregated into four categories: general, robotics, smart infrastructure, and driving. Table 10 reports results for the Edge, Nano, and Super models and their comparisons to existing open-source and closed-source models. The numbers are evaluated using VLMEvalKit Duan et al. (2024), which is integrated into our benchmark infrastructure.

#### General.

We select 19 benchmarks, listed below, to assess the model’s general capabilities.

- • *Broad visual question answering and multimodal understanding* is measured by MMBench_DEV (Liu et al., 2024d), RealWorldQA (xAI, 2024), and AI2D (Kembhavi et al., 2016), which test whether the model can interpret natural images, diagrams, and real-world scenes while answering diverse semantic and compositional questions.

- • *Spatial, grounding, and quantitative reasoning.* is evaluated by CVBench (Tong et al., 2024), BlinkSpatial, BlinkDepth (Fu et al., 2024), RefCOCO (Yu et al., 2016), and CountBenchQA (Paiss et al., 2023), covering 2D/3D spatial relations, depth perception, referring-expression localization, and object counting.

- • *Text-rich visual understanding* is covered by DocVQA (Mathew et al., 2021), InfoVQA (Mathew et al., 2022), and OCRBench-v2 (Fu et al., 2026), which require reading and reasoning over documents, infographics, scene text, and structured visual layouts.

- • *Video, physical, and causal reasoning* is assessed by MVBench (Li et al., 2024c), VideoPhy2 (Bansal et al., 2025b), MVPBench (Krojer et al., 2025), and CausalVQA (Foss et al., 2025), testing temporal event understanding, physical plausibility, and cause–effect reasoning across frames.

- • *Advanced reasoning, robustness, and instruction following* is measured by LogicVista (Xiao et al., 2024b), MMMU_Pro (Yue et al., 2025), HallusionBench (Guan et al., 2024), and IFBench (Pyatkin et al., 2025b), which probe visual logic, expert-level multimodal problem solving, hallucination resistance, and adherence to user instructions.

Together, these benchmarks provide a broad view of model’s general reasoning ability across perception, localization, text recognition, temporal understanding, and reliable instruction-conditioned response generation.

#### Robotics.

We group 17 robotics and embodied reasoning benchmarks into several capability families.

- • *Embodied commonsense and task reasoning* is measured by Embodied Reasoning, CommonSense in Cosmos Reason (NVIDIA, 2025d), ERQA (Gemini Robotics Team et al., 2025), and Where2Place (Yuan et al., 2024), which test whether the model can reason about object affordances, feasible actions, placement decisions, and physical commonsense in embodied environments.

- • *Spatial grounding and scene geometry* is evaluated by RefSpatial (Zhou et al., 2025b), VSI-Bench (Yang et al., 2025b), SparBench (Zhang et al., 2025b), and RoboSpatialHome(Song et al., 2025), covering referring-expression grounding, metric and relational spatial understanding, indoor layout reasoning, free-space awareness, and robot-relevant localization.

- • *Robotics-oriented perception and action understanding* is captured by RynnBrain (Dang et al., 2026) and ERQA (Gemini Robotics Team et al., 2025), which probe manipulation-relevant perception, action feasibility, trajectory reasoning, and object-centric decision making over real robot episodes. And MMSIVideoBench (Lin et al., 2025c) requires reasoning across multiple views or frames to infer object correspondences, spatial relations, temporal changes, and scene-level structure. We curate HealthSurgiBench, an in-house benchmark for operating-room understanding with 23 question types. It combines rule-based scoring for structured outputs such as counts, tools, roles, boxes, coordinates, time/distance estimates, ordered lists, scene graphs, and monitor text, with a local Qwen3-4B judge for six free-form answer types. The final score uses the applicable evaluator for each sample and then reports the unweighted mean across all samples.

Together, these benchmarks evaluate whether the model can move beyond static visual recognition toward embodied reasoning: understanding where objects are, how they relate, what actions are possible, and how spatial evidence evolves across views and time.

#### Smart infrastructure.

We evaluate on **VANTAGE-Bench** (NVIDIA, 2026g) and **Traffic Anomaly Reasoning (TAR)** (NVIDIA, 2026e), covering warehouse logistics, transportation, and smart-infrastructure fixed-camera settings. VANTAGE-Bench measures semantic, spatial, temporal, and spatiotemporal understanding through event verification, VQA, referring, pointing, localization, temporal localization, dense captioning, and VLM-native single-object tracking, with $3{,}346$ assets and $35{,}027$ expert annotations, including synthetic anomaly footage. TAR, the AI City Challenge 2026 Track 3 suite, evaluates anomaly verification, temporal localization, scene description, causality, summarization, and out-of-domain generalization with heterogeneous QA, temporal IoU, and text-generation metrics.

#### Driving.

We evaluate the driving capabilities with **LingoQA** (Marcu et al., 2024) and two in-house benchmarks for safety-critical driving event classification. **AVSpecialCollisionBench** measures whether the model correctly classifies each video into one of three event categories: collision, near collision, or no collision. The benchmark contains 100 videos per category and the per-category accuracy is computed. Finally, the mean accuracy across the three categories is reported as the final score. **AVSpecialStopBehaviorBench** evaluates stop-sign behavior classification across five categories: full stop, rolling stop, no stop, not relevant, and false sign. This benchmark contains 10 videos per category, and its final score is the mean of the five per-category accuracies.

Cosmos 3 is competitive with open-source models on general benchmarks, while still trailing Gemini 3.1 Pro (Google DeepMind, 2025a). Compared with Cosmos-Reason2, Cosmos 3 shows stronger general capabilities, benefiting from the additional 20% pre-training data that increases data diversity. In the robotics, smart infrastructure, and driving domains, Cosmos 3 outperforms both open-source and closed-source models including RynnBrain (Dang et al., 2026), Mimo-Embodied (Hao et al., 2026), and Gemma-4 (Google DeepMind, 2026b), with the exception of a small gap to Gemini 3.1 Pro in robotics. Overall, Cosmos 3 demonstrates strong domain-specific reasoning across robotics, smart infrastructure, and autonomous driving, supporting a broad range of Physical AI applications.

## 6.2 Generator Evaluation

The Generator component of Cosmos 3 is evaluated across a diverse set of tasks that collectively measure its ability to simulate and generate multimodal worlds for Physical AI. Unlike conventional generative models that focus on a single modality, Cosmos 3 jointly models images, videos, audio, and actions within a unified framework, enabling evaluation across image generation, video generation, audio-visual generation, transfer generation, forward and inverse dynamics, and robot policy learning. We further evaluate specialized post-trained variants, including Cosmos3-Super-Text2Image, Cosmos3-Super-Image2Video, and Cosmos3-Nano-Policy-DROID, to assess the effectiveness of downstream adaptation from a shared omnimodal foundation model. Our benchmark suite combines automated metrics, human evaluation, domain-specific Physical AI benchmarks, and real-world robotics evaluations, covering critical capabilities such as prompt following, physical plausibility, temporal consistency, audio-video synchronization, controllability, action prediction, and task completion.

### 6.2.1 Image Generation Evaluation

We evaluate Cosmos 3 image generation as single-frame visual generation, focusing on four complementary axes: broad semantic prompt following, exact scene-text rendering, human-preference alignment, and visual aesthetics. UniGenBench is the primary prompt-following metric because it exposes failures at the testpoint level. We enhance UniGenBench by adding a Physical-AI subset. CVTG isolates a frequent failure mode of image generators—misspelled, omitted, blurred, or duplicated scene text—through OCR-based GNED and PNED scores. HPSv3 and LAION aesthetic complement those targeted checks by measuring overall human preference and visual appeal, giving a more actionable view of T2I quality than any single aggregate score. For all benchmarks, we use Claude-Opus-4.7 as a prompt rewriter to convert evaluation text prompts into a structured format described in Sec. 6.3.1 and Sec. 6.3.2, ensuring they match the training prompt style preferred by the generator. The instructions template can be found in Appendix B.2. We generate and compare all models at 1024x1024 resolution. For open-source models, we follow the recommended hyper-parameters and negative prompts provided in their documentation. Qualitative examples can also be found in Fig. 17.

![Figure 17](figures/sft_t2i_demo.jpg)

> Figure 17: **Example images generated by Cosmos3-Super-Text2Image. Our model generates images that are both physically plausible and photorealistic, exhibiting coherent object geometry, consistent object environment interactions, \etc. All images are generated from single-shot upsampled JSON prompts using shift=3.0, guidance=4.0, and 50 diffusion steps, as also described in Table 21. These results highlight the model’s potential as an effective real-world image simulator for robotics, autonomous driving, and other scenarios where adherence to physical laws is essential.**

#### UniGenBench.

UniGenBench (Wang et al., 2025h) is a unified semantic evaluation benchmark for text-to-image generation. It comprises 600 prompts spanning 5 main themes and 20 subthemes, each assessed across 10 primary and 27 sub-evaluation criteria using an MLLM-as-Judge framework. To better assess the capabilities of Cosmos 3 in Physical AI scenarios, we augment the benchmark with 570 additional prompts (UniGenBench-Phys) targeting photorealistic physical-world scenes. These prompts cover six physical-world sub-domains: (a) robotics and industrial, (b) physical signage and text, (c) autonomous driving, (d) construction sites, (e) fluid dynamics, and (f) medical/clinical. Gemini 3.1 Pro evaluates each generated image against each testpoint with binary pass/fail decisions; the primary score is mean testpoint accuracy, reported for the full 1,170-prompt (\ie"All") with additional breakdowns over original and physics subsets (\ie"Orig" and "Phys").

#### CVTG.

CVTG (Du et al., 2025) (Complex Visual Text Generation) evaluates a model’s ability to accurately render text in visually complex scenes. This capability is particularly important for real-world environments, where signage, labels, and instructional text must be legible and correctly spelled. Generated images are first processed by an OCR system to extract visible text regions, and the predicted strings are then matched to the target strings using Hungarian matching based on normalized edit distance (\ieNED).

We evaluate on two prompt sets: (a) *CVTG-500L* , an English-focused subset of 500 prompts randomly sampled from CVTG-2K while preserving comparable coverage of the number of text regions. We further upsample each short prompt into a long, dense description to better reflect the requirements of modern world-model generation. (b) *CVTG-102ch* , a Chinese-focused set of 102 prompts designed to evaluate accurate Chinese character rendering. These prompts are drawn from both common and physically grounded domains, including public spaces, outdoor and scenic environments, digital displays, and other real-world settings.

**HPSv3.** HPSv3 (Ma et al., 2025) evaluates prompt-aware text-to-image quality with a learned human-preference reward model. It is built on HPDv3, a preference dataset spanning both synthetic and real images across a wide range of quality levels. HPSv3 adopts a VLM-based architecture trained with an uncertainty-aware ranking loss, producing a prompt-aware score that reflects human judgments of semantic alignment, realism, and aesthetic quality. We directly apply HPSv3 on Cosmos 3 results to obtain this complementary human-preference metric.

**Aesthetic V2.** Aesthetic V2 (Schuhmann and LAION, 2022) measures prompt-independent visual appeal using the LAION aesthetic predictor. The predictor estimates how much people would like an image on a 1–10 scale, using a lightweight model trained on top of CLIP image embeddings. Unlike HPSv3, this score does not condition on the input prompt and therefore does not directly measure instruction following or semantic alignment. We use it as a standalone image-quality signal to capture general visual attractiveness and composition quality.

> Table 11: **Text-to-Image benchmark results. UniGenBench scores are fractions of evaluation criteria satisfied; “All (1170)” aggregates the original 600 prompts (Orig) and 570 Physical AI prompts (Phys). PNED and GNED are character-level accuracy metrics (higher is better); CVTG-102ch tests Chinese character rendering, CVTG-500L tests English long-prompt rendering. Aesthetic v2 and HPSv3 are higher-is-better image-level metrics.†**

| — | — | — | — | — | — | — | — | — | — | — |
|---|---|---|---|---|---|---|---|---|---|---|
|  |  | **UniGenBench** | **CVTG-500L** | **CVTG-102ch** | **Image-Level Metrics** |  |  |  |  |  |
| **Model** | **Type** | **All** ($\uparrow$) | **Orig** ($\uparrow$) | **Phys** ($\uparrow$) | **GNED** ($\uparrow$) | **PNED** ($\uparrow$) | **GNED** ($\uparrow$) | **PNED** ($\uparrow$) | **Aesv2** ($\uparrow$) | **HPSv3** ($\uparrow$) |
| **Cosmos3-Super-Text2Image** | Open-source | **91.36** | **93.34** | **89.54** | **80.88** | 89.08 | 32.02 | 41.22 | 5.91 | 11.60 |
| **Cosmos3-Super** | Open-source | 87.33 | 85.21 | 89.64 | 66.77 | 70.97 | 8.48 | 16.31 | 5.76 | 9.49 |
| **Cosmos3-Nano** | Open-source | 84.61 | 87.32 | 82.12 | 24.23 | 26.53 | 4.63 | 9.70 | 5.76 | 8.99 |
| Gemini 3 Pro Image | Closed-source | 90.69 | 92.81 | 89.74 | 59.24† | 71.79† | 46.00 | **76.40** | 5.70 | 11.78 |
| FLUX.2-dev | Open-source | 87.60 | 89.77 | 85.61 | 74.71 | 84.98 | 44.33 | 68.74 | 5.75 | 11.38 |
| Qwen-Image-2512 | Open-source | 84.25 | 87.32 | 81.44 | 79.68 | **90.86** | 46.33 | 71.26 | **5.92** | 11.03 |
| Hunyuan 3.0 | Open-source | 84.02 | 87.68 | 80.67 | 71.40 | 87.68 | 49.05 | 71.31 | 5.90 | **11.93** |
| Z-Image-Turbo | Open-source | 78.14 | 81.53 | 75.03 | 75.20 | 86.95 | **49.18** | 73.32 | 5.70 | 11.36 |

![Figure 18](figures/2026-05-28-Cosmos3-Super-Text2Image-Leaderboard.jpg)

> Figure 18: **Cosmos3-Super-Text2Image is the #1 open-weight model on crowdsourced arena rankings. Cosmos3-Super-Text2Image ranked #1 among open-weight models (#4 including proprietary models) on the Artificial Analysis Text to Image Leaderboard (Date: 2026-05-28).**

#### Artificial Analysis Text-to-Image Leaderboard.

To evaluate Cosmos 3 under real-world scenarios, we submitted our specialized T2I model, Cosmos3-Super-Text2Image, alongside an agentic harness, to the Artificial Analysis Text-to-Image leaderboard for crowdsourced public voting. The model ranked #1 among all open-weight models and #4 among all models (open $+$ closed). For more details on the submission, please see Appendix B.7.

### 6.2.2 Video Generation Evaluation

We evaluate the video generation capabilities of Cosmos 3 through complementary automated and human benchmarks. Automated benchmarks offer scalable, reproducible comparisons and capture a broad range of quality and domain-specific signals, but their discriminative power diminishes as models improve (especially in domain-specific Physical-AI regimes, where such metrics are usually myopic to temporal and physics-based failures). Human evaluation addresses these gaps by catching long-tail physics, embodiment, and semantic failures that automated protocols systematically miss, while spreading scores across a meaningfully wider range so that small but real differences between state-of-the-art models remain detectable. We report results on three automated benchmarks—PAIBench-G, RBench, and Physics-IQ—followed by Cosmos HUE, a dedicated human evaluation protocol for Physical AI video generation, and Human World Bench (HWB), targeted human evaluation for realistic human motion from task-level instructions. For all benchmarks (automated or human-evaluation), we use Claude-Opus-4.6 as a prompt rewriter to convert text prompts into a structured format described in Sec. 6.3.1 and Sec. 6.3.2, ensuring they match the training prompt distribution.

#### PAIBench-G.

PAIBench-G is the video generation track of the Physical AI Benchmark (Zhou et al., 2025c), comprising 1,044 image–text prompt pairs across six Physical AI domains: Human (299), Autonomous Vehicle (239), Common Sense (174), Robotics (107), Physics (107), and Industry (107). We adopt it for its broad domain coverage and balanced scoring: each model receives a Quality Score (aggregating metrics for frame consistency, motion smoothness, aesthetic quality, and video–text alignment) and a Domain Score (VLM-as-Judge binary verification of physical and semantic accuracy across domains). The overall score weights both equally: $\text{Overall}=0.5\times\text{Quality}+0.5\times\text{Domain}$. With a Pearson correlation of r=0.918 against human ELO rankings, PAIBench-G is well-suited for reliably measuring progress in early training phases, before models converge to the frontier where automated scores begin to saturate. For every prompt, we generate videos across 5 seeds and evaluate at 720p resolution, 16:9 aspect ratio for 189 frames. While PaiBench-G natively supports only Image-to-Video evaluation, we extend it to compute Text-to-Video scores as well. Tab. 12 reports both text-to-video and image-to-video PAIBench-G results using Qwen2.5-VL-72B-Instruct as the VLM judge; Cosmos3-Super achieves state-of-the-art overall score on both tracks, emerging as the best open-source model, outperforming strong closed-source models such as Veo-3.1.

> Table 12: **PAIBench-G and RBench results, across Text-to-Video and Image-to-Video settings. PAIBench-G evaluates visual quality and domain-specific accuracy across six Physical AI domains while RBench evaluates task correctness and physical plausibility in embodied robotics scenarios. Cosmos3-Super achieves the highest overall scores on both PAIBench-G T2V and I2V among open-source models, while Cosmos3-Nano leads on RBench. Bold indicates the winner in the column and underline indicates the second best.**

| — | — | — | — | — | — | — | — | — |
|---|---|---|---|---|---|---|---|---|
|  |  | **PAIBench-G Text2Video ($\uparrow$)** | **PAIBench-G Image2Video ($\uparrow$)** | **RBench Image2Video ($\uparrow$)** |  |  |  |  |
| **Model** | **Type** | **Overall** | **Domain** | **Quality** | **Overall** | **Domain** | **Quality** | **Score** |
| **Cosmos3-Super** | Open-source | **80.0** | **86.8** | 73.1 | **82.8** | 87.3 | **78.2** | 58.1% |
| **Cosmos3-Nano** | Open-source | 79.4 | 85.8 | 73.0 | 82.7 | 87.2 | 78.1 | 58.4% |
| Wan2.2-A14B | Open-source | 78.0 | 83.2 | 72.8 | 81.3 | 85.3 | 77.3 | 50.7% |
| HunyuanVideo-1.5 | Open-source | 76.5 | 80.9 | 72.0 | 81.7 | 85.9 | 77.6 | 46.0% |
| Cosmos-Predict2.5-2B | Open-source | 76.5 | 79.9 | **73.2** | 81.2 | 84.6 | 77.9 | 46.4% |
| Cosmos-Predict2.5-14B | Open-source | 76.4 | 79.5 | **73.2** | 81.1 | 84.0 | 78.1 | — |
| Wan2.1-14B | Open-source | 76.4 | 80.1 | 72.7 | 80.2 | 83.6 | 76.8 | — |
| Wan2.2-5B | Open-source | 76.3 | 79.6 | 73.0 | 81.0 | 84.6 | 77.4 | — |
| Veo-3.1 | Closed-source | 79.1 | 85.2 | 72.9 | 82.6 | **87.6** | 77.6 | 56.3% |
| Seedance-1.5-Pro | Closed-source | 76.9 | 82.1 | 71.6 | 80.8 | 84.7 | 76.9 | 58.4% |
| Wan 2.6 | Closed-source | 78.6 | 85.2 | 72.0 | 81.9 | 85.9 | 77.8 | **60.7%** |

#### RBench.

RBench (Deng et al., 2026) evaluates video generation in embodied task scenarios, emphasizing task correctness and physical plausibility in robot–object interactions over purely perceptual realism. While PAIBench-G covers Physical AI domains broadly, RBench delves deeper into robotics as a critical Physical AI use case, stress-testing models on generating physically coherent manipulation sequences across diverse robot morphologies. The benchmark comprises 650 image–text evaluation cases from two complementary splits: 250 task-oriented pairs spanning five categories (Common Manipulation, Long-horizon Planning, Multi-entity Collaboration, Spatial Relationship, and Visual Reasoning) and 400 embodiment-specific pairs covering four robot morphologies (Dual-arm, Humanoid, Single-arm, and Quadruped). Prompts are sourced from RoVid-X (Deng et al., 2026), a curated corpus of 4M robotics clips spanning over 1,300 skills. Each video is scored on Task Completion (TC, averaging physical-semantic plausibility and task-adherence consistency) and Visual Quality (VQ, a penalized combination of robot–subject stability and motion smoothness), and the final score is the mean of both across all 650 cases. With a Spearman correlation of $\rho=0.96$ with human judgments across 25 evaluated models, RBench provides a reliable signal for embodied generation quality. For every prompt, we generate videos with a single seed and evaluate at 720p resolution, 16:9 aspect ratio for 121 frames. Tab. 12 reports Cosmos 3 image-to-video results on RBench – Cosmos 3 emerges as the best open-source model.

As shown in Tab. 12, Cosmos3-Super achieves the highest overall PAIBench-G scores on both T2V and I2V across all models, including closed-source, while Cosmos3-Nano matches the second best result on RBench. Both Cosmos 3 variants also significantly outperform their Cosmos-Predict2.5 predecessors, reflecting the gains from the omnimodal architecture. While both benchmarks incorporate physical plausibility into their scoring, they do not probe it in depth. We therefore turn to Physics-IQ for a targeted evaluation of physics adherence.

#### Physics-IQ.

Physics-IQ (Motamed et al., 2026) evaluates whether video generation models capture physical principles by conditioning on a real-world starting context and scoring how closely the generated continuation matches an actual physical outcome. Unlike PAIBench-G and RBench, which incorporate physical plausibility as one scoring component among many, Physics-IQ isolates it as the sole evaluation axis, measuring whether generated motion matches ground-truth physical outcomes along precise spatial and temporal dimensions. Physics-IQ covers five physics categories—solid mechanics, fluid dynamics, optics, thermodynamics, and magnetism—across 396 real-world scenes captured from three fixed viewpoints, with paired textual descriptions for text-conditioned models. Two evaluation modes are supported. In *image-to-video* (I2V), the model is conditioned on a single *switch frame* plus an optional text prompt and predicts the subsequent motion. In *video-to-video* (V2V) continuation, the model is conditioned on a 3 s conditioning video plus an optional text prompt and predicts the next 5 s of motion. Generated videos are compared against ground-truth physical continuations along four complementary axes (spatial overlap, temporal alignment, magnitude-weighted spatial agreement, and pixel-level error), normalized by a real-vs-real upper bound into a single 0–100 score directly comparable across models and conditioning modes.

> Table 13: **Physics-IQ benchmark results, separated by conditioning modes. WMReward (BoN) denotes best-of-$N$ reranking with a WMReward (Yuan et al., 2026). Higher Physics-IQ score is better. Cosmos3-Super achieved state-of-the-art results for both I2V and V2V, with and without using the WMReward+BoN. Bold indicates best in the column group and underline indicates the second best.**

| — | — | — |
|---|---|---|
| **Model** | **Mode** | **Score ($\uparrow$)** |
| **Cosmos3-Super** | I2V + WMReward (BoN) | **48.9** |
| **Cosmos3-Nano** | I2V + WMReward (BoN) | 43.8 |
| Sora2 (Closed-sourced) | I2V + WMReward (BoN) | 46.4 |
| Wan2.2-A14B (Open-sourced) | I2V + WMReward (BoN) | 44.4 |
| **Cosmos3-Super** | I2V | **43.8** |
| **Cosmos3-Nano** | I2V | 40.2 |
| Sora2 (Closed-sourced) | I2V | 42.3 |
| Wan2.2-A14B (Open-sourced) | I2V | 38.3 |

We evaluate Cosmos3-Super in both I2V and V2V modes in Tab. 13 alongside leading open-source and commercial baselines in both modes. For V2V, we use the full 3 s conditioning video as input. We also use a prompt upsampler, following a similar iterative-refinement strategy to PhyT2V (Xue et al., 2025), to generate text prompts from the switching frame in the I2V setting and from the 3 s conditioning video in the V2V setting. Following the public Physics-IQ leaderboard and the WMReward inference-time alignment protocol (Yuan et al., 2026), we additionally run WMReward + best-of-$N$ (BoN) scores for Cosmos3-Super in both I2V and V2V. From Tab. 13, we find that Cosmos3-Super achieves state-of-the-art in I2V: its direct score of $43.8$ exceeds the direct I2V baselines, and WMReward+BoN further improves the score to $48.9$, above the strongest listed I2V baseline with WMReward+BoN. In V2V, Cosmos3-Super also achieves the state-of-the-art, reaching $59.7$ directly and $63.4$ with WMReward + BoN, above the strongest listed V2V baseline with WMReward+BoN.

While automated evaluation metrics are valuable for measuring quality, prompt alignment, and physical plausibility, even the strongest VLM-based metrics miss certain artifacts and failure cases. Human evaluation complements automated metrics on two fronts: coverage of long-tail failures that automated protocols systematically miss, and discriminability across a wider scoring range. For instance, on the same prompt set, the evaluated T2V generators span $\sim$10 points on human evaluation versus $\sim$4 points on the comparable automated PAIBench-G overall score (see Appendix F). We therefore complement our automated results with two human evaluation protocols: Cosmos HUE, which targets broad Physical AI video generation, and Human World Bench (HWB), which focuses specifically on realistic human motion under task-level instructions.

#### Cosmos HUE.

Cosmos HUE (HUman Evaluation) is a human scoring protocol grounded in the same PAIBench-G prompt set (Sec. 6.2.2). HUE departs from prior human-eval protocols in two ways. First, it replaces subjective Likert-scale grading with *atomic binary* verification: each video is decomposed into a set of single-fact *Yes / No / Unclear* questions phrased so that “Yes” always denotes the desirable outcome, shifting the annotator’s task from holistic judgment to objective fact-verification. Each (video, question) pair is independently rated by two annotators, with disagreements escalated to a quality-control reviewer. Second, the per-prompt question set is *automatically generated by a three-layer VLM pipeline* : a Domain Strategist classifies the prompt into one of seven Physical AI domains, a Scene Parser produces a structured scene manifest from the prompt (T2V) or from sampled frames of the paired ground-truth reference video (I2V), and an Auditor emits the final atomic questions. This ensures that questions track the actual prompt and reference scene rather than a static rubric. All three layers run on GPT 5.2. The VLM-generated question set is then supplemented by a human review pass in which reviewers inspect generated videos from top-ranked models and propose additional questions targeting failure modes the automated pipeline does not yet cover; the proposed questions are folded back into the question bank. The evaluation set consists of 100 fixed prompts sampled from PAIBench-G preserving its native domain distribution, with each model producing 5 random-seed generations per prompt for 500 videos per model; the per-prompt question set (up to 20 binary questions) is applied to all 5 generated videos. Each question is classified into one of four dimensions: “Semantic Alignment”, “Physical Laws”, “Geometric Reasoning”, and “Visual Integrity”. Per-dimension and per domain T2V and I2V leaderboards, the formal scoring scheme, and reliability estimates are detailed in Appendix F.

> Table 14: **Human evaluation results on Cosmos HUE and Human World Bench (HWB). Cosmos HUE evaluates broad Physical AI video generation quality via atomic binary verification across four dimensions; HWB evaluates realistic human motion under task-level instructions via instruction-following and physics pass rates. *Ground Truth* scores real videos paired with the same prompts and serves as an upper reference for Cosmos-HUE. Cosmos3-Super achieves the highest HUE T2V score and the highest HWB score among open-source models. Full per-dimension HUE leaderboards in Appendix F. Bold indicates the best in the column; underline indicates the second best.**

| — | — | — | — | — |
|---|---|---|---|---|
|  |  | **Cosmos HUE** | **Human World Bench** |  |
| **Model** | **Type** | **Text-to-Video ($\uparrow$)** | **Image-to-Video ($\uparrow$)** | **Image-to-Video ($\uparrow$)** |
| *Ground Truth* | — | 93.6 | 94.4 | — |
| **Cosmos3-Super** | Open-sourced | 89.3 | 89.6 | **71.9** |
| **Cosmos3-Nano** | Open-sourced | 87.6 | 88.6 | 66.9 |
| Wan2.2-A14B | Open-sourced | 88.2 | 88.4 | 60.7 |
| HunyuanVideo-1.5 | Open-sourced | 86.5 | 85.6 | 54.7 |
| Wan2.1-14B | Open-sourced | 84.0 | 83.9 | 33.1 |
| Wan2.2-5B | Open-sourced | 80.8 | 80.4 | 25.4 |
| Cosmos-Predict2.5-14B | Open-sourced | 82.1 | 83.0 | 38.7 |
| Cosmos-Predict2.5-2B | Open-sourced | 81.8 | 82.6 | 32.8 |
| Veo-3.1 | Closed-sourced | **91.3** | **89.7** | 67.8 |
| Seedance-1.5-Pro | Closed-sourced | 90.0 | 87.6 | — |

#### Human World Bench (HWB).

While Cosmos HUE evaluates broad Physical AI video generation, Human World Bench (HWB) focuses on a more targeted and challenging setting: egocentric image-to-video generation for human manipulation tasks under task-level instructions. The benchmark videos in HWB are sourced from EgoVerse (Punamiya et al., 2026) and comprise 180 samples. HWB uses an absolute failure-mode protocol: annotators judge each generated video independently for instruction following and physical plausibility. We report two top-level pass rates. *Instruction following* measures whether the video depicts the requested actions and objects. *Physical plausibility* measures temporal coherence and physical plausibility, including object dynamics, contact, and hand anatomy. The HWB score is the average of the instruction-following and physics pass rates.

Tab. 14 reports Cosmos-HUE scores on both T2V and I2V, alongside Human World Bench (HWB) results. On HUE T2V, Cosmos3-Super is the best open-source model at 89.3, behind the closed-source Veo-3.1 (91.3) and Seedance-1.5-Pro (90.0). On HUE I2V, Cosmos3-Super is again the best open-source model and is essentially tied with the leading closed-source generator, trailing Veo-3.1 by only 0.1 points (89.6 vs. 89.7). Cosmos3-Nano is also competitive, finishing second among open-source models on I2V (88.5) and third on T2V(87.6).

On HWB, Cosmos3-Super achieves 71.9, the state-of-the-art score among all evaluated models in Tab. 14, outperforming the strongest listed closed-source baseline, Veo-3.1 (67.8), by 4.1 points and the strongest non-Cosmos open-source baseline, Wan2.2-A14B (60.7), by 11.2 points. Cosmos3-Nano also performs strongly at 66.9, ranking second among open-source models and outperforming every non-Cosmos open-source baseline. Together, the two Cosmos 3 variants take the top two open-source positions on HWB, demonstrating strong egocentric human-motion generation across both model scales.

![Figure 19](figures/aa_i2v_oss.jpg)

> Figure 19: **Cosmos3-Super-Image2Video is the best open-weight model on crowdsourced arena rankings. Cosmos3-Super-Image2Video ranked #1 among open-weight models (#22 including proprietary models) on the Artificial Analysis Image to Video Leaderboard (No Audio) (Date: 2026-05-28).**

#### Artificial Analysis Image-to-Video Leaderboard.

To evaluate Cosmos 3 under real-world scenarios, we submitted our specialized I2V model, Cosmos3-Super-Image2Video, to the Artificial Analysis Image-to-Video leaderboard (No Audio) for crowdsourced public voting. The model ranked the top among all open-weight models, and achieved the #22 position globally including proprietary models. In particular, the model is on par with proprietary offerings such as Veo 3.1 (Google DeepMind, 2025b) and Wan 2.5 (Wan et al., 2025b), demonstrating its exceptional temporal dynamics and visual fidelity.

### 6.2.3 Audio Generation Evaluation

Text-to-audiovisual generation must satisfy two requirements that are not captured by video-only benchmarks. The generated audio should contain the sound events requested by the prompt, and those events should be attributable to the correct visual sources with plausible timing. We therefore evaluate audio generation with Cosmos-SoundBench, a targeted benchmark for audio-visual prompt following and synchronization. The metric separates semantic audio-visual correctness from prompt-blind audio fidelity. A sample can contain the right sound at the right moment but still suffer from audio artifacts, or it can be acoustically clean while missing the requested event.

#### Cosmos-SoundBench.

Cosmos-SoundBench contains 144 evaluation prompts drawn from FoleyBench (Dixit et al., 2026). The prompts cover non-speech sound categories such as ambient scenes, impacts, object interactions, tools, vehicles, water, and other environmental effects. We focus on non-speech audio because these signals are especially important for Physical AI. Contact sounds reveal material and collision properties, tool sounds indicate ongoing actions, and ambient cues provide scene context that may be only partially visible.

#### Audiovisual quality metric (AVQ).

We evaluate each generated sample with a structured MLLM-as-judge protocol. The judge sees the prompt, video, and audio only in the stages where that information is needed, keeping each judge stage focused on the intended evidence rather than unrelated cross-modal cues.

1. 1. *Prompt checklist construction.* Before inspecting any generated media, an ensemble of Claude Opus 4.7, Gemini 3.1 Pro, and GPT 5.5 extracts the required foreground sounds, ambient audio conditions, and prompt-critical visual evidence. We use majority voting to fix the checklist used by downstream scoring.

1. 2. *Prompt-blind visual observation.* Gemini 3.1 Pro Preview describes visible entities, actions, scene context, and plausible sound sources without seeing the prompt. These observations provide evidence for source attribution and temporal alignment, rather than a standalone visual-quality score.

1. 3. *Semantic audiovisual scoring.* The judge evaluates whether the requested sounds are present, source-specific, dynamically appropriate, and aligned with visible or plausible actions. These checks are mapped to semantic audio correctness (**SA** ), audiovisual alignment (**AVAlign** ), and prompt-critical visual support (**VisualSupport** ), combined as: $\mathrm{SAV}=0.60\,\mathrm{SA}+0.30\,\mathrm{AVAlign}+0.10\,\mathrm{VisualSupport}.$ We run this stage three times and average the scores to account for judge variability.

We additionally measure audiobox-aesthetics Production Quality (PQ) as a proxy for perceptual audio quality, as it tries to quantify sample-level clarity & fidelity, dynamics, frequency bandwidth and spatialization (Tjandra et al., 2025)

The final audiovisual quality score is:

$$\mathrm{AVQ}=0.5\,\mathrm{SAV}+0.5\,\mathrm{AQ}.$$

For each model, we evaluate five random-seed generations per prompt. For Cosmos 3 models, we use Claude Opus 4.6 to rewrite SoundBench prompts into the structured generation format described in Sec. 6.3.1 and Sec. 6.3.2, matching the prompt distribution used by the generator.

> Table 15: **Cosmos-SoundBench Audiovisual Quality. We report the overall Audiovisual Quality (AVQ), Semantic Audiovisual quality (SAV), its sub-scores defined in Sec. 6.2.3, and audiobox-aesthetics Production Quality (PQ). Bold marks the best score in each column and underline marks the second best. Seedance-1.5-Pro achieves the highest AVQ through stronger PQ, while Cosmos 3 achieves the strongest semantic audio-visual grounding and alignment.**

| — | — | — | — | — | — | — | — |
|---|---|---|---|---|---|---|---|
|  |  | **SoundBench Audiovisual Quality ($\uparrow$)** |  |  |  |  |  |
| **Model** | **Type** | **AVQ** | **SAV** | **SA** | **AVAlign** | **Visual Sup.** | **PQ** |
| **Cosmos3-Super** | Open-sourced | 7.31 | 8.34 | 8.30 | 8.14 | **9.18** | 6.28 |
| **Cosmos3-Nano** | Open-sourced | 7.34 | **8.35** | **8.33** | **8.16** | 9.10 | 6.32 |
| LTX-2.3 | Open-sourced | 7.10 | 7.80 | 7.86 | 7.58 | 8.12 | 6.39 |
| Seedance-1.5-Pro | Closed-sourced | **7.64** | 8.21 | 8.22 | 8.06 | 8.61 | **7.06** |
| Veo-3.1 | Closed-sourced | 7.45 | 8.21 | 8.21 | 8.01 | 8.85 | 6.68 |
| LTX-2.3 Pro | Closed-sourced | 7.32 | 7.93 | 7.96 | 7.74 | 8.35 | 6.70 |
| Wan2.6 | Closed-sourced | 7.23 | 7.90 | 7.99 | 7.54 | 8.45 | 6.55 |
| Sora 2 | Closed-sourced | 6.90 | 7.94 | 7.97 | 7.70 | 8.49 | 5.85 |

![Figure 20](figures/av_align_no_reels.png)

> Figure 20: **Audio-video event alignment. Selected frames from a Cosmos3-Nano generation are paired with the spectrogram of the generated audio. Colored frames denote hammer-strike moments, and their temporal markers coincide with sharp spectral transients. The gray frame shows a non-contact moment between strikes, where no comparable acoustic transient is observed. This contrast provides qualitative evidence that the acoustic transients are aligned with visual impact moments rather than intervening motion.**

Tab. 15 shows that the strongest closed-source systems retain an advantage in overall AVQ, primarily through higher perceptual audio quality. Seedance-1.5-Pro achieves the best AVQ ($7.64$) and PQ ($7.06$), followed by Veo-3.1 ($7.45$ AVQ, $6.68$ AQ). In contrast, Cosmos 3 is strongest on the semantic and alignment components that measure whether the sound matches the visual event. Cosmos3-Nano obtains the best SAV, SA, and AVAlign scores, while Cosmos3-Super achieves the best visual-support score. This pattern suggests that Cosmos 3 mid-training is effective at grounding sound events in the generated video, with remaining headroom concentrated in low-level audio fidelity. Fig. 20 demonstrates an example of strong temporal alignment between visual and acoustic events in Cosmos3-Nano generations.

### 6.2.4 Transfer Generation Evaluation

#### Two-weight classifier-free guidance.

Video transfer is conditioned on both a structured text prompt and a control video, and the optimal balance between caption fidelity and structural adherence varies across modalities. To control these two factors independently, we use a two-weight classifier-free guidance scheme with separate weights, one for the control video and one for the text prompt.

At each denoising step, we evaluate the denoiser three times—with both conditions, with the prompt only (dropping the control video), and with the control video kept but the prompt replaced by a fixed negative caption. We then combine the predictions so that the control weight extrapolates from the prompt-only prediction toward the fully conditional one (strengthening structural control), while the text weight extrapolates away from the negative-prompt prediction (strengthening caption fidelity). Exposing the two weights as separate knobs lets us tune each modality to its own quality–fidelity sweet spot, and we find this factored guidance to be more effective than the standard single-guidance formulation.

#### General video transfer.

We evaluate video transfer on PAIBench-C (NVIDIA, 2025e), a control-conditioned video-to-video benchmark covering four spatial control modalities: blur, edge, segmentation, and depth. The benchmark contains $600$ clips spanning three Physical AI domains: $200$ robotic-arm manipulation clips from AgiBot World (Bu et al., 2025), $200$ driving clips from OpenDV (Yang et al., 2024), and $200$ egocentric everyday-life clips from Ego-Exo-4D (Grauman et al., 2024).

For each example, the model receives a text prompt and a control video and must generate a photorealistic video that follows the control while preserving the prompted scene semantics. We report the single-control setting (exactly one modality per example) so each modality’s contribution can be measured in isolation. Quality is assessed by re-extracting the relevant control signal from the generated and reference videos and comparing them in the corresponding space (blur SSIM after bilateral filtering, Canny edge F1, scale-invariant RMSE on estimated depth, mIoU on open-vocabulary segmentation masks), plus DOVER (Wu et al., 2023a) as a content-agnostic measure of perceptual realism.

We compare Cosmos 3 against the Cosmos-Transfer2.5 baseline, which handles different modalities with a dedicated ControlNet (Zhang et al., 2023) branch per modality. Note that Cosmos 3 is instead a unified model that consumes the control video alongside the text prompt in its input sequence, natively supporting any combination of modalities without per-modality ControlNet adapters.

Tab. 16 shows that, despite the collapse of four dedicated ControlNet branches into a single unified backbone, Cosmos 3 matches or surpasses Cosmos-Transfer2.5 in every modality through one of its two variants: Cosmos3-Nano leads on perceptual quality (DOVER) and segmentation, while Cosmos3-Super takes the geometrically demanding edge and depth tasks. All three models are effectively on par on blur SSIM, which is already saturated near the metric’s upper bound. These results indicate that per-modality ControlNet adapters are not a prerequisite for strong control fidelity—a single unified backbone natively supports all four spatial controls and beats the dedicated-adapter baseline at one of its two scales on every metric.

> Table 16: **PAIBench-C single-control results. Each generation is conditioned on one of four control modalities (depth, segmentation, blur, or edge) and scored by the corresponding ground-truth-based metric: Depth si-RMSE, the scale-invariant root-mean-squared error between predicted and reference depth; Seg. mIoU, the mean intersection-over-union between predicted and reference segmentation masks; Blur SSIM, the structural similarity between predicted and reference blur maps; and Edge F1, the F1 score between predicted and reference edge maps. DOVER is a no-reference perceptual video-quality score, averaged across the four per-modality generations. Depth si-RMSE: lower is better; DOVER, Seg. mIoU, Blur SSIM, and Edge F1: higher is better. Bold indicates the best result per column.**

| — | — | — | — | — | — |
|---|---|---|---|---|---|
| **Model** | **DOVER** $\uparrow$ | **Seg. mIoU** $\uparrow$ | **Blur SSIM** $\uparrow$ | **Edge F1** $\uparrow$ | **Depth si-RMSE** $\downarrow$ |
| **Cosmos3-Super** | 10.14 | 0.71 | **0.91** | **0.50** | **0.58** |
| **Cosmos3-Nano** | **10.39** | **0.72** | **0.91** | 0.49 | 0.62 |
| Cosmos-Transfer2.5 | 9.49 | 0.68 | 0.90 | 0.45 | 0.68 |

![Figure 21](figures/avtransfer02.jpg)

> Figure 21: **Driving scene Video Transfer results. Cosmos3-Nano generates frames (bottom) from the corresponding 720p control video (top). The control video encodes HD map elements—lanes, road markings, poles, and traffic lights (with or without state)—which together represent complex road topologies (including overpasses), as well as actors represented as cuboids. Each cuboid is color-coded by a coarse class ontology (\eg, truck, vehicle, pedestrian) and shaded to differentiate front from back.**

#### Autonomous driving.

PAIBench-C is complemented by an AV-specific benchmark of $486$ single-view driving clips (NVIDIA, 2025b) for world-scenario-map-conditioned video transfer, called AVBench-C. The control input is a camera-view rendering of the driving scene that combines static map structure (lane lines, road boundaries, traffic signals, and traffic signs) with all scene objects (vehicles, pedestrians, and other agents), both stationary and moving. Given this rendered scenario together with a text prompt, the model must produce a photorealistic driving video that is consistent with both inputs. We evaluate the results with both automatic and human evaluations:

- • *AVBench-C automatic evaluation.* We evaluate each generation with three ground-truth-based automatic checkers. The *egomotion* checker uses visual odometry to compute trajectory drift per meter travelled. The *object-correspondence* checker matches scene entities to the control input, comparing dynamic actors against rendered trajectories and static structure against the projected map. The *environment* checker uses a VLM judge to score prompt-level driving conditions, including weather, time of day, region, and road-surface state.

- • *AVBench-C human evaluation.* Trained annotators rate each generated video on a 1–3 scale along two axes. The *video quality* axis measures overall realism, with 3 indicating realistic textures and temporally consistent agent behavior, 2 indicating mild deformities or brief temporal stutter, and 1 indicating clearly unrealistic dynamics or low-quality textures. The *lane line* axis measures fidelity to the world-scenario map: annotators view the generation alongside a reference overlay of the expected road layout and assign 3 if lanes, crossings, and entities are mostly in the correct locations, 2 if a few lanes are missing but most entities are correctly placed, and 1 if most lanes or crossings are missing or entities are misplaced.

> Table 17: **AVBench-C evaluation scores. We report both automatic and human evaluation results. *Auto scores* are computed by three ground-truth-based checkers: Ego drift (lower is better), the visual-odometry trajectory drift; Dyn. Obj. and Static Obj. (higher is better), how closely scene entities match the control input; and Environment (higher is better), a VLM-judge score for prompt-level driving conditions. *Human scores* are 1–3 ratings from trained annotators along two axes: Video quality, which measures overall realism (textures, agent behavior, and temporal consistency), and Lane line, which measures fidelity to the world-scenario map (correct placement of lanes, crossings, and entities). Higher is better for both human metrics. Bold indicates the best result per column.**

| — | — | — | — | — | — | — |
|---|---|---|---|---|---|---|
|  | **Automatic evaluation** | **Human evaluation** |  |  |  |  |
| **Model** | **Ego drift** $\downarrow$ | **Dyn. Obj.** $\uparrow$ | **Static Obj.** $\uparrow$ | **Environment** $\uparrow$ | **Video quality** $\uparrow$ | **Lane line** $\uparrow$ |
| **Cosmos3-Super** | **0.003** | 0.64 | 0.41 | **0.90** | **2.86** | 2.45 |
| **Cosmos3-Nano** | **0.003** | **0.67** | 0.41 | **0.90** | 2.82 | **2.50** |
| Cosmos-Transfer2.5-AV-Singleview | 0.008 | 0.62 | **0.42** | **0.90** | 2.59 | 2.47 |

Tab. 17 shows that Cosmos 3 matches or surpasses Cosmos-Transfer2.5 on every driving-scene metric through one of its two variants. On the automatic side, ego-trajectory drift is uniformly small across all three models, and Cosmos3-Nano further leads on dynamic-object correspondence, while static structure and environment consistency are effectively on par and already saturated near the metric’s upper bound. Human evaluation reinforces this picture: Cosmos3-Super and Cosmos3-Nano deliver markedly higher video quality ($2.86$ and $2.82$ vs. $2.59$), while lane-line fidelity is comparable across all three models (within $\pm 0.05$). Taken together, these results indicate that Cosmos 3 preserves geometric and structural fidelity while delivering visibly higher-quality driving-scene generations, beating the baseline at one of its two scales on every metric. Fig. 21 shows a qualitative example of a driving-scene video generated by Cosmos3-Nano from its corresponding control input.

### 6.2.5 Action Generation Evaluation

We evaluate whether action mid-training endows Cosmos 3 with a reusable world-action prior across domains and inference modes. The central question is whether unified action mid-training accelerates adaptation to a domain-specific action interface, and whether a short post-training stage can turn the shared base model into a specialized model that is competitive with or stronger than state-of-the-art domain baselines. Table 18 reports results on camera motion, autonomous driving, robotics, and egocentric motion domains, covering forward- and inverse-dynamics settings. Table 19 reports results on robot policy settings, evaluating Cosmos 3’s ability to complete language-specified tasks.

#### Setup.

We compare two initialization protocols for each downstream domain. The first, pre-training initialization (*PT-init* ), starts from the Cosmos 3 pre-trained checkpoint, which has not been trained on action-domain data. The second, mid-training initialization (*MT-init* ), starts from our mid-trained checkpoint, which has seen action data spanning multiple domains and prediction modes, including forward dynamics (FD), inverse dynamics (ID), and policy. For each comparison, we use the same training recipe and keep the model size, data, and compute budget fixed. We report results for both Cosmos3-Nano and Cosmos3-Super.

#### Metrics.

We report metrics for each action interface. For autonomous-vehicle inverse dynamics, relative rotation error (RRE) and relative translation error (RTE) measure frame-to-frame pose accuracy, while absolute trajectory error (ATE) measures global trajectory consistency. We also use these metrics to measure camera-following accuracy in camera-motion forward dynamics, comparing the ground-truth camera poses with the estimated camera trajectories from generated videos. For robotics and egocentric forward dynamics, PSNR measures the reconstruction quality of action-conditioned future observations. Although a plausible generative rollout need not be pixel-identical to the single recorded ground-truth future, we find that PSNR is as a useful proxy for temporal alignment, motion consistency, and reconstruction fidelity under a relatively short temporal horizon. For robotics policy, success rate measures the percentage of evaluation tasks completed successfully.

> Table 18: **Post-training comparisons for forward and inverse dynamics across domains. FD denotes forward dynamics and ID denotes inverse dynamics. *PT-init* initializes from the generic Cosmos 3 pre-trained checkpoint, while *MT-init* initializes from the mid-trained checkpoint. Domain-specific baselines are reported only for their corresponding application, while Cosmos 3 variants are compared across all evaluated action settings. Bold indicates the best in the column and underline indicates the second best.**

| — | — | — | — | — | — | — | — | — |
|---|---|---|---|---|---|---|---|---|
|  | **Autonomous Vehicle (ID)** | **Camera Motion (FD)** | **Egocentric Motion (FD)** | **Robotics (FD)** |  |  |  |  |
| **Model** | RRE (∘, $\downarrow$) | RTE (m, $\downarrow$) | ATE (m, $\downarrow$) | RRE (∘, $\downarrow$) | RTE (m, $\downarrow$) | ATE (m, $\downarrow$) | PSNR ($\uparrow$) | PSNR ($\uparrow$) |
| **Cosmos3-Super (*MT-init* )** | 0.232 | **0.014** | **0.90** | **0.142** | **0.026** | **0.99** | **16.19** | **26.04** |
| **Cosmos3-Nano (*MT-init* )** | **0.211** | **0.014** | 0.98 | 0.147 | 0.029 | 1.24 | 16.12 | 25.52 |
| **Cosmos3-Super (*PT-init* )** | 0.284 | 0.018 | 1.32 | 0.293 | 0.036 | 1.82 | 15.34 | 22.69 |
| **Cosmos3-Nano (*PT-init* )** | 0.249 | 0.017 | 1.20 | 0.172 | 0.034 | 1.61 | 15.22 | 23.24 |
| Lingbot-World | – | – | – | 0.299 | 0.057 | 2.88 | – | – |
| HY-World1.5 | – | – | – | 0.377 | 0.042 | 1.39 | – | – |
| VGGT | 0.596 | 0.768 | 23.46 | – | – | – | – | – |
| DepthAnything3 | 0.312 | 0.354 | 9.29 | – | – | – | – | – |
| LOME | – | – | – | – | – | – | 9.36 | – |
| Ctrl-World | – | – | – | – | – | – | – | 22.99 |

#### Autonomous vehicle (ID).

We evaluate the inverse-dynamics capabilities of Cosmos 3 using an in-house driving dataset, which consists of 6-second video clips with accurate ego-vehicle trajectories at 10 FPS. Under this setup, the model directly predicts the ego-trajectory from video inputs. We compare our approach against two state-of-the-art general-domain baselines: VGGT (Wang et al., 2025b) and DepthAnything3 (Lin et al., 2025b). As reported in Tab. 18, both Cosmos3-Nano and Cosmos3-Super initialized with *PT-init* outperform the baselines. Applying *MT-init* yields further improvements for Cosmos3-Nano. Notably, our method trained with specialized driving data achieves much better metric-scale translation estimation, whereas the general-domain baselines suffer from drifting errors. Overall, these results demonstrate that physical-AI-oriented video models can excel in specific embodied applications with minimal adaptation. Qualitative results are visualized in Fig. 22.

![Figure 22](figures/av_id_figure.png)

> Figure 22: **Comparison for autonomous vehicle inverse dynamics. We qualitatively compare ego-vehicle trajectories estimated from input videos by different methods, with the red trajectory representing the ground truth. Cosmos3-Nano *(MT-init)* demonstrates the ability to estimate accurate, metric-scale ego poses.**

#### Camera motion (FD).

Camera-conditioned video generation can serves as world simulation for many applications. We task the model with predicting future frames given an initial image and a specified camera trajectory. To quantify camera-following accuracy, we utilize DepthAnything3 (Lin et al., 2025b) to estimate metric-scale camera trajectories from the generated videos and compare them against the conditioning input. If the generated videos are highly consistent with the conditioning trajectory, the estimated poses from the predicted sequence should closely match the input poses. We benchmark our approach against the bidirectional models of Lingbot-World (Robbyant et al., 2026) and HY-World 1.5 (HunyuanWorld, 2025) on an internal dataset of one hundred 5-second realistic video clips with camera motions estimated by DepthAnything3 (Lin et al., 2025b). Qualitative results are reported in Fig. 23. The results show that Cosmos3-Nano and Cosmos3-Super with *PT-init* already provide robust camera control. *MT-init* improves the result further: Cosmos3-Super achieves 0.142∘ RRE, 0.026 m RTE, and 0.99 m ATE, outperforming Lingbot-World (0.299∘ RRE, 0.057 m RTE, 2.88 m ATE) and HY-World 1.5 (0.377∘ RRE, 0.042 m RTE, 1.39 m ATE) across all three metrics.

![Figure 23](figures/camera_fd_figure.png)

> Figure 23: **Camera forward dynamics comparison. Given complex realistic trajectories, Cosmos3-Nano *(MT-init)* faithfully reproduces the same camera motion in the generated video. For each motion example, the first row shows frames near the start of the sequence and the second row shows frames near the end. The downward arrow indicates temporal progression from start to finish, while the text beside it specifies the commanded camera motion.**

#### Egocentric motion (FD).

We evaluate videos from Human World Bench (HWB, see Sec. 6.2.2) in the forward-dynamics setting. We use the HWB action annotations, which include both camera ego-motion and hand motion tracking, and report the PSNR of the generated videos. We adapt both *PT-init* and *MT-init* checkpoints to the egocentric domain and compare against LOME (Gao et al., 2026a), a recent action-conditioned video generation method specialized for egocentric hand manipulation data. Although LOME is one of the closest available baselines for this setting, it performs poorly on HWB, achieving a PSNR value of 9.36dB, likely due to distribution shift between its training data and the HWB benchmark. In contrast, Cosmos 3 achieves substantially higher PSNR across both model scales and initialization protocols. With *PT-init* , Cosmos3-Nano reaches a PSNR value of 15.22dB and Cosmos3-Super reaches a PSNR value of 15.34dB. Starting from *MT-init* further improves the scores to PSNR values of 16.12dB for Cosmos3-Nano and 16.19dB for Cosmos3-Super. These results show that *MT-init* provides a consistent gain, indicating that unified action mid-training provides a substantially stronger starting point for egocentric forward dynamics. Overall, these results support the central hypothesis of unified action mid-training: co-training across robot embodiments, camera motion, autonomous-vehicle motion, and egocentric motion induces a transferable action-domain prior, enabling faster convergence and stronger downstream adaptation in the egocentric domain.

#### Robotics (FD).

Robotics forward dynamics unlocks applications such as policy evaluations with video models. We conduct experiments on the DROID dataset (Khazatsky et al., 2024), a large-scale real-robot manipulation dataset featuring diverse scenes and objects. Given an initial frame and the robot end-effector action chunk of size 16, the model predicts the subsequent 16 frames. We post-train both the *PT-init* and *MT-init* checkpoints on the DROID dataset. We compare against Ctrl-World (Guo et al., 2026) as our primary baseline. We present the qualitative results in Fig. 24 and quantitative results in Tab. 18. As shown in Tab. 18, post-training from the pre-trained checkpoint already matches the baseline at Nano scale, reaching a PSNR value of 23.24dB compared with 22.99dB for Ctrl-World. Post-training from the mid-trained checkpoint yields substantially stronger results, reaching PSNR values of 25.52dB with Cosmos3-Nano and 26.04dB with Cosmos3-Super. These results demonstrate that Cosmos 3 is a strong and flexible backbone for forward dynamics prediction.

![Figure 24](figures/robotics_fd_figure.png)

> Figure 24: **Qualitative comparison for robotics forward dynamics. The generated frames closely follow the action commands, and the interactions between the robot arm and the fabric are more realistic than those from the baseline. Green boxes highlight regions with visible distortions or artifacts in the baseline outputs, and the corresponding regions in Cosmos3-Nano *(MT-init)* , where these artifacts are absent.**

#### Robot manipulation (policy).

To evaluate the policy mode, we post-train and submit our Cosmos3-Nano-Policy-DROID to the RoboLab simulation benchmark (Yang et al., 2026a), the RoboArena real-world benchmark (Atreya et al., 2025), and the MolmoSpaces simulation benchmark (Kim et al., 2026). As shown in Tab. 19, Fig. 26, and Fig. 27, our model achieves new state-of-the-art results across all three benchmarks, demonstrating that Cosmos3 omnimodal world models can be effectively post-trained into strong robot manipulation policies.

RoboLab (Yang et al., 2026a) is a high-fidelity, robot- and policy-agnostic simulation benchmark comprising 120 language-conditioned tasks designed to evaluate task-generalist robot manipulation policies across visual, relational, and procedural competencies. RoboLab evaluates each task under three instruction specificity levels, across vague prompts, default prompts and specific prompts. This split tests robustness to language phrasing rather than a single canonical command. On RoboLab, our post-trained policy surpasses all prior models on task success rate by clear margins (Tab. 19), including strong vision-language-action (VLA) models such as $\pi_{0.5}$ (Physical Intelligence Team, 2025) and world-action models (WAM) such as DreamZero (Ye et al., 2026), across all task instruction granularities and task difficulty levels. For example, under *specific* task instructions, our policy achieves a 39.7% average success rate across 120 tasks with 10 rollouts per task, outperforming $\pi_{0.5}$ at 28.1% and DreamZero at 25.2%. Additionally, compared with a model post-trained directly from the pre-trained checkpoint, Cosmos3-Nano (*PT-init* ), our final policy performs better, demonstrating the effectiveness of incorporating action-modality data from diverse sources into mid-training.

> Table 19: **Cosmos3-Nano-Policy-DROID establishes a new state of the art on RoboLab. Task success rates (%) are reported on RoboLab-120 across language specificity levels and task difficulty levels. All policies use off-the-shelf checkpoints fine-tuned on the DROID dataset. Bold indicates the best in the column.**

| — | — | — | — | — | — | — | — | — | — | — | — | — |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
|  | **Overall** | **Simple** | **Moderate** | **Complex** |  |  |  |  |  |  |  |  |
| **Model** | Vague | Default | Specific | Vague | Default | Specific | Vague | Default | Specific | Vague | Default | Specific |
| **Cosmos3-Nano-Policy-DROID** | **20.6** | **36.8** | **39.7** | **23.3** | **40.6** | **42.0** | **23.3** | **35.4** | **40.3** | 4.1 | **25.3** | **29.4** |
| **Cosmos3-Nano (*PT-init* )** | 16.7 | 28.1 | 30.2 | 17.8 | 30.3 | 32.8 | 19.0 | 28.7 | 29.5 | **7.1** | 18.2 | 21.8 |
| $\pi_{0.5}$ | 15.2 | 28.0 | 28.1 | 16.2 | 29.7 | 29.8 | 17.9 | 31.5 | 31.0 | 5.3 | 13.5 | 14.7 |
| DreamZero | 14.9 | 25.7 | 23.9 | 15.0 | 26.1 | 25.8 | 19.5 | 30.0 | 26.7 | 4.1 | 14.1 | 10.6 |
| $\pi_{0}$-FAST | 9.2 | 15.5 | 14.9 | 9.5 | 20.2 | 19.4 | 12.8 | 13.3 | 12.6 | 0.0 | 2.9 | 3.5 |
| paligemma-binning | 3.1 | 3.4 | 5.5 | 2.2 | 3.4 | 4.1 | 5.9 | 4.9 | 10.3 | 0.0 | 0.0 | 0.0 |
| GR00T N1.6 | 5.4 | 7.2 | 5.3 | 7.2 | 8.8 | 7.5 | 4.9 | 7.9 | 4.1 | 0.0 | 0.0 | 0.0 |
| $\pi_{0}$ | 2.8 | 5.0 | 3.5 | 2.8 | 7.2 | 5.3 | 3.8 | 3.6 | 2.1 | 0.0 | 0.0 | 0.0 |

![Figure 25 第1张](figures/snapshots_20260520_02_put_the_screwdriver_on_the_top_shelf_view_1_zoom_tlr10_spaced.jpg)

![Figure 25 第2张](figures/snapshots_20260520_01_put_the_screwdriver_and_the_glove_in_the_purple_container_view_1_zoom_tlr10_spaced.jpg)

> Figure 25: **Real-world evaluation of Cosmos3-Nano-Policy-DROID. We show snapshot frames from physical-robot rollouts. These examples demonstrate successful real-world deployment of our policy for language-conditioned manipulation tasks on physical robots.**

RoboArena (Atreya et al., 2025) is a distributed, real-world benchmark that uses crowdsourced pairwise comparisons to evaluate and rank generalist robot policies across diverse tasks and real world environments. Anyone with a DROID platform can evaluate a pair of policies in any environment and on any task by conducting double-blind A/B comparisons, and the final scores are aggregated from these pairwise preferences to produce an overall rating for each policy. As of 2:40 p.m. on May 30, 2026, our robot manipulation policy tops the leaderboard (Fig. 26), outperforming many prior strong policy models. We expect to receive more evaluations from the community, which will further validate our policy. Across several tested tasks, the policy accomplishes tasks reliably and follows language instructions well. The policy can perform simple pick-and-place tasks, as well as long-horizon tasks requiring multiple sequential steps. We observe strong generalization to a variety of unseen objects and tasks. The policy also tolerates failures, often retrying when necessary, and remains robust to human interventions during execution. Some qualitative results are shown in Fig. 25.

![Figure 26](figures/roboarena_leaderboard_final.jpg)

> Figure 26: **Cosmos3-Nano-Policy-DROID held the top position on RoboArena. Cosmos3-Nano-Policy-DROID ranked #1 on the RoboArena real-world benchmark leaderboard (Date: 2026-05-30).**

MolmoSpaces (Kim et al., 2026) is a simulation benchmark for evaluating generalist policies with a focus on generalization under systematic and controlled variations. We focus on the manipulation tasks, which consist of two task sets: (1) *MolmoSpaces Combined* and (2) *MolmoBot Combined* . The *MolmoSpaces Combined* set comprises four benchmark tasks (*Pick-v1* , *Pick & Place-v1* , *Open-v1* , and *Close-v1* ), while the *MolmoBot Combined* set comprises seven benchmark tasks (*Pick-v1.5* , *Pick-v2-classic* , *Pick-v2-filament* , *Pick-v2-RandCam* , *Pick & Place-v2* , *Pick & Place-NextTo-v2* , and *Pick & Place-Color-v2* ). As of June 20, 2026, Cosmos3-Nano-Policy-DROID ranked first on the leaderboard under the *All Combined* setting, achieving a 39.0% oracle success rate (Fig. 27). The model outperformed several strong prior policy models, such as WALL-OSS-0.5 (Zhai et al., 2025) and TiPToP (Shen et al., 2026b). Notably, we submitted the exact same model and hyperparameters for the RoboLab and RoboArena evaluations, without any benchmark-specific tuning for MolmoSpaces.

![Figure 27](figures/molmospaces_leaderboard_final.jpeg)

> Figure 27: **Cosmos3-Nano-Policy-DROID ranked #1 on MolmoSpaces. Cosmos3-Nano-Policy-DROID was the top-ranked model on the MolmoSpaces simulation benchmark leaderboard (Date: 2026-06-20).**

#### Adaptation to new embodiments.

We evaluate whether *MT-init* enables Cosmos3-Nano to adapt more quickly to an unseen embodiment and environment. We use the LIBERO-10 environment (Liu et al., 2023a) with multi-view observations from a third-person camera and a wrist camera. We report progress across post-training iterations by running 50 trials per validation task, giving 500 rollouts per checkpoint.

As shown in Tab. 20, post-training rapidly improves closed-loop manipulation success rate for both initializations, but *MT-init* has a clear advantage early in post-training. At 500 iterations, the Cosmos3-Nano *MT-init* reaches 24.6% success, while the Cosmos3-Nano *PT-init* remains at 0.0%. By 2000 iterations, the Cosmos3-Nano *MT-init* can achieve a 97.4% success rate. These results show that *MT-init* enables faster adaptation to new embodiments and environments.

> Table 20: **Fast adaptation to a new embodiment using LIBERO-10.** Closed-loop success rates for **Cosmos3-Nano** from *MT-init* and *PT-init* , evaluated with 500 rollouts per checkpoint. The results show that *MT-init* adapts faster than *PT-init* .

| — | — | — | — | — |
|---|---|---|---|---|
| **Model** | **Iteration** |  |  |  |
| **500** | **1000** | **1500** | **2000** |  |
| **Cosmos3-Nano (*MT-init* )** | 24.6% | 91.4% | 95.8% | **97.4%** |
| **Cosmos3-Nano (*PT-init* )** | 0.0% | 73.8% | 93.4% | 95.2% |

#### Action data synergy.

Choosing which action domains to train together is a practical mixture-design problem: an added domain can provide a useful visual-action prior, but it can also dilute supervision for the target domain. Inspired by recent work on language-domain transfer (Longpre et al., 2026), which measures how training on one language benefits or interferes with another, we build analogous transfer maps for action mid-training across ego-motion domains (Camera Motion, Autonomous Vehicle), robot manipulation domains (Google Robot, WidowX-250, Franka Panda Single, Franka Panda Dual, AgiBot), and human egocentric motion (Egocentric). The quantitative synergy matrices are summarized in Figure 28 and Figure 29. We report PSNR for FD and MSE for ID. For policy mode, we report the minimum PSNR and MSE across 4 rollouts because the rollout distribution is multimodal. In each synergy matrix, an off-diagonal cell uses a 50/50 mixture of the row and column domains for 4,000 iterations, while a diagonal cell is the corresponding single-domain baseline at 2,000 iterations. This setup matches the per-domain training budget between single-domain and paired runs. Each row fixes the evaluation domain, and columns vary the single-domain or paired training setting. Positive deltas indicate cross-domain transfer, while negative deltas indicate interference.

We summarize our key findings below:

![Figure 28](figures/synergy_av_camera_robots_tikz.svg)

> Figure 28: **Synergy study across ego-motion and robot manipulation domains. Rows denote evaluation domains; columns denote the added co-training domain. Diagonal cells are single-domain baselines, while off-diagonal cells use a 50/50 row–column mixture with matched row-domain training exposure. Each cell reports the score and delta from the row diagonal. Green indicates positive transfer, with signs adjusted so that higher PSNR ($\uparrow$) and lower MSE ($\downarrow$) are both better.**

- • *Camera motion benefits from broad action co-training.* Figure 28 shows that camera motion, one of the lower-performing domains, benefits from several co-training partners rather than only from another ego-motion source. AV data improves camera FD PSNR from 11.96 to 12.82 (+0.86), while robot domains also provide positive FD gains, including Google Robot (+0.79), Franka Panda Single (+0.73), and Franka Panda Dual (+0.48). ID MSE also improves for every shown co-training partner in the row. This suggests that camera-motion learning benefits from general action-conditioned visual priors, such as object persistence, scene geometry, and motion-correspondence cues, even when the added domain has a different embodiment.

- • *Robot manipulation domains share early-training priors.* The robot-domain panels in Figure 28 show broad early transfer among manipulation datasets, especially for domains with lower-performing single-domain baselines or more heterogeneous data. WidowX-250 benefits strongly from Google Robot, gaining +1.39 FD PSNR and +2.29 policy PSNR, with matching improvements in ID and policy MSE. Google Robot also gains from several robot co-training partners, with FD PSNR improvements up to +0.89 and policy PSNR improvements up to +1.44. By contrast, the Franka Panda single-arm and dual-arm entries in this synergy study correspond to small RoboMIND Franka subsets (Wu et al., 2025a), with only 23 and 4 hours of data, respectively. Compared with the much larger action-data sources summarized in Figure 9, these small target domains saturate quickly under single-domain training, so adding larger co-training domains yields smaller or mixed gains on their own evaluations. However, they still provide useful transfer to other domains when used as co-trained sources.

- • *Human egocentric motion helps robot adaptation.* Figure 29(a) shows modest but consistent transfer between egocentric motion and AgiBot. Egocentric data improves AgiBot FD PSNR from 23.07 to 23.20 (+0.13), while AgiBot slightly improves egocentric FD PSNR from 15.13 to 15.16 (+0.03). The warmup curve in Figure 29(b) further tests this transfer as an initialization effect: we first warm up the base PT-init checkpoint on egocentric motion and then adapt it to AgiBot, comparing against direct AgiBot adaptation from the same PT-init checkpoint. Starting from the egocentric-warmed checkpoint improves AgiBot FD PSNR at every measured step, with gains of +0.94 at 5K and roughly +1.3–1.6 later in training. Together, these results suggest that egocentric human action data provides a useful manipulation prior for robot adaptation, while domain-aware sampling or specialization remains important as training progresses.

![Figure 29 第1张](figures/synergy_agibot_handpose_tikz.svg)

![Figure 29 第2张](figures/agibot_handpose_curve_tikz.svg)

> Figure 29: **Egocentric motion as a robot-adaptation prior. (a) The matrix measures pairwise transfer between AgiBot robot manipulation and Egocentric motion. (b) The curve compares AgiBot adaptation from an Egocentric-warmed checkpoint against direct adaptation from the *PT-init* checkpoint.**

#### Conclusion.

We show that Cosmos 3 is a strong action foundation model across diverse domains, embodiments, and inference modes. A single foundation model can be adapted to camera-controlled video generation, autonomous-vehicle inverse dynamics, egocentric hand forward dynamics, robot forward dynamics, and robot policy learning, while remaining competitive with or stronger than specialized domain baselines. The comparison between *PT-init* and *MT-init* further shows that unified action mid-training does more than improve isolated domains: it produces a reusable action-domain prior that accelerates convergence across downstream settings, including adaptation to a new embodiment and environment. This is especially notable because the evaluated domains differ substantially in embodiment and supervision format, ranging from camera and vehicle motion to articulated human hands and robot end-effectors. The synergy study provides evidence that action domains share transferable structure: co-training across ego-motion, robot manipulation, and egocentric motion can improve early adaptation, particularly for domains with weaker single-domain baselines. The additional action-specific ablations in Appendix E.4 and E.5 reinforce the same conclusion: FD, ID, and policy objectives share useful structure under joint training, and videos predicted alongside policy actions remain aligned with simulator rollouts driven by those same actions. Overall, these findings support Cosmos 3 as a general-purpose world-action foundation model that can be efficiently specialized to a broad range of action generation and control tasks.

## 6.3 Generator User Guide

While benchmark results provide a quantitative assessment of generation quality, effectively using an omnimodal world model also requires understanding its inference interface, prompting methodology, and sampling configurations. Because Cosmos 3 supports a diverse set of modalities and generation modes—including image, video, audio-visual, transfer, forward-dynamics, inverse-dynamics, and policy generation—the quality of the outputs depends not only on the model weights but also on how generation requests are specified and conditioned. In this section, we provide practical guidance for using Cosmos 3 Generator, including recommended prompting strategies, structured caption formats, sampling hyperparameters, and the role of the Cosmos 3 Reasoner as a prompt upsampler. These guidelines reflect the configurations used throughout our evaluations and serve as a reference for obtaining high-quality, physically plausible generations across a wide range of Physical AI applications.

### 6.3.1 Generation Guide

The Cosmos 3 Generator supports flexible visual (and audio-visual) generation across a broad inference envelope: frame rates from 10–30 FPS, 5 to 400 frames, resolutions spanning 256p, 480p, and 720p, and common aspect ratios (1:1, 3:4, 4:3, 9:16, 16:9). This allows a single model to serve use cases ranging from short preview clips to longer, higher-resolution landscape or portrait video without changing the sampling interface. The Cosmos 3 Generator is trained for forward dynamics, inverse dynamics and policy modes to support different action-related applications. For action generation, the base Cosmos3-Nano and Cosmos3-Super models support action prediction at native control frequencies ranging from 10–30 FPS, with prediction horizons spanning 16–400 frames across inverse dynamics and policy modes. Post-trained models specialize to a single mode and frequency—for example, Cosmos3-Nano-Policy-DROID operates at 15 FPS with a 32-step prediction horizon. Below, we detail the key components for successful generation using Cosmos 3 Generator. These details are also summarized in Tab. 21.

> Table 21: **Default sampling configurations and negative prompts for each generator and generation modality. We summarize the generation settings for different Cosmos 3 Generator modes. Negative prompts are provided in full for each setting in the Appendix; “Null” indicates that the null string was the best-performing variant.**

| — | — | — | — |
|---|---|---|---|
|  | **Generation Modality** | **Sampling Hyperparameters** | **Negative Prompt** |
| **Cosmos3-Nano** | Audio-Visual | steps=50, guidance=6, shift=10, full-range CFG | Appendix B.6 |
| **Cosmos3-Super** | Audio-Visual | steps=50, guidance=6, shift=10, full-range CFG | Appendix B.6 |
| **Cosmos3-Super-Text2Image** | Visual | steps=50, guidance=4, shift=3, full-range CFG | Null |
| **Cosmos3-Super-Image2Video** | Visual | steps=50, guidance=6, shift=5, full-range CFG | Appendix B.3 |
| **Cosmos3-Nano** | Forward/Inverse Dynamics | steps=50, guidance=1, shift=5, full-range CFG | Null |
| **Cosmos3-Super** | Forward/Inverse Dynamics | steps=50, guidance=1, shift=5, full-range CFG | Null |
| **Cosmos3-Nano-Policy-DROID** | Policy | steps=4, guidance=3, shift=5, full-range CFG | Null |
| **Cosmos3-Nano** | Transfer | steps=50, guidance=3, control guidance=1.5, shift=10 | Appendix B.6 |
| **Cosmos3-Super** | Transfer | steps=50, guidance=3, control guidance=1.5, shift=10 | Appendix B.6 |

#### Media specifications and prompting guide.

The Cosmos 3 Generator is trained on structured JSON captions that provide fine-grained control over scene composition, covering subjects, background, lighting, aesthetics, cinematography, and for video, temporal fields such as actions, state changes, camera motion, and segment-level descriptions (full schema in Appendix A). At inference time, a prompt upsampler—served either by Claude Opus 4.6 or by the Cosmos 3 Reasoner—converts user requests into this same structured format, ensuring that generation prompts match the distribution seen during training (see Appendix B.1 for template instructions). The upsampler is instructed to first describe the scene layout and world state, then specify the temporal progression of events, and finally add any audio descriptions. The specific upsampler instruction varies slightly across generation modes—for instance, action and transfer generation impose additional task constraints tailored to their conditioning inputs (see Appendix B.4 for the transfer generation prompt prefix, and Appendix B.5 for the action prompt guide). The JSON specification additionally includes explicit media controls (duration, FPS, spatial height and width, and aspect ratio), keeping prompt interpretation and sampling configuration inspectable and reproducible.

#### Negative prompt.

We tune negative prompts separately for each model and generation mode through automated benchmark iteration. For each configuration, we ablate over candidate templates spanning natural-language descriptions, keyword lists, instruction-style directives, compositional extensions targeting physical consistency and identity preservation, and the null string. The best-performing variant is selected based on automated benchmark scores. For the base Cosmos3-Nano and Cosmos3-Super generators, the explicit negative prompt can be found in Appendix B.6. For the post-trained variants, we found that the null string negative prompt works best for Cosmos3-Super-Text2Image, while using negative prompts automatically derived from the user prompts yields the best result for Cosmos3-Super-Image2Video (Appendix B.3). For action generation modes, we found the null string negative prompt to work best.

#### Generation sampling hyperparameters.

We adopt the following sampling parameters for different modalities:

1. 1. *Audio-visual generation.* For audio-visual generation, we tune sampling hyperparameters on automated benchmarks for image and video generation (Sec. 6.2.1 and Sec. 6.2.2). For the base Cosmos3-Nano and Cosmos3-Super generators, we use 50 denoising steps, a guidance scale of 6, a time shift of 10, and full-range classifier-free guidance. For the post-trained Cosmos3-Super-Text2Image model, we use a guidance scale of 4 and a time shift of 3. For the post-trained Cosmos3-Super-Image2Video model, we use a shift of 5.

1. 2. *Action generation.* Action generation has three supported modes. For forward and inverse dynamics, we use 50 denoising steps, a guidance scale of 1, a time shift of 5, and full-range classifier-free guidance. For policy mode, we switch to 4 denoising steps and a guidance scale of 3.

1. 3. *Transfer generation.* We tune sampling hyperparameters for video transfer generation on the automated PAIBench-C benchmark (Sec. 6.2.4). We use 50 denoising steps, a text guidance scale of 3, a control guidance scale of 1.5, a time shift of 10, and full-range classifier-free guidance.

### 6.3.2 Cosmos 3 Reasoner as Prompt Upsampler

Prompt upsampling is the pre-generation reasoning step in Cosmos 3 that translates compact user intent into a structured spatiotemporal scene specification. Rather than merely rewriting the prompt, it expands sparse user input into a physically grounded control language that captures scene layout, temporal evolution, and audio cues when applicable. Users typically provide a short natural-language request, while high-quality image and video generation depends on many details that are rarely specified explicitly such as subject attributes, spatial layout, camera behavior, lighting, temporal ordering, audio cues, and generation controls such as resolution, aspect ratio, duration, and frame rate. The upsampler fills this gap by acting as an instruction-following LLM module between the user interface and the generator. It takes the brief request, the output’s structure template, plus the optional conditioning input signals such as a starting image for image-to-video, and produces a dense typed JSON scene specification that the downstream image or video model can render from.

The prior work falls into two threads. The first thread maps short user queries into richer text prompts for image generation. DALL-E 3 uses descriptive re-captioning and caption upsampling to better match the generator’s caption distribution (Betker et al., 2023); Prompt Expansion explicitly learns to expand a query into multiple optimized text-to-image prompts (Datta et al., 2024); and prompt-adaptation systems such as Promptist, BeautifulPrompt, and RePrompt train language models to rewrite user inputs into model-preferred prompts while optimizing image-level objectives (Hao et al., 2023; Cao et al., 2023; Wu et al., 2025b). The second thread uses LLMs as planners for downstream visual generators, producing object layouts, grounded scene descriptions, frame-level prompts, or multi-scene video plans (Lian et al., 2024; Feng et al., 2023; Hong et al., 2023; Lin et al., 2023). Cosmos 3 takes the same basic idea of inserting a reasoning module before generation, but further changes the interface. The upsampler emits one typed multimodal scene program, rather than only a rewritten prompt or a generator-specific layout plan, and the program spans image, video, and audio-conditioned generation. In a sense, the upsampler proceeds by first imagining the scene, considering the temporal/spatial aspects, and adding further multimodal content (\eg, audio descriptors) in an abstract language description state, then translating them into the structured output that matches the provided template.

We treat upsampling as complex *multimodal* instruction following with *physical priors* over *structured data* . The input may be text-only, image-plus-text, or video-plus-text. The output is a schema-constrained JSON control program that captures the semantic content, visual attributes, task-specific caption, temporal plan for video tasks, audio-description field for video tasks, and generation parameters needed by the renderer. The structured output is not only a formatting choice, it exposes the latent variables that the generator must condition on, including entities, spatial relations, actions, timing, camera behavior, audio consequences, and generation controls. This connects prompt upsampling to the body of work on structured LLM reasoning and verification, where natural-language instructions are converted into explicit, checkable programs over structured fields (Chegini et al., 2025). At the same time, filling a dense scene schema requires reasoning under uncertainty in which the upsampler must infer likely object states, temporal transitions, causal interactions, and acoustic outcomes from incomplete user input (Pournemat et al., 2025) in order to expand along the creativity axis without contradicting physical constraints of imposed reality. In Cosmos 3, these probabilistic and physical priors are expressed through the schema itself. The model first imagines a coherent world state, then maps it into a temporal rollout, and finally derives audio cues that remain synchronized with visible events. This separation is useful because it exposes prompt understanding as an independently inspectable component rather than entangling it with the rendering model.

#### Prompt contract.

At inference time, the upsampler receives the user description together with the selected generation controls. For image-to-video generation, it also receives the conditioning image, which is treated as definitive visual evidence for the first frame. The request is formatted as four tagged blocks: 1) instructions block: introduces all blocks, defines the task-level behavior such as producing a single fenced JSON object, avoiding extra commentary, and treating the template as mandatory. 2) image or video _description block: carries the raw semantic request; for conditioned requests such as I2V, the attached condition content is provided alongside this text and the constraints specify how visual facts should be anchored to it. 3) task_constraints block: carries most of the operational detail. It specifies field ordering, timing format, duration bounds, copied controls such as resolution, aspect ratio, duration, and frame rate, preservation requirements for user-provided entities and actions, and task-specific grounding rules such as matching the I2V first frame at $t=0$. 4) output_json_template block: defines the schema surface: which keys must be populated, which nested fields are expected, and where scene, temporal, audio, subject, camera, lighting, style, and control information should be placed. In other words, the constraints describe how the upsampler should reason and copy values, while the JSON template defines the shape that the final answer must take. The system prompt is a minimal “You are a helpful assistant”. The full template can be found in appendix B.1. Using this template, certain placeholder arguments such as description, FPS, duration, aspect ratio, resolution, \etc, have to be filled accordingly before passing to the Upsampler.
