r"""第 1 步：World Models (Ha & Schmidhuber 2018) 的最小可跑复现。

任务：Pendulum 摆起（力矩控制，目标 = 摆杆朝上并保持）。
观测：自己用 numpy 栅格化的 48x64 灰度图（不依赖 pygame/渲染后端）。
链路：像素 --VAE--> z --MDN-RNN--> 预测下一时刻 z（含不确定性）--> 学一个奖励头 --> CEM 在隐空间规划，MPC 执行。

运行顺序（在项目根目录 D:\科研\worldmodel 下）：
    python -m wm1.collect     # 采随机策略数据
    python -m wm1.train       # 先 VAE 后 MDN-RNN + 奖励头
    python -m wm1.plan        # CEM 规划 + 与随机基线对比
    python -m wm1.metrics     # 开环动作排序一致性 / 回报估计误差（这两个才是真验收）
"""

__version__ = "0.1"
