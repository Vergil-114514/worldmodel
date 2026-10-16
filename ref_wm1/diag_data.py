"""数据 + 隐空间健康度诊断。

先确认「视频有时间结构」，再确认「z 也有时间结构」。这两件事必须同时成立，
否则 RNN 学到的只会是噪声，后面所有规划指标都无法解释。

关键量：var(z_{t+L} - z_t) / var(z)
  真状态（摆动）应随 L 增长并饱和到 2；
  若 L=1 就已经接近 2，说明逐帧变化是白噪声 —— 编码器把亚像素锯齿放大成隐变量抖动。
"""
from __future__ import annotations

import os

import numpy as np
import torch
import torch.nn.functional as F

from .envs import ROD_LEN
from .model import IMG_H, IMG_W, VAE, dev, to_img
from .train import CKPT, effective_rank, load


def encode(vae, frames, blur=0):
    x = to_img(torch.from_numpy(frames.reshape(-1, IMG_H, IMG_W))).to(dev())
    if blur:
        k = 2 * blur + 1
        x = F.avg_pool2d(x, k, stride=1, padding=blur)
    with torch.no_grad():
        z = torch.cat([vae.z(x[i:i + 4096]) for i in range(0, x.shape[0], 4096)]).cpu().numpy()
    return z.astype(np.float32)


def white_ratio(Z, L):
    """同一条轨迹内 lag=L 的 E||z_{t+L}-z_t||^2 / E||z-mean||^2。
    真状态平滑 => L=1 远小于 2 且随 L 增长；纯白噪声 => L=1 就近似 2。
    """
    num = ((Z[:, L:] - Z[:, :-L]) ** 2).sum(-1).mean()
    den = ((Z - Z.mean((0, 1))) ** 2).sum(-1).mean()
    return float(num / den)


def report(vae, Z, th, thd, ac, tag):
    sd = Z.std((0, 1))
    live = np.argsort(sd)[::-1][:4]
    print(f"  [{tag}] 有效秩={effective_rank(torch.from_numpy(Z.reshape(-1, Z.shape[-1]))):.1f} "
          f"top4 std={sd[live].round(3)}")
    print("      逐帧噪声比 var(Δz)/var(z)：" + "  ".join(
        f"L={L}:{white_ratio(Z, L):.2f}" for L in (1, 2, 5, 10, 30)))
    zf, thr, thdr = Z.reshape(-1, Z.shape[-1]), th.ravel(), thd.ravel()
    cs, sn = np.cos(thr), np.sin(thr)
    for i in live:
        c = lambda v: float(np.corrcoef(zf[:, i], v)[0, 1])
        cc = np.corrcoef(Z[:, :-1, i].ravel(), Z[:, 1:, i].ravel())[0, 1]
        print(f"      dim{i:<3} lag1自相关={float(cc):+.3f}  cosθ {c(cs):+.3f}  sinθ {c(sn):+.3f}  θ̇ {c(thdr):+.3f}")


def main():
    d = load()
    fr, st, ac = d["frames"], d["states"], d["actions"]
    E, T = fr.shape[:2]
    print(f"数据: E={E} T={T} frames={fr.shape} states={st.shape} actions={ac.shape}")

    fe = (fr.astype(np.float32) / 255.0).reshape(E, T, IMG_H, IMG_W)
    rng = np.random.default_rng(0)
    p1 = fe[rng.integers(E, size=3000), rng.integers(T, size=3000)]
    p2 = fe[rng.integers(E, size=3000), rng.integers(T, size=3000)]
    print("[1] 像素时间结构（平均绝对差）")
    print("    " + "  ".join(f"lag{L}:{np.abs(fe[:, L:] - fe[:, :-L]).mean():.5f}" for L in (1, 2, 5, 10, 30))
          + f"  随机配对:{np.abs(p1 - p2).mean():.5f}")

    th, thd = st[..., 0], st[..., 1]
    dth = np.abs(np.diff(th, axis=1))
    print(f"[2] 真值动力学: theta_dot∈[{thd.min():.2f},{thd.max():.2f}]  "
          f"单步|dtheta| 均值={dth.mean():.3f} p95={np.quantile(dth, 0.95):.3f} max={dth.max():.3f} rad"
          f"  => 杆尖 {ROD_LEN * dth.mean():.1f}/{ROD_LEN * dth.max():.1f}px")
    # 真值自身的逐帧噪声比：这是"环境本身"的参照，模型不可能比它更平滑
    thr = th.reshape(-1, 1)
    print(f"    真值 cosθ 的 var(Δ)/var: L=1 {white_ratio(th.reshape(E, T, 1), 1):.2f}  "
          f"L=10 {white_ratio(th.reshape(E, T, 1), 10):.2f}")

    vae = VAE().to(dev())
    vae.load_state_dict(torch.load(os.path.join(CKPT, "vae.pt"), map_location=dev(), weights_only=True)["vae"])

    print("[3] 当前 VAE 的隐空间（原始输入）")
    report(vae, encode(vae, fr).reshape(E, T, -1), th, thd, ac, "raw")
    for b in (1, 2):
        print(f"[3+模糊] 输入做 {(2 * b + 1)}x{(2 * b + 1)} 盒模糊后")
        report(vae, encode(vae, fr, blur=b).reshape(E, T, -1), th, thd, ac, f"blur{b}")

    print("[4] 环境可预测性上限：用真值 (cosθ,sinθ,θ̇,a) 线性预测下一帧真值")
    Xt = np.concatenate([np.cos(th)[:, :-1, None], np.sin(th)[:, :-1, None],
                         thd[:, :-1, None], ac[:, :-1]], 2).reshape(-1, 4)
    tgt = np.stack([np.cos(th)[:, 1:], np.sin(th)[:, 1:], thd[:, 1:]], 2).reshape(-1, 3)
    D = np.c_[Xt, np.ones(len(Xt))]
    w, *_ = np.linalg.lstsq(D, tgt, rcond=None)
    r2 = 1 - ((tgt - D @ w) ** 2).sum() / ((tgt - tgt.mean(0)) ** 2).sum()
    print(f"    R²={float(r2):.4f}（接近 1 说明任务可学，学不好是模型的问题）")


if __name__ == "__main__":
    main()
