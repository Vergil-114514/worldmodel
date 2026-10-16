"""采数据：随机策略 + PD 专家混合跑 Pendulum，存成 npz。

对应论文里 "先随便玩，攒经验" 那一步。动力学监督完全来自"下一帧确实发生了"；
混合专家只是为了让状态分布覆盖规划器真正要用的区域（这一点在 docstring 里量化说明）。
"""
from __future__ import annotations

import os

import numpy as np

from .envs import expert_rollout, random_rollout

DATA = os.path.join(os.path.dirname(__file__), "..", "data")
T = 200


def main(seed: int = 0, n_rand: int = 180, n_exp: int = 120, T: int = 200):
    """混合采集：随机力矩覆盖快运动，PD+噪声覆盖"接近竖直的慢运动"。

    只用随机策略是个真实陷阱：它把 θ̇ 顶到 ±8 饱和，单帧 |Δθ|≈0.4 rad，画面在 ~10 帧内
    就失去记忆；而规划器要用的恰恰是慢速近竖直区域，模型从没见过的话只能靠外推。
    """
    os.makedirs(DATA, exist_ok=True)
    a = random_rollout(n_rand, T=T, seed=seed)
    b = expert_rollout(n_exp, T=T, seed=seed)
    d = {k: np.concatenate([a[k], b[k]], axis=0) for k in a}
    E = len(d["frames"]) // T
    for k in ("frames", "actions", "rewards", "terminals", "states"):
        d[k] = d[k].reshape(E, T, *d[k].shape[1:]) if d[k].ndim > 1 else d[k].reshape(E, T)
    idx = np.random.default_rng(seed).permutation(E)          # 打乱，避免"前随机后专家"的分块
    d = {k: v[idx] for k, v in d.items()}
    path = os.path.join(DATA, "rollouts.npz")
    np.savez_compressed(path, **d)

    lv = np.unique(d["frames"])
    assert lv.size > 4, f"像素电平数={lv.size}，疑似渲染量纲错误（应为 0..255 的多级灰度）"
    fe = d["frames"].astype(np.float32) / 255.0        # [E,T,H,W]
    ff = fe.reshape(-1, *fe.shape[-2:])                # 展平用于随机配对
    rng = np.random.default_rng(0)
    p1 = ff[rng.integers(0, len(ff), 3000)]; p2 = ff[rng.integers(0, len(ff), 3000)]
    lag1 = np.abs(fe[:, 1:] - fe[:, :-1]).mean()       # 沿时间轴，不能沿 episode 轴
    th = d["states"][..., 0]
    print(f"已保存 {path}")
    print(f"  episodes={E}  T={T}  frames={d['frames'].shape}  灰阶={lv.size} 均值={d['frames'].mean():.1f}")
    print(f"  动作 a=u/2：均值={d['actions'].mean():+.3f} std={d['actions'].std():.3f} "
          f"范围=[{d['actions'].min():.2f},{d['actions'].max():.2f}]")
    print(f"  回报/回合 均值={d['rewards'].sum(1).mean():.1f} 最优={d['rewards'].sum(1).max():.1f} "
          f"最差={d['rewards'].sum(1).min():.1f}")
    print(f"  时间结构：lag1 像素差={lag1:.5f} 随机配对={np.abs(p1 - p2).mean():.5f} "
          f"（{np.abs(p1 - p2).mean() / lag1:.1f} 倍；>3 才有可学的动力学）")
    print(f"  状态覆盖：|theta|<0.5 占 {float(np.mean(np.abs(th) < 0.5)):.2f}，"
          f"|theta_dot|<1 占 {float(np.mean(np.abs(d['states'][..., 1]) < 1)):.2f}")


if __name__ == "__main__":
    main()
