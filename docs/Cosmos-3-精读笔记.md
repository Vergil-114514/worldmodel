# Cosmos 3 精读笔记

来源：`docs/cosmos3-technical-report.pdf`（arXiv 2606.02800v4，139 页，抽取文本 `docs/cosmos3-tr.txt`）。
本笔记里的每个数字都可在原文或 `staging/Cosmos3-Edge/` 的 checkpoint 配置中复核。标注【实测】的条目是我从权重头表/配置文件直接读出来的，不是论文原文。

---

## 0. 阅读路线（已核实的文献清单）

| 优先级 | 文献 | 页数 | 读什么 |
|---|---|---|---|
| P0 | Cosmos 3（本篇） | 139 | §2 架构、§4 训练、§5 基建、§6 结果。附录 A/B 是 prompt 模板，用到再查 |
| P1 | arXiv 2501.03575v3 Cosmos WFM Platform | 75 | 初代平台论文：自研 video tokenizer、guardrail、数据清洗管线的原始设计 |
| P1 | arXiv 2503.15558 Cosmos-Reason1 | 36 | Reasoner 塔的前身，物理常识 SFT/RL 数据怎么造 |
| P2 | arXiv 2503.14492 Cosmos-Transfer1 | 28 | depth/edge/seg 控制条件的原始方案 |
| P2 | arXiv 2601.16163 Cosmos Policy | 22 | 视频模型 → 策略模型（LIBERO 98.33% / RoboCasa 71.1%） |
| P2 | arXiv 2511.00062 World Sim with Video FM | 44 | Predict2 世代方法论 |
| P3 | arXiv 2606.18943 Physics-IQ Verified | 40 | 判断 Cosmos 3 物理分数成色时读 |
| P3 | arXiv 2607.00836 From World Models to WAM 综述 | — | 建立领域坐标系 |

**坑**：Predict2 / Predict2.5 / Transfer2.5 / Reason2 这些版本号没有正式论文，只有 GitHub README、HF 博客和 model card。旧仓库 `nvidia-cosmos/*` 已挂迁移公告。

---

## 1. 一句话主张

理解（understanding）与生成（generation）是同一能力的两面，拆开建模会互相拖累：理解需要推断世界如何演化、动作会带来什么后果；生成需要一个紧凑、结构化的世界与行为表示。所以把 VLM、文生图、视频生成、前向/逆向动力学、VLA/WAM 统一进一个 omnimodal backbone，靠共享表示与多任务联合监督来 scale。

---

## 2. 架构

### 2.1 四个模态编码器（"冻结的分寸"是重点）

| 模态 | 编码器 | 关键参数 | 训练时 |
|---|---|---|---|
| 语言 | tokenizer | vocab 131072 | 联训 |
| 视觉-理解 | 预训练 ViT（VLM 对齐） | patch 16×16，两层 MLP 做 2×2 merge，DeepStack 聚合，插入文本化时间戳（Qwen3-VL 做法） | **联训** |
| 视觉-生成 | **Wan2.2-TI2V-5B 的 video VAE** | 时间 4×、空间 32×32（16×16 + 2×2 patch merge），latent_channel 48 | **冻结** |
| 音频 | audio VAE | 48 kHz 立体声，hop 1920 → 25 token/s | **冻结** |
| 动作 | 域感知线性投影 | 每个本体域一套 $W^{in}_{(d)}/W^{out}_{(d)}$，从零训 | 联训 |

VAE 是"坐标系"，动了会把生成流形的语义搅乱；ViT 是"眼睛"，必须跟着语言适配。每个非语言模态还加一个可学的 modality-specific embedding，让共享参数能区分模态。

动作表征刻意避开各家控制器细节（PID、底层 actuation），统一为三类几何分量：ego pose 9D、effector pose 9D、grasp state（手 15D / 夹爪 1D）。相对位姿 $\Delta T = T_{t-1}^{-1}T_t$，旋转用 6D 过参数化表示，解码时 SVD 投影回 SO(3)。于是 AV 9D、camera 9D、ego 57D、单臂 10D、双臂 20D、人形 29D 落在同一语义空间。

### 2.2 序列排布：AR 段 + DM 段

一条序列固定两段：**AR 子序列**（语言 token + ViT 编码的图像/视频，负责推理），后面接**DM 子序列**（VAE 视觉 token + 音频 + 动作，负责生成）。统一格式三条规则：AR 永远在前；DM 内部 clean 条件 token 在 noisy token 之前；两类子序列内部都按 视觉→音频→动作 排。

任务差异只靠"换 token"表达：

- Text-to-Image：$S_{T2I} = [S_{AR}, \tilde v_1]$，其中 $S_{AR} = [x_1..x_n, EOS, BOG]$
- Text-to-Video(+Audio)：$[S_{AR}, \tilde v_{1:F}, \tilde a]$
- Image/Video-to-Video：$[S_{AR}, v_{1:k}, \tilde v_{k+1:F}]$，k=1 就是 I2V，k>1 是 V2V
- Transfer：$[S_{AR}, v^{ctrl}_{1:F}, \tilde v_{1:F}]$（depth/blur/edge/seg 当 clean 条件）
- 动作三模式：forward dynamics（去噪视觉、动作 clean）／inverse dynamics（去噪动作、视觉 clean）／policy（两者都去噪）

### 2.3 MoT 双塔：共享注意力，不共享 MLP

每个 decoder 层两套完整参数（LN / 注意力投影 / FFN 全独立），**都从同一个预训练 VLM 初始化**；AR 段路由到 Reasoner 塔，DM 段路由到 Generator 塔。掩码非对称：

$$O_{AR} = \mathrm{Attn}_{causal}(Q_{AR}, K_{AR}, V_{AR}) \qquad O_{DM} = \mathrm{Attn}_{full}(Q_{DM}, [K_{AR};K_{DM}], [V_{AR};V_{DM}])$$

AR 不看 DM 任何 token → 保住 VLM 的自回归能力与条件路径因果完整性；DM 双向看全序列。语言用 next-token prediction 解码，其余模态用迭代去噪。

**这不是 MoE**：没有 router 选专家，而是按 token 类型路由到不同参数塔。

### 2.4 3D mRoPE 的两处关键改动

基础沿用 Qwen3-VL 的 3D MRoPE（隐维度切 t/h/w）：语言 t=h=w（退化成 1D RoPE）；ViT 视觉同帧共享 t；DM 视频三轴都变，且空间/时间索引在每个 vision segment 开头**清零**（当作片段内绝对坐标）；音频、动作只走时间轴，h=w=0。

改动一：**AR 与 DM 之间插入固定 15000 的时间 gap**。直接续上的话，最后一个文本 token 与第一帧视觉 token 时间位置几乎相同 → 初始帧过饱和、棋盘格伪影，模型越大越严重（Super 尤其明显）。加缓冲区即可，不引入任何可学参数。

改动二：**绝对时间调制**。定义 TPS（每秒时间步数）：视频 = FPS / 4，音频 = 48000/1920 = 25，动作 = 采样频率。基准 TPS_base = 24/4 = 6，索引增量改为 Δ = TPS_base / TPS。效果：16/24/30 FPS 下同样的真实 1 秒占据同样的位置区间——时间轴是物理时间，不是 token 计数。

### 2.5 三档规格与参数量分解

| 变体 | 层数 | hidden | 头/KV头 | head_dim | FFN | 初始化 |
|---|---|---|---|---|---|---|
| Edge | 28 | 2048 | 16 / 8 | 128 | 9216 | **Megatron 从零训**，架构近似 Qwen3-1.7B，去掉 QK norm、FFN 激活改 ReLU² |
| Nano | 36 | 4096 | 32 / 8 | 128 | 12288 | Qwen3-VL 8B |
| Super | 64 | 5120 | 64 / 8 | 128 | 25600 | Qwen3-VL 32B |

【实测】Cosmos3-Edge 权重头表分解（总 4.56B，与宣称的"4B"吻合）：

- AR 塔 28 层 = **1.4094B**；DM 塔 = **1.4094B**（严格相等 → 双塔是真复制，不是共享+适配器）
- AR 塔 + embed_tokens(268.4M) + lm_head(268.4M) = **1.95B** → 就是论文那句"dense 2B transformer"
- 生成侧适配器 282.4M：`proj_in [2048,192]`（192 = 48 latent ch × 2×2 merge）、`proj_out [192,2048]`、`time_embedder`、`action_proj_in/fc [32, 131072]` = 32 个本体域 × (64×2048) 摊平，正是 Eq.(1)(2) 的域特定投影
- VAE 0.705B（1.41GB）+ ViT 0.489B（0.98GB）
- 命名证据：DM 塔用 `_moe_gen` / `add_q_proj` / `to_add_out` / `norm_added_k` —— **FLUX 双流块的血统**
- 论文没写但权重名泄露的实现细节：`k_norm_und_for_gen`（`use_und_k_norm_for_gen: true`）—— 生成塔的 Key 归一化复用理解塔那一份

### 2.6 生成规格（工程约束）

分辨率 256p/480p/720p；宽×高按 5 种比例，例如 480p-16:9 = 832×480、256p-16:9 = 320×192、720p-16:9 = 1280×720。FPS 10–30（默认 24），帧数 5–300（默认 189），Edge 限 256p/480p 且帧数 50–150、不支持音频与 transfer。精度 BF16，OS 仅 Linux，官方支持卡型 Ampere/Hopper/Blackwell。

---

## 3. 训练配方（可直接搬的经验值）

### 3.1 Reasoner

预训练：LM+projector 学习率 5e-5，ViT 5e-6，cosine 衰减到 0.1× 峰值，10% 线性 warmup，AdamW β=(0.9,0.999)，wd 0.05，全局范数裁剪 1.0，全量混合训 2 epoch（no-replacement 均匀拼接采样器）。序列上限 16k token，单样本 2048 图像 token / 8192 视频 token。用 **√n 归一化的 per-token loss 加权**平衡长短序列（实测显著提升下游分数与稳定性）。明确不做"先冻 VLM 只对齐 projector"的分阶段。

SFT：按重要性给每个数据集分配采样预算；掺高质量预训练子集，**预训练:SFT = 1:4**（防止专精化侵蚀通用能力）；再加 800K 指令跟随数据稳住对话能力。8200 iter，global batch 512，lr 1e-5 / ViT 1e-6，wd 0.1。

数据规模：合计约 **24.2M 样本**（预训练 22.0M + SFT 2.2M）。预训练混合中 OCR 9.44M（42.9%）、2D grounding 3.62M（16.5%）、视觉 QA 2.48M（11.3%）、图像推理 1.66M（7.5%）；主干来自 Nemotron Nano 2 的 19.7M 子集。

### 3.2 Generator 目标函数

**rectified flow matching**：$\alpha_t = t\,\epsilon + (1-t)\,z_0$，预测恒定速度 $v^* = \epsilon - z_0$，masked MSE（条件 token 被门控出 loss）。**逐模态独立采 t**；图像/音频/动作用 logit-normal 分布，视频用 **mode sampling**（实测质量更好）。再经 shift 重参数化，分辨率自适应：256p σ=1、480p σ=3、720p σ=5。

### 3.3 多分辨率 + 序列打包

三档同训：256p 吃全量源、480p 只吃原生 ≥480p、720p 只吃 ≥720p；帧数上限 400/400/300。batch 组成 image-only : 256p : 480p : 720p = **1 : 1 : 2 : 1**。变长序列打包进**固定 74,000 token** 上下文，避免 padding 和反复重编译。视频内部 T2V 70% / I2V 20% / V2V 10%；四种生成模式 T2I 20% / T2V 56% / I2V 16% / V2V 8%。

数据清洗管线要点：TransNetV2 场景切分 → ffmpeg cropdetect 去黑边 → 统一重编码；嵌入去重（图像用 Qwen3-VL-Embedding-8B，视频用 Cosmos-Embed1-448p）+ cuML KMeans 20000 类簇内做近重复剔除。语料分布：720p 占图像 26.8%/视频 36.4%，480p 占 26.0%/30.8%，≥1080p 占 25.2%/12.2%，16:9 占图像 52.0%/视频 97.3%。

规模：**767M 图像 + 347.7M 视频片段**，由 7.8B 原始图像与 3B 原始视频清洗得到；动作数据 **8.4M episodes / 61.3K 小时**；音频最终池 18.8M clips（12.8M 非语音）；transfer 中期训练从预训练池挑 3M 视频，edge/blur 训练时在线算（Canny/高斯模糊/双边滤波随机参数），depth/seg 离线算（Video Depth Anything / SAMv2）；world-scenario 控制用 MADS 1.1M 样本 × 7 路同步相机。

### 3.4 后训练三种去向

1. **合成数据生成**：T2I 两阶段 SFT（阶段1 20k steps，配比 真实 45% : 合成 40% : 纯文字渲染 15%；阶段2 用 470k 超高质图文对再 2k steps；固定 70k 上下文，只训 >720p 图像）；I2V 同理，还有 4-step 蒸馏变体（宣称 17–25× 加速）。
2. **任务专精**：机器人策略用 DROID（76k 轨迹 / 350 小时 / 86 任务 / 564 场景，360×640 输入，空闲帧过滤 + 失败演示剔除），从 mid-trained Nano 恢复，动作编码器/解码 MLP/action embedding token 全新初始化并给 5× 学习率；输入含本体感受 + 三视图观测。
3. **训练环境生成**：报告定位为长期方向。

---

## 4. 结果速览（Table 1，* 为后训练变体）

| 能力 | Super | Nano | 主要对手 |
|---|---|---|---|
| Reasoning General | 73.7 | 69.6 | Gemini 3.1 Pro **77.5**（通用推理仍弱于旗舰闭源 VLM） |
| Reasoning Robotics | 57.8 | 55.1 | Qwen3-VL-32B 58.2 |
| Smart infra | 62.6 | 61.0 | Gemma-4-31B 52.6 |
| Driving | 79.3 | 76.0 | Qwen3-VL-32B 40.7 |
| Text2Image | 91.36*（UniGenBench） | — | Qwen-Image-2512 84.25 |
| Text2Video | 80.0 | 84.61 | Veo-3.1 等 |
| Image2Video | 79.4 | 82.8 | Wan2.2-A14B 78.0 |
| Audio | 7.31 | 7.34 | — |
| FD: Robot | 26.0* | 25.5* | Ctrl-World 0.5 |
| Policy: Robot | 39.7* | 28.1 | Gemini 3.1 Pro 23.0 |

**Physics-IQ**（只测物理保真这一个轴，396 个真实场景 ×3 固定视角，覆盖固体力学/流体/光学/热力学/磁学）：

| 模式 | Cosmos3-Super | +WMReward(BoN) | Sora2 | Wan2.2-A14B |
|---|---|---|---|---|
| I2V | 43.8 | **48.9** | 42.3 / 46.4 | 38.3 / 44.4 |
| V2V | **59.7** | **63.4** | — | Magi-1 56.0 / 62.6 |

读法要点：PAIBench-G 和 RBench 把物理合理性当成分项之一，Physics-IQ 才是独立轴；V2V 模式给 3 秒条件预测 5 秒运动。另外作者在脚注里直接说**公开的 PAIBench-G I2V 榜单（Qwen3-VL-235B 判分）结果不可复现**——所以对比时要以论文自测口径为准。

---

## 5. 我的三条批判性观察

1. **双塔是真复制**：AR/DM 参数量精确相等（各 1.4094B），意味着"统一"省的是流水线与数据协同，不是显存。宣称 4B/16B/64B 时其实都包含两塔，选卡时按整机 9.1GB(bf16 Edge) 起算，再加 VAE/ViT。
2. **物理能力靠 V2V 与后训练撑**：FD:Robot 26.0 vs Ctrl-World 0.5 这种数量级差说明该轴是"有没有能力"而非"强多少"；通用推理分数明确输给 Gemini 3.1 Pro。
3. **架构收敛点在 VLM 初始化**：Nano/Super 直接套 Qwen3-VL 权重做双塔共同初始化，Edge 例外（从零训 LLM）。换句话说 Cosmos 3 的一半竞争力是 Qwen3-VL 的语义先验。

---

## 6. 还没读的部分（下一轮）

§5 基建（数据基建 / attention kernel 实现 / 分布式训练 / selective activation checkpointing / 吞吐汇总 / vLLM vs TensorRT-LLM vs vLLM-Omni vs NIM 服务栈）、§6.3 生成器使用指南（含 Reasoner 当 prompt upsampler）、§7 相关工作、附录 A/B/C/D/F。


---

## 更正记录（依据 arXiv HTML 干净源 2606.02800v4）

本笔记初版的 §2 公式取自 pdftotext 有损文本，以下符号与原文不符，正确写法以 `docs/Cosmos3-中文全译.md` 为准：

| 笔记初版写法 | 原文正确写法 |
|---|---|
| 帧数 F、条件帧数 k | 总帧数 N、条件帧数 P |
| 域下标 d ∈ {1..N} | 域下标 k ∈ {1..K} |
| 时间增量 Δ = TPS_base / TPS | δt = TPS_base / TPS |
| 音频 TPS = 48000/1920 = 25 | 48000/1920 ≈ 25（原文为约等号） |
| AR 前缀 [x₁…xₙ, EOS, BOG] | [l₁…lₙ, ⟨EOS⟩, ⟨BOG⟩] |
| 注意力式带层上标 (l)、编号 (7)(8) | 无层上标；O_AR = Attn_causal(Q_AR, K_AR, V_AR)，O_DM = Attn_full(Q_DM, [K_AR;K_DM], [V_AR;V_DM]) |

另确认两处原文自身不一致（照录不改）：Table 8 表题称 Nano/Super 用 2048/4096 块 GB200，正文与 §4 写 1024/2048；Cosmos3-Nano 的 Cosmos-HUE 图生视频分数正文 88.5、表 14 为 88.6。
