# Cosmos 3: Omnimodal World Models for Physical AI —— 对照翻译 Part 6（下）

> 译本范围：§6.2.2 视频生成评测 —— §8 结论。
> 源文件：`cosmos3-tr.txt`（`pdftotext -layout` 抽取），实际起始于 §6.2.2 小节标题（第 3277 行）；§6.2.1 图像生成评测由前一位译者负责，此处不重复。
> 表中数值均照录原文；箭头、度数符号（°）、±、上标 π 等在 `-layout` 抽取中丢失的字形，已用 `pdftotext -table -enc UTF-8` 逐页复核补回。

---

## 6.2.2 视频生成评测（Video Generation Evaluation）

我们通过互补的自动化基准与人工基准来评测 Cosmos 3 的视频生成能力。自动化基准提供可扩展、可复现的比较，并能捕捉广泛的质量与领域相关信号；但随着模型能力提升，其区分度会下降（特别是在领域相关的 Physical-AI 场景中，这类指标对时间与物理层面的失效往往是短视的）。人工评测则弥补这些缺口：它能捕捉自动化协议系统性地漏掉的长尾物理、具身与语义失效，同时其分数分布在一个明显更宽的区间上，使最先进模型之间微小但真实的差异仍可被检测出来。我们报告三个自动化基准——PAIBench-G、RBench 与 Physics-IQ——的结果，随后报告 Cosmos HUE（一个面向 Physical AI 视频生成的专用人工评测协议），以及 Human World Bench（HWB，一项针对"从任务级指令生成逼真人体运动"的定向人工评测）。对于所有基准（无论是自动化评测还是人工评测），我们都使用 Claude-Opus-4.6 作为提示词改写器，把文本提示转换为 Sec. 6.3.1 与 Sec. 6.3.2 所描述的结构化格式，以确保它们匹配训练时的提示分布。

**PAIBench-G。** PAIBench-G 是 Physical AI Benchmark（Zhou et al., 2025c）的视频生成赛道，包含覆盖六个 Physical AI 领域的 1,044 个图文提示对：Human（299）、Autonomous Vehicle（239）、Common Sense（174）、Robotics（107）、Physics（107）与 Industry（107）。我们采用它是因为其广泛的领域覆盖与均衡的计分方式：每个模型获得一个 Quality Score（聚合帧一致性、运动平滑度、美学质量与视频-文本对齐等指标）与一个 Domain Score（由 VLM-as-Judge 对跨领域的物理与语义正确性进行二值核验）。总分对二者等权：Overall = 0.5 × Quality + 0.5 × Domain。PAIBench-G 与人工 ELO 排名的 Pearson 相关系数达到 r=0.918，因此非常适合在训练早期阶段、当模型尚未收敛到前沿而自动化分数开始出现饱和之前，可靠地衡量进展。对每个提示，我们在 5 个随机种子上生成视频，并在 720p 分辨率、16:9 宽高比、189 帧的条件下评测。虽然 PaiBench-G 原生仅支持 Image-to-Video 评测，但我们将其扩展为同样可计算 Text-to-Video 分数²。Tab. 12 使用 Qwen2.5-VL-72B-Instruct 作为 VLM 评审，报告了文生视频与图生视频两种 PAIBench-G 结果；Cosmos3-Super 在两个赛道上都取得了最先进的 overall 分数，成为最佳开源模型，超越了包括 Veo-3.1 在内的强闭源模型。

> 脚注：²我们发现公开的 PAIBench-G Image-to-Video 排行榜结果（由 Qwen3-VL-235B-A22B 评审）是不可复现的。因此我们在内部评测（Tab. 12）中使用 Qwen2.5-VL-72B-Instruct 作为 domain-score 评审，并独立地向公开排行榜提交；在两者上，Cosmos3-Super 与 Cosmos3-Nano 均位列总榜第一和第二。

> Table 12: PAIBench-G 与 RBench 在 Text-to-Video 与 Image-to-Video 设置下的结果。PAIBench-G 在六个 Physical AI 领域上评测视觉质量与领域相关准确度，而 RBench 评测具身机器人场景中的任务正确性与物理合理性。在开源模型中，Cosmos3-Super 在 PAIBench-G T2V 与 I2V 两项上的 overall 分数均为最高，而 Cosmos3-Nano 在 RBench 上领先。加粗表示该列最优，下划线表示次优。

| Model | Type | PAIBench-G T2V Overall | PAIBench-G T2V Domain | PAIBench-G T2V Quality | PAIBench-G I2V Overall | PAIBench-G I2V Domain | PAIBench-G I2V Quality | RBench I2V Score |
|---|---|---|---|---|---|---|---|---|
| Cosmos3-Super | Open-source | 80.0 | 86.8 | 73.1 | 82.8 | 87.3 | 78.2 | 58.1% |
| Cosmos3-Nano | Open-source | 79.4 | 85.8 | 73.0 | 82.7 | 87.2 | 78.1 | 58.4% |
| Wan2.2-A14B | Open-source | 78.0 | 83.2 | 72.8 | 81.3 | 85.3 | 77.3 | 50.7% |
| HunyuanVideo-1.5 | Open-source | 76.5 | 80.9 | 72.0 | 81.7 | 85.9 | 77.6 | 46.0% |
| Cosmos-Predict2.5-2B | Open-source | 76.5 | 79.9 | 73.2 | 81.2 | 84.6 | 77.9 | 46.4% |
| Cosmos-Predict2.5-14B | Open-source | 76.4 | 79.5 | 73.2 | 81.1 | 84.0 | 78.1 | -- |
| Wan2.1-14B | Open-source | 76.4 | 80.1 | 72.7 | 80.2 | 83.6 | 76.8 | -- |
| Wan2.2-5B | Open-source | 76.3 | 79.6 | 73.0 | 81.0 | 84.6 | 77.4 | -- |
| Veo-3.1 | Closed-source | 79.1 | 85.2 | 72.9 | 82.6 | 87.6 | 77.6 | 56.3% |
| Seedance-1.5-Pro | Closed-source | 76.9 | 82.1 | 71.6 | 80.8 | 84.7 | 76.9 | 58.4% |
| Wan 2.6 | Closed-source | 78.6 | 85.2 | 72.0 | 81.9 | 85.9 | 77.8 | 60.7% |

⟨由文本抽取重建，需对照 PDF 复核⟩（三列组标题为 `Overall / Domain / Quality (↑)`，RBench 列为 `Image2Video (↑) Score`；本表已用 `pdftotext -table` 逐行复核归属）

**RBench。** RBench（Deng et al., 2026）在具身任务场景中评测视频生成，强调机器人与物体交互中的任务正确性与物理合理性，而非纯粹的感知真实感。PAIBench-G 广泛覆盖 Physical AI 各领域，而 RBench 则更深入地研究机器人这一关键的 Physical AI 用例，通过在多样化机器人形态上生成物理连贯的操作序列来对模型施压。该基准包含 650 个图文评测样例，来自两个互补的划分：250 个任务导向对，覆盖五个类别（Common Manipulation、Long-horizon Planning、Multi-entity Collaboration、Spatial Relationship、Visual Reasoning）；以及 400 个具身特定对，覆盖四种机器人形态（Dual-arm、Humanoid、Single-arm、Quadruped）。提示词取自 RoVid-X（Deng et al., 2026），这是一个覆盖 1,300 多种技能、包含 4M 机器人片段的精选语料库。每个视频在 Task Completion（TC，物理-语义合理性与任务遵循一致性的平均值）与 Visual Quality（VQ，机器人主体稳定性与运动平滑度的惩罚性组合）上打分，最终分数为全部 650 个样例上两者的均值。RBench 与人工判断在 25 个被评测模型上的 Spearman 相关系数为 ρ = 0.96，为具身生成质量提供了可靠的信号。对每个提示，我们用单一随机种子生成视频，并在 720p 分辨率、16:9 宽高比、121 帧的条件下评测。Tab. 12 报告了 Cosmos 3 在 RBench 上的图生视频结果——Cosmos 3 成为最佳开源模型。

如 Tab. 12 所示，Cosmos3-Super 在 T2V 与 I2V 两项 PAIBench-G overall 分数上均为所有模型（包括闭源模型）中最高，而 Cosmos3-Nano 在 RBench 上追平了次优结果。两个 Cosmos 3 变体也显著超越了它们的 Cosmos-Predict2.5 前代，体现了全模态架构带来的收益。尽管两个基准都把物理合理性纳入打分，但并未对其进行深度探测。因此我们转向 Physics-IQ，以定向评测物理遵循程度。

> Table 13: Physics-IQ 基准结果，按条件模式划分。WMReward (BoN) 表示使用 WMReward（Yuan et al., 2026）进行 best-of-N 重排序。Physics-IQ 分数越高越好。Cosmos3-Super 在 I2V 与 V2V 上、以及在使用与不使用 WMReward+BoN 的情况下均取得了最先进结果。加粗表示该列组最优，下划线表示次优。

**(a) Image-to-Video (I2V)。**

| Model | Mode | Score (↑) |
|---|---|---|
| Cosmos3-Super | I2V + WMReward (BoN) | 48.9 |
| Cosmos3-Nano | I2V + WMReward (BoN) | 43.8 |
| Sora2 (Closed-sourced) | I2V + WMReward (BoN) | 46.4 |
| Wan2.2-A14B (Open-sourced) | I2V + WMReward (BoN) | 44.4 |
| Cosmos3-Super | I2V | 43.8 |
| Cosmos3-Nano | I2V | 40.2 |
| Sora2 (Closed-sourced) | I2V | 42.3 |
| Wan2.2-A14B (Open-sourced) | I2V | 38.3 |

**(b) Video-to-Video (V2V)。**

| Model | Mode | Score (↑) |
|---|---|---|
| Cosmos3-Super | V2V + WMReward (BoN) | 63.4 |
| Cosmos3-Nano | V2V + WMReward (BoN) | 57.7 |
| Magi-1 (Open-sourced) | V2V + WMReward (BoN) | 62.6 |
| Cosmos3-Super | V2V | 59.7 |
| Cosmos3-Nano | V2V | 50.2 |
| Magi-1 (Open-sourced) | V2V | 56.0 |
| Video-GPT (Open-sourced) | V2V | 35.0 |
| VideoPoet (Closed-sourced) | V2V | 29.5 |

⟨由文本抽取重建，需对照 PDF 复核⟩（(a) 与 (b) 两个子表在原 PDF 中左右并排；已逐行复核归属）

**Physics-IQ。** Physics-IQ（Motamed et al., 2026）通过让模型以一个真实世界的起始上下文为条件，并对生成的后续内容与真实物理结果的接近程度打分，来评测视频生成模型是否掌握了物理原理。与把物理合理性作为众多评分组件之一的 PAIBench-G 和 RBench 不同，Physics-IQ 将其隔离为唯一的评测轴，度量生成的运动是否在精确的空间与时间维度上匹配真实物理结果。Physics-IQ 覆盖五个物理类别——固体力学、流体动力学、光学、热学与磁学——涉及从三个固定视点拍摄的 396 个真实场景，并为文本条件模型配备配对的文本描述。它支持两种评测模式。在 image-to-video（I2V）中，模型以单个 switch frame（切换帧）加一个可选文本提示为条件，预测随后的运动。在 video-to-video（V2V）续写中，模型以一个 3 秒条件视频加一个可选文本提示为条件，预测接下来 5 秒的运动。生成的视频会沿四个互补轴与真实物理续写进行比较（空间重叠、时间对齐、量级加权的空间一致性、像素级误差），并由 real-vs-real 上界归一化为单一的 0–100 分数，可直接跨模型、跨条件模式比较。

我们在 Tab. 13 中于 I2V 与 V2V 两种模式下评测 Cosmos3-Super，并将其与两种模式下领先的开源与商业基线并列。对于 V2V，我们使用完整的 3 秒条件视频作为输入。我们还使用了一个提示词上采样器，遵循与 PhyT2V（Xue et al., 2025）类似的迭代精化策略，从 I2V 设置中的切换帧、以及 V2V 设置中的 3 秒条件视频生成文本提示。依照公开 Physics-IQ 排行榜与 WMReward 推理时对齐协议（Yuan et al., 2026），我们额外为 Cosmos3-Super 在 I2V 与 V2V 两种模式下运行了 WMReward + best-of-N（BoN）分数。从 Tab. 13 我们发现，Cosmos3-Super 在 I2V 上达到最先进：其直接得分 43.8 超过了各直接 I2V 基线，而 WMReward+BoN 进一步把分数提升到 48.9，高于所列最强的带 WMReward+BoN 的 I2V 基线。在 V2V 上，Cosmos3-Super 同样达到最先进，直接得分为 59.7，使用 WMReward + BoN 为 63.4，高于所列最强的带 WMReward+BoN 的 V2V 基线。

尽管自动化评测指标在衡量质量、提示对齐与物理合理性方面很有价值，但即使是最强的基于 VLM 的指标也会漏掉某些伪影与失效案例。人工评测在两个方面补充自动化指标：对自动化协议系统性地漏掉的长尾失效的覆盖，以及在更宽分数区间上的可区分性。例如，在同一提示集上，被评测的 T2V 生成器在人工评测上横跨 10 分，而可比的自动化 PAIBench-G overall 分数只横跨 4 分（见 Appendix F）。因此我们用两个人工评测协议来补充自动化结果：Cosmos HUE，面向广泛的 Physical AI 视频生成；以及 Human World Bench（HWB），专门聚焦任务级指令下的逼真人体运动。

> Table 14: 在 Cosmos HUE 与 Human World Bench（HWB）上的人工评测结果。Cosmos HUE 通过四个维度上的原子化二值核验来评测广泛的 Physical AI 视频生成质量；HWB 通过指令遵循率与物理通过率来评测任务级指令下的逼真人体运动。Ground Truth 一行为配对相同提示的真实视频得分，作为 Cosmos-HUE 的上界参考。在开源模型中，Cosmos3-Super 取得最高的 HUE T2V 分数与最高的 HWB 分数。完整的分维度 HUE 排行榜见 Appendix F。加粗表示该列最优；下划线表示次优。

| Model | Type | Cosmos HUE Text-to-Video (↑) | Cosmos HUE Image-to-Video (↑) | Human World Bench Image-to-Video (↑) |
|---|---|---|---|---|
| Ground Truth | -- | 93.6 | 94.4 | -- |
| Cosmos3-Super | Open-sourced | 89.3 | 89.6 | 71.9 |
| Cosmos3-Nano | Open-sourced | 87.6 | 88.6 | 66.9 |
| Wan2.2-A14B | Open-sourced | 88.2 | 88.4 | 60.7 |
| HunyuanVideo-1.5 | Open-sourced | 86.5 | 85.6 | 54.7 |
| Wan2.1-14B | Open-sourced | 84.0 | 83.9 | 33.1 |
| Wan2.2-5B | Open-sourced | 80.8 | 80.4 | 25.4 |
| Cosmos-Predict2.5-14B | Open-sourced | 82.1 | 83.0 | 38.7 |
| Cosmos-Predict2.5-2B | Open-sourced | 81.8 | 82.6 | 32.8 |
| Veo-3.1 | Closed-sourced | 91.3 | 89.7 | 67.8 |
| Seedance-1.5-Pro | Closed-sourced | 90.0 | 87.6 | -- |

⟨由文本抽取重建，需对照 PDF 复核⟩（已用 `pdftotext -table` 逐行复核归属）

**Cosmos HUE。** Cosmos HUE（HUman Evaluation，人工评测）是一项以同一 PAIBench-G 提示集（Sec. 6.2.2）为基础的打分工协议。HUE 在两个方面偏离以往的人工评测协议。第一，它用原子化二值核验取代主观的 Likert 量表打分：每个视频被分解为一组单一事实的 Yes / No / Unclear 问题，且问题的措辞保证"是"始终表示期望的结果，从而把标注员的任务从整体判断转变为客观的事实核验。每个 (视频, 问题) 对由两名标注员独立评级，分歧上报给一名质量控制复核员。第二，逐提示的问题集由一个三层 VLM 流水线自动生成：Domain Strategist 把提示分类到七个 Physical AI 领域之一；Scene Parser 从提示（T2V）或从配对真实参考视频的采样帧（I2V）生成结构化的场景清单；Auditor 输出最终的原子问题。这确保问题追踪的是实际的提示与参考场景，而非静态评分细则。三层全部运行在 GPT 5.2 上。VLM 生成的问题集随后再由一轮人工复核补充：复核员检查排名靠前模型生成的视频，并提出针对自动化流水线尚未覆盖的失效模式的额外问题；这些被提议的问题会被回灌进问题库。评测集由从 PAIBench-G 中采样、保持其原生领域分布的 100 个固定提示构成，每个模型对每个提示生成 5 个随机种子样本，即每个模型 500 个视频；逐提示的问题集（最多 20 个二值问题）应用于全部 5 个生成视频。每个问题被归类到四个维度之一："Semantic Alignment"、"Physical Laws"、"Geometric Reasoning" 与 "Visual Integrity"。分维度、分领域的 T2V 与 I2V 排行榜、正式计分方案与信度估计详见 Appendix F。

**Human World Bench（HWB）。** 虽然 Cosmos HUE 评测广泛的 Physical AI 视频生成，Human World Bench（HWB）聚焦于一个更定向、更具挑战性的设置：在任务级指令下、面向人类操作任务的 egocentric（第一人称）图生视频生成。HWB 的基准视频取自 EgoVerse（Punamiya et al., 2026），共包含 180 个样例。HWB 使用一种绝对失效模式协议：标注员独立判断每个生成视频的指令遵循情况与物理合理性。我们报告两个顶层通过率。Instruction following（指令遵循）衡量视频是否描绘了所请求的动作与物体。Physical plausibility（物理合理性）衡量时间连贯性与物理合理性，包括物体动力学、接触与手部解剖结构。HWB 分数是指令遵循通过率与物理通过率的平均值。

Tab. 14 报告了 Cosmos-HUE 在 T2V 与 I2V 上的分数，以及 Human World Bench（HWB）结果。在 HUE T2V 上，Cosmos3-Super 以 89.3 成为最佳开源模型，落后于闭源的 Veo-3.1（91.3）与 Seedance-1.5-Pro（90.0）。在 HUE I2V 上，Cosmos3-Super 再次成为最佳开源模型，并与领先的闭源生成器基本持平，仅比 Veo-3.1 低 0.1 分（89.6 对 89.7）。Cosmos3-Nano 也颇具竞争力，在 I2V 上位列开源模型第二（88.5），在 T2V 上位列第三（87.6）。在 HWB 上，Cosmos3-Super 取得 71.9，是 Tab. 14 中所评测全部模型中的最先进分数，比所列最强的闭源基线 Veo-3.1（67.8）高 4.1 分，比最强的非 Cosmos 开源基线 Wan2.2-A14B（60.7）高 11.2 分。Cosmos3-Nano 也以 66.9 表现强劲，位列开源模型第二，并超越所有非 Cosmos 开源基线。两个 Cosmos 3 变体合计拿下 HWB 上开源模型的前两名，展示了在两种模型规模上强大的第一人称人体运动生成能力。

> Figure 19: Cosmos3-Super-Image2Video 是众包竞技场排名中最佳的开源权重模型。Cosmos3-Super-Image2Video 在 Artificial Analysis Image to Video Leaderboard（No Audio）上位列开源权重模型第 1 名（计入闭源模型则排名第 22）（日期：2026-05-28）。

**Artificial Analysis Image-to-Video Leaderboard。** 为了在真实世界场景下评测 Cosmos 3，我们把专用的 I2V 模型 Cosmos3-Super-Image2Video 提交到 Artificial Analysis Image-to-Video 排行榜（No Audio）参与众包公开投票。该模型在所有开源权重模型中排名第一，并在计入专有模型后的全球排名中位列第 22。特别地，该模型与 Veo 3.1（Google DeepMind, 2025b）和 Wan 2.5（Wan et al., 2025b）这样的专有产品不相上下，展示了其出色的时序动力学与视觉保真度。

---

## 6.2.3 音频生成评测（Audio Generation Evaluation）

文本到音频-视觉的生成必须满足两个视频专属基准无法捕捉的要求。生成的音频应包含提示所请求的声音事件，并且这些事件应可归因于正确的视觉来源、且具有合理的时间安排。因此我们使用 Cosmos-SoundBench 来评测音频生成，这是一个面向音频-视觉提示遵循与同步的定向基准。该指标把语义层面的音频-视觉正确性与"不看提示"的音频保真度分离开来。一个样例可能包含了正确时刻的正确声音、却仍存在音频伪影；也可能在声学上很干净、却漏掉了所请求的事件。

**Cosmos-SoundBench。** Cosmos-SoundBench 包含从 FoleyBench（Dixit et al., 2026）中抽取的 144 个评测提示。这些提示覆盖非语音声音类别，例如环境场景、撞击、物体交互、工具、载具、水以及其他环境效应。我们聚焦于非语音音频，因为这些信号对 Physical AI 尤为重要：接触声音揭示材质与碰撞属性，工具声音指示正在进行的动作，而环境线索则提供可能只部分可见的场景上下文。

**音视频质量指标（AVQ）。** 我们用一种结构化的 MLLM-as-judge 协议评测每个生成样例。评审只在需要某类信息的阶段才看到提示、视频与音频，从而让每个评审阶段聚焦于预期的证据，而非无关的跨模态线索。

1. **提示清单构建（Prompt checklist construction）。** 在检查任何生成媒体之前，由 Claude Opus 4.7、Gemini 3.1 Pro 与 GPT 5.5 组成的集成模型抽取所要求的前景声音、环境音频条件以及提示关键的视觉证据。我们使用多数投票来固定下游打分所用的清单。
2. **不看提示的视觉观察（Prompt-blind visual observation）。** Gemini 3.1 Pro Preview 在不知道提示的情况下描述可见实体、动作、场景上下文与可能的声源。这些观察为来源归因与时间对齐提供证据，而不是一个独立的视觉质量分数。
3. **语义音视频打分（Semantic audiovisual scoring）。** 评审评估所请求的声音是否存在、是否来源特定、是否动态上恰当、是否与可见或合理的动作对齐。这些检查被映射到语义音频正确性（SA）、音视频对齐（AVAlign）与提示关键视觉支撑（VisualSupport），并按下式组合：

   > SAV = 0.60 × SA + 0.30 × AVAlign + 0.10 × VisualSupport.

   我们把该阶段运行三次并对分数取平均，以考虑评审的变异性。

我们额外测量 audiobox-aesthetics 的 Production Quality（PQ）作为感知音频质量的代理指标，因为它试图量化样本级的清晰度与保真度、动态范围、频带宽度与空间化（Tjandra et al., 2025）。

最终的音视频质量分数为：

> AVQ = 0.5 × SAV + 0.5 × AQ.

对每个模型，我们对每个提示评测 5 个随机种子生成。对于 Cosmos 3 模型，我们使用 Claude Opus 4.6 把 SoundBench 提示改写为 Sec. 6.3.1 与 Sec. 6.3.2 所述的结构化生成格式，以匹配生成器所使用的提示分布。

Tab. 15 显示，最强的闭源系统在整体 AVQ 上仍保有一定优势，主要通过更高的感知音频质量实现。Seedance-1.5-Pro 取得最佳的 AVQ（7.64）与 PQ（7.06），其后是 Veo-3.1（7.45 AVQ，6.68 AQ）。相比之下，Cosmos 3 在衡量声音是否匹配视觉事件的语义与对齐组件上最强。Cosmos3-Nano 取得最佳的 SAV、SA 与 AVAlign 分数，而 Cosmos3-Super 取得最佳的视觉支撑分数。这一模式表明 Cosmos 3 的中期训练在把声音事件锚定到生成视频方面是有效的，剩余的提升空间集中在底层音频保真度上。Fig. 20 展示了 Cosmos3-Nano 生成结果中视觉与声学事件强时间对齐的一个示例。

> Figure 20: 音频-视频事件对齐。来自一次 Cosmos3-Nano 生成的若干选定帧与所生成音频的频谱图配对。彩色帧标记锤击时刻，其时间标记与尖锐的频谱瞬态重合。灰色帧展示的是两次敲击之间的非接触时刻，此处未观察到可比的声学瞬态。这一对比提供了定性证据：声学瞬态与视觉撞击时刻对齐，而非与中间运动过程对齐。

> Table 15: Cosmos-SoundBench 音视频质量。我们报告整体音视频质量（AVQ）、语义音视频质量（SAV）、其在 Sec. 6.2.3 中定义的各子分数，以及 audiobox-aesthetics Production Quality（PQ）。加粗标记每列最佳分数，下划线标记次佳。Seedance-1.5-Pro 凭借更强的 PQ 取得最高 AVQ，而 Cosmos 3 取得最强的语义音频-视觉锚定与对齐。

| Model | Type | AVQ | SAV | SA | AVAlign | Visual Sup. | PQ |
|---|---|---|---|---|---|---|---|
| Cosmos3-Super | Open-sourced | 7.31 | 8.34 | 8.30 | 8.14 | 9.18 | 6.28 |
| Cosmos3-Nano | Open-sourced | 7.34 | 8.35 | 8.33 | 8.16 | 9.10 | 6.32 |
| LTX-2.3 | Open-sourced | 7.10 | 7.80 | 7.86 | 7.58 | 8.12 | 6.39 |
| Seedance-1.5-Pro | Closed-sourced | 7.64 | 8.21 | 8.22 | 8.06 | 8.61 | 7.06 |
| Veo-3.1 | Closed-sourced | 7.45 | 8.21 | 8.21 | 8.01 | 8.85 | 6.68 |
| LTX-2.3 Pro | Closed-sourced | 7.32 | 7.93 | 7.96 | 7.74 | 8.35 | 6.70 |
| Wan2.6 | Closed-sourced | 7.23 | 7.90 | 7.99 | 7.54 | 8.45 | 6.55 |
| Sora 2 | Closed-sourced | 6.90 | 7.94 | 7.97 | 7.70 | 8.49 | 5.85 |

⟨由文本抽取重建，需对照 PDF 复核⟩（列标题为 `SoundBench Audiovisual Quality (↑)`；已复核归属）

---

## 6.2.4 转换生成评测（Transfer Generation Evaluation）

**双权重无分类器引导。** 视频转换同时以一个结构化文本提示和一个控制视频为条件，而字幕保真度与结构遵循之间的最优平衡在不同模态上各不相同。为了独立控制这两个因素，我们使用一种带独立权重的双权重无分类器引导方案：一个权重用于控制视频，一个权重用于文本提示。

在每个去噪步骤，我们对去噪器求值三次——同时带两个条件、只带提示（丢弃控制视频）、以及保留控制视频但把提示替换为一个固定的负字幕（negative caption）。随后我们组合这些预测，使得控制权重从"仅提示"预测向"全条件"预测外推（强化结构控制），而文本权重则朝远离负提示预测的方向外推（强化字幕保真度）。把这两个权重作为独立旋钮暴露出来，让我们可以把每个模态调到各自的质量-保真度最佳点；我们发现这种因子化的引导比标准的单引导公式更有效。

> Table 16: PAIBench-C 单控制结果。每次生成以一个四选一的模态（depth、segmentation、blur 或 edge）为条件，并用相应的基于真值的指标打分：Depth si-RMSE（预测深度与参考深度之间的尺度无关均方根误差）、Seg. mIoU（预测分割掩码与参考分割掩码的平均交并比）、Blur SSIM（预测模糊图与参考模糊图的结构相似度）、Edge F1（预测边缘图与参考边缘图的 F1 分数）。DOVER 是一个无参考的感知视频质量分数，在四种单模态生成上取平均。Depth si-RMSE：越低越好；DOVER、Seg. mIoU、Blur SSIM 与 Edge F1：越高越好。加粗表示每列最佳结果。

| Model | DOVER ↑ | Seg. mIoU ↑ | Blur SSIM ↑ | Edge F1 ↑ | Depth si-RMSE ↓ |
|---|---|---|---|---|---|
| Cosmos3-Super | 10.14 | 0.71 | 0.91 | 0.50 | 0.58 |
| Cosmos3-Nano | 10.39 | 0.72 | 0.91 | 0.49 | 0.62 |
| Cosmos-Transfer2.5 | 9.49 | 0.68 | 0.90 | 0.45 | 0.68 |

⟨由文本抽取重建，需对照 PDF 复核⟩（箭头方向已由 `pdftotext -table` 确认）

**通用视频转换。** 我们在 PAIBench-C（NVIDIA, 2025c）上评测视频转换，这是一个控制条件的视频到视频基准，覆盖四个空间控制模态：blur、edge、segmentation 与 depth。该基准包含 600 个片段，跨越三个 Physical AI 领域：来自 AgiBot World（Bu et al., 2025）的 200 个机械臂操作片段、来自 OpenDV（Yang et al., 2024）的 200 个驾驶片段，以及来自 Ego-Exo-4D（Grauman et al., 2024）的 200 个第一人称日常生活的片段。

对每个样例，模型接收一个文本提示与一个控制视频，必须生成一段遵循控制、同时保留提示所描述场景语义的写实视频。我们报告单控制设置（每个样例恰好一个模态），以便每个模态的贡献都能被孤立地度量。质量评估的方式是从生成视频与参考视频中重新提取相关控制信号，并在对应空间中比较它们（双边滤波后的 blur SSIM、Canny edge F1、在估计深度上的尺度无关 RMSE、在开放词表分割掩码上的 mIoU），再加上 DOVER（Wu et al., 2023a）作为一个与内容无关的感知真实度度量。

我们把 Cosmos 3 与 Cosmos-Transfer2.5 基线进行比较，后者通过每个模态一条专用 ControlNet（Zhang et al., 2023）分支来处理不同模态。需要注意的是，Cosmos 3 取而代之是一个统一模型，它在输入序列中同时消费控制视频与文本提示，无需按模态的 ControlNet 适配器即可原生支持任意模态组合。

Tab. 16 显示，尽管四条专用 ControlNet 分支被折叠进单一统一骨干，Cosmos 3 仍通过其两个变体之一在所有模态上追平或超过 Cosmos-Transfer2.5：Cosmos3-Nano 在感知质量（DOVER）与分割上领先，而 Cosmos3-Super 拿下几何上要求更高的 edge 与 depth 任务。三个模型在 blur SSIM 上基本持平，而该指标已接近其上界饱和。这些结果表明，按模态的 ControlNet 适配器并非强控制保真度的先决条件——单一统一骨干原生支持全部四种空间控制，并在每一项指标上、以两个规模之一击败专用适配器基线。

**自动驾驶。** PAIBench-C 由一个 AV 专用基准补充：486 个单视角驾驶片段（NVIDIA, 2025b），用于 world-scenario-map 条件的视频转换，称为 AVBench-C。控制输入是驾驶场景的相机视角渲染，它把静态地图结构（车道线、道路边界、交通信号灯与交通标志）与所有场景物体（车辆、行人及其他代理，含静止与运动）结合在一起。给定这一渲染场景以及一个文本提示，模型必须产生与两个输入都一致的写实驾驶视频。我们用自动评测与人工评测两种方式评估结果：

- **AVBench-C 自动评测。** 我们用三个基于真值的自动检查器评测每次生成。egomotion 检查器使用视觉里程计计算每行驶一米的轨迹漂移。物体对应检查器把场景实体与控制输入匹配，将动态参与者与渲染轨迹比对、将静态结构与投影地图比对。environment 检查器使用一个 VLM 评审对提示级的驾驶条件打分，包括天气、时段、区域与路面状态。
- **AVBench-C 人工评测。** 受训标注员沿两个轴以 1–3 分对每个生成视频评级。video quality 轴衡量整体真实度：3 表示纹理写实且代理行为时间上一致，2 表示轻微形变或短暂的时间卡顿，1 表示明显不真实的动力学或低质量纹理。lane line 轴衡量对 world-scenario map 的保真度：标注员把生成结果与一张预期道路布局的参考叠加图一起观看，如果车道、交叉口与实体大多在正确位置则给 3，如果少数车道缺失但多数实体放置正确则给 2，如果多数车道或交叉口缺失或实体错放则给 1。

Tab. 17 显示，Cosmos 3 通过其两个变体之一在每一项驾驶场景指标上追平或超过 Cosmos-Transfer2.5。在自动侧，三个模型的自车轨迹漂移都一致地很小，且 Cosmos3-Nano 在动态物体对应上进一步领先；而静态结构与环境一致性基本持平，并已接近该指标上界饱和。人工评测强化了这一图景：Cosmos3-Super 与 Cosmos3-Nano 提供显著更高的视频质量（2.86 与 2.82，对 2.59），而车道线保真度在三个模型间可比（差异在 ±0.05 以内）。综合来看，这些结果表明 Cosmos 3 在保持几何与结构保真度的同时，提供了质量明显更高的驾驶场景生成，并在每一项指标上、以两个规模之一击败基线。Fig. 21 展示了由 Cosmos3-Nano 从相应控制输入生成的驾驶场景视频的定性示例。

> Figure 21: 驾驶场景 Video Transfer 结果。Cosmos3-Nano 从对应的 720p 控制视频（上排）生成帧（下排）。控制视频编码了 HD map 元素——车道、路面标线、立杆与交通灯（含带状态与不带状态）——它们共同表示复杂的道路拓扑（包括高架桥），以及以立方体表示的参与者。每个立方体按一个粗略的类别本体着色（例如 truck、vehicle、pedestrian），并以明暗区分前后朝向。

> Table 17: AVBench-C 评测分数。我们同时报告自动评测与人工评测结果。Auto 分数由三个基于真值的检查器计算：Ego drift（越低越好）为视觉里程计轨迹漂移；Dyn. Obj. 与 Static Obj.（越高越好）衡量场景实体与控制输入的接近程度；Environment（越高越好）是提示级驾驶条件的 VLM 评审分数。Human 分数是受训标注员沿两个轴给出的 1–3 评级：Video quality 衡量整体真实度（纹理、代理行为与时间一致性），Lane line 衡量对 world-scenario map 的保真度（车道、人行横道与实体的正确放置）。两个人工指标均为越高越好。加粗表示每列最佳结果。

| Model | Ego drift ↓ | Dyn. Obj. ↑ | Static Obj. ↑ | Environment ↑ | Video quality ↑ | Lane line ↑ |
|---|---|---|---|---|---|---|
| Cosmos3-Super | 0.003 | 0.64 | 0.41 | 0.90 | 2.86 | 2.45 |
| Cosmos3-Nano | 0.003 | 0.67 | 0.41 | 0.90 | 2.82 | 2.50 |
| Cosmos-Transfer2.5-AV-Singleview | 0.008 | 0.62 | 0.42 | 0.90 | 2.59 | 2.47 |

⟨由文本抽取重建，需对照 PDF 复核⟩（原表分为 Automatic evaluation / Human evaluation 两个列组；`-layout` 抽取中 Dyn. Obj. 与 Lane line 数值曾错位，已用 `pdftotext -table` 修正）

---

## 6.2.5 动作生成评测（Action Generation Evaluation）

我们评测动作中期训练是否赋予 Cosmos 3 一个可跨领域、跨推理模式复用的世界-动作先验。核心问题是：统一的动作中期训练是否能加速对领域特定动作接口的适配，以及一段短的后训练能否把共享基座模型变成与最先进领域基线相当、或更强的专用模型。Tab. 18 报告在相机运动、自动驾驶、机器人与第一人称运动领域上的结果，覆盖前向与逆向动力学设置。Tab. 19 报告机器人策略设置上的结果，评测 Cosmos 3 完成语言指定任务的能力。

> Table 18: 跨领域的前向与逆向动力学后训练比较。FD 表示前向动力学，ID 表示逆向动力学。PT-init 从通用的 Cosmos 3 预训练检查点初始化，MT-init 从中期训练检查点初始化。领域专用基线仅在其对应的应用上报告，而 Cosmos 3 变体在所有被评测的动作设置上进行比较。加粗表示该列最优，下划线表示次优。

| Model | AV (ID) RRE (°, ↓) | AV (ID) RTE (m, ↓) | AV (ID) ATE (m, ↓) | Camera Motion (FD) RRE (°, ↓) | Camera Motion (FD) RTE (m, ↓) | Camera Motion (FD) ATE (m, ↓) | Egocentric Motion (FD) PSNR (↑) | Robotics (FD) PSNR (↑) |
|---|---|---|---|---|---|---|---|---|
| Cosmos3-Super (MT-init) | 0.232 | 0.014 | 0.90 | 0.142 | 0.026 | 0.99 | 16.19 | 26.04 |
| Cosmos3-Nano (MT-init) | 0.211 | 0.014 | 0.98 | 0.147 | 0.029 | 1.24 | 16.12 | 25.52 |
| Cosmos3-Super (PT-init) | 0.284 | 0.018 | 1.32 | 0.293 | 0.036 | 1.82 | 15.34 | 22.69 |
| Cosmos3-Nano (PT-init) | 0.249 | 0.017 | 1.20 | 0.172 | 0.034 | 1.61 | 15.22 | 23.24 |
| Lingbot-World | - | - | - | 0.299 | 0.057 | 2.88 | - | - |
| HY-World1.5 | - | - | - | 0.377 | 0.042 | 1.39 | - | - |
| VGGT | 0.596 | 0.768 | 23.46 | - | - | - | - | - |
| DepthAnything3 | 0.312 | 0.354 | 9.29 | - | - | - | - | - |
| LOME | - | - | - | - | - | - | 9.36 | - |
| Ctrl-World | - | - | - | - | - | - | - | 22.99 |

⟨由文本抽取重建，需对照 PDF 复核⟩（原表列组为 Autonomous Vehicle (ID) / Camera Motion (FD) / Egocentric Motion (FD) / Robotics (FD)；`-layout` 抽取中 PT-init 与 MT-init 行曾整体错位一行，已用 `pdftotext -table` 修正）

**设置。** 对每个下游领域，我们比较两种初始化协议。第一种是预训练初始化（PT-init），从 Cosmos 3 预训练检查点开始，该检查点未在动作领域数据上训练过。第二种是中期训练初始化（MT-init），从我们的中期训练检查点开始，该检查点已见过跨越多个领域与预测模式的动作数据，包括前向动力学（FD）、逆向动力学（ID）与策略。对每次比较，我们使用相同的训练配方，并保持模型大小、数据与算力预算固定。我们同时报告 Cosmos3-Nano 与 Cosmos3-Super 的结果。

**指标。** 我们为每个动作接口报告相应指标。对于自动驾驶车辆的逆向动力学，相对旋转误差（RRE）与相对平移误差（RTE）衡量逐帧位姿精度，而绝对轨迹误差（ATE）衡量全局轨迹一致性。我们也用这些指标衡量相机运动前向动力学中的相机跟随精度，比较真值相机位姿与从生成视频中估计出的相机轨迹。对于机器人与第一人称前向动力学，PSNR 衡量动作条件下未来观测的重建质量。尽管一段合理的生成 rollout 不必与唯一记录的真值未来在像素上完全一致，但我们发现 PSNR 在相对较短的时间跨度内是一个有用的代理指标，可反映时间对齐、运动一致性与重建保真度。对于机器人策略，成功率衡量被成功完成的评测任务百分比。

**自动驾驶车辆（ID）。** 我们使用一个内部驾驶数据集评测 Cosmos 3 的逆向动力学能力，该数据集由 6 秒视频片段组成，带有 10 FPS 的精确自车轨迹。在这一设置下，模型直接从视频输入预测自车轨迹。我们将本方法与两个最先进的通用领域基线比较：VGGT（Wang et al., 2025b）与 DepthAnything3（Lin et al., 2025b）。如 Tab. 18 所报告，以 PT-init 初始化的 Cosmos3-Nano 与 Cosmos3-Super 都优于基线。对 Cosmos3-Nano 应用 MT-init 带来进一步提升。值得注意的是，用专用驾驶数据训练得到的方法在米制尺度的平移估计上表现好得多，而通用领域基线则受漂移误差之苦。总体而言，这些结果表明面向 physical AI 的视频模型只需极少适配就能在特定具身应用中表现出色。定性结果可视化于 Fig. 22。

> Figure 22: 自动驾驶车辆逆向动力学比较。我们从不同方法由输入视频估计的自车轨迹进行定性比较，红色轨迹表示真值。Cosmos3-Nano (MT-init) 展示了估计准确、米制尺度自车位姿的能力。

**相机运动（FD）。** 相机条件的视频生成可作为许多应用的世界仿真。我们让模型在给定一张初始图像与一条指定相机轨迹时预测未来帧。为了量化相机跟随精度，我们利用 DepthAnything3（Lin et al., 2025b）从生成视频中估计米制尺度的相机轨迹，并与条件输入比较。如果生成视频与条件轨迹高度一致，那么从预测序列估计出的位姿就应当与输入位姿紧密匹配。我们在一个内部数据集上把本方法与 Lingbot-World（Robbyant et al., 2026）与 HY-World 1.5（HunyuanWorld, 2025）的双向模型作为基准比较；该数据集包含一百个 5 秒的真实视频片段，其相机运动由 DepthAnything3（Lin et al., 2025b）估计。定性结果报告于 Fig. 23。结果显示，带 PT-init 的 Cosmos3-Nano 与 Cosmos3-Super 已经提供稳健的相机控制。MT-init 进一步改善结果：Cosmos3-Super 达到 0.142° RRE、0.026 m RTE 与 0.99 m ATE，在全部三项指标上超过 Lingbot-World（0.299° RRE、0.057 m RTE、2.88 m ATE）与 HY-World 1.5（0.377° RRE、0.042 m RTE、1.39 m ATE）。

> Figure 23: 相机前向动力学比较。给定复杂的真实轨迹，Cosmos3-Nano（MT-init）在生成视频中忠实复现了相同的相机运动。对每个运动示例，第一行显示接近序列开始处的帧，第二行显示接近序列结束处的帧。向下的箭头表示从开始到结束的时间推进，其旁的文字指定所命令的相机运动。

**第一人称运动（FD）。** 我们在前向动力学设置下评测来自 Human World Bench（HWB，见 Sec. 6.2.2）的视频。我们使用 HWB 的动作标注，它同时包含相机自运动与手部运动跟踪，并报告生成视频的 PSNR。我们把 PT-init 与 MT-init 两种检查点都适配到第一人称领域，并与 LOME（Gao et al., 2026a）比较——后者是近期一个专门面向第一人称手部操作数据的动作条件视频生成方法。尽管 LOME 是该设置下最接近的可用基线之一，但它在 HWB 上表现很差，PSNR 值为 9.36dB，这可能源于其训练数据与 HWB 基准之间的分布偏移。相比之下，Cosmos 3 在两个模型规模与两种初始化协议上都取得明显更高的 PSNR。使用 PT-init 时，Cosmos3-Nano 达到 15.22dB 的 PSNR 值，Cosmos3-Super 达到 15.34dB 的 PSNR 值。从 MT-init 开始可进一步提升到 Cosmos3-Nano 16.12dB、Cosmos3-Super 16.19dB 的 PSNR 值。这些结果表明 MT-init 提供了一致的增益，说明统一的动作中期训练为第一人称前向动力学提供了一个明显更强的起点。总体而言，这些结果支持了统一动作中期训练的核心假设：跨机器人本体、相机运动、自动驾驶车辆运动与第一人称运动的协同训练会诱发一个可迁移的动作领域先验，从而在第一人称领域实现更快的收敛与更强的下游适配。

**机器人（FD）。** 机器人前向动力学解锁了诸如用视频模型做策略评估等应用。我们在 DROID 数据集（Khazatsky et al., 2024）上做实验，这是一个大规模真实机器人操作数据集，场景与物体多样。给定一帧初始图像与大小为 16 的机器人末端执行器动作块，模型预测随后的 16 帧。我们在 DROID 数据集上对 PT-init 与 MT-init 两种检查点都做后训练。我们以 Ctrl-World（Guo et al., 2026）作为主要基线进行比较。定性结果见 Fig. 24，定量结果见 Tab. 18。如 Tab. 18 所示，从预训练检查点开始的后训练在 Nano 规模上已能追平基线，达到 23.24dB 的 PSNR 值，而 Ctrl-World 为 22.99dB。从中期训练检查点开始的后训练带来显著更强的结果，Cosmos3-Nano 达到 25.52dB、Cosmos3-Super 达到 26.04dB 的 PSNR 值。这些结果表明 Cosmos 3 是前向动力学预测的一个强而灵活的骨干。

> Figure 24: 机器人前向动力学的定性比较。生成的帧紧密跟随动作命令，且机械臂与织物之间的交互比基线的更真实。绿色方框标出基线输出中存在可见畸变或伪影的区域，以及 Cosmos3-Nano（MT-init）中对应的区域——在这些区域中这些伪影不存在。

**机器人操作（策略）。** 为了评测策略模式，我们对 Cosmos3-Nano-Policy-DROID 进行后训练，并提交到 RoboLab 仿真基准（Yang et al., 2026a）、RoboArena 真实世界基准（Atreya et al., 2025）以及 MolmoSpaces 仿真基准（Kim et al., 2026）。如 Tab. 19、Fig. 26 与 Fig. 27 所示，我们的模型在全部三个基准上都取得了新的最先进结果，证明 Cosmos3 全模态世界模型可以被有效地后训练成强机器人操作策略。

**RoboLab**（Yang et al., 2026a）是一个高保真、与机器人和策略均无关的仿真基准，包含 120 个语言条件任务，旨在跨视觉、关系与程序性能力评测任务通用的机器人操作策略。RoboLab 在三种指令具体度层级下评测每个任务：vague 提示、default 提示与 specific 提示。这一划分测试的是对语言表述方式的鲁棒性，而非对单一规范命令的鲁棒性。在 RoboLab 上，我们后训练后的策略在任务成功率上以明显优势超越所有先前的模型（Tab. 19），包括强视觉-语言-动作（VLA）模型（如 π0.5，Physical Intelligence Team, 2025）与世界-动作模型（WAM，如 DreamZero，Ye et al., 2026），覆盖所有任务指令粒度与所有任务难度层级。例如，在 specific 任务指令下，我们的策略在 120 个任务上、每任务 10 次 rollout 取得 39.7% 的平均成功率，超过 π0.5 的 28.1% 与 DreamZero 的 25.2%。此外，与直接从预训练检查点后训练的模型 Cosmos3-Nano（PT-init）相比，我们的最终策略表现更好，证明了把多来源的动作模态数据纳入中期训练的有效性。

> Table 19: Cosmos3-Nano-Policy-DROID 在 RoboLab 上建立新的最先进水平。在 RoboLab-120 上报告任务成功率（%），按语言具体度层级与任务难度层级划分。所有策略使用在 DROID 数据集上微调过的现成检查点。加粗表示该列最优。

| Model | Overall Vague | Overall Default | Overall Specific | Simple Vague | Simple Default | Simple Specific | Moderate Vague | Moderate Default | Moderate Specific | Complex Vague | Complex Default | Complex Specific |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Cosmos3-Nano-Policy-DROID | 20.6 | 36.8 | 39.7 | 23.3 | 40.6 | 42.0 | 23.3 | 35.4 | 40.3 | 4.1 | 25.3 | 29.4 |
| Cosmos3-Nano (PT-init) | 16.7 | 28.1 | 30.2 | 17.8 | 30.3 | 32.8 | 19.0 | 28.7 | 29.5 | 7.1 | 18.2 | 21.8 |
| π0.5 | 15.2 | 28.0 | 28.1 | 16.2 | 29.7 | 29.8 | 17.9 | 31.5 | 31.0 | 5.3 | 13.5 | 14.7 |
| DreamZero | 14.9 | 25.7 | 23.9 | 15.0 | 26.1 | 25.8 | 19.5 | 30.0 | 26.7 | 4.1 | 14.1 | 10.6 |
| π0-FAST | 9.2 | 15.5 | 14.9 | 9.5 | 20.2 | 19.4 | 12.8 | 13.3 | 12.6 | 0.0 | 2.9 | 3.5 |
| paligemma-binning | 3.1 | 3.4 | 5.5 | 2.2 | 3.4 | 4.1 | 5.9 | 4.9 | 10.3 | 0.0 | 0.0 | 0.0 |
| GR00T N1.6 | 5.4 | 7.2 | 5.3 | 7.2 | 8.8 | 7.5 | 4.9 | 7.9 | 4.1 | 0.0 | 0.0 | 0.0 |
| π0 | 2.8 | 5.0 | 3.5 | 2.8 | 7.2 | 5.3 | 3.8 | 3.6 | 2.1 | 0.0 | 0.0 | 0.0 |

⟨由文本抽取重建，需对照 PDF 复核⟩（原表列组为 Overall / Simple / Moderate / Complex，每组三子列 Vague / Default / Specific。注意：`-layout` 抽取中 π 字符丢失，π0.5 / π0-FAST / π0 三行的模型名在源 txt 中显示为 `0.5` / `0-FAST` / `0`，已按 `pdftotext -table -enc UTF-8` 还原；paligemma-binning、GR00T N1.6、π0 三行在 `-layout` 中数值严重错位，本表完全依据 `-table` 抽取）

**RoboArena**（Atreya et al., 2025）是一个分布式、真实世界的基准，它使用众包的成对比较在多样化任务与真实环境上评测并排名通用机器人策略。任何拥有 DROID 平台的人都可以通过双盲 A/B 比较，在任何环境、任何任务上评测一对策略，最终分数从这些成对偏好中聚合而来，为每个策略产生一个总体评级。截至 2026 年 5 月 30 日 14:40，我们的机器人操作策略在排行榜上居首（Fig. 26），超过许多先前的强策略模型。我们预期会收到来自社区更多的评测，这将进一步验证我们的策略。在所测试的若干任务上，该策略可靠地完成任务并良好地跟随语言指令。该策略能执行简单的抓取-放置任务，也能执行需要多个顺序步骤的长时程任务。我们观察到对多样未见物体与任务的强泛化能力。该策略还能容忍失败，常在必要时重试，并在执行过程中对人类干预保持鲁棒。部分定性结果见 Fig. 25。

> Figure 25: Cosmos3-Nano-Policy-DROID 的真实世界评测。我们展示物理机器人 rollout 的快照帧。这些示例展示了我们的策略在物理机器人上、面向语言条件操作任务的成功真实世界部署。

> Figure 26: Cosmos3-Nano-Policy-DROID 在 RoboArena 上保持首位。Cosmos3-Nano-Policy-DROID 在 RoboArena 真实世界基准排行榜上排名第 1（日期：2026-05-30）。

**MolmoSpaces**（Kim et al., 2026）是一个面向通用策略评测的仿真基准，聚焦于在系统化、受控变化下的泛化。我们关注其中的操作任务，它包含两个任务集：(1) MolmoSpaces Combined 与 (2) MolmoBot Combined。MolmoSpaces Combined 集包含四个基准任务（Pick-v1、Pick & Place-v1、Open-v1 与 Close-v1），而 MolmoBot Combined 集包含七个基准任务（Pick-v1.5、Pick-v2-classic、Pick-v2-filament、Pick-v2-RandCam、Pick & Place-v2、Pick & Place-NextTo-v2 与 Pick & Place-Color-v2）。截至 2026 年 6 月 20 日，Cosmos3-Nano-Policy-DROID 在 All Combined 设置下排行榜第一，取得 39.0% 的 oracle 成功率（Fig. 27）。该模型超过了若干强先验策略模型，例如 WALL-OSS-0.5（Zhai et al., 2025）与 TiPToP（Shen et al., 2026b）。值得注意的是，我们用于 RoboLab 与 RoboArena 评测的是完全相同的模型与完全相同的超参数，未对 MolmoSpaces 做任何基准特定的调优。

> Figure 27: Cosmos3-Nano-Policy-DROID 在 MolmoSpaces 上排名第 1。Cosmos3-Nano-Policy-DROID 是 MolmoSpaces 仿真基准排行榜上排名第一的模型（日期：2026-06-20）。

**适配新本体。** 我们评测 MT-init 是否让 Cosmos3-Nano 更快地适配一个未见过的本体与环境。我们使用 LIBERO-10 环境（Liu et al., 2023a），带来自第三人称相机与腕部相机的多视角观测。我们通过每个验证任务跑 50 次 trial 来报告后训练迭代过程中的进展，即每个检查点 500 次 rollout。

> Table 20: 使用 LIBERO-10 快速适配新本体。来自 MT-init 与 PT-init 的 Cosmos3-Nano 的闭环成功率，每个检查点以 500 次 rollout 评测。结果显示 MT-init 比 PT-init 适配更快。

| Model | Iteration 500 | Iteration 1000 | Iteration 1500 | Iteration 2000 |
|---|---|---|---|---|
| Cosmos3-Nano (MT-init) | 24.6% | 91.4% | 95.8% | 97.4% |
| Cosmos3-Nano (PT-init) | 0.0% | 73.8% | 93.4% | 95.2% |

⟨由文本抽取重建，需对照 PDF 复核⟩

如 Tab. 20 所示，后训练对两种初始化都快速提升闭环操作成功率，但 MT-init 在后训练早期有明显优势。在 500 次迭代时，Cosmos3-Nano MT-init 达到 24.6% 成功率，而 Cosmos3-Nano PT-init 仍为 0.0%。到 2000 次迭代时，Cosmos3-Nano MT-init 可达到 97.4% 的成功率。这些结果表明 MT-init 能够更快地适配新的本体与环境。

**动作数据协同。** 选择哪些动作领域一起训练，是一个实际的混合设计问题：新增一个领域可以提供有用的视觉-动作先验，但它也可能稀释目标领域的监督。受近期关于语言领域迁移工作的启发（Longpre et al., 2026）——该工作度量在一种语言上训练如何惠及或干扰另一种语言——我们为动作中期训练构建了类似的迁移图谱，覆盖自运动领域（Camera Motion、Autonomous Vehicle）、机器人操作领域（Google Robot、WidowX-250、Franka Panda Single、Franka Panda Dual、AgiBot）与人类第一人称运动（Egocentric）。定量协同矩阵汇总于 Fig. 28 与 Fig. 29。FD 报告 PSNR，ID 报告 MSE。对于策略模式，我们报告 4 次 rollout 上的最小 PSNR 与 MSE，因为 rollout 分布是多峰的。在每个协同矩阵中，非对角单元格使用行领域与列领域的 50/50 混合训练 4,000 次迭代，而对角单元格是相应的单领域基线，训练 2,000 次迭代。这一设置使单领域与配对运行之间在每个领域的训练预算相匹配。每一行固定评测领域，列则在单领域或配对训练设置之间变化。正 delta 表示跨领域迁移，负 delta 表示干扰。

> Figure 28: 跨自运动与机器人操作领域的协同研究。行表示评测领域；列表示新增的协同训练领域。对角单元格是单领域基线，非对角单元格使用行-列 50/50 混合且行领域的训练暴露量相匹配。每个单元格报告分数以及相对该行对角值的 delta。绿色表示正迁移，符号已做调整，使得更高的 PSNR（↑）与更低的 MSE（↓）都表示更好。

> Figure 29: 第一人称运动作为机器人适配先验。(a) 该矩阵度量 AgiBot 机器人操作与 Egocentric 运动之间的成对迁移。(b) 该曲线比较了从 Egocentric 预热检查点开始的 AgiBot 适配与直接从 PT-init 检查点开始的适配。
> （图 29a 单元格数值：AgiBot 对角 23.07，加入 Egocentric 后 23.20，Δ+0.13；Egocentric 对角 15.13，加入 AgiBot 后 15.16，Δ+0.03。图 29b 曲线标注增益：+0.94 @5k，+1.32、+1.55、+1.64、+1.38、+1.43 沿训练步推进；横轴 Training Steps 为 5k/10k/15k/20k/25k/30k。）

我们总结如下关键发现：

- **相机运动从广泛的动作协同训练中受益。** Fig. 28 显示，相机运动作为表现较弱的领域之一，从若干协同训练伙伴（而非仅从另一个自运动来源）中获益。AV 数据把相机 FD PSNR 从 11.96 提升到 12.82（+0.86），而机器人领域也提供正的 FD 增益，包括 Google Robot（+0.79）、Franka Panda Single（+0.73）与 Franka Panda Dual（+0.48）。该行的 ID MSE 对每一个所示协同训练伙伴也都改善。这表明相机运动的学习受益于一般的动作条件视觉先验，例如物体持存性、场景几何与运动对应线索，即使新增领域具有不同的本体。
- **机器人操作领域共享早期训练先验。** Fig. 28 中的机器人领域面板显示操作数据集之间存在广泛的早期迁移，尤其是对那些单领域基线表现较差、或数据更异质的领域。WidowX-250 从 Google Robot 强烈受益，获得 +1.39 的 FD PSNR 与 +2.29 的策略 PSNR，并在 ID 与策略 MSE 上有相应改善。Google Robot 也从若干机器人协同训练伙伴受益，FD PSNR 提升最高达 +0.89，策略 PSNR 提升最高达 +1.44。相比之下，本次协同研究中 Franka Panda 单臂与双臂条目对应的是小规模的 RoboMIND Franka 子集（Wu et al., 2025a），分别只有 23 与 4 小时的数据。与 Fig. 9 中汇总的远为庞大的动作数据来源相比，这些小目标领域在单领域训练下很快饱和，因此加入更大的协同训练领域在它们自身的评测上带来的收益较小或有正有负。然而，当它们作为被协同训练的来源使用时，仍然对其他领域提供有用的迁移。
- **人类第一人称运动有助于机器人适配。** Fig. 29a 显示第一人称运动与 AgiBot 之间存在温和但一致的迁移。Egocentric 数据把 AgiBot FD PSNR 从 23.07 提升到 23.20（+0.13），而 AgiBot 轻微地把 egocentric FD PSNR 从 15.13 提升到 15.16（+0.03）。Fig. 29b 中的预热曲线进一步把这一迁移作为初始化效应来检验：我们先在 egocentric 运动上预热基座 PT-init 检查点，再把它适配到 AgiBot，并与从同一 PT-init 检查点直接做 AgiBot 适配进行比较。从 egocentric 预热检查点出发，在每一个测量步骤上都改善了 AgiBot FD PSNR，在 5K 时增益为 +0.94，在训练后期大约为 +1.3–1.6。综合来看，这些结果表明人类的 egocentric 动作数据为机器人适配提供了一个有用的操作先验，而随着训练推进，领域感知的采样或专门化仍然重要。

**结论。** 我们表明 Cosmos 3 是一个跨多样领域、本体与推理模式的强动作基础模型。单一基础模型可以被适配到相机控制视频生成、自动驾驶车辆逆向动力学、第一人称手部前向动力学、机器人前向动力学以及机器人策略学习，同时保持与专用领域基线相当或更强。PT-init 与 MT-init 的进一步比较表明，统一的动作中期训练所做的不只是改善孤立领域：它产生了一个可复用的动作领域先验，加速了跨下游设置的收敛，包括对新本体与新环境的适配。这一点格外值得注意，因为所评测的领域在本体与监督形式上差异极大，从相机与车辆运动到有关节的人类手部与机器人末端执行器。协同研究提供了动作领域共享可迁移结构的证据：跨自运动、机器人操作与第一人称运动的协同训练可以改善早期适配，尤其是对那些单领域基线较弱的领域。Appendix E.4 与 E.5 中额外的动作特定消融支持同一结论：FD、ID 与策略目标在联合训练下共享有用的结构，并且与策略动作一同预测的视频，与由这些相同动作驱动的仿真器 rollout 保持一致。总体而言，这些发现支持 Cosmos 3 作为一个通用世界-动作基础模型，可以被高效地专门化到广泛的动作生成与控制任务上。

---

## 6.3 生成器使用指南（Generator User Guide）

虽然基准结果为生成质量提供了定量评估，但要有效使用一个全模态世界模型，还需要理解其推理接口、提示方法与采样配置。由于 Cosmos 3 支持多样的模态与生成模式——包括图像、视频、音频-视觉、转换、前向动力学、逆向动力学与策略生成——输出的质量不仅取决于模型权重，也取决于生成请求如何被指定与条件化。本节提供使用 Cosmos 3 Generator 的实践指南，包括推荐的提示策略、结构化字幕格式、采样超参数，以及 Cosmos 3 Reasoner 作为提示词上采样器的作用。这些指南反映了我们在全部评测中所使用的配置，可作为在广泛的 Physical AI 应用中获得高质量、物理上合理生成的参考。

> Table 21: 每个生成器与生成模态的默认采样配置与负提示。我们汇总不同 Cosmos 3 Generator 模式的生成设置。各设置的完整负提示见附录；"Null" 表示空字符串是表现最佳的变体。

| Model | Generation Modality | Sampling Hyperparameters | Negative Prompt |
|---|---|---|---|
| Cosmos3-Nano | Audio-Visual | steps=50, guidance=6, shift=10, full-range CFG | Appendix B.6 |
| Cosmos3-Super | Audio-Visual | steps=50, guidance=6, shift=10, full-range CFG | Appendix B.6 |
| Cosmos3-Super-Text2Image | Visual | steps=50, guidance=4, shift=3, full-range CFG | Null |
| Cosmos3-Super-Image2Video | Visual | steps=50, guidance=6, shift=5, full-range CFG | Appendix B.3 |
| Cosmos3-Nano | Forward/Inverse Dynamics | steps=50, guidance=1, shift=5, full-range CFG | Null |
| Cosmos3-Super | Forward/Inverse Dynamics | steps=50, guidance=1, shift=5, full-range CFG | Null |
| Cosmos3-Nano-Policy-DROID | Policy | steps=4, guidance=3, shift=5, full-range CFG | Null |
| Cosmos3-Nano | Transfer | steps=50, guidance=3, control guidance=1.5, shift=10 | Appendix B.6 |
| Cosmos3-Super | Transfer | steps=50, guidance=3, control guidance=1.5, shift=10 | Appendix B.6 |

⟨由文本抽取重建，需对照 PDF 复核⟩（已用 `pdftotext -table` 复核行-列归属）

### 6.3.1 生成指南（Generation Guide）

Cosmos 3 Generator 支持在宽广推理包络内的灵活视觉（及音频-视觉）生成：帧率 10–30 FPS、5 到 400 帧、分辨率覆盖 256p、480p 与 720p，以及常见宽高比（1:1、3:4、4:3、9:16、16:9）。这使得单一模型可以服务从短的预览片段到更长、更高分辨率的横屏或竖屏视频等多种用例，而无需改变采样接口。Cosmos 3 Generator 针对前向动力学、逆向动力学与策略模式训练，以支持不同的动作相关应用。对于动作生成，基础的 Cosmos3-Nano 与 Cosmos3-Super 模型支持原生控制频率在 10–30 FPS 范围内的动作预测，在逆向动力学与策略模式下预测跨度覆盖 16–400 帧。后训练模型则专门化到单一模式与单一频率——例如，Cosmos3-Nano-Policy-DROID 以 15 FPS 运行，预测范围为 32 步。下面我们将详述使用 Cosmos 3 Generator 成功生成的关键组件。这些细节也汇总于 Tab. 21。

**媒体规格与提示指南。** Cosmos 3 Generator 在结构化 JSON 字幕上训练，这些字幕对场景构成提供细粒度控制，涵盖主体、背景、光照、美学、摄影，以及视频特有的时间字段（如动作、状态变化、相机运动与分段级描述；完整 schema 见 Appendix A）。在推理时，一个提示词上采样器——由 Claude Opus 4.6 或 Cosmos 3 Reasoner 提供服务——把用户请求转换为同样的这一结构化格式，确保生成提示匹配训练期间所见的分布（模板指令见 Appendix B.1）。上采样器被指示先描述场景布局与世界状态，再指定事件的时间推进，最后加入任何音频描述。具体的上采样指令在各生成模式之间略有差异——例如，动作生成与转换生成会施加针对其条件输入定制的额外任务约束（转换生成的提示前缀见 Appendix B.4，动作提示指南见 Appendix B.5）。JSON 规范还额外包含显式的媒体控制（duration、FPS、空间高度与宽度、宽高比），使提示解释与采样配置保持可检查、可复现。

**负提示（Negative prompt）。** 我们通过自动化基准迭代，为每个模型与生成模式单独调优负提示。对每个配置，我们在候选模板上做消融，候选范围包括自然语言描述、关键词列表、指令式命令、面向物理一致性与身份保持的组合式扩展，以及空字符串。表现最佳的变体依据自动化基准分数选出。对于基础的 Cosmos3-Nano 与 Cosmos3-Super 生成器，显式负提示见 Appendix B.6。对于后训练变体，我们发现空字符串负提示对 Cosmos3-Super-Text2Image 效果最好，而对 Cosmos3-Super-Image2Video，使用从用户提示自动派生的负提示取得最佳结果（Appendix B.3）。对于动作生成模式，我们发现空字符串负提示效果最好。

**生成采样超参数。** 我们对不同模态采用以下采样参数：

1. **音频-视觉生成。** 对于音频-视觉生成，我们在图像与视频生成的自动化基准（Sec. 6.2.1 与 Sec. 6.2.2）上调优采样超参数。对于基础的 Cosmos3-Nano 与 Cosmos3-Super 生成器，我们使用 50 个去噪步、guidance scale 为 6、time shift 为 10，以及全范围无分类器引导。对于后训练的 Cosmos3-Super-Text2Image 模型，我们使用 guidance scale 4 与 time shift 3。对于后训练的 Cosmos3-Super-Image2Video 模型，我们使用 shift 5。
2. **动作生成。** 动作生成支持三种模式。对于前向与逆向动力学，我们使用 50 个去噪步、guidance scale 为 1、time shift 为 5，以及全范围无分类器引导。对于策略模式，我们切换为 4 个去噪步、guidance scale 为 3。
3. **转换生成。** 我们在自动化 PAIBench-C 基准（Sec. 6.2.4）上调优视频转换生成的采样超参数。我们使用 50 个去噪步、文本 guidance scale 为 3、控制 guidance scale 为 1.5、time shift 为 10，以及全范围无分类器引导。

### 6.3.2 用 Cosmos 3 Reasoner 做提示词上采样（Cosmos 3 Reasoner as Prompt Upsampler）

提示词上采样是 Cosmos 3 中在生成之前的推理步骤，它把紧凑的用户意图转换为结构化的时空场景规范。它不是仅仅重写提示，而是把稀疏的用户输入扩展成一种物理上接地的控制语言，捕捉场景布局、时间演化，以及（在适用时）音频线索。用户通常只提供一段简短的自然语言请求，而高质量的图像与视频生成依赖于许多很少被显式指定的细节，例如主体属性、空间布局、相机行为、光照、时间顺序、音频线索，以及诸如 resolution、宽高比、duration 与 frame rate 的生成控制。上采样器通过在用户界面与生成器之间充当一个指令跟随的 LLM 模块来填补这一空缺。它接收简短请求、输出的结构模板，加上可选的条件输入信号（例如 image-to-video 的起始图像），产出一份稠密的、带类型的 JSON 场景规范，供下游图像或视频模型据此渲染。

先前工作分为两条脉络。第一条脉络把简短的用户查询映射为更丰富的文本提示以用于图像生成。DALL-E 3 使用描述性重打caption 与字幕上采样，以更好地匹配生成器的字幕分布（Betker et al., 2023）；Prompt Expansion 显式地学习把一个查询扩展为多个优化的文本到图像提示（Datta et al., 2024）；而 Promptist、BeautifulPrompt 与 RePrompt 这类提示适配系统训练语言模型把用户输入重写为模型偏好的提示，同时优化图像级目标（Hao et al., 2023; Cao et al., 2023; Wu et al., 2025b）。第二条脉络使用 LLM 作为下游视觉生成器的规划器，产出物体布局、接地的场景描述、帧级提示或多场景视频计划（Lian et al., 2024; Feng et al., 2023; Hong et al., 2023; Lin et al., 2023）。Cosmos 3 采纳了"在生成前插入一个推理模块"这一相同的基本思路，但进一步改变了接口。上采样器输出的是一个带类型的多模态场景程序，而不只是一个重写后的提示或生成器专用的布局计划；并且该程序横跨图像、视频与音频条件的生成。从某种意义上说，上采样器的做法是：先想象场景，考虑其时间/空间方面，在一个抽象语言描述状态中添加更多模态的内容（例如音频描述符），再把它们翻译为匹配所提供模板的结构化输出。

我们把上采样视为一种在结构化数据上带物理先验的复杂多模态指令跟随。输入可以是纯文本、图像加文本，或视频加文本。输出是一个 schema 约束的 JSON 控制程序，它捕捉语义内容、视觉属性、任务特定字幕、视频任务的时间计划、视频任务的音频描述字段，以及渲染器所需的生成参数。结构化输出不只是一个格式上的选择：它暴露出生成器必须以其为条件的隐变量，包括实体、空间关系、动作、时序、相机行为、音频后果与生成控制。这把提示词上采样与"结构化 LLM 推理与验证"这一工作体系联系起来——在那里，自然语言指令被转换为在结构化字段上的显式、可检查的程序（Chegini et al., 2025）。同时，填写一个稠密的场景 schema 需要在不确定性下推理：上采样器必须从不完整的用户输入中推断出可能的物体状态、时间转换、因果交互与声学结果（Pournemat et al., 2025），从而在不违背所施加之现实的物理约束的前提下，沿创造力轴扩展。在 Cosmos 3 中，这些概率与物理先验通过 schema 本身表达。模型先想象一个连贯的世界状态，然后把它映射为一个时间 rollout，最后导出与可见事件保持同步的音频线索。这种分离是有用的，因为它把提示理解暴露为一个可独立检查的组件，而不是与渲染模型纠缠在一起。

**提示契约（Prompt contract）。** 在推理时，上采样器接收用户描述以及所选的生成控制。对于 image-to-video 生成，它还接收条件图像，该图像被视为第一帧的确凿视觉证据。请求被格式化为四个带标签的区块：1) instructions 区块：介绍所有区块，定义任务级行为，例如产出单个围栏式 JSON 对象、避免额外评论、以及把模板视为强制。2) image 或 video _description 区块：承载原始语义请求；对于 I2V 这类受条件约束的请求，附带的条件内容与该文本一同提供，且约束规定了视觉事实应如何锚定于它。3) task_constraints 区块：承载大部分操作细节。它指定字段顺序、时间格式、duration 上下界、需照抄的控制项（如 resolution、宽高比、duration 与 frame rate）、对用户所提供实体与动作的保持要求，以及任务特定的接地规则（例如在 t = 0 处匹配 I2V 的第一帧）。4) output_json_template 区块：定义 schema 表面：哪些键必须填充、期望哪些嵌套字段，以及场景、时间、音频、主体、相机、光照、风格与控制信息应放置在何处。换言之，约束描述上采样器应当如何推理与照抄取值，而 JSON 模板定义最终答案必须采取的形状。系统提示是一个极简的 "You are a helpful assistant"。完整模板见 appendix B.1。使用该模板时，某些占位参数（如 description、FPS、duration、宽高比、resolution 等）必须在传给 Upsampler 之前相应填好。

---

## 7. 相关工作（Related Work）

Physical AI 近期的进展，由若干此前相互独立的研究领域的进步所驱动，包括世界模型、多模态理解、视频生成、动作建模、音频-视觉生成与全模态基础模型。尽管这些方向各自独立地为感知、推理、仿真与控制贡献了重要能力，但 Physical AI 系统最终需要这些能力在一个统一框架内协同工作。本节回顾与 Cosmos 3 最相关的文献，聚焦于世界仿真、多模态推理、生成式建模与具身智能方面的先前工作。我们强调这些研究脉络如何演化到对物理世界日益统一的表示，并讨论 Cosmos 3 如何通过在单一全模态世界模型中联合建模语言、图像、视频、音频与动作（同时用于理解与生成），延伸这一轨迹。

### 7.1 Physical AI 的世界模型（World Models for Physical AI）

世界模型描述世界如何演化，以及一个智能体的动作如何改变未来的观测。一个有用的区分是：预测性隐空间世界模型（predictive latent world models）学习紧凑的内部动力学以用于规划与控制；而生成式世界模型（generative world models）把预测的未来作为可检查的多模态仿真呈现出来。

预测性隐空间世界模型学习紧凑的隐状态，其价值在于让规划与控制更便宜：控制器可以在一个抽象掉像素级细节的表示中进行搜索或优化。早期的隐动力学系统，如 World Models（Ha and Schmidhuber, 2018）、Embed-to-Control（Watter et al., 2015）、PlaNet（Hafner et al., 2019）与 Dreamer（Hafner et al., 2020），表明紧凑的预测状态可以支持从像素出发的控制与规划。更近期的 JEPA 风格模型把预测从像素转移到与感知、预测与规划更契合的隐抽象表示（LeCun, 2022; Assran et al., 2023; Bardes et al., 2025; Assran et al., 2025; Maes et al., 2026）。这些方法把内部动力学建模确立为智能体的核心要素，但它们通常是为紧凑预测或下游控制而优化，而非为高保真的多模态仿真。

生成式世界模型把仿真本身作为建模接口：模型把可能的未来观测预测为图像、视频、音频或其他接地的 token。通过直接呈现预测出的未来，它们使几何、接触、时间与声音上的错误变得可被观察，而不仅仅从任务损失中推断。Sora（OpenAI, 2024）使这一视角在视频生成与隐式世界仿真方面广为人知（He et al., 2026）。Cosmos 世界模型系列直接面向 Physical AI 发展这一方向（NVIDIA, 2025a,b,c,d）。其他领域专用系统研究操作、驾驶与具身导航及交互（Wang et al., 2024b; Zhao et al., 2025; Liang et al., 2024a; Jang et al., 2025; Ren et al., 2025a; Zhou et al., 2024; Gao et al., 2026b）。近期的交互系统把同一方向延伸到可控环境与面向智能体的 rollout 接口（Bruce et al., 2024; Google DeepMind, 2024b; Ball et al., 2025; Hu et al., 2023; Yang et al., 2023; World Labs, 2025; Bahmani et al., 2025; Shen et al., 2026a; Waymo, 2026; Li et al., 2025c; Wang et al., 2025g）。Cosmos 3 建立在这一方向之上，但把世界建模同时视为一个理解问题与一个生成问题，而不只是视频合成：其 reasoner 塔解读多模态上下文并推断结构化的世界状态，其 generator 塔则从该上下文合成未来的图像、视频、音频与动作 token。这让一个框架就能连接场景理解、未来合成、动作推断与多模态 rollout，从而生成的轨迹可以以文本、观测、动作与音频为条件，而不只是以提示为条件。

### 7.2 多模态理解与具身推理（Multimodal Understanding and Embodied Reasoning）

多模态理解模型为物理智能提供了所需的感知与推理层。Flamingo（Alayrac et al., 2022）与 BLIP-2（Li et al., 2023b）帮助确立了把大语言模型与视觉输入相耦合的现代范式，而 LLaVA（Liu et al., 2023b; Li et al., 2024a）使指令微调的开放视觉-语言助手产生了广泛影响（Zhu et al., 2024）。近期的模型家族在图像与视频上改进规模、接地、时间推理、OCR 与指令跟随（Chen et al., 2024c; Wang et al., 2025e; Dai et al., 2024; Bai et al., 2023, 2025b,c; Deitke et al., 2025; Peng et al., 2024; You et al., 2024; Zhang et al., 2024; McKinzie et al., 2024; Zhang et al., 2025a; Tschannen et al., 2025; Xiao et al., 2024a; Beyer et al., 2024; Steiner et al., 2024）。GPT-4o（OpenAI, 2024）体现了向全模态交互的迈进。这些能力使视觉-语言模型成为具身系统的有用前端，但物理智能需要的不只是对孤立图像或片段的识别。它需要时间上持久的状态、绑定到物体与代理的空间接地、对可能交互的可供性（affordance）推理，以及在条件变化时的任务进度追踪。这把推理的基本单元从一段字幕或一个答案，转变为一个持续维护、可据以行动的场景估计。

因此，对 Physical AI 而言，相关的挑战不只是视觉问答，而是在推理空间、时间、可供性、物体状态与任务进度的同时，维持接地的场景状态。Cosmos-Reason1（NVIDIA, 2025）通过物理常识与具身思维链推理来应对这一场景。相关的机器人与第一人称工作强调空间接地、具身规划，以及人-物或机器人-物体交互推理，同时使用模型开发与任务导向的基准（Sermanet et al., 2024; Wang et al., 2023; Chen et al., 2025b; Yang et al., 2025a; Chen et al., 2024a; Song et al., 2025; Zhou et al., 2025b; Yang et al., 2025c）。尽管有此进展，大多数理解模型仍主要是判别式或语言输出式的系统：它们能描述场景、回答问题或推断下一步意图，但通常不在同一表示空间中生成未来的观测或可执行的动作。Cosmos 3 通过允许结构化的多模态理解直接为世界生成提供条件，来解决这一分离。

### 7.3 视频生成与视觉世界仿真（Video Generation and Visual World Simulation）

视频生成已从短的文本到视频片段，进展到高分辨率、时间上连贯、遵循指令的合成。早期的扩散与 Transformer 系统确立了文本条件视频的基本配方（Ho et al., 2022b; Singer et al., 2023; Ho et al., 2022a; Villegas et al., 2023; Blattmann et al., 2023; Bar-Tal et al., 2024; HaCohen et al., 2025; Kondratyuk et al., 2024; Girdhar et al., 2024; Yang et al., 2025e; Open-Sora Team, 2025; Genmo, 2024; Zhang et al., 2025c）。Sora（OpenAI, 2024, 2025）、Movie Gen（Polyak et al., 2024）与 Veo 3（DeepMind, 2025; Google DeepMind, 2025b）反映了近期朝向长时程写实、更强提示遵循与更高保真视觉动力学的转变（Kong et al., 2024; Wan et al., 2025a; Gao et al., 2025; Arkhipkin et al., 2025）。工业系统也已把可控性、创作者工作流与 API 部署变成视频生成版图的组成部分（Runway, 2024, 2025; Kuaishou, 2024, 2025; Luma, 2024; Luma AI, 2025; MiniMax, 2024, 2025; Pika Labs, 2025; Adobe, 2025; Amazon, 2024）。

由此形成的格局大多把进步框定在感知层面的视频生成上：合理的帧、平滑的运动，以及匹配文本或视觉条件的输出。关于视频世界仿真与物理一致性评估的工作表明，这些目标是世界建模所必需、但对 Physical AI 并不充分（He et al., 2026; Bansal et al., 2025a; Guo et al., 2025; Motamed et al., 2026）。世界仿真施加了一个更强的契约：rollout 必须保持物体身份与持存性、遵守时间因果性、暴露诸如动作或相机运动这样的可控因素，并在同一场景以不同干预被询问时保持一致。对一个智能体而言，一段视频只有在变化可以被回溯到状态、动作与接触时才有用；否则真实感并不蕴含一个可靠的仿真器。这一缺口在反复提示或闭环使用下尤为明显——那里小的不一致会累积成错误的下游决策。因此，面向仿真的系统必须把合成与接地的状态及干预语义耦合起来。在此背景下，Cosmos 3 把视频放入一个更广阔的世界建模框架之中。视频不只是一个输出模态，它也是推理的输入、动作推断的观测流，以及与动作和控制相耦合的状态轨迹。

### 7.4 动作建模、VLA 与世界-动作模型（Action Modeling, VLAs, and World-Action Models）

动作为智能体与变化中的世界状态之间提供因果联结，先前工作通常被组织为三种设置：前向动力学从状态与动作历史预测未来观测；逆向动力学从一次被观测的转换推断其背后的动作；策略模式则把观测、目标与指令直接映射为动作。这一分类法跨越异构的动作空间，从机器人关节命令与载具控制，到相机、人体与第一人称佩戴者运动，每一种都有不同的单位、速率与因果作用范围。

当动作被当作对未来观测的条件时，前向动力学模型最为显式。在驾驶领域，GAIA-1（Hu et al., 2023）、DriveDreamer（Wang et al., 2024b; Zhao et al., 2025）与 Cosmos-Drive-Dreams（Ren et al., 2025a）说明了未来场景可以在自运动、轨迹或其他控制下如何生成。在机器人与相机控制生成领域，相关工作探索动作条件的操作视频、机器人感知的仿真器、相机轨迹、深度、分割与 3D 一致的控制（Liang et al., 2024a; Jang et al., 2025; Zhou et al., 2024; Zhu et al., 2025; Wang et al., 2025c; Gao et al., 2026b; He et al., 2024; Wang et al., 2024e; Xu et al., 2024a; Ren et al., 2025b）。这些系统表明生成模型能学到有用的动作条件先验，但其中许多是针对特定领域、动作空间或本体而专门化的。

在实践中，逆向动力学常问的是"哪个动作解释了所观测到的转换"。VPT（Baker et al., 2022）研究从视频标注动作，后续工作通过从观察中学习模仿、隐动作发现、以及在没有显式动作标注的视频上学习来扩展这一思路（Zhang et al., 2022; Torabi et al., 2018; Yang et al., 2019; Pavse et al., 2020; Schmidt and Jiang, 2023; Ye et al., 2025; Garrido et al., 2026）。像 Open X-Embodiment（Vuong et al., 2023）与 DROID（Khazatsky et al., 2024）这样的大规模具身数据集，为跨本体、跨任务、跨视点、跨操作机制的学习提供了数据基座（Walke et al., 2023; Liu et al., 2023a; Nasiriany et al., 2024; contributors, 2024; Bu et al., 2025; Grauman et al., 2024; Li et al., 2023a）。

策略模式的系统从观测、目标与指令预测动作。RT-1/RT-2（Brohan et al., 2023b,a）、PaLM-E（Driess et al., 2023）、OpenVLA（Kim et al., 2024）、π0（Black et al., 2025）、Gemini Robotics（Gemini Robotics Team et al., 2025; Gemini Robotics Team, 2025）与 GR00T N1（Bjorck et al., 2025）勾勒了从视觉-语言策略到通用机器人基础模型的演进（Li et al., 2024d; Octo Model Team et al., 2024; Physical Intelligence Team, 2025; Liu et al., 2024c; Zhou et al., 2025d; Zheng et al., 2026; Yang et al., 2025d; Shi et al., 2025b; Lee et al., 2025a; Wu et al., 2023b; Cheang et al., 2024）。相关的具身智能体系统使用语言或视觉-语言模型来做空间价值图、动作推理与交互感知的规划（Huang et al., 2023; Zawalski et al., 2024; Yang et al., 2025a）。世界-动作模型通过使用视频动力学与动作表示作为先验，把策略学习拉得更接近世界建模（Li et al., 2025a; Ye et al., 2026; Wang et al., 2025i; Cen et al., 2025; Wang et al., 2026b; Xue et al., 2026）。Cosmos 3 把前向动力学、逆向动力学与策略模式视为同一个多模态序列模型（在视频、音频、文本与动作 token 上）的不同条件化方式。

### 7.5 音频与音频-视觉生成（Audio and Audio-Visual Generation）

音频是物理世界建模的一个重要部分，因为许多事件不仅由它们看起来如何定义，也由它们听起来如何定义。AudioLDM 2（Liu et al., 2024b）、AudioCraft（Meta AI, 2023）与 MusicGen（Copet et al., 2023）是文本条件音频与音乐生成快速进步的代表，后续系统把这一空间向语音、音效与面向创作者的产品扩展（Le et al., 2023; Vyas et al., 2023; Stability AI, 2024; Lee et al., 2025b; Suno, 2024; Udio, 2024; ElevenLabs, 2024）。这些模型改善了生成媒体的声学真实感，但物理世界仿真还要求把声音与可见的动力学同步。

音频-视觉学习研究声音与视觉是否对应于同一事件、同一来源或同一运动。经典脉络包括跨模态对应、来源分离、同步与语音-唇动对齐；而 Diff-Foley（Luo et al., 2023）与相关的视频到音频系统则聚焦于生成跟随可见动力学的声音（Owens and Efros, 2018; Zhao et al., 2018; Ephrat et al., 2018; Chung and Zisserman, 2016; Prajwal et al., 2020; Comunita et al., 2024; Zhang et al., 2026; Ren et al., 2025c; Gramaccioni et al., 2024; Cheng et al., 2025; Kling Team, 2025）。说话人头部生成、人体动画与联合音视频生成器进一步把语音、身体运动、场景动力学与声音连接起来，包括 Movie Gen（Polyak et al., 2024）与 Veo 3（DeepMind, 2025; Microsoft Research, 2024; Tian et al., 2024; Xu et al., 2024b; Wang et al., 2025a; Xing et al., 2024; Ruan et al., 2023; Wang et al., 2024a; Liu et al., 2024a; Li et al., 2025b; HaCohen et al., 2026; Liu et al., 2025c）中的同步音视频媒体生成。就物理仿真而言，时机与声音的身份同样重要：一次碰撞应当在接触的那一帧产生撞击声，脚步声应当与步态和地面匹配，而工具或发动机在其可见状态变化时声音也应当变化。语音同样需要嘴部运动、说话人身份与轮换（turn-taking）保持对齐；而警报、马达、刮擦以及其他环境声音可以为部分被遮挡的事件提供因果证据。对 Physical AI 而言，音频应当被建模为关于事件、接触、语音、工具、发动机与环境的同步证据，而不是事后添加的装饰。Cosmos 3 把音频视为同一世界建模接口中的又一个模态，支持联合视频-音频生成、视频条件的音频生成，以及音频条件的视频生成。

### 7.6 用于理解与生成的全模态模型（Omnimodels for Understanding and Generation）

一支不断壮大的工作研究全模态模型（omnimodels），它们在单一框架内同时结合多模态理解与生成。把这一目标与两个相邻家族区分开来是有用的。视觉-语言模型（VLM）通常把多模态输入映射为文本，而媒体生成器把提示或条件映射为生成的图像、视频或音频。全模态模型旨在在一个框架内支持这两个方向，从而感知、语言与合成可以共享表示，而不是只通过外部流水线相连接。

Unified-IO 2（Lu et al., 2024）与 Chameleon（Chameleon Team, 2024）研究统一的多模态建模，而 GPT-4o（OpenAI, 2024）与 Gemini（Google DeepMind, 2024a, 2025a）展示了前沿系统如何走向原生的多模态输入与输出。其他统一或 any-to-any 系统探索文本、图像、音频、视频的不同组合，以及离散 tokenization 或扩散接口；其中 Qwen-Omni（Xu et al., 2025; Qwen Team, 2026a）代表了一个近期的全模态家族（Tang et al., 2023; Wu et al., 2023c; Zhan et al., 2024; Ge et al., 2024; Mizrahi et al., 2023; Xie et al., 2025; Chen et al., 2025d; Wang et al., 2024c）。

在这个更广阔的全模态家族内，近期的 MoT 风格工作格外相关，因为它追问的是一个模型如何既能共享序列级上下文、又能为不同模态或功能保留专门容量。Transfusion（Zhou et al., 2025a）通过把文本的下一 token 预测与基于扩散的图像生成相结合，把这条脉络连接到跨混合模态序列的单-transformer 训练。Mixture-of-Transformers（Liang et al., 2025）为多模态基础模型把这一专门化模式显式化；相关工作把预训练语言模型改造以支持多模态生成，并研究异构的理解专家与生成专家之间的非对称桥接（Shi et al., 2025c; Wang et al., 2025f）。BAGEL（Deng et al., 2025）把这一方向延伸到统一的多模态预训练，同时覆盖理解与生成，采用仅在解码器上的架构、在大规模交错多模态数据上训练。近期的具身扩展把同样的架构问题"物理化"，在 VLA 与世界-动作模型中为场景理解、视觉前瞻、隐动作与控制分别专门化通路（Lv et al., 2025; Cai et al., 2026; Shou et al., 2026; Bi et al., 2025; MotuBrain Team et al., 2026; Li et al., 2026a; Tencent Robotics X et al., 2026）。

综合来看，这些全模态模型表明理解与生成可以在共享的多模态框架内处理，而不必依赖彼此分离的系统。然而，现有工作仍偏重文本-图像建模或一般的多模态媒体生成，对物理世界动力学、动作条件的生成、逆向动力学与具身控制的关注较少。Cosmos 3 通过把一个用于多模态理解的自回归 reasoner 塔，与一个以 reasoner 表示为条件的扩散 generator 塔相配对，把全模态理念延伸到 Physical AI。这一接口支持视频/文本到文本的理解、文本/视频到视频的生成、音频-视频生成，以及用于动作理解与预测的世界-动作建模。Cosmos 3 不只是多模态的，也是全功能（omni-functional）的：同一个模型可以解读世界、仿真它如何演化、推断观测变化背后的动作，并生成未来的观测与动作。

---

## 8. 结论（Conclusion）

我们提出了 Cosmos 3，一族面向 Physical AI 的全模态世界模型。Cosmos 3 在单一架构内统一了跨语言、图像、视频、音频与动作的多模态理解与生成，减少了组合彼此分离的视觉-语言模型、视频生成模型、世界模型与动作模型的需要。这一统一形式之所以可能，得益于模态专用编码器、结构化的 token 排布，以及一个把自回归推理与基于扩散的生成相耦合的 Mixture-of-Transformers 骨干。配合可扩展的数据、训练、服务与评测基础设施，Cosmos 3 为开发 Physical AI 智能体提供了坚实基础。在多样的理解与生成基准上，Cosmos 3 展示了强劲的结果与广泛的能力覆盖，同时仍可通过后训练便利地做下游专门化。我们期望 Cosmos 3 充当合成世界与真实世界之间的桥梁，为 Physical AI 提供更好的合成数据、更好的专用模型起点，以及更好的闭环训练环境。通过发布源代码、预训练检查点与精选基准，我们旨在加速通向通用 Physical AI 智能体的研究，让它们能够在真实世界中感知、推理、仿真与行动。
