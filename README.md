# worldmodel

世界模型学习工作区，两条线并行：**文献线**（Cosmos 3 技术报告的 1:1 中译与精读）和**动手线**（从零实现 Ha & Schmidhuber 2018 的 V-M-C 世界模型）。

## 目录

```
docs/                     文献线
  Cosmos3-中文全译.md      ← 交付：正文 §1–§8 逐节全译，含图/表/公式
  Cosmos3-讲解手册.md       ← 面向"能讲出来"的重组版
  Cosmos-3-精读笔记.md      ← 最早的技术地图 + 更正记录
  figures/                 从 arXiv HTML 抽出的 73 张图（全译的相对链接指向这里）
  paper/                   抽取—翻译—合并—机检 管线（extract/merge5/audit .mjs，en/ 干净英文源）
  papers/                  论文原文 PDF / pdftotext 残留 / arXiv HTML（PDF 与 txt 不入库）
  jepa/                    JEPA 与潜空间理论论文包（不入库，文件名即 arXiv 编号）
  _trans/ _archive/        分章初稿、作废稿

wm1/                      动手线，你自己从头写（当前为空）
ref_wm1/                  我写的实现 = 答案，做完对应阶段再看
ref/world-models-pytorch/ 上游参考 ctallec/world-models（CarRacing，V/M/C 分开训练，C 用 CMA-ES）
data/                     wm1 的轨迹数据（不入库，可重生成）
staging/                  给 esim 准备的 Cosmos3-Edge 权重离线中转，8.6G，不入库
```

## 动手线的六个阶段

每阶段先写下"要回答什么问题"和预测数字，再跑，再把差异记进 `wm1/LOG.md`。

| 阶段 | 要回答的问题 | 完成判据（实测） |
|---|---|---|
| 1 渲染 | 这个世界被观测成什么样 | 灰阶 >4；θ=0 杆尖 y<CY，θ=π y>CY |
| 2 数据 | 模型能学到什么分布 | lag1/随机像素差 ≥3；\|θ\|<0.5 占比 ≥0.3 |
| 3 VAE | 像素能否压成状态 | 重建 MAE<0.01；z 与 cosθ/sinθ 相关 >0.9；过拟合时 NLL 明显降 |
| 4 MDN-RNN | 状态的下一步是什么（分布） | 留出 NLL 同时打赢 copy 与边缘基线 |
| 5 奖励头 | 这个状态好不好 | **留出** R²>0.8 |
| 6 规划 | 会预测能否变成会决策 | 开环 Spearman 与闭环 MPC 回报是否一致 |

## 已实测的环境事实（省你重走）

gymnasium 1.4 的 `PendulumEnv.__init__` 只接受 `(render_mode, g)`，`dt=0.05`、`max_speed=8` 硬编码，所以无法靠降采样率让画面变慢。力矩与角加速度**同号**（`newthdot = thdot + (3g/2l·sinθ + 3/(ml²)·u)·dt`），PD 必须写成 `u = -(kp·θ + kd·θ̇)`；符号写错时不同增益会给出完全相同的轨迹。满扭矩只值 6 rad/s² 而重力项峰值 15 rad/s²，因此静态平衡只在 |θ|<23.6° 内可能，能量整形摆起在 600 步内进不了顶端邻域——本项目做的是"从中等倾角稳住"，不是摆起。

## 运行

```
conda activate wm1          # torch 2.6.0+cu124，RTX 3060 已实测可用
cd /d/科研/worldmodel
PYTHONIOENCODING=utf-8 python -m ref_wm1.collect      # 不加会中文乱码
PYTHONIOENCODING=utf-8 python -m ref_wm1.train > ref_wm1/results/train.log 2>&1
```
