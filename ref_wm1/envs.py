"""环境：gymnasium Pendulum-v1 的物理 + 我们自己栅格化的像素观测。

刻意不用 pygame / mujoco 渲染：观测是我们定义的，画什么就决定了模型能看到什么。
这里画出枢轴、摆杆、末端配重，并把角速度编码成杆的亮度 —— 这样"从像素恢复状态"
是个良定义的问题，同时确实存在歧义（单帧看不到角度符号的全部信息），够你后面折腾一阵。
"""
from __future__ import annotations

import math

import numpy as np
import gymnasium as gym

W, H = 64, 48          # 宽 x 高
CX, CY = W // 2, H // 3
ROD_LEN = 15.0
G_DEFAULT = 10.0       # gymnasium 1.4 的 Pendulum 默认值；实测它是唯一开放的物理旋钮（dt/max_speed 硬编码）


def _disc(img: np.ndarray, x: float, y: float, r: float, v: float) -> None:
    """在图上画一个实心圆（越界自动裁剪）。"""
    h, w = img.shape
    x0, x1 = max(0, int(x - r)), min(w, int(x + r) + 1)
    y0, y1 = max(0, int(y - r)), min(h, int(y + r) + 1)
    if x1 <= x0 or y1 <= y0:
        return
    yy, xx = np.mgrid[y0:y1, x0:x1]
    mask = (xx - x) ** 2 + (yy - y) ** 2 <= r * r
    img[y0:y1, x0:x1][mask] = v


def render_state(theta: float, theta_dot: float) -> np.ndarray:
    """状态 -> [H,W] uint8 灰度帧。theta=0 为竖直向上。"""
    img = np.zeros((H, W), np.float32)
    # 摆杆：从枢轴沿角度方向采样画点；亮度随 |角速度| 增大
    # 图像 y 轴向下，而 theta=0 是竖直向上 => y 必须取减号（写成加号会把"朝上"画成"朝下"）
    tip_x = CX + ROD_LEN * math.sin(theta)
    tip_y = CY - ROD_LEN * math.cos(theta)
    bright = 0.45 + 0.55 * min(1.0, abs(theta_dot) / 8.0)
    for t in np.linspace(0.0, 1.0, 64):
        _disc(img, CX + (tip_x - CX) * t, CY + (tip_y - CY) * t, 1.1, bright)
    _disc(img, CX, CY, 2.6, 1.0)                      # 枢轴
    _disc(img, tip_x, tip_y, 3.4, 1.0)                # 末端配重
    # 注意：img 目前是 [0,1] 浮点亮度，必须放大到 0..255 再转 uint8；
    # 直接 astype(uint8) 会把所有非零像素压成 0/1，下游等于在看全黑图。
    return (np.clip(img, 0, 1) * 255.0).astype(np.uint8)


def state_of(obs: np.ndarray) -> tuple[float, float]:
    """gymnasium Pendulum 观测 [cos, sin, thetadot] -> (theta in [-pi,pi], thetadot)。"""
    return float(math.atan2(obs[1], obs[0])), float(obs[2])


class PendulumPixels:
    """轻量封装：step 返回 (frame, theta, theta_dot, reward, done)。

    g / dt 是"每帧物理时长"的旋钮：gymnasium 1.4 的 PendulumEnv 只接受 g，dt=0.05 与
    max_speed=8 是硬编码的，所以想让画面变慢只能降 g（摆速上限约 sqrt(4g)）。
    这里保留 gym.make 作为物理内核，g 由调用方给出。
    """

    def __init__(self, seed: int = 0, max_steps: int = 200, g: float = G_DEFAULT):
        self._env = gym.make("Pendulum-v1", max_episode_steps=max_steps, g=g)
        self._env.reset(seed=seed)
        self.max_steps = max_steps

    def reset(self, jitter: bool = False) -> dict:
        obs, _ = self._env.reset()
        if jitter:  # 轻微随机初始角，制造分布外起点（评测规划器时很好用）
            th = float(np.random.uniform(-math.pi, math.pi))
            obs = np.array([math.cos(th), math.sin(th), 0.0], np.float32)
            self._env.unwrapped.state = np.array([th, 0.0], np.float64)
        th, thd = state_of(obs)
        return {"frame": render_state(th, thd), "theta": th, "theta_dot": thd}

    def step(self, u: float):
        obs, rew, term, trunc, _ = self._env.step(np.array([float(np.clip(u, -2.0, 2.0))]))
        th, thd = state_of(obs)
        return {"frame": render_state(th, thd), "theta": th, "theta_dot": thd}, float(rew), bool(term or trunc)

    def close(self):
        self._env.close()


def is_upright(theta: float, tol: float = 0.30) -> bool:
    return abs(theta) < tol


# ---- 动作量纲：模型看到的动作 a = u / 2 ∈ [-1,1]，环境力矩 u = 2a ----
# 刻意用线性映射而不是 tanh：可精确求逆，规划器采样范围与训练分布一致。
TORQUE = 2.0


def to_torque(a) -> np.ndarray:
    return np.clip(np.asarray(a, np.float32) * TORQUE, -TORQUE, TORQUE)


def norm(theta: np.ndarray):
    return (np.asarray(theta) + math.pi) % (2 * math.pi) - math.pi


def pd_torque(theta, theta_dot, kp: float = 20.0, kd: float = 5.0) -> np.ndarray:
    """倒立摆平衡律。实测符号：gymnasium 1.4 的 newthdot = thdot + (3g/2l·sinθ + 3/(ml²)·u)·dt，
    力矩与角加速度同号，所以负反馈是 u = -(kp·θ + kd·θ̇)；写反号时三个不同增益给出同一条轨迹。"""
    return np.clip(-(kp * norm(theta) + kd * np.asarray(theta_dot)), -TORQUE, TORQUE)


def random_rollout(n_episodes: int, T: int = 200, seed: int = 0, scale: float = 2.0, g: float = 10.0):
    """随机策略采数据（World Models 论文里的 "random expert"）。返回展平的轨迹数组。

    注意：随机力矩会把 θ̇ 顶到 ±8 的硬上限，单帧 |Δθ| 约 0.4 rad —— 这一半数据本身就是
    时间上接近白噪声的。真正给规划器用的"慢速、接近竖直"区域由 expert_rollout 覆盖。
    """
    rng = np.random.default_rng(seed)
    env = PendulumPixels(seed=seed, max_steps=T, g=g)
    frames, actions, rewards, terminals, states = [], [], [], [], []
    for _ in range(n_episodes):
        s = env.reset()
        for t in range(T):
            u = float(rng.uniform(-scale, scale))
            frames.append(s["frame"])
            actions.append([u / TORQUE])
            rewards.append(reward_of(s["theta"], s["theta_dot"], u))
            terminals.append(1.0 if t == T - 1 else 0.0)
            states.append([s["theta"], s["theta_dot"]])
            s, _, done = env.step(u)
            if done:
                break
    env.close()
    return _pack(frames, actions, rewards, terminals, states)


def expert_rollout(n_episodes: int, T: int = 200, seed: int = 0, kp: float = 20.0, kd: float = 5.0,
                   noise: float = 0.35, tilt: float = 0.6, g: float = 10.0):
    """PD 平衡 + 动作噪声 + 中等初始倾角：覆盖"慢速、接近竖直"的控制区域。

    初始角只取 |θ|<=tilt：实测满扭矩只能在 |θ|<23.6° 内静态平衡（6 vs 15 rad/s²），
    从下方摆起在任何能量整形增益下 600 步内都进不了顶端邻域，所以不假装能采到。
    """
    rng = np.random.default_rng(seed + 10_000)
    env = PendulumPixels(seed=seed, max_steps=T, g=g)
    frames, actions, rewards, terminals, states = [], [], [], [], []
    for _ in range(n_episodes):
        th0 = float(rng.uniform(-tilt, tilt)); td0 = float(rng.uniform(-1.0, 1.0))
        env.reset()
        env._env.unwrapped.state = [th0, td0]
        s = {"frame": render_state(th0, td0), "theta": th0, "theta_dot": td0}
        for t in range(T):
            u = float(np.clip(pd_torque(s["theta"], s["theta_dot"], kp, kd) + rng.normal(0, noise), -TORQUE, TORQUE))
            frames.append(s["frame"])
            actions.append([u / TORQUE])
            rewards.append(reward_of(s["theta"], s["theta_dot"], u))
            terminals.append(1.0 if t == T - 1 else 0.0)
            states.append([s["theta"], s["theta_dot"]])
            s, _, done = env.step(u)
            if done:
                break
    env.close()
    return _pack(frames, actions, rewards, terminals, states)


def _pack(frames, actions, rewards, terminals, states):
    return {
        "frames": np.asarray(frames, np.uint8),
        "actions": np.asarray(actions, np.float32),
        "rewards": np.asarray(rewards, np.float32),
        "terminals": np.asarray(terminals, np.float32),
        "states": np.asarray(states, np.float32),
    }


def reward_of(theta: float, theta_dot: float, u: float) -> float:
    """与 gymnasium Pendulum 一致的非归一化奖励（越大越好，约 -16 ~ 0）。"""
    u = float(np.clip(u, -2.0, 2.0))
    return -(theta ** 2 + 0.1 * theta_dot ** 2 + 0.001 * u ** 2)
