"""分模块验收：把"规划失败"拆成可定位的三层。

1) 一步隐空间预测误差         —— RNN 的动力学准不准
2) 开环动作排序一致性 (Spearman) —— 模型能不能给动作分好坏（规划的真正前提）
3) 回报估计误差               —— 奖励头 +  rollout 复合误差
4) 像素漂移                   —— 多步 rollout 解码后偏离真实的程度（重建式视角的自检）

关键认知：2 差而 1、3 看着还行，是最典型的"JEPA/世界模型陷阱"——单步预测很准，
但 latent 距离对动作不可排序，闭环靠重规划也能刷出像样的回报，从而把问题掩盖掉。
"""
from __future__ import annotations

import argparse
import json
import math
import os

import numpy as np
import torch

from .core import Runtime, frame_of
from .envs import PendulumPixels, render_state, reward_of
from .model import IMG_H, IMG_W


def set_state(env: PendulumPixels, theta: float, theta_dot: float):
    env._env.reset()
    env._env.unwrapped.state = np.array([theta, theta_dot], np.float64)


def true_rollout(theta, theta_dot, acts, gamma=0.99):
    """真环境执行给定动作序列（acts 已压缩到 [-1,1]），返回 (折扣回报, 真实帧序列)。"""
    env = PendulumPixels(seed=0)
    set_state(env, theta, theta_dot)
    R, frames = 0.0, [render_state(theta, theta_dot)]
    disc = 1.0
    s = {"theta": theta, "theta_dot": theta_dot}
    for a in acts:
        u = float(np.clip(a * 2.0, -2.0, 2.0))
        R += disc * reward_of(s["theta"], s["theta_dot"], u)
        disc *= gamma
        s, _, done = env.step(u)
        frames.append(s["frame"])
        if done:
            break
    env.close()
    return R, np.asarray(frames, np.uint8)


def spearman(x, y):
    def rank(v):
        o = np.argsort(v, kind="stable")
        r = np.empty_like(o, dtype=float)
        r[o] = np.arange(len(v))
        return r
    rx, ry = rank(np.asarray(x)), rank(np.asarray(y))
    return float(np.corrcoef(rx, ry)[0, 1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--states", type=int, default=12, help="测试的初始状态数")
    ap.add_argument("--cands", type=int, default=24, help="每个状态下比较的动作序列数")
    ap.add_argument("--horizon", type=int, default=16)
    a = ap.parse_args()
    rt = Runtime()
    rng = np.random.default_rng(0)
    H = a.horizon

    sp, err_r, err_p = [], [], []
    one_step, drift = [], []
    for i in range(a.states):
        th = float(rng.uniform(-math.pi, math.pi)); thd = float(rng.uniform(-4, 4))
        frame = render_state(th, thd)
        z0 = rt.encode(frame)[None]
        h0 = rt.zero_h(1)

        cand = np.tanh(rng.normal(0, 1.2, size=(a.cands, H, 1))).astype(np.float32)
        true_ret, real_frames = [], []
        for c in cand:
            R, fr = true_rollout(th, thd, c[:, 0])
            true_ret.append(R); real_frames.append(fr)
        with torch.no_grad():
            acts_t = torch.from_numpy(cand.transpose(1, 0, 2)).to(rt.device)      # [H,N,1]
            z = z0.expand(a.cands, -1); h = h0.expand(1, a.cands, -1).contiguous()
            pred = rt.rollout(z, h, acts_t).cpu().numpy().astype(float)
        sp.append(spearman(pred, np.asarray(true_ret)))
        err_r.append(np.abs(pred - np.asarray(true_ret)).mean())

        # 单步与多步像素漂移（同一条随机序列）。注意 batch 维：全程 [1,Z] / [1,1,H]
        env = PendulumPixels(seed=0); set_state(env, th, thd)
        zc, hc = z0.clone(), h0.clone()
        for t in range(H):
            act = float(cand[0, t, 0]); u = act * 2.0
            s2, _, _ = env.step(u)
            z_real = rt.encode(s2["frame"])                      # [1,Z]
            a_t = torch.tensor([[[act]]], device=rt.device)       # [1,1,1]
            z_pred, hc = rt.rnn.mean_step(zc, hc, a_t)            # z_pred [1,Z], hc [1,1,H]
            if t == 0:
                one_step.append(float((z_pred - z_real).pow(2).mean()))
            else:
                with torch.no_grad():
                    rec = rt.vae.decode(z_pred)[0, 0]          # [48,64]，解码器已精确复原尺寸
                drift.append(float((rec - torch.from_numpy(s2["frame"]).to(rt.device).float() / 255).abs().mean()))
            zc = z_real
        env.close()

    out = {
        "spearman_mean": float(np.mean(sp)),
        "spearman_p10": float(np.percentile(sp, 10)),
        "return_abs_err_mean": float(np.mean(err_r)),
        "one_step_latent_mse": float(np.mean(one_step)),
        "pixel_drift_mae": float(np.mean(drift)),
        "cfg": vars(a),
    }
    print(json.dumps(out, ensure_ascii=False, indent=1))
    p = os.path.join(os.path.dirname(__file__), "..", "results", "metrics.json")
    os.makedirs(os.path.dirname(p), exist_ok=True); json.dump(out, open(p, "w"), ensure_ascii=False, indent=1)

    print("\n怎么读这几个数：")
    print(f"  Spearman 均值 {out['spearman_mean']:.2f}（>0.5 才可谈规划；<0.3 时 MPC 基本等于随机+算力浪费）")
    print(f"  折扣回报绝对误差 {out['return_abs_err_mean']:.1f}（Pendulum 200 步回报量级 ~1e2，越小越好）")
    print(f"  单步隐空间 MSE {out['one_step_latent_mse']:.4f} vs 多步像素漂移 MAE {out['pixel_drift_mae']:.3f}")
    print("  两者差距大 => 误差在递推中复合放大：先查 RNN（更长序列/更大 K/更小 lr 上限），再考虑 horizon 调短。")


if __name__ == "__main__":
    main()
