# Appendix D Cosmos3-Edge LLM Model Training

Cosmos3-Edge uses a dense 2B backbone trained from scratch. Its training follows a two-stage curriculum: pre-training followed by supervised fine-tuning. The pre-training stage is further divided into base pre-training and long-context extension. We use BF16 precision throughout training; optimizer settings are given below.

#### Base pre-training.

During base pre-training, we train the 2B Edge backbone from scratch on a total of 15T tokens from the Nemotron pre-training corpus, using a sequence length of 8,192 tokens. This stage consists of two sub-stages: general pre-training on a broad-coverage data mixture, followed by continued pre-training on a higher-quality mixture. The data mixture is hot-swapped during training: continued pre-training resumes from the general-pre-training checkpoint while preserving the optimizer state and learning-rate schedule, so only the data mixture changes. We use AdamW with peak learning rate $1.2\times 10^{-3}$, $(\beta_{1},\beta_{2})=(0.9,0.95)$, weight decay $0.1$, and gradient clipping at norm 1.0. We use a warmup-stable-decay (WSD) learning-rate schedule, aligning the data-mixture switch with the transition from the stable phase to the decay phase. The tokenizer is shared with the NVIDIA Nemotron-3 models (NVIDIA, 2025f).

#### Long-context extension.

During the long-context extension phase, we extend the context window of the Cosmos3-Edge backbone to 128K tokens. Although the extended context window supports 128K-token training sequences, the primary goal of this stage is to improve robustness and quality at the deployed 32K-token sequence length. During the context extension phase, we train on 128K sequence length with an increased RoPE base of 1e8. We use a constant learning rate of $1.2\times 10^{-5}$ and the long-context phase is trained with 90B tokens. For the data blend in this phase, we downsample the pre-training blend to 80% and add long document QA data as the remaining 20% in the blend.

#### Supervised fine-tuning.

We use the supervised fine-tuning (SFT) data from Nemotron-Cascade-2 (Yang et al., 2026b), which covers a broad set of domains including mathematics, coding, science, general chat, instruction following, tool use, and code-agent tasks. In total, the dataset contains approximately 26M SFT samples. We pack these examples into sequences of up to 128K tokens, yielding roughly 2.6M packed training samples. The model is trained in a single SFT stage with a global batch size of 32. We use the AdamW optimizer with a learning rate of $2\times 10^{-5}$ and $(\beta_{1},\beta_{2})=(0.9,0.98)$. Empirically, model capability peaks after approximately 1.7 epochs, corresponding to 140K training steps.

We evaluate our SFT model on a set of text benchmarks spanning reasoning, science, instruction following, long context, and general capabilities: HMMT25 Feb (Harvard-MIT Mathematics Tournament, 2025), GPQA (Rein et al., 2023), MMLU-Pro (Wang et al., 2024d), AA-LCR (Artificial Analysis Team, 2025), IFBench (Pyatkin et al., 2025a), and Scale AI Multi-Challenge (Sirdeshmukh et al., 2025). We compare against Qwen3.5-2B (Qwen Team, 2026b), a strong baseline with the same model size.

As shown in Tab. 27, our text SFT model substantially outperforms Qwen3.5-2B on math reasoning and science benchmarks, such as HMMT25 Feb and GPQA. It yields comparable results on instruction-following and long-context evaluations, including IFBench and AA-LCR. However, it lags behind Qwen3.5-2B on general-domain benchmarks such as MMLU-Pro.

> Table 27: **Text benchmark results.** Comparing **Cosmos3-Edge** and Qwen3.5-2B across reasoning, science, instruction-following, and long-context evaluations. **Cosmos3-Edge** substantially improves mathematical and scientific reasoning capability on HMMT25 Feb and GPQA, while achieving comparable scores on IFBench and AA-LCR.

| **Model** | **HMMT25** **Feb** | **GPQA** | **MMLU** **Pro** | **AA-LCR** | **IFBench** **(prompt)** | **Scale AI** **Multi-Challenge** |
|---|---|---|---|---|---|---|
| Qwen3.5-2B | 22.9 | 51.6 | **66.5** | **25.6** | 41.3 | **33.7** |
| **Cosmos3-Edge** | **76.3** | **56.4** | 62.6 | 22.8 | **43.6** | 28.1 |
