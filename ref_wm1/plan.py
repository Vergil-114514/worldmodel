"""闭环：VAE 编码真实帧 -> RNN 推进隐状态 -> CEM 在隐空间规划 -> 执行第一步 -> 重复（MPC）。

对照的是同环境的随机策略基线。这里刻意把两个数分开报：
  * 回报（模型与真环境的优化目标本身）
  * 摆起成功率（|theta|<0.3 rad 的末态比例）
回报高但成功率低 = 模型偏爱"停在下面慢慢晃"这类局部最优，通常指向动力学或奖励头不准。
"""
from __future__ import annotations

import argparse
import json
import os
import time

import numpy as np

from .core import Runtime, frame_of
from .envs import PendulumPixels, is_upright, pd_torque, reward_of


def set_state(env: PendulumPixels, theta: float, theta_dot: float):
    env._env.reset()
    env._env.unwrapped.state = [float(theta), float(theta_dot)]


def frame_of(theta, theta_dot):
    from .envs import render_state
    return render_state(theta, theta_dot)


def run_mpc(rt: Runtime, env: PendulumPixels, horizon=16, n_samples=200, n_iter=6, seed=0, init=None):
    """滚动规划：每步从当前真实帧重新编码，CEM 求最优动作序列，只执行第一个动作。

    h 每次重规划都归零（core.plan 里写死）：观测把角速度编码进了杆的亮度，单帧近似马尔可夫。
    想验证隐状态到底有没有用，把 render_state 的亮度项关掉再跑一遍，成功率应当掉下来。
    """
    if init is None:
        s = env.reset()
    else:
        set_state(env, init[0], init[1])
        s = {"frame": frame_of(init[0], init[1]), "theta": init[0], "theta_dot": init[1]}
    tot, traj = 0.0, []
    for t in range(env.max_steps):
        acts, pred = rt.plan(s["frame"], horizon=horizon, n_samples=n_samples, n_iter=n_iter, seed=seed + t)
        u = float(np.clip(acts[0] * 2.0, -2.0, 2.0))   # 模型动作 a=u/2，还原成力矩
        r = reward_of(s["theta"], s["theta_dot"], u)
        s, _, done = env.step(u)
        tot += r
        traj.append((s["theta"], u, r, pred))
        if done:
            break
    return tot, s["theta"], traj


def run_random(env: PendulumPixels, seed=0, scale=2.0, init=None):
    rng = np.random.default_rng(seed)
    if init is None:
        s = env.reset()
    else:
        set_state(env, init[0], init[1])
        s = {"frame": frame_of(init[0], init[1]), "theta": init[0], "theta_dot": init[1]}
    tot = 0.0
    for t in range(env.max_steps):
        u = float(rng.uniform(-scale, scale))
        r = reward_of(s["theta"], s["theta_dot"], u)
        s, _, done = env.step(u)
        tot += r
        if done:
            break
    return tot, s["theta"]


def run_pd(env: PendulumPixels, init=None, kp=20.0, kd=5.0):
    """模型无关基线：解析 PD 平衡律。MPC 至少要接近它才算"模型够用"。"""
    if init is None:
        s = env.reset()
    else:
        set_state(env, init[0], init[1])
        s = {"frame": frame_of(init[0], init[1]), "theta": init[0], "theta_dot": init[1]}
    tot = 0.0
    for t in range(env.max_steps):
        u = float(pd_torque(s["theta"], s["theta_dot"], kp, kd))
        r = reward_of(s["theta"], s["theta_dot"], u)
        s, _, done = env.step(u)
        tot += r
        if done:
            break
    return tot, s["theta"]


def inits(rng, group: str, n: int):
    if group == "in":        # 数据覆盖范围内：|theta| <= 0.6
        return [(float(rng.uniform(-0.6, 0.6)), float(rng.uniform(-1, 1))) for _ in range(n)]
    return [(float(rng.uniform(0.6, 1.2) * rng.choice([-1, 1])), float(rng.uniform(-1, 1))) for _ in range(n)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--episodes", type=int, default=8)
    ap.add_argument("--horizon", type=int, default=16)
    ap.add_argument("--samples", type=int, default=200)
    ap.add_argument("--iters", type=int, default=6)
    a = ap.parse_args()

    t0 = time.time()
    rt = Runtime()
    print(f"设备={rt.device}  加载权重 {time.time() - t0:.1f}s")

    out = {"cfg": vars(a)}
    for group in ("in", "hard"):
        rng = np.random.default_rng(7)
        I = inits(rng, group, a.episodes)
        res = {}
        for name, fn in (("mpc", lambda e, i: run_mpc(rt, e, a.horizon, a.samples, a.iters, seed=e, init=i)),
                         ("pd", lambda e, i: run_pd(e, init=i)),
                         ("random", lambda e, i: run_random(e, seed=e, init=i))):
            rets, oks, ms = [], [], []
            for e, ini in enumerate(I):
                env = PendulumPixels(seed=1000 + e, max_steps=120)
                t1 = time.time()
                ret, th_end = fn(env, ini)
                ms.append((time.time() - t1) / 120 * 1000)
                rets.append(ret); oks.append(is_upright(th_end)); env.close()
            res[name] = {"return": float(np.mean(rets)), "return_std": float(np.std(rets)),
                         "upright_rate": float(np.mean(oks)), "ms_per_step": float(np.mean(ms))}
        print(f"\n=== 初始角分组 {group}（{'|θ|≤0.6 数据内' if group == 'in' else '0.6<|θ|≤1.2 数据外'}）===")
        for k, v in res.items():
            print(f"  {k:<7} 回报={v['return']:8.1f}±{v['return_std']:.1f}  末态竖直率={v['upright_rate']:.2f}  {v['ms_per_step']:.1f} ms/步")
        out[f"init_{group}"] = res

    p = os.path.join(os.path.dirname(__file__), "..", "results", "plan.json")
    os.makedirs(os.path.dirname(p), exist_ok=True)
    json.dump(out, open(p, "w"), ensure_ascii=False, indent=1)
    print("\n已写入", os.path.relpath(p, os.path.join(os.path.dirname(__file__), "..")))
    for group in ("in", "hard"):
        m, r, d = out[f"init_{group}"]["mpc"], out[f"init_{group}"]["random"], out[f"init_{group}"]["pd"]
        tag = "数据内" if group == "in" else "数据外"
        if m["return"] <= r["return"]:
            print(f"提示（{tag}）：MPC 不优于随机 —— 问题在模型（VAE 丢信息 / RNN 不准 / 奖励头差），不是 CEM 搜索强度。")
        if m["return"] < d["return"]:
            print(f"提示（{tag}）：MPC 输给解析 PD（{m['return']:.1f} vs {d['return']:.1f}）—— 世界模型规划的上限还不及已知控制律，这正是本项目的核心结论之一。")


if __name__ == "__main__":
    main()
