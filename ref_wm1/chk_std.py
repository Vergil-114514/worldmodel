"""同一份权重、同一段代码，两种 std 算法放在一起比，直到矛盾消失为止。"""
import os
import numpy as np
import torch

from .model import IMG_H, IMG_W, VAE, dev, to_img
from .train import CKPT, effective_rank, load

d = load()
fr = d["frames"]
E, T = fr.shape[:2]
vae = VAE().to(dev())
vae.load_state_dict(torch.load(os.path.join(CKPT, "vae.pt"), map_location=dev(), weights_only=True)["vae"])
with torch.no_grad():
    x = to_img(torch.from_numpy(fr.reshape(-1, IMG_H, IMG_W))).to(dev())
    z = torch.cat([vae.z(x[i:i + 2048]) for i in range(0, x.shape[0], 2048)]).cpu().numpy()
print("dtype", z.dtype, "shape", z.shape, "E,T", E, T)
sd_flat = z.std(0)
Z = z.reshape(E, T, -1)
sd_3d = Z.std((0, 1))
sd_64 = z.astype(np.float64).std(0)
print("max std: flat=%.3f  3d=%.3f  float64=%.3f" % (sd_flat.max(), sd_3d.max(), sd_64.max()))
print("argmax dim:", sd_flat.argmax(), sd_3d.argmax(), sd_64.argmax())
print("flat top8 :", np.sort(sd_flat)[::-1][:8].round(3))
print("3d   top8 :", np.sort(sd_3d)[::-1][:8].round(3))
print("f64  top8 :", np.sort(sd_64)[::-1][:8].round(3))
print("allclose flat/3d:", np.allclose(sd_flat, sd_3d, rtol=1e-3), " max|diff|", float(np.abs(sd_flat - sd_3d).max()))
print("|z| mean", float(np.abs(z).mean()), "z range", float(z.min()), float(z.max()))
print("有效秩 flat", round(effective_rank(torch.from_numpy(z)), 2))
live = np.argsort(sd_3d)[::-1][:6]
print("live dims", live, "std", sd_3d[live].round(3))
for i in live:
    print(f"  dim{i}: min={z[:, i].min():.3f} max={z[:, i].max():.3f} mean={z[:, i].mean():.3f} std={z[:, i].std():.3f} 分位={np.percentile(z[:, i], [1, 50, 99]).round(3)}")
