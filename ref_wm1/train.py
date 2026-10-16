"""训练：先 VAE 后 MDN-RNN，最后拟合奖励头。产出 wm1/ckpt/*.pt。

刻意把三段分开跑而不是端到端，这样每一段的健康度都能单独看：
  VAE   -> 重建是否够清晰、z 是否退化（报有效秩）
  RNN   -> 在 z 上的预测对数似然是否比"只预测均值"强（隐含基线）
  奖励头 -> 拟合质量决定规划器上限
"""
from __future__ import annotations

import json
import math
import os

import numpy as np
import torch
import torch.nn.functional as F

from .model import IMG_H, IMG_W, MDNRNN, RewardModel, VAE, Z_DIM, dev, to_img

ROOT = os.path.dirname(__file__)
DATA = os.path.join(ROOT, "..", "data")
CKPT = os.path.join(ROOT, "ckpt")
T_RNN = 60          # 截断序列长度：够长以体现动力学，够短以免梯度消失


def load():
    d = np.load(os.path.join(DATA, "rollouts.npz"))
    return {k: d[k] for k in d.files}


def train_vae(vae, frames, epochs=25, bs=128, lr=2e-3):
    x_all = to_img(torch.from_numpy(frames).reshape(-1, IMG_H, IMG_W)).to(dev())
    n = x_all.shape[0]
    opt = torch.optim.Adam(vae.parameters(), lr)
    g = torch.Generator().manual_seed(0)
    for ep in range(epochs):
        perm = torch.randperm(n, generator=g).to(x_all.device)
        tot = 0.0
        for i in range(0, n, bs):
            xb = x_all[perm[i:i + bs]]
            loss, log = vae.loss(xb)
            opt.zero_grad(); loss.backward(); opt.step()
            tot += loss.item() * xb.shape[0]
        if ep % 5 == 0 or ep == epochs - 1:
            loss, log = vae.loss(x_all[:2048])
            print(f"  VAE ep{ep:02d} loss={tot / n:.5f} recon={log['recon']:.5f} kl={log['kl']:.2f}")
    return vae


def effective_rank(z: torch.Tensor) -> float:
    """z 协方差谱的参与率（participation ratio）。掉到个位数 = 表征塌了。"""
    z = z - z.mean(0)
    cov = (z.T @ z) / max(1, z.shape[0] - 1)
    ev = torch.linalg.eigvalsh(cov).clamp_min(0)
    p = ev / ev.sum().clamp_min(1e-12)
    return float(torch.exp(-(p * (p + 1e-12).log()).sum()))


def train_rnn(rnn, z, a, steps=4000, bs=32, lr=1e-3):
    E = z.shape[0]
    opt = torch.optim.Adam(rnn.parameters(), lr)
    z_t = torch.from_numpy(z[:, :T_RNN]).to(dev())        # [E,T,Z]
    a_t = torch.from_numpy(a[:, :T_RNN]).to(dev())        # [E,T,1]
    z_t, a_t = z_t.permute(1, 0, 2), a_t.permute(1, 0, 2)  # [T,B,Z]
    for s in range(steps):
        idx = torch.randint(0, E, (bs,), device=dev())
        zb, ab = z_t[:, idx], a_t[:, idx]
        loss = rnn.loss(zb, ab)
        opt.zero_grad(); loss.backward()
        torch.nn.utils.clip_grad_norm_(rnn.parameters(), 1.0)
        opt.step()
        if s % 500 == 0 or s == steps - 1:
            print(f"  RNN step{s:05d} NLL={loss.item():.4f}")
    return rnn


def _gauss_nll(pred, tgt) -> float:
    """把 tgt 当作各维独立高斯（pred 为均值）时的平均 NLL —— 与 MDNRNN.loss 同量纲，可直接比。"""
    resid = tgt - pred
    sigma = resid.std(0).clamp_min(1e-6)
    d = resid / sigma
    ll = -0.5 * (d ** 2 + 2 * sigma.log() + math.log(2 * math.pi))
    return float(-ll.mean())


@torch.no_grad()
def eval_dynamics(rnn, z, a, split=0.8):
    """在留出的轨迹上比三个预测器，全部用同一个 NLL 量纲：
      1) MDN：h_t 输出的混合高斯期望
      2) 复制：z_{t+1} ≈ z_t        （"世界不动"）
      3) 边缘：z_{t+1} ≈ z 的训练均值（"只会猜平均摆"）
    MDN 打不赢 2) 就说明它没学到动力学，后面的规划结果都不可信。
    """
    E = z.shape[0]
    e0, e1 = int(E * split), E
    ztr = torch.from_numpy(z[:e0, :T_RNN]).to(dev())
    zva = torch.from_numpy(z[e0:, :T_RNN]).to(dev())
    ava = torch.from_numpy(a[e0:, :T_RNN]).to(dev())
    mdn = rnn.loss(zva.permute(1, 0, 2), ava.permute(1, 0, 2)).item()
    inp = torch.cat([zva.permute(1, 0, 2), ava.permute(1, 0, 2)], dim=-1)
    h, _ = rnn.gru(inp)
    mean, _, logpi, _ = rnn._params(h[:-1])
    mdn_mean_nll = _gauss_nll((mean * logpi.exp()).sum(2), zva[1:])
    copy_nll = _gauss_nll(zva[:-1], zva[1:])
    mz = ztr.mean((0, 1))                       # 训练集各维均值 [Z]
    marg_nll = _gauss_nll(mz.expand_as(zva[1:]), zva[1:])
    mse = lambda p: float(F.mse_loss(p, zva[1:]))
    return {"mdn_nll": mdn, "mdn_mean_nll": mdn_mean_nll, "copy_nll": copy_nll,
            "marginal_nll": marg_nll, "mdn_mean_mse": mse((mean * logpi.exp()).sum(2)),
            "copy_mse": mse(zva[:-1]), "marginal_mse": mse(mz.expand_as(zva[1:]))}


def train_reward(rw, rnn, z, a, r, steps=1500, bs=64, lr=1e-3, gamma=0.99):
    """输入 (z_t, h_t, a_t) 预测 r_t；h_t 由 RNN 全序列前向得到。"""
    z_np, h_np = forward_hidden(rnn, z, a)
    Z = torch.from_numpy(z_np).reshape(-1, z_np.shape[-1]).to(dev())   # [E*T, Z]
    H = torch.from_numpy(h_np).reshape(-1, h_np.shape[-1]).to(dev())   # [E*T, H]
    A = torch.from_numpy(a).reshape(-1, 1).to(dev())                   # [E*T, 1]
    R = torch.from_numpy(r).reshape(-1).to(dev())                      # [E*T]
    assert Z.shape[0] == H.shape[0] == A.shape[0] == R.shape[0], \
        f"展平后样本数不一致: Z{tuple(Z.shape)} H{tuple(H.shape)} A{tuple(A.shape)} R{tuple(R.shape)}"
    n = Z.shape[0]
    opt = torch.optim.Adam(rw.parameters(), lr)
    for s in range(steps):
        i = torch.randint(0, n, (bs,), device=dev())
        pred = rw(Z[i], H[i], A[i])
        loss = F.mse_loss(pred, R[i])
        opt.zero_grad(); loss.backward(); opt.step()
        if s % 300 == 0 or s == steps - 1:
            with torch.no_grad():
                var = R.var()
                print(f"  RW  step{s:05d} MSE={loss.item():.4f}  R²≈{1 - loss.item() / float(var):.3f}")
    return rw


@torch.no_grad()
def forward_hidden(rnn, z, a):
    """沿每条轨迹推进 RNN，返回对齐到 t 的 (z_t, h_t) 展平数组。"""
    E, T, _ = z.shape
    h = torch.zeros(1, E, rnn.h_dim, device=dev())
    zs, hs = [], []
    for t in range(T):
        zt = torch.from_numpy(z[:, t]).to(dev())
        at = torch.from_numpy(a[:, t]).to(dev())
        zs.append(zt.cpu().numpy()); hs.append(h.squeeze(0).cpu().numpy())
        _, h = rnn.mean_step(zt, h, at)
    return np.concatenate([x[:, None, :] for x in zs]), np.concatenate([x[:, None, :] for x in hs])


def main():
    os.makedirs(CKPT, exist_ok=True)
    torch.manual_seed(0); np.random.seed(0)
    d = load()
    E, T = d["rewards"].shape
    print(f"数据: {E} 条轨迹 x {T} 步")

    vae = VAE().to(dev())
    print("[1/3] 训练 VAE")
    train_vae(vae, d["frames"])

    diag = {}
    with torch.no_grad():
        x_all = to_img(torch.from_numpy(d["frames"].reshape(-1, IMG_H, IMG_W))).to(dev())
        rec = torch.cat([vae.decode(vae.z(x_all[i:i + 2048])) for i in range(0, x_all.shape[0], 2048)])
        mae = float((rec - x_all).abs().mean())
        print(f"     重建 MAE={mae:.4f}（0-1 尺度；>0.05 说明像素信息大量丢失）")
        diag["vae_recon_mae"] = mae
        z_all = torch.cat([vae.z(x_all[i:i + 2048]) for i in range(0, x_all.shape[0], 2048)]).cpu().numpy()
        std = z_all.std(0)
        er = effective_rank(torch.from_numpy(z_all))
        print(f"     z 有效秩={er:.1f} / {Z_DIM}   逐维 std: min={std.min():.3f} 中位={np.median(std):.3f} max={std.max():.3f}")
        print(f"     z 范围=[{z_all.min():.2f}, {z_all.max():.2f}]  |z| 均值={np.abs(z_all).mean():.3f}")
        diag.update({"z_effective_rank": er, "z_std_min": float(std.min()),
                     "z_std_median": float(np.median(std)), "z_absmin_max": [float(z_all.min()), float(z_all.max())]})
        if er < 5:
            print("     ⚠ z 有效秩 < 5：表征塌缩，动力学无从可学")
    z = z_all.reshape(E, T, Z_DIM).astype(np.float32)
    a = d["actions"].astype(np.float32)
    r = d["rewards"].astype(np.float32)

    print("[2/3] 训练 MDN-RNN")
    rnn = MDNRNN().to(dev()); train_rnn(rnn, z, a)
    dt = eval_dynamics(rnn, z, a)
    print("     留出集动力学对比（同量纲 NLL，越小越好）")
    for k in ("mdn_nll", "mdn_mean_nll", "copy_nll", "marginal_nll"):
        print(f"       {k:<14} {dt[k]:+.4f}")
    for k in ("mdn_mean_mse", "copy_mse", "marginal_mse"):
        print(f"       {k:<14} {dt[k]:.5f}")
    diag.update(dt)
    if dt["mdn_mean_nll"] > dt["copy_nll"]:
        print('     ⚠ MDN 均值预测还不如「复制上一帧」，RNN 没学到动力学')

    print("[3/3] 训练奖励头")
    rw = RewardModel().to(dev()); train_reward(rw, rnn, z, a, r)

    torch.save({"vae": vae.state_dict(), "z_scale": float(np.abs(z_all).mean())}, os.path.join(CKPT, "vae.pt"))
    torch.save({"rnn": rnn.state_dict()}, os.path.join(CKPT, "rnn.pt"))
    torch.save({"rw": rw.state_dict()}, os.path.join(CKPT, "rw.pt"))
    json.dump({"z_dim": Z_DIM, "h_dim": rnn.h_dim, "T": int(T), "T_rnn": T_RNN},
              open(os.path.join(CKPT, "cfg.json"), "w"), ensure_ascii=False, indent=1)
    os.makedirs(os.path.join(ROOT, "results"), exist_ok=True)
    json.dump(diag, open(os.path.join(ROOT, "results", "diag.json"), "w"), ensure_ascii=False, indent=1)
    print(f"完成，权重在 {os.path.relpath(CKPT, os.path.join(ROOT, '..'))}/，诊断在 results/diag.json")


if __name__ == "__main__":
    main()
