#!/usr/bin/env python3
"""採用した始動の経過（start_final.json → fig/fig7_final.png）：回転数と開度."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import figstyle  # noqa: F401（共通の見た目）
import matplotlib.pyplot as plt
F = json.load(open(os.path.join(HERE, "start_final.json"), encoding="utf-8"))
COL = ["#2a78d6", "#eb6834", "#1baf7a"]
fig, axs = plt.subplots(2, 1, figsize=(10, 6.4), sharex=True, gridspec_kw={"height_ratios": [2, 1]})
ax = axs[0]
ax.axhspan(775, 825, color="#2a78d6", alpha=0.10, lw=0)
for r, c in zip(F["runs"], COL):
    ax.plot([q[0] for q in r["tr"]], [q[1] for q in r["tr"]], color=c, lw=0.9,
            label=f"負荷 {r['Tl']} N·m：完爆 {r['tFire']:.2f} s（{r['nc']} サイクル），整定 {r['tSettle']:.2f} s")
    ax.axvline(r["tFire"], color=c, lw=1, ls=(0, (3, 3)))
ax.set_ylim(0, 1000)
ax.set_ylabel("瞬時の回転数 N [rpm]")
ax.legend(fontsize=8.5, loc="lower right")
ax.set_title(f"採用した始動：クランキング中は全開，初期位相 φin = +{F['phin']}°，φex = +{F['phex']}°，T_stall = {F['Tst']:.0f} N·m（VVT は固定）")
ax = axs[1]
for r, c in zip(F["runs"], COL):
    ax.plot([q[0] for q in r["tr"]], [q[2] for q in r["tr"]], color=c, lw=1.4, label=f"負荷 {r['Tl']} N·m")
ax.set_yscale("log")
ax.set_yticks([2, 5, 10, 20, 50, 90], ["2", "5", "10", "20", "50", "90"])
ax.set_ylabel("開度 α [°]")
ax.set_xlabel("時間 t [s]")
ax.set_xlim(0, 12)
p = os.path.join(HERE, "fig", "fig7_final.png")
fig.savefig(p)
print(p)
