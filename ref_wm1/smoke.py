"""秒级形状/数值冒烟测试：专门盯这次真踩过的坑
（卷积尺寸不匹配、MDN 的 K 维没摊开导致广播/gather 出错、rollout/plan 的 batch 约定不一致、
像素量纲错误）。跑法：python -m wm1.smoke
"""
from __future__ import annotations

import math

import numpy as np
import torch

from .model import IMG_H, IMG_W, MDNRNN, RewardModel, VAE, Z_DIM, dev
from .envs import render_state, PendulumPixels, reward_of, state_of


def chk(name, cond, extra=""):
    print(("  PASS  " if cond else "  FAIL  ") + name + ("   " + extra if extra else ""))
    return cond


def main():
    ok = True
    d = dev()
    torch.manual_seed(0)

    # 1) 像素量纲：断言的是"没被压成二值"，不是"丰富灰度"——按元素平涂，电平数本来就等于元素数
    f = render_state(0.0, 4.0)
    lv = np.unique(np.stack([render_state(0.0, v) for v in np.linspace(0, 8, 9)]))
    ok &= chk("帧为 uint8 且未被压成二值", f.dtype == np.uint8 and f.max() == 255 and lv.size > 5,
              f"单帧电平={len(np.unique(f))} 跨帧电平={lv.size} max={f.max()}")

    # 2) 几何：theta=0 画在枢轴(CY=16)上方，theta=pi 画在下方；杆长 15、配重半径 3.4
    up, dn = render_state(0.0, 0.0), render_state(math.pi, 0.0)
    y_up = np.nonzero(up)[0].min()
    y_dn = np.nonzero(dn)[0].max()
    ok &= chk("上/下的像素位置正确", y_up <= 2 and 30 <= y_dn <= IMG_H - 8, f"y_up={y_up} y_dn={y_dn}")

    # 3) VAE 前后向尺寸精确闭合（不再靠插值兜底）
    vae = VAE().to(d)
    x = torch.rand(4, 1, IMG_H, IMG_W, device=d)
    rec, mu, logvar = vae(x)
    ok &= chk("VAE 尺寸闭合", tuple(rec.shape) == (4, 1, IMG_H, IMG_W), f"{tuple(rec.shape)}")
    ok &= chk("VAE 输出在 [0,1]", float(rec.min()) >= 0 and float(rec.max()) <= 1,
              f"[{float(rec.min()):.3f},{float(rec.max()):.3f}]")
    loss, lg = vae.loss(x)
    ok &= chk("VAE loss 有限且可反传", math.isfinite(float(loss)) and loss.requires_grad)

    # 4) MDN：K 维必须真的分开（这里曾经是广播错误）
    T, B, K = 12, 5, MDNRNN().k
    rnn = MDNRNN().to(d)
    z = torch.randn(T, B, Z_DIM, device=d)
    a = torch.rand(T, B, 1, device=d)
    l1 = rnn.loss(z, a)
    ok &= chk("MDN loss 有限", math.isfinite(float(l1)), f"NLL={float(l1):.3f}")
    opt = torch.optim.Adam(rnn.parameters(), lr=5e-3)
    first = last = None
    for i in range(60):
        loss = rnn.loss(z, a)
        opt.zero_grad(); loss.backward(); opt.step()
        if i == 0:
            first = float(loss)
        last = float(loss)
    ok &= chk("MDN 在同一批数据上能下降（过拟合检查）", last < first * 0.98, f"{first:.3f} -> {last:.3f}")

    # 5) step / mean_step 的 batch 约定：输入 [B,Z] -> 输出 [B,Z]，h 保持 [1,B,H]
    z0, h0, a0 = torch.randn(B, Z_DIM, device=d), torch.zeros(1, B, rnn.h_dim, device=d), torch.rand(B, 1, device=d)
    z1, h1 = rnn.step(z0, h0, a0)
    zm, hm = rnn.mean_step(z0, h0, a0)
    ok &= chk("step 形状约定", tuple(z1.shape) == (B, Z_DIM) and tuple(h1.shape) == (1, B, rnn.h_dim), f"{tuple(z1.shape)} {tuple(h1.shape)}")
    ok &= chk("mean_step 形状约定", tuple(zm.shape) == (B, Z_DIM) and tuple(hm.shape) == (1, B, rnn.h_dim))

    # 6) 奖励头 + 一段 rollout 不改变形状
    rw = RewardModel().to(d)
    r = rw(z0, h0.squeeze(0), a0)
    ok &= chk("奖励头输出 [B]", tuple(r.shape) == (B,), f"{tuple(r.shape)}")

    # 7) 环境接线：注入的状态能被取回；重力按 sin(theta) 把角速度往 0 方向推（theta>0 时 thetadot 增大）
    env = PendulumPixels(seed=0)
    env._env.reset(); env._env.unwrapped.state = np.array([0.5, -1.0], np.float64)
    s, _, _ = env.step(0.0)
    th, thd = s["theta"], s["theta_dot"]
    # 理论值：thetadot += dt * (3*9.8/(2*1)) * sin(0.5) = -1.0 + 0.05*14.7*0.479 = -0.645
    ok &= chk("状态注入与一步动力学符合解析值", abs(th - 0.5) < 0.05 and abs(thd - (-0.645)) < 0.05,
              f"theta={th:.3f} thetadot={thd:.3f}（解析 -0.645）")
    ok &= chk("奖励方向：朝上优于朝下", reward_of(0.0, 0.0, 0.0) > reward_of(math.pi, 0.0, 0.0))
    env.close()

    print("全部通过" if ok else "有失败项，别去跑长训练")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
