# 6. 结果（Results）—— 逐句忠实翻译（第 2944–3660 行）

## 6. 结果（Results）

我们在对 Physical AI 至关重要的广泛的「理解」与「生成」任务谱系上评测 Cosmos 3。与聚焦单一模态或单一能力的既往系统不同，Cosmos 3 被设计为一个统一的全模态（omnimodal）世界模型，联合支持推理、感知、仿真与动作生成。因此我们的评测同时覆盖 Reasoner 与 Generator 两个组件，涵盖多模态理解、空间与时间推理、图像与视频生成、音频—视觉生成、迁移（transfer）生成、前向与逆向动力学，以及机器人策略学习。在这些多样化的基准上，相对于专用开源模型与领先的专有（proprietary）系统，Cosmos 3 都一致地展现出强劲的结果，凸显出面向 Physical AI 的统一世界模型架构所带来的收益。后续各节给出 Reasoner 与 Generator 的详细结果，并一并给出它们在机器人、自动驾驶、智慧基建与通用多模态领域上的能力分析。

> 表 10（Table 10）：Cosmos 3 各变体与对比模型在通用多模态理解、机器人、智慧基建与自动驾驶基准上的 Reasoner 评测结果。行报告单个基准或分组平均值，列报告模型得分。在每个分隔开的模型块内，每行的最高分与次高分分别以粗体和下划线显示。⟨此处标记符号在文本抽取中丢失⟩ 表示闭源模型。

⟨Table 10 的表体由约 21 列模型得分组成，且模型列名在 PDF 中竖排（旋转 90°），pdftotext 将其打散并与数值行交叉错位，单元格数值无法可靠归属到具体的「基准行 × 模型列」。以下仅列出可从最左列可靠恢复的行名（基准名/平均项名）；所有数值单元格在文本抽取中错位，无法确证，需对照 PDF 第 51 页复核。⟩

**Table 10 行名（按原文顺序，最左列可恢复）**

- 通用（General，19 个基准）：MMBench-Dev、RealWorldQA、CVBench、VideoPhy2、CausalVQA、MVPBench、CountBenchQA、AI2D、DocVQA、InfoVQA、OCRBench-v2、LogicVista、MMMU-Pro、MVBench、BlinkSpatial、BlinkDepth、RefCOCO、HallusionBench、IFBench、General Avg.
- 机器人（Robotics，17 个基准）：Cosmos-ER、Cosmos-CS、RefSpatial、VSI-Bench、SparBench、RynnBrain-Area、RynnBrain-Spatial、RynnBrain-Trajectory、RynnBrain-Affordance、RynnBrain-Object、RynnBrain-Grounding、MMSIBench、MMSIVideoBench、HealthSurgiBench、ERQA、RoboSpatialHome、Where2Place、Robotics Avg.
- 智慧基建（Smart Infrastructure，9 个基准）：VANTAGE-2DGrounding、VANTAGE-Astro2D、VANTAGE-2DPointing、VANTAGE-DVC、VANTAGE-EventVerif、VANTAGE-SOT、VANTAGE-Temporal、VANTAGE-VQA、TARBench、Smart Infra. Avg.
- 驾驶（Driving，3 个基准）：LingoQA、AVSpecialCollision、AVSpecialStopBehavior、Driving Avg.

⟨表头竖排模型名在抽取中散落于表体，可辨认出的列块名称片段包括：Cosmos 3 Super、Qwen3-VL 32B、Cosmos-Reason2 32B、Gemma-4 31B、Gemini 3.1 Pro、Cosmos 3 Nano、Qwen3-VL 8B、Cosmos-Reason2 8B、Gemma-4 E4B、RynnBrain 8B、MiMo-Embodied 7B、Cosmos 3 Edge、Qwen3-VL 2B、Cosmos-Reason2 2B、Gemma-4 E2B、RynnBrain 2B（其后为闭源模型列块）；但它们与具体分数列的对应关系无法确证。⟩

### 6.1 推理器评测（Reasoner Evaluation）

Cosmos 3 Reasoner 在总计 48 个基准上进行评测。结果被聚合为四个类别：通用（general）、机器人（robotics）、智慧基建（smart infrastructure）与驾驶（driving）。Tab. 10 报告 Edge、Nano 与 Super 三个模型的结果，以及它们与既有开源和闭源模型的对比。这些数字使用 VLMEvalKit Duan et al. (2024) 进行评测，该工具已集成进我们的基准基础设施。

**通用（General）。** 我们选取 19 个基准（列于下方）来评估模型的通用能力。

- 宽泛的视觉问答与多模态理解由 MMBench_DEV (Liu et al., 2024d)、RealWorldQA (xAI, 2024) 与 AI2D (Kembhavi et al., 2016) 衡量，它们测试模型能否在回答多样化的语义与组合性问题的同时，解读自然图像、示意图与真实世界场景。

- 空间、定位（grounding）与量化推理。由 CVBench (Tong et al., 2024)、BlinkSpatial、BlinkDepth (Fu et al., 2024)、RefCOCO (Yu et al., 2016) 与 CountBenchQA (Paiss et al., 2023) 评估，覆盖 2D/3D 空间关系、深度感知、指示表达定位（referring-expression localization）与物体计数。

- 文本密集的视觉理解由 DocVQA (Mathew et al., 2021)、InfoVQA (Mathew et al., 2022) 与 OCRBench-v2 (Fu et al., 2026) 覆盖，它们要求在文档、信息图、场景文字与结构化视觉版面之上进行阅读与推理。

- 视频、物理与因果推理由 MVBench (Li et al., 2024c)、VideoPhy2 (Bansal et al., 2025b)、MVPBench (Krojer et al., 2025) 与 CausalVQA (Foss et al., 2025) 评估，测试跨帧的时间事件理解、物理可信度与因果推理。

- 高级推理、鲁棒性与指令遵循由 LogicVista (Xiao et al., 2024b)、MMMU_Pro (Yue et al., 2025)、HallusionBench (Guan et al., 2024) 与 IFBench (Pyatkin et al., 2025b) 衡量，它们探查视觉逻辑、专家级多模态问题求解、抗幻觉能力以及对用户指令的遵从度。

总之，这些基准从感知、定位、文字识别、时间理解以及可靠的指令条件响应生成等方面，提供了对模型通用推理能力的宽幅视图。

**机器人（Robotics）。** 我们将 17 个机器人与具身推理基准归入若干能力族。

- 具身常识与任务推理由 Cosmos Reason 中的 Embodied Reasoning、CommonSense (NVIDIA, 2025)、ERQA (Gemini Robotics Team et al., 2025) 与 Where2Place (Yuan et al., 2024) 衡量，它们测试模型能否就物体可用性（affordance）、可行动作、放置决策以及具身环境中的物理常识进行推理。

- 空间定位与场景几何由 RefSpatial (Zhou et al., 2025b)、VSI-Bench (Yang et al., 2025b)、SparBench (Zhang et al., 2025b) 与 RoboSpatialHome (Song et al., 2025) 评估，覆盖指示表达定位（referring-expression grounding）、度量与关系式空间理解、室内布局推理、自由空间感知，以及与机器人相关的定位。

- 面向机器人的感知与动作理解由 RynnBrain (Dang et al., 2026) 与 ERQA (Gemini Robotics Team et al., 2025) 刻画，它们探查与操作相关的感知、动作可行性、轨迹推理，以及基于真实机器人 episode 的以物体为中心的决策。而 MMSIVideoBench (Lin et al., 2025c) 要求跨多个视角或帧进行推理，以推断物体对应关系、空间关系、时间变化与场景级结构。我们策划了 HealthSurgiBench，这是一个用于手术室理解的自研（in-house）基准，包含 23 种问题类型。它将针对结构化输出的规则式打分——例如计数、工具、角色、边框、坐标、时间/距离估计、有序列表、场景图与监护仪文字——与一个本地 Qwen3-4B 评审模型（judge）对六种自由格式答案类型的打分结合起来。最终分数对每个样本使用其适用的评估器，然后报告所有样本上的未加权平均值。

总之，这些基准评估模型能否超越静态视觉识别、走向具身推理：理解物体在哪里、它们如何相互关联、哪些动作是可行的，以及空间证据如何随视角与时间演化。

**智慧基建（Smart infrastructure）。** 我们在 VANTAGE-Bench (NVIDIA, 2026c) 与 Traffic Anomaly Reasoning（TAR，交通异常推理）(NVIDIA, 2026b) 上进行评测，覆盖仓储物流、运输以及智慧基建固定摄像头场景。VANTAGE-Bench 通过事件验证、VQA、指称（referring）、指点（pointing）、定位、时间定位、密集描述（dense captioning）以及 VLM 原生单目标跟踪来衡量语义、空间、时间与时空理解，包含 3,346 个资产与 35,027 条专家标注，其中含合成异常影像。TAR 即 AI City Challenge 2026 Track 3 评测套件，使用异构 QA、时间 IoU 与文本生成指标，评估异常验证、时间定位、场景描述、因果关系、摘要以及域外（out-of-domain）泛化。

**驾驶（Driving）。** 我们使用 LingoQA (Marcu et al., 2024) 与两个用于安全关键驾驶事件分类的自研基准来评估驾驶能力。AVSpecialCollisionBench 衡量模型能否把每段视频正确分类到三个事件类别之一：碰撞（collision）、接近碰撞（near collision）或无碰撞（no collision）。该基准包含每类 100 段视频，并计算逐类准确率。最后报告三个类别上的平均准确率作为最终分数。AVSpecialStopBehaviorBench 评估停车标志行为分类，共五个类别：完全停车（full stop）、滑行停车（rolling stop）、不停车（no stop）、不相关（not relevant）与虚假标志（false sign）。该基准每类包含 10 段视频，其最终分数是五个逐类准确率的平均值。

在通用基准上，Cosmos 3 与开源模型相比具有竞争力，但仍然落后于 Gemini 3.1 Pro (Google DeepMind, 2025a)。与 Cosmos-Reason2 相比，Cosmos 3 展现出更强的通用能力，这得益于额外 20% 的预训练数据所带来的数据多样性提升。在机器人、智慧基建与驾驶领域，Cosmos 3 优于开源与闭源模型，包括 RynnBrain (Dang et al., 2026)、Mimo-Embodied (Hao et al., 2026) 与 Gemma-4 (Google DeepMind, 2026b)，仅在机器人领域与 Gemini 3.1 Pro 存在小幅差距。总体而言，Cosmos 3 在机器人、智慧基建与自动驾驶上展现出强的领域专用推理能力，可支撑广泛的 Physical AI 应用。

### 6.2 生成器评测（Generator Evaluation）

Cosmos 3 的 Generator 组件在一套多样化任务上被评测，这些任务共同度量它为 Physical AI 仿真与生成多模态世界的能力。与聚焦单一模态的常规模型不同，Cosmos 3 在一个统一框架内对图像、视频、音频与动作进行联合建模，从而可对图像生成、视频生成、音频—视觉生成、迁移生成、前向与逆向动力学以及机器人策略学习开展评测。我们进一步评测专门的后训练（post-trained）变体，包括 Cosmos3-Super-Text2Image、Cosmos3-Super-Image2Video 与 Cosmos3-Nano-Policy-DROID，以评估从共享的全模态基础模型出发进行下游适配的有效性。我们的基准套件融合了自动化指标、人工评估、面向领域的 Physical AI 基准以及真实世界机器人评测，覆盖提示词遵循、物理可信度、时间一致性、音画同步、可控性、动作预测与任务完成等关键能力。

#### 6.2.1 图像生成评测（Image Generation Evaluation）

我们把 Cosmos 3 的图像生成评测作为单帧视觉生成来进行，聚焦四条互补的轴线：宽泛的语义提示词遵循、精确的场景文字渲染、人类偏好对齐以及视觉美感。UniGenBench 是首要的提示词遵循指标，因为它能在测试点（testpoint）粒度暴露失败。我们对 UniGenBench 做了增强，加入一个 Physical-AI 子集。CVTG 隔离出图像生成器一类常见失败模式——拼写错误、遗漏、模糊或重复的场景文字——并通过基于 OCR 的 GNED 与 PNED 分数加以度量。HPSv3 与 LAION 美学分通过测量总体人类偏好与视觉吸引力来补充那些针对性检查，从而给出比任何单一聚合分数更可行动的 T2I 质量视图。对所有基准，我们都使用 Claude-Opus-4.7 作为提示词改写器（prompt rewriter），把评测用的文本提示词转换为 Sec. 6.3.1 与 Sec. 6.3.2 所述的结构化格式，以确保它们匹配生成器所偏好的训练提示词风格。指令模板见 Appendix B.2。我们在 1024x1024 分辨率下生成并比较所有模型。对于开源模型，我们遵循其文档中给出的推荐超参数与负向提示词（negative prompts）。定性示例亦可见 Fig. 17。

⟨原文本段在 PDF 中被下方的 Figure 17 图题打断（跨第 53–54 页），此处按原文段落整体译出，图题紧随其后。⟩

> 图 17（Figure 17）：由 Cosmos3-Super-Text2Image 生成的示例图像。我们的模型生成的图像既在物理上可信又具照片级真实感，表现出连贯的物体几何、一致的物体—环境交互等。所有图像都由单次采样（single-shot）的上采样 JSON 提示词生成，使用 shift=3.0、guidance=4.0 与 50 步扩散，如 Table 21 中所述。这些结果凸显了该模型作为面向机器人、自动驾驶以及必须遵循物理定律的其他场景的高效真实世界图像仿真器的潜力。

**UniGenBench。** UniGenBench (Wang et al., 2025h) 是一个面向文本到图像生成的统一语义评测基准。它包含 600 条提示词，横跨 5 个主题与 20 个子主题，每个主题在一个 MLLM-as-Judge 框架下按 10 项主要与 27 项子评测准则进行评估。为更好地评估 Cosmos 3 在 Physical AI 场景中的能力，我们用 570 条额外提示词（UniGenBench-Phys）扩充该基准，专攻照片级真实感的物理世界场景。这些提示词覆盖六个物理世界子域：(a) 机器人与工业、(b) 物理标识与文字、(c) 自动驾驶、(d) 施工现场、(e) 流体动力学、(f) 医疗/临床。Gemini 3.1 Pro 对每张生成图像按每个测试点以二元通过/未通过（pass/fail）方式评估；主分数为平均测试点准确率，在完整的 1,170 条提示词（即 "All"）上报告，并额外给出原始子集与物理子集上的拆分（即 "Orig" 与 "Phys"）。

**CVTG。** CVTG (Du et al., 2025)（Complex Visual Text Generation，复杂视觉文字生成）评估模型在视觉上复杂场景中准确渲染文字的能力。这一能力对真实世界环境尤为重要，因为标识、标签与说明性文字必须清晰可读且拼写正确。生成图像先由 OCR 系统处理以抽取可见文字区域，随后基于归一化编辑距离（即 NED）的匈牙利匹配（Hungarian matching）把预测字符串与目标字符串进行配对。

我们在两个提示词集合上评测：(a) CVTG-500L，一个以英文为主、从 CVTG-2K 中随机抽取 500 条提示词构成的子集，同时保持可比的文字区域数量覆盖。我们进一步把每条短提示词上采样（upsample）为一段长而密集的描述，以更好反映现代世界模型生成的要求。(b) CVTG-102ch，一个以中文为主、包含 102 条提示词的集合，用于评估准确的汉字渲染。这些提示词取自常见场景与有物理依据的领域，包括公共空间、户外与景区环境、数字显示屏以及其他真实世界场景。

> 表 11（Table 11）：Text-to-Image 基准结果。UniGenBench 分数为所满足的评测准则比例；"All (1170)" 聚合了原始 600 条提示词（Orig）与 570 条 Physical AI 提示词（Phys）。PNED 与 GNED 是字符级准确率指标（越高越好）；CVTG-102ch 测试中文汉字渲染，CVTG-500L 测试英文长提示词渲染。Aesthetic v2 与 HPSv3 是越高越好的图像级指标。

| 模型 | 类型 | UniGenBench All | UniGenBench Orig | UniGenBench Phys | CVTG-500L GNED | CVTG-500L PNED | CVTG-102ch GNED | CVTG-102ch PNED | Aesv2 | HPSv3 |
|---|---|---|---|---|---|---|---|---|---|---|
| Cosmos3-Super-Text2Image | Open-source | 91.36 | 93.34 | 89.54 | 80.88 | 89.08 | 32.02 | 41.22 | 5.91 | 11.60 |
| Cosmos3-Super | Open-source | 87.33 | 85.21 | 89.64 | 66.77 | 70.97 | 8.48 | 16.31 | 5.76 | 9.49 |
| Cosmos3-Nano | Open-source | 84.61 | 87.32 | 82.12 | 24.23 | 26.53 | 4.63 | 9.70 | 5.76 | 8.99 |
| Gemini 3 Pro Image | Closed-source | 90.69 | 92.81 | 89.74 | 59.24 | 71.79 | 46.00 | 76.40 | 5.70 | 11.78 |
| FLUX.2-dev | Open-source | 87.60 | 89.77 | 85.61 | 74.71 | 84.98 | 44.33 | 68.74 | 5.75 | 11.38 |
| Qwen-Image-2512 | Open-source | 84.25 | 87.32 | 81.44 | 79.68 | 90.86 | 46.33 | 71.26 | 5.92 | 11.03 |
| Hunyuan 3.0 | Open-source | 84.02 | 87.68 | 80.67 | 71.40 | 87.68 | 49.05 | 71.31 | 5.90 | 11.93 |
| Z-Image-Turbo | Open-source | 78.14 | 81.53 | 75.03 | 75.20 | 86.95 | 49.18 | 73.32 | 5.70 | 11.36 |

⟨由文本抽取重建，列对齐需对照 PDF 第 55 页复核⟩（原文表头各指标后的 ↑ 方向箭头符号在文本抽取中丢失，显示为空括号。）

脚注（Table 11 表下注，原文无编号）：Gemini 3 Pro Image 有很高概率生成大小写不敏感（case-insensitive）的场景文字（例如 "Adventure" ⟨箭头符号在抽取中丢失⟩ "ADVENTURE"）。当排除该类错误后，CVTG-500L 分数上升到 GNED = 75.97 与 PNED = 91.45。

**HPSv3。** HPSv3 (Ma et al., 2025) 使用一个训练得到的人类偏好奖励模型来评估提示词感知的文本到图像质量。它建立在 HPDv3 之上，后者是一个横跨合成与真实图像、覆盖广泛质量等级的偏好数据集。HPSv3 采用基于 VLM 的架构，以不确定性感知的排序损失（uncertainty-aware ranking loss）训练，产出一个反映人类对语义对齐、真实感与美学质量判断的提示词感知分数。我们直接在 Cosmos 3 的结果上应用 HPSv3，以获得这一互补的人类偏好指标。

**Aesthetic V2。** Aesthetic V2 (Schuhmann and LAION, 2022) 使用 LAION 美学预测器来度量与提示词无关的视觉吸引力。该预测器在一个建立在 CLIP 图像嵌入之上的轻量模型上，以 1-10 的尺度估计人们会有多喜欢一张图像。与 HPSv3 不同，该分数不以输入提示词为条件，因此并不直接度量指令遵循或语义对齐。我们把它用作一个独立的图像质量信号，用来刻画一般的视觉吸引力与构图质量。

**Artificial Analysis Text-to-Image 榜单（Artificial Analysis Text-to-Image Leaderboard）。** 为在真实世界场景下评估 Cosmos 3，我们把专门化的 T2I 模型 Cosmos3-Super-Text2Image 连同一套智能体（agentic）流程装置（harness）提交到 Artificial Analysis Text-to-Image 榜单，接受众包公开投票。该模型在所有开源权重（open-weight）模型中排名第 1（#1），并在所有模型（开源 + 闭源）中排名第 4（#4）。关于提交的更多细节，请见 Appendix B.7。

> 图 18（Figure 18）：Cosmos3-Super-Text2Image 是众包竞技场（crowdsourced arena）排名中的第 1 名开源权重模型。Cosmos3-Super-Text2Image 在 Artificial Analysis Text to Image Leaderboard 的开源权重模型中排名第 1（计入专有模型则排名第 4）（日期：2026-05-28）。

#### 6.2.2 视频生成评测（Video Generation Evaluation）

我们通过互补的自动化基准与人工基准来评测 Cosmos 3 的视频生成能力。自动化基准提供可扩展、可复现的比较，并捕获广泛的质量与领域专用信号，但随着模型进步，其判别力会下降（尤其是在领域专用的 Physical-AI 场景中，这类指标通常对时间与基于物理的失败是短视的）。人工评估在这些缺口上予以补足：它能捕获自动化协议系统性地漏掉的长尾物理、具身与语义失败，并把分数铺开到一个明显更宽有意义的范围上，使得最先进模型之间微小但真实的差异仍可被检出。我们报告三个自动化基准——PAIBench-G、RBench 与 Physics-IQ——的结果，随后是 Cosmos HUE（一个面向 Physical AI 视频生成的专用人工评估协议）以及 Human World Bench（HWB，针对任务级指令下真实人体运动的定向人工评估）。对所有基准（自动化或人工评估），我们都使用 Claude-Opus-4.6 作为提示词改写器，把文本提示词转换为 Sec. 6.3.1 与 Sec. 6.3.2 所述的结构化格式，以确保它们匹配训练提示词分布。

**PAIBench-G。** PAIBench-G 是 Physical AI Benchmark (Zhou et al., 2025c) 的视频生成赛道，包含横跨六个 Physical AI 领域的 1,044 组图文提示对：Human（人类，299）、Autonomous Vehicle（自动驾驶车辆，239）、Common Sense（常识，174）、Robotics（机器人，107）、Physics（物理，107）与 Industry（工业，107）。我们采用它是因其广泛的领域覆盖与均衡的打分：每个模型获得一个 Quality Score（聚合帧一致性、运动平滑度、美学质量与视频—文本对齐等指标）与一个 Domain Score（用 VLM-as-Judge 对各领域的物理与语义正确性做二元核验）。总体分数对二者等权：Overall = 0.5 × Quality + 0.5 × Domain。由于与人类 ELO 排名的 Pearson 相关系数达到 r=0.918，PAIBench-G 非常适合在训练早期阶段可靠地度量进展，此时模型尚未收敛到自动化分数开始饱和的前沿水平。对每条提示词，我们跨 5 个随机种子生成视频，并在 720p 分辨率、16:9 宽高比、189 帧的设定下评测。尽管 PaiBench-G 原生只支持 Image-to-Video 评测，我们把其扩展为同样计算 Text-to-Video 分数²。Tab. 12 使用 Qwen2.5-VL-72B-Instruct 作为 VLM 评审，报告文本到视频与图像到视频两条 PAIBench-G 的结果；Cosmos3-Super 在两条赛道上都取得 state-of-the-art 的 overall 分数，成为最佳开源模型，超越了包括 Veo-3.1 在内的强闭源模型。

⟨原文本段在 PDF 中被下方的 Table 12 与其页脚注打断（跨第 56–57 页），此处按原文段落整体译出，表格与脚注紧随其后。⟩

> 表 12（Table 12）：PAIBench-G 与 RBench 结果，跨 Text-to-Video 与 Image-to-Video 两种设定。PAIBench-G 在六个 Physical AI 领域上评估视觉质量与领域专用准确率，而 RBench 评估具身机器人场景中的任务正确性与物理可信度。Cosmos3-Super 在 PAIBench-G T2V 与 I2V 两项上都取得开源模型中的最高 overall 分数，而 Cosmos3-Nano 在 RBench 上领先。粗体表示该列的冠军，下划线表示次优。

| 模型 | 类型 | PAIBench-G T2V Overall | PAIBench-G T2V Domain | PAIBench-G T2V Quality | PAIBench-G I2V Overall | PAIBench-G I2V Domain | PAIBench-G I2V Quality | RBench I2V Score |
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

⟨由文本抽取重建，列对齐需对照 PDF 第 57 页复核：抽取中 11 个数值块与 11 个行首模型名并未逐行对齐，此处按「数值块文档顺序 = 行文档顺序」重建；该顺序与正文所有可核验陈述一致（Cosmos3-Super 的 T2V Overall 80.0 与 I2V Overall 82.8 为全表最高、含闭源；Cosmos3-Nano 的 RBench 58.4% 与 Seedance-1.5-Pro 并列次优于最高 60.7%，并领先全部开源；RBench 列中三个 -- 落在 Cosmos-Predict2.5-14B、Wan2.1-14B、Wan2.2-5B 三行），仍需 PDF 复核。⟩

脚注 2（原文页脚注）：我们发现公开的 PAIBench-G Image-to-Video 榜单结果（由 Qwen3-VL-235B-A22B 担任评审）不可复现。因此我们在内部评测（Tab. 12）中使用 Qwen2.5-VL-72B-Instruct 作为 domain-score 评审，并独立地向公开榜单提交；在两者之上，Cosmos3-Super 与 Cosmos3-Nano 均排名总体第一与第二。

**RBench。** RBench (Deng et al., 2026) 在具身任务场景中评估视频生成，强调机器人—物体交互中的任务正确性与物理可信度，而非纯粹的感知真实感。PAIBench-G 宽泛地覆盖 Physical AI 领域，而 RBench 把机器人作为一个关键的 Physical AI 用例更深入地挖掘，跨多种机器人形态（morphology）压力测试模型生成物理上连贯的操作序列的能力。该基准包含 650 个图文评测样例，来自两个互补的划分：250 组面向任务的配对，横跨五个类别（Common Manipulation 常规操作、Long-horizon Planning 长时程规划、Multi-entity Collaboration 多实体协作、Spatial Relationship 空间关系、Visual Reasoning 视觉推理）；以及 400 组面向具体形态的配对，覆盖四种机器人形态（Dual-arm 双臂、Humanoid 人形、Single-arm 单臂、Quadruped 四足）。提示词取自 RoVid-X (Deng et al., 2026)，这是一个涵盖 1,300 多种技能、由 4M 机器人片段构成的精选语料库。每段视频按 Task Completion（TC，任务完成，取物理—语义可信度与任务遵循一致性的平均）与 Visual Quality（VQ，视觉质量，机器人主体稳定性与运动平滑度的惩罚式组合）打分，最终分数是所有 650 个样例上两者的均值。由于在 25 个被评测模型上与人类判断的 Spearman 相关系数达到 ⟨原文此处符号在文本抽取中丢失⟩ = 0.96，RBench 为具身生成质量提供了可靠的信号。对每条提示词，我们以单个种子生成视频，并在 720p 分辨率、16:9 宽高比、121 帧的设定下评测。Tab. 12 报告 Cosmos 3 在 RBench 上的图像到视频结果——Cosmos 3 成为最佳开源模型。

如 Tab. 12 所示，Cosmos3-Super 在 T2V 与 I2V 两项 PAIBench-G 上取得包括闭源在内的所有模型中最高的 overall 分数，而 Cosmos3-Nano 在 RBench 上追平次优结果。两个 Cosmos 3 变体也显著优于它们的 Cosmos-Predict2.5 前代，体现出全模态架构带来的收益。虽然两个基准都把物理可信度纳入打分，但它们并未深入探查这一点。因此我们转向 Physics-IQ，以对物理遵从性做定向评估。

> 表 13（Table 13）：Physics-IQ 基准结果，按条件化模式分列。WMReward (BoN) 表示使用 WMReward (Yuan et al., 2026) 进行 best-of-⟨N，原文符号在抽取中丢失⟩ 重排。Physics-IQ 分数越高越好。Cosmos3-Super 在 I2V 与 V2V 上都取得了 state-of-the-art 结果，无论是否使用 WMReward+BoN。粗体表示该列组中的最优，下划线表示次优。

**(a) Image-to-Video（I2V）。**

| 模型 | 模式 | 分数 |
|---|---|---|
| Cosmos3-Super | I2V + WMReward (BoN) | 48.9 |
| Cosmos3-Nano | I2V + WMReward (BoN) | 43.8 |
| Sora2 (Closed-sourced) | I2V + WMReward (BoN) | 46.4 |
| Wan2.2-A14B (Open-sourced) | I2V + WMReward (BoN) | 44.4 |
| Cosmos3-Super | I2V | 43.8 |
| Cosmos3-Nano | I2V | 40.2 |
| Sora2 (Closed-sourced) | I2V | 42.3 |
| Wan2.2-A14B (Open-sourced) | I2V | 38.3 |

**(b) Video-to-Video（V2V）。**

| 模型 | 模式 | 分数 |
|---|---|---|
| Cosmos3-Super | V2V + WMReward (BoN) | 63.4 |
| Cosmos3-Nano | V2V + WMReward (BoN) | 57.7 |
| Magi-1 (Open-sourced) | V2V + WMReward (BoN) | 62.6 |
| Cosmos3-Super | V2V | 59.7 |
| Cosmos3-Nano | V2V | 50.2 |
| Magi-1 (Open-sourced) | V2V | 56.0 |
| Video-GPT (Open-sourced) | V2V | 35.0 |
| VideoPoet (Closed-sourced) | V2V | 29.5 |

⟨由文本抽取重建，列对齐需对照 PDF 第 58 页复核⟩

**Physics-IQ。** Physics-IQ (Motamed et al., 2026) 通过在真实世界起始上下文上施加条件、并为生成续接与真实物理结果之间的接近程度打分，来评估视频生成模型是否掌握了物理原理。与把物理可信度作为众多打分成分之一的 PAIBench-G 和 RBench 不同，Physics-IQ 把它单独隔离为唯一评测轴线，在精确的空间与时间维度上度量生成的运动是否与真实物理结果相匹配。Physics-IQ 覆盖五个物理类别——固体力学、流体动力学、光学、热力学与磁学——横跨从三个固定视点采集的 396 个真实世界场景，并配有成对的文本描述以支持文本条件化模型。它支持两种评测模式。在 image-to-video（I2V）中，模型以单个切换帧（switch frame）加上可选文本提示词为条件，预测随后的运动。在 video-to-video（V2V）续接中，模型以一段 3 秒的条件视频加上可选文本提示词为条件，预测接下来 5 秒的运动。生成的视频沿四条互补轴线（空间重叠、时间对齐、幅度加权的空间一致性、像素级误差）与真实物理续接进行比较，并由 real-vs-real 上界归一化为单一的 0-100 分数，可直接跨模型与跨条件化模式比较。

我们在 Tab. 13 中于 I2V 与 V2V 两种模式下评测 Cosmos3-Super，并在两种模式下与领先的开源及商业基线并列比较。对于 V2V，我们使用完整的 3 秒条件视频作为输入。我们还使用一个提示词上采样器（prompt upsampler），遵循与 PhyT2V (Xue et al., 2025) 类似的迭代精化策略，从 I2V 设定中的切换帧以及 V2V 设定中的 3 秒条件视频生成文本提示词。遵循公开 Physics-IQ 榜单与 WMReward 推理时对齐协议 (Yuan et al., 2026)，我们额外在 I2V 与 V2V 两种模式下为 Cosmos3-Super 运行了 WMReward + best-of-⟨N，抽取中丢失⟩（BoN）分数。由 Tab. 13，我们发现 Cosmos3-Super 在 I2V 上取得 state-of-the-art：其直接得分 43.8 超过各直接 I2V 基线，而 WMReward+BoN 进一步把分数提升到 48.9，高于使用 WMReward+BoN 的最强在列 I2V 基线。在 V2V 中，Cosmos3-Super 同样取得 state-of-the-art，直接达到 59.7，使用 WMReward + BoN 达到 63.4，高于使用 WMReward+BoN 的最强在列 V2V 基线。

虽然自动化评测指标在度量质量、提示对齐与物理可信度上很有价值，但即使是最强的基于 VLM 的指标也会漏掉某些伪影与失败案例。人工评估在两个方面对自动化指标形成补充：对被自动化协议系统性漏掉的长尾失败的覆盖，以及在更宽分数范围上的可分辨性。例如，在同一提示词集上，被评测的 T2V 生成器在人工评估上横跨 10 个分数点，而在可比的自动化 PAIBench-G overall 分数上仅横跨 4 个分数点（见 Appendix F）。因此我们用两个人工评估协议来补充我们的自动化结果：Cosmos HUE，面向宽幅的 Physical AI 视频生成；以及 Human World Bench（HWB），专门聚焦任务级指令下的真实人体运动。

> 表 14（Table 14）：在 Cosmos HUE 与 Human World Bench（HWB）上的人工评估结果。Cosmos HUE 通过四个维度上的原子式二元核验来评估宽幅的 Physical AI 视频生成质量；HWB 通过指令遵循通过率与物理通过率来评估任务级指令下的真实人体运动。Ground Truth 对与相同提示词配对的真实视频打分，并作为 Cosmos-HUE 的上界参照。Cosmos3-Super 取得最高的 HUE T2V 分数，并在开源模型中取得最高的 HWB 分数。逐维度的 HUE 完整榜单见 Appendix F。粗体表示该列最优；下划线表示次优。

| 模型 | 类型 | Cosmos HUE Text-to-Video | Cosmos HUE Image-to-Video | Human World Bench Image-to-Video |
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

⟨由文本抽取重建，列对齐需对照 PDF 第 59 页复核：抽取中 HUE 两列数值与行首模型名逐行错位，此处按「数值块文档顺序 = 行文档顺序」重建；该顺序与正文全部可核验陈述一致（Super T2V 89.3、I2V 89.6，仅落后 Veo-3.1 0.1 点即 89.7；Veo T2V 91.3、Seedance T2V 90.0；Nano T2V 87.6 为开源第三、I2V 为开源第二；HWB 列 71.9/66.9/67.8/60.7 与正文完全吻合）。⟩

**Cosmos HUE。** Cosmos HUE（HUman Evaluation，人工评估）是一个基于同一套 PAIBench-G 提示词集（Sec. 6.2.2）的人工打分协议。HUE 在两个方面区别于既往的人工评估协议。第一，它用原子式二元核验取代主观的 Likert 量表分级：每段视频被分解为一组单事实的 Yes / No / Unclear 问题，其表述使 "Yes" 始终表示期望的结果，从而把标注者的任务从整体判断转变为客观事实核验。每个（视频，问题）对由两名标注者独立评级，分歧升级给一名质量控制复核员。第二，逐提示词的问题集由一个三层 VLM 流程自动生成：Domain Strategist（领域策略器）把提示词分类到七个 Physical AI 领域之一；Scene Parser（场景解析器）从提示词（T2V）或从配对真实参考视频的采样帧（I2V）产出结构化的场景清单（scene manifest）；Auditor（审计器）发出最终的原子问题。这确保问题跟踪实际的提示词与参考场景，而非一份静态评分细则。三层全部运行在 GPT 5.2 上。随后由一轮人工复核补充 VLM 生成的问题集：复核员检查排名靠前模型生成的视频，并提出自动化流程尚未覆盖的失败模式对应的额外问题；这些被提出的问题被回折进问题库。评测集由从 PAIBench-G 中按保持其原生领域分布的方式采样的 100 条固定提示词组成，每个模型对每条提示词产出 5 个随机种子生成，即每个模型 500 段视频；逐提示词的问题集（至多 20 个二元问题）被应用于全部 5 段生成视频。每个问题被归入四个维度之一："Semantic Alignment"（语义对齐）、"Physical Laws"（物理定律）、"Geometric Reasoning"（几何推理）与 "Visual Integrity"（视觉完整性）。逐维度与逐领域的 T2V、I2V 榜单、正式打分方案以及信度估计在 Appendix F 中详述。

**Human World Bench（HWB）。** 虽然 Cosmos HUE 评估宽幅的 Physical AI 视频生成，Human World Bench（HWB）聚焦一个更定向、更具挑战性的设定：在任务级指令下，面向人类操作任务的第一人称（egocentric）image-to-video 生成。HWB 中的基准视频取自 EgoVerse (Punamiya et al., 2026)，包含 180 个样例。HWB 使用一套绝对的失败模式协议：标注者独立判断每段生成视频在指令遵循与物理可信度上的表现。我们报告两个顶层通过率。Instruction following（指令遵循）度量视频是否描绘了所要求的动作与物体。Physical plausibility（物理可信度）度量时间连贯性与物理可信度，包括物体动力学、接触与手部解剖结构。HWB 分数是指令遵循通过率与物理通过率的平均值。

⟨原文本段在 PDF 中被下一页顶部的 Figure 19 图题打断（第 59–60 页），此处按原文段落整体译出，图题紧随其后。⟩

> 图 19（Figure 19）：Cosmos3-Super-Image2Video 是众包竞技场（crowdsourced arena）排名中第 1 名开源权重模型。Cosmos3-Super-Image2Video 在 Artificial Analysis Image to Video Leaderboard (No Audio) 的开源权重模型中排名第 1（计入专有模型则排名第 22）（日期：2026-05-28）。

Tab. 14 报告了 HUE 在 T2V 与 I2V 上的 Cosmos-HUE 分数，以及 Human World Bench（HWB）结果。在 HUE T2V 上，Cosmos3-Super 是最佳开源模型，得分 89.3，仅次于闭源的 Veo-3.1（91.3）与 Seedance-1.5-Pro（90.0）。在 HUE I2V 上，Cosmos3-Super 再次是最佳开源模型，并与领先的闭源生成器基本持平，仅以 0.1 点落后于 Veo-3.1（89.6 vs. 89.7）。Cosmos3-Nano 也很有竞争力，在 I2V 上位居开源模型第二（88.5），在 T2V（87.6）上位居第三。在 HWB 上，Cosmos3-Super 取得 71.9，是 Tab. 14 中所有被评测模型中最高的 state-of-the-art 分数，比最强的在列闭源基线 Veo-3.1（67.8）高 4.1 点，比最强的非 Cosmos 开源基线 Wan2.2-A14B（60.7）高 11.2 点。Cosmos3-Nano 同样表现强劲，取得 66.9，在开源模型中排名第二，优于所有非 Cosmos 的开源基线。合计起来，两个 Cosmos 3 变体拿下 HWB 上开源席位的前两名，表明其在两种模型规模上都具有强的第一人称人体运动生成能力。

**Artificial Analysis Image-to-Video 榜单（Artificial Analysis Image-to-Video Leaderboard）。** 为在真实世界场景下评估 Cosmos 3，我们把专门化的 I2V 模型 Cosmos3-Super-Image2Video 提交到 Artificial Analysis Image-to-Video 榜单（No Audio），接受众包公开投票。该模型在所有开源权重模型中排名第一，并在计入专有模型后取得全球第 22（#22）位。特别地，该模型与 Veo 3.1 (Google DeepMind, 2025b) 和 Wan 2.5 (Wan et al., 2025b) 这样的专有产品相当，展现出其卓越的时间动态与视觉保真度。

#### 6.2.3 音频生成评测（Audio Generation Evaluation）

文本到音频—视觉生成必须满足两个仅视频基准无法刻画的要求。生成的音频应当包含提示词所要求的声音事件，并且这些事件应可归因于正确的视觉来源、并具有可信的时序。因此我们使用 Cosmos-SoundBench 来评估音频生成，这是一个面向音频—视觉提示词遵循与同步的定向基准。该指标把语义上的音频—视觉正确性与不感知提示词的音频保真度分离开来。一个样例可能包含了正确的声音与正确的时刻，却仍受音频伪影之害；反之，它也可能在声学上干净，却漏掉所要求的事件。

**Cosmos-SoundBench。** Cosmos-SoundBench 包含从 FoleyBench (Dixit et al., 2026) 抽取的 144 条评测提示词。这些提示词覆盖非语音声音类别，例如环境场景、撞击、物体交互、工具、车辆、水以及其他环境效应。我们聚焦非语音音频，因为这类信号对 Physical AI 尤其重要。接触声音揭示材料与碰撞属性，工具声音指示正在进行的动作，而环境线索提供可能只被部分看见的场景上下文。

**音频—视觉质量指标（AVQ）。** 我们用一个结构化的 MLLM-as-judge 协议评估每个生成样例。评审只在需要该信息的阶段才看到提示词、视频与音频，从而使每个评审阶段聚焦于预期的证据，而不是无关的跨模态线索。

1. 提示词检查表构建（Prompt checklist construction）。在检视任何生成媒体之前，由 Claude Opus 4.7、Gemini 3.1 Pro 与 GPT 5.5 组成的集成体提取所需的前景声音、环境音频条件以及对提示词关键的视觉证据。我们使用多数投票来固定下游打分所使用的检查表。

2. 不感知提示词的视觉观察（Prompt-blind visual observation）。Gemini 3.1 Pro Preview 在未见提示词的情况下描述可见实体、动作、场景上下文与可能的声源。这些观察为来源归因与时间对齐提供证据，而非一个独立的视觉质量分数。

3. 语义音频—视觉打分（Semantic audiovisual scoring）。评审评估所要求的声音是否存在、是否来源特定、是否动态上恰当，以及是否与可见或可能的动作对齐。这些检查被映射到语义音频正确性（SA）、音频—视觉对齐（AVAlign）与提示词关键视觉支撑（VisualSupport），并按下式组合：

   SAV = 0.60 SA + 0.30 AVAlign + 0.10 VisualSupport。

   我们把该阶段运行三次并对分数取平均，以考虑评审的变异性。

我们额外测量 audiobox-aesthetics 的 Production Quality（PQ，制作质量）作为感知音频质量的代理，因为它试图量化样本级的清晰度与保真度、动态、频带宽度与空间化 (Tjandra et al., 2025)。

最终的音频—视觉质量分数为：

   AVQ = 0.5 SAV + 0.5 AQ。

对每个模型，我们在每条提示词上评测五次随机种子生成。对于 Cosmos 3 模型，我们使用 Claude Opus 4.6 把 SoundBench 提示词改写为 Sec. 6.3.1 与 Sec. 6.3.2 所述的结构化生成格式，以匹配生成器所使用的提示词分布。

Tab. 15 显示，最强的闭源系统在整体 AVQ 上保持优势，主要通过更高的感知音频质量。Seedance-1.5-Pro 取得最佳的 AVQ（7.64）与 PQ（7.06），其后是 Veo-3.1（7.45 AVQ，6.68 AQ）。相比之下，Cosmos 3 在度量声音是否与视觉事件匹配的语义与对齐成分上最强。Cosmos3-Nano 取得最佳的 SAV、SA 与 AVAlign 分数，而 Cosmos3-Super 取得最佳的视觉支撑分数。这一模式表明，Cosmos 3 的中期训练（mid-training）在把声音事件锚定（grounding）到生成视频方面是有效的，剩余的改进空间集中在低层音频保真度上。Fig. 20 展示了一个 Cosmos3-Nano 生成结果中视觉与声学事件强时间对齐的示例。

> 表 15（Table 15）：Cosmos-SoundBench 音频—视觉质量。我们报告总体 Audiovisual Quality（AVQ）、Semantic Audiovisual quality（SAV）、其 Sec. 6.2.3 中定义的子分数，以及 audiobox-aesthetics Production Quality（PQ）。粗体标记每列最佳分数，下划线标记次佳。Seedance-1.5-Pro 凭借更强的 PQ 取得最高 AVQ，而 Cosmos 3 取得最强的语义音频—视觉锚定与对齐。

| 模型 | 类型 | AVQ | SAV | SA | AVAlign | Visual Sup. | PQ |
|---|---|---|---|---|---|---|---|
| Cosmos3-Super | Open-sourced | 7.31 | 8.34 | 8.30 | 8.14 | 9.18 | 6.28 |
| Cosmos3-Nano | Open-sourced | 7.34 | 8.35 | 8.33 | 8.16 | 9.10 | 6.32 |
| LTX-2.3 | Open-sourced | 7.10 | 7.80 | 7.86 | 7.58 | 8.12 | 6.39 |
| Seedance-1.5-Pro | Closed-sourced | 7.64 | 8.21 | 8.22 | 8.06 | 8.61 | 7.06 |
| Veo-3.1 | Closed-sourced | 7.45 | 8.21 | 8.21 | 8.01 | 8.85 | 6.68 |
| LTX-2.3 Pro | Closed-sourced | 7.32 | 7.93 | 7.96 | 7.74 | 8.35 | 6.70 |
| Wan2.6 | Closed-sourced | 7.23 | 7.90 | 7.99 | 7.54 | 8.45 | 6.55 |
| Sora 2 | Closed-sourced | 6.90 | 7.94 | 7.97 | 7.70 | 8.49 | 5.85 |

⟨由文本抽取重建，列对齐需对照 PDF 第 62 页复核：Visual Sup. 与 PQ 两列在抽取中整体下移一行，此处按 AVQ = 0.5 SAV + 0.5 PQ（即文中 AVQ = 0.5 SAV + 0.5 AQ）逐行核算配平，全部 8 行均吻合到小数点后两位，例如 LTX-2.3 Pro：0.5×7.93+0.5×6.70=7.315≈7.32；Sora 2：0.5×7.94+0.5×5.85=6.895≈6.90；并满足正文陈述（Seedance PQ 7.06 最佳、Veo PQ 6.68、Cosmos3-Super 视觉支撑 9.18 最佳、Cosmos3-Nano SAV/SA/AVAlign 最佳）。⟩

> 图 20（Figure 20）：音频—视频事件对齐。来自一段 Cosmos3-Nano 生成结果的若干选定帧与所生成音频的频谱图配对显示。彩色帧标记锤击时刻，其时间标记与尖锐的频谱瞬态相吻合。灰色帧显示击打之间的一次非接触时刻，其中观察不到可比的声学瞬态。这一对比提供了定性证据：声学瞬态与视觉撞击时刻对齐，而非与期间的运动对齐。

#### 6.2.4 迁移生成评测（Transfer Generation Evaluation）

**双权重无分类器引导（Two-weight classifier-free guidance）。** 视频迁移同时以一个结构化的文本提示词和一个控制视频为条件，而描述保真度与结构遵从之间的最佳平衡会随模态而变化。为独立地控制这两个因素，我们使用一套双权重无分类器引导方案，为控制视频与文本提示词分别设置一个权重。

在每个去噪步，我们把去噪器评估三次——同时使用两个条件、只使用提示词（丢弃控制视频）、以及保留控制视频但把提示词替换为一个固定的负向描述（negative caption）。随后我们组合这些预测，使得控制权重从「仅提示词」的预测向「全条件」的预测方向外推（强化结构控制），而文本权重则朝着远离负向提示预测的方向外推（强化描述保真度）。把这两个权重作为两个独立旋钮暴露出来，可以让我们为每个模态分别调优到它自己的质量—保真度最佳点，并且我们发现这种分解式引导比标准的单一引导公式更有效。

> 表 16（Table 16）：PAIBench-C 单控制结果。每次生成以四种控制模态之一（depth 深度、segmentation 分割、blur 模糊、edge 边缘）为条件，并由对应的基于真值的指标打分：Depth si-RMSE，预测深度与参考深度之间的尺度不变均方根误差；Seg. mIoU，预测分割掩码与参考分割掩码之间的平均交并比；Blur SSIM，预测模糊图与参考模糊图之间的结构相似度；以及 Edge F1，预测边缘图与参考边缘图之间的 F1 分数。DOVER 是一个无参考的感知视频质量分数，在四个逐模态生成上取平均。Depth si-RMSE：越低越好；DOVER、Seg. mIoU、Blur SSIM 与 Edge F1：越高越好。粗体表示每列最佳结果。

| 模型 | DOVER | Seg. mIoU | Blur SSIM | Edge F1 | Depth si-RMSE |
|---|---|---|---|---|---|
| Cosmos3-Super | 10.14 | 0.71 | 0.91 | 0.50 | 0.58 |
| Cosmos3-Nano | 10.39 | 0.72 | 0.91 | 0.49 | 0.62 |
| Cosmos-Transfer2.5 | 9.49 | 0.68 | 0.90 | 0.45 | 0.68 |

⟨由文本抽取重建，列对齐需对照 PDF 第 63 页复核⟩

**通用视频迁移（General video transfer）。** 我们在 PAIBench-C (NVIDIA, 2025c) 上评估视频迁移，这是一个覆盖四种空间控制模态（blur 模糊、edge 边缘、segmentation 分割与 depth 深度）控制条件化的 video-to-video 基准。该基准包含 600 个片段，横跨三个 Physical AI 领域：来自 AgiBot World (Bu et al., 2025) 的 200 个机械臂操作片段、来自 OpenDV (Yang et al., 2024) 的 200 个驾驶片段，以及来自 Ego-Exo-4D (Grauman et al., 2024) 的 200 个第一人称日常生活的片段。

对每个样例，模型接收一个文本提示词与一段控制视频，必须生成一段遵循该控制、同时保留提示词场景语义的照片级真实视频。我们报告单控制设定（每个样例恰好一种模态），以便孤立地度量每种模态的贡献。

质量评估方式是：从生成视频与参考视频中重新提取相关的控制信号，并在对应的空间中比较它们（经 bilateral 滤波后的 blur SSIM、Canny edge F1、在估计深度上的尺度不变 RMSE、在开放词表分割掩码上的 mIoU），再加上 DOVER (Wu et al., 2023a) 作为与内容无关的感知真实度度量。
