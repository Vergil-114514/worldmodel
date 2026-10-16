"""核对：存档的 VAE 权重是否与训练时打印的 z 统计一致。"""
import os
import numpy as np
import torch

from .model import IMG_H, IMG_W, VAE, Z_DIM, dev, to_img
from .train import CKPT, effective_rank, load

d = load()
fr = d["frames"]
vae = VAE().to(dev())
ck = torch.load(os.path.join(CKPT, "vae.pt"), map_location=dev(), weights_only=True)
missing = vae.load_state_dict(ck["vae"])
print("load_state_dict:", missing)
print("ckpt z_scale =", ck.get("z_scale"))
with torch.no_grad():
    x = to_img(torch.from_numpy(fr.reshape(-1, IMG_H, IMG_W))).to(dev())
    z = torch.cat([vae.z(x[i:i + 2048]) for i in range(0, x.shape[0], 2048)]).cpu().numpy()
sd = z.std(0)
print(f"z: shape={z.shape} |z|mean={np.abs(z).mean():.4f} std min={sd.min():.3f} 中位={np.median(sd):.3f} max={sd.max():.3f}")
print("top8 std =", np.sort(sd)[::-1][:8].round(3))
print(f"有效秩={effective_rank(torch.from_numpy(z)):.1f} / {Z_DIM}")
print("mu 层权重范数:", float(vae.mu.weight.norm()), float(vae.mu.bias.abs().max()))
print("mu 行范数 top8:", np.sort(vae.mu.weight.detach().cpu().numpy().astype(np.float64).std(1))[::-1][:8].round(3))
