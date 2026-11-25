#!/usr/bin/env python3
"""圧縮の反力の最大の，吸気の位相と回転数への依存（vvt_rmin.json → fig/fig5_rmin.png）."""
import json, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
HERE = os.path.dirname(os.path.abspath(__file__))
import sys
sys.path.insert(0, HERE)
import figstyle  # noqa: F401（共通の見た目）
V = json.load(open(os.path.join(HERE, "vvt_rmin.json"), encoding="utf-8"))
B = V["best"]
row = sorted([g for g in V["grid"] if g["phex"] == 0 and not g.get("vhit")], key=lambda g: g["phin"])
cols = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"]
fig, ax = plt.subplots(figsize=(8, 4.4))
for j, N in enumerate(V["NS"]):
    ax.plot([g["phin"] for g in row], [g["byN"][j] for g in row], color=cols[j], lw=1.6, label=f"N = {N} rpm")
ax.plot([g["phin"] for g in row], [g["Rhat"] for g in row], color="#141413", lw=2.6, label="R̂ = 回転数についての最大")
ax.plot(0, [g["Rhat"] for g in row if g["phin"] == 0][0], "o", ms=11, mfc="none", mec="#141413", mew=1.8)
ax.plot(B["phin"], B["Rhat"], "*", ms=17, mfc="#eb6834", mec="#ffffff", mew=1.2)
ax.annotate(f"既定 0°：{[g['Rhat'] for g in row if g['phin'] == 0][0]:.1f} N·m", (0, [g["Rhat"] for g in row if g["phin"] == 0][0]), xytext=(8, 10), textcoords="offset points", fontsize=9, color="#4f4e4a")
ax.annotate(f"最小 φin = +{B['phin']}°，φex = {B['phex']}°：{B['Rhat']:.1f} N·m", (B["phin"], B["Rhat"]), xytext=(-8, -26), textcoords="offset points", ha="right", fontsize=9, color="#4f4e4a")
ax.set_xlim(-42, 42)
ax.set_xlabel("吸気の位相 φin [°]（正が遅角．範囲 ±40°）")
ax.set_ylabel("圧縮の反力の最大 [N·m]")
ax.set_title("圧縮の反力の最大と吸気の位相（燃料 OFF，開度 3.94°，φex = 0°）")
ax.legend(fontsize=8.5, ncol=2, loc="upper right")
p = os.path.join(HERE, "fig", "fig5_rmin.png")
fig.savefig(p)
print(p)
