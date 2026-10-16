"""运行时：加载三个权重，提供 (a) 像素->隐状态 (b) 隐空间 rollout (c) CEM 规划。

plan.py 与 metrics.py 共用这里，保证"规划用的模型"和"被评测的模型"是同一份，避免两套实现带来的假象。
"""
from __future__ import annotations

import json
import os

import numpy as np
import torch

from .model import IMG_H, IMG_W, MDNRNN, RewardModel, VAE, dev, to_img
from .envs import render_state

CKPT = os.path.join(os.path.dirname(__file__), "ckpt")


class Runtime:
    def __init__(self, gamma: float = 0.99):
        self.device = dev()
        cfg = json.load(open(os.path.join(CKPT, "cfg.json")))
        self.T_rnn = cfg["T_rnn"]
        self.vae = VAE().to(self.device); self.vae.load_state_dict(torch.load(os.path.join(CKPT, "vae.pt"), weights_only=True)["vae"]); self.vae.eval()
        self.rnn = MDNRNN(z_dim=cfg["z_dim"], h_dim=cfg["h_dim"]).to(self.device)
        self.rnn.load_state_dict(torch.load(os.path.join(CKPT, "rnn.pt"), weights_only=True)["rnn"]); self.rnn.eval()
        self.rw = RewardModel(cfg["z_dim"], cfg["h_dim"]).to(self.device)
        self.rw.load_state_dict(torch.load(os.path.join(CKPT, "rw.pt"), weights_only=True)["rw"]); self.rw.eval()
        self.gamma = gamma

    # ---- 像素 -> z ----
    @torch.no_grad()
    def encode(self, frames) -> torch.Tensor:
        f = np.asarray(frames)
        if f.ndim == 2:
            f = f[None]
        x = to_img(torch.from_numpy(np.ascontiguousarray(f)).to(self.device).float() * (1.0 / 255.0))
        return self.vae.z(x)

    def zero_h(self, bsz: int = 1) -> torch.Tensor:
        return torch.zeros(1, bsz, self.rnn.h_dim, device=self.device)

    # ---- 并行隐空间 rollout：z [B,Z], h [1,B,H], acts [Tp,B,1] ----
    @torch.no_grad()
    def rollout(self, z, h, acts, use_sample: bool = False):
        step = self.rnn.step if use_sample else self.rnn.mean_step
        B = z.shape[0]
        r = torch.zeros(B, device=self.device)
        disc = 1.0
        for t in range(acts.shape[0]):
            a = acts[t]
            rhat = self.rw(z, h.squeeze(0), a)
            r = r + disc * rhat
            disc *= self.gamma
            z, h = step(z, h, a)
        return r

    # ---- CEM 规划：返回最优动作序列 [Tp] 与其预测回报 ----
    def plan(self, frame, horizon: int = 16, n_samples: int = 200, n_iter: int = 6,
             n_elite: int = 20, seed: int = 0, use_sample: bool = False):
        g = torch.Generator(device=self.device).manual_seed(seed)
        mu = torch.zeros(horizon, 1, device=self.device)
        sd = torch.ones(horizon, 1, device=self.device)
        z0 = self.encode(frame)[None]           # [1,Z]
        h0 = self.zero_h(1)
        best = (-1e18, None)
        for _ in range(n_iter):
            eps = torch.randn(n_samples, horizon, 1, device=self.device, generator=g)
            # 量纲约定（与训练一致）：模型动作 a = tanh(u/2) ∈ [-1,1]，环境力矩 u = 2·atanh(a)。
            # 见 envs.torque_to_action / action_to_torque。
            acts = torch.tanh(mu.unsqueeze(1) + sd.unsqueeze(1) * eps)      # [N,Tp,1]
            z = z0.expand(n_samples, -1)
            h = h0.expand(1, n_samples, -1).contiguous()
            val = self.rollout(z, h, acts.permute(1, 0, 2).contiguous())     # -> [N]
            elite = torch.topk(val, n_elite).indices                        # 最优的 N 条
            sel = acts[elite]                                               # [n_elite,Tp,1]
            mu = 0.3 * mu + 0.7 * sel.mean(0)
            sd = 0.3 * sd + 0.7 * sel.std(0).clamp_min(0.05)
            bi = int(torch.argmax(val))
            if float(val[bi]) > best[0]:
                best = (float(val[bi]), acts[bi, :, 0].clone())
        return best[1].cpu().numpy(), best[0]


def frame_of(theta: float, theta_dot: float) -> np.ndarray:
    return render_state(theta, theta_dot)
