#!/usr/bin/env python3
"""クランキング中の開度の比較（wot.json → fig/fig6_wot.png）."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import figstyle  # noqa: F401（共通の見た目）
import matplotlib.pyplot as plt
W = json.load(open(os.path.join(HERE, "wot.json"), encoding="utf-8"))
COL = {3.94: "#2a78d6", 10: "#1baf7a", 20: "#eda100", 90: "#eb6834"}
NS = W["NS"]
fig, axs = plt.subplots(1, 3, figsize=(14, 4.2))
fig.subplots_adjust(wspace=0.32)
for c in W["cases"]:
    a = c["a"]
    lab = f"α = {a}°" + ("（全開）" if a == 90 else "（α_ff）" if a == 3.94 else "")
    axs[0].plot(NS, [r["max"] for r in c["rs"]], "-o", color=COL[a], lw=1.8, ms=5, mec="#ffffff", label=lab)
    axs[1].plot(NS, [r["pmep"] for r in c["rs"]], "-o", color=COL[a], lw=1.8, ms=5, mec="#ffffff", label=lab)
axs[0].set_title("圧縮の反力の最大")
axs[0].set_ylabel("R の最大 [N·m]")
axs[1].set_title("ポンプ損失（PMEP）")
axs[1].set_ylabel("PMEP [kPa]")
axs[1].axhline(0, color="#7a7974", lw=0.8)
for ax in axs[:2]:
    ax.set_xlabel("回転数 N [rpm]（燃料 OFF，固定）")
    ax.legend(fontsize=8.5)
ax = axs[2]
k6 = [c["st"] for c in W["cases"]]
for c in W["cases"]:
    if c["a"] not in (3.94, 90):
        continue
    r = [s for s in c["st"] if s["Tl"] == 6][0]
    ax.plot([q[0] for q in r["tr"]], [q[1] for q in r["tr"]], color=COL[c["a"]], lw=1.0,
            label=f"α_crank = {c['a']}°：" + (f"完爆 {r['tFire']:.2f} s" if r["tFire"] is not None and r["tFire"] == r["tFire"] else "完爆しない"))
ax.axhspan(775, 825, color="#2a78d6", alpha=0.10, lw=0)
ax.axhline(500, color="#7a7974", lw=0.8, ls=(0, (3, 3)))
ax.text(11.8, 510, "完爆の回転数 500 rpm", ha="right", va="bottom", fontsize=8, color="#7a7974")
ax.set_xlim(0, 12)
ax.set_ylim(0, 1000)
ax.set_xlabel("時間 t [s]")
ax.set_ylabel("瞬時の回転数 N [rpm]")
ax.set_title("始動（負荷 6 N·m）")
ax.legend(fontsize=8.5, loc="lower right")
fig.text(0.01, 1.0, f"クランキング中のスロットル開度（初期位相 φin = +{W['PHIN']}°，φex = {W['PHEX']}°）", fontsize=11, fontweight="bold")
p = os.path.join(HERE, "fig", "fig6_wot.png")
fig.savefig(p)
print(p)
