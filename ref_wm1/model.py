"""模型：VAE（像素 <-> z）+ MDN-RNN（在 z 上做带不确定性的动力学）+ 奖励头。

三件事对应 World Models 的 V / M / C 三模块，其中 C（控制器）这里换成"CEM 在隐空间规划"，
理由很实际：规划器不用训练、行为可解释，而且能直接把"模型给动作排序"这件事单独量出来。
"""
from __future__ import annotations

import math

import torch
import torch.nn as nn
import torch.nn.functional as F

Z_DIM = 32
H_DIM = 256
MDN_K = 5
IMG_H, IMG_W = 48, 64


# ---------------------------------------------------------------- VAE
class VAE(nn.Module):
    """48x64 <-> z。全部用 kernel4/stride2/pad1，尺寸精确减半再精确复原，不留插值这种含糊环节：
    48x64 -> 24x32 -> 12x16 -> 6x8（flatten = 64*6*8 = 3072）。
    """

    def __init__(self, z_dim: int = Z_DIM):
        super().__init__()
        self.z_dim = z_dim
        self.conv = nn.Sequential(
            nn.Conv2d(1, 16, 4, 2, 1), nn.ReLU(),
            nn.Conv2d(16, 32, 4, 2, 1), nn.ReLU(),
            nn.Conv2d(32, 64, 4, 2, 1), nn.ReLU(),
        )
        self.flat = 64 * 6 * 8
        self.fc = nn.Sequential(nn.Flatten(), nn.Linear(self.flat, 256), nn.ReLU())
        self.mu = nn.Linear(256, z_dim)
        self.logvar = nn.Linear(256, z_dim)
        self.dec = nn.Sequential(
            nn.Linear(z_dim, self.flat), nn.ReLU(), nn.Unflatten(1, (64, 6, 8)),
            nn.ConvTranspose2d(64, 32, 4, 2, 1), nn.ReLU(),
            nn.ConvTranspose2d(32, 16, 4, 2, 1), nn.ReLU(),
            nn.ConvTranspose2d(16, 1, 4, 2, 1),
        )

    def encode(self, x: torch.Tensor):
        h = self.fc(self.conv(x))
        return self.mu(h), self.logvar(h)

    def reparam(self, mu, logvar):
        return mu + torch.randn_like(mu) * torch.exp(0.5 * logvar)

    def decode(self, z: torch.Tensor):
        return torch.sigmoid(self.dec(z))          # 输出压在 [0,1]，与 x/255 同尺度

    def forward(self, x):
        mu, logvar = self.encode(x)
        z = self.reparam(mu, logvar)
        return self.decode(z), mu, logvar

    def loss(self, x, beta: float = 1.0):
        """重建项按像素求和（标准 VAE 量纲），KL 按维度求和、按样本平均。

        早先用 per-pixel 平均 MSE 时，稀疏黑图的重建项只有 1e-4 量级，
        KL 直接压倒它 -> 后验塌缩（z 变常数），而 loss 曲线看着仍然"在降"。
        """
        rec, mu, logvar = self(x)
        recon = F.binary_cross_entropy(rec, x.clamp(1e-6, 1 - 1e-6), reduction="sum") / x.shape[0]
        kl = -0.5 * (1 + logvar - mu.pow(2) - logvar.exp()).sum(1).mean()
        return recon + beta * kl, {"recon": recon.item(), "kl": kl.item()}

    @torch.no_grad()
    def z(self, x):
        mu, _ = self.encode(x)
        return mu


# ---------------------------------------------------------------- MDN-RNN
class MDNRNN(nn.Module):
    """z_{t+1} | z_{<=t}, a_t ；输出高斯混合，不是均值回归。

    为什么必须是分布：环境有随机性、而且单帧观测对角度符号存在歧义，
    用 MSE 回归会把这些模式平均成一根糊掉的杆 —— 这正是 Ha 论文里 MDN 的作用。
    """

    def __init__(self, z_dim: int = Z_DIM, h_dim: int = H_DIM, k: int = MDN_K):
        super().__init__()
        self.z_dim, self.h_dim, self.k = z_dim, h_dim, k
        self.gru = nn.GRU(z_dim + 1, h_dim)
        self.head = nn.Linear(h_dim, 3 * k * z_dim)

    def _params(self, h):
        """头输出摊成 [...,K,Z]：混合分量必须在 K 维上分离，否则广播/gather 全是错的。"""
        out = self.head(h).chunk(3, dim=-1)
        lead = out[0].shape[:-1]
        shape = (*lead, self.k, self.z_dim)
        mean = torch.tanh(out[0].view(shape)) * 2.5                  # z 的经验范围约 [-3,3]
        logstd = out[1].view(shape).clamp(-4.0, 0.5)
        logits_k = out[2].view(shape)[..., 0]                       # 每个分量一个权重（对 Z 取首列，因为已在 K 上归一）
        logpi = F.log_softmax(logits_k, dim=-1).unsqueeze(-1)       # [...,K,1] 广播到 Z
        return mean, logstd, logpi, logits_k

    def loss(self, z_seq, a_seq):
        """z_seq [T,B,Z], a_seq [T,B,1] -> 平均负对数似然。"""
        inp = torch.cat([z_seq, a_seq], dim=-1)
        h, _ = self.gru(inp)                                  # h_t 编码 z_{<=t} 与 a_t
        mean, logstd, logpi, _ = self._params(h[:-1])         # 用 h_t 预测 z_{t+1}
        tgt = z_seq[1:].unsqueeze(2)                          # [T-1,B,1,Z]
        d = (tgt - mean) / logstd.exp()
        ll_k = -0.5 * (d ** 2 + 2 * logstd + math.log(2 * math.pi))   # 逐维高斯对数密度
        ll = torch.logsumexp(ll_k + logpi, dim=2)             # 对 K 个分量边缘化 -> [T-1,B,Z]
        return -ll.mean()

    @torch.no_grad()
    def step(self, z, h, a):
        """走一步并采样一个分量：返回 (z_{t+1} [B,Z], h' [1,B,H])。"""
        inp = torch.cat([z.unsqueeze(0), a.unsqueeze(0)], dim=-1)
        h_new, _ = self.gru(inp, h)
        mean, logstd, _, logits_k = self._params(h_new)
        pick = torch.distributions.Categorical(logits=logits_k).sample()          # [1,B]
        idx = pick.unsqueeze(-1).unsqueeze(-1).expand(-1, -1, 1, self.z_dim)
        mu_k = mean.gather(2, idx).squeeze(2)
        sd_k = logstd.gather(2, idx).squeeze(2).exp()
        return (mu_k + torch.randn_like(mu_k) * sd_k).squeeze(0), h_new

    @torch.no_grad()
    def mean_step(self, z, h, a):
        """规划用：对分量取期望，避免 CEM 里混入采样噪声。"""
        inp = torch.cat([z.unsqueeze(0), a.unsqueeze(0)], dim=-1)
        h_new, _ = self.gru(inp, h)
        mean, _, logpi, _ = self._params(h_new)
        return (mean * logpi.exp()).sum(2).squeeze(0), h_new


class RewardModel(nn.Module):
    def __init__(self, z_dim: int = Z_DIM, h_dim: int = H_DIM):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(z_dim + h_dim + 1, 128), nn.ReLU(),
                                 nn.Linear(128, 64), nn.ReLU(), nn.Linear(64, 1))

    def forward(self, z, h, a):
        return self.net(torch.cat([z, h, a], dim=-1)).squeeze(-1)


# ---------------------------------------------------------------- 工具
def to_img(frames: torch.Tensor) -> torch.Tensor:
    """[N,H,W] uint8/float -> [N,1,H,W] in [0,1]"""
    x = frames.float() / 255.0 if frames.dtype != torch.float32 else frames
    return x.unsqueeze(1)


def dev():
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")
