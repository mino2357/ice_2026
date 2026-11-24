#!/usr/bin/env python3
"""始動の実験の図（matplotlib）．report_data.json（report_data.js が作る）を読み，fig/ に PNG を書く．
使い方： python3 experiments/startup/plot_report.py"""
import json, math, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import Rectangle

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, "report_data.json"), encoding="utf-8"))
OUT = os.path.join(HERE, "fig")
os.makedirs(OUT, exist_ok=True)

plt.rcParams.update({
    "font.family": ["Inter", "IPAPGothic"],
    "font.size": 10,
    "axes.edgecolor": "#b9b8b2",
    "axes.labelcolor": "#4f4e4a",
    "axes.titlesize": 11,
    "axes.titleweight": "bold",
    "axes.titlelocation": "left",
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.grid": True,
    "grid.color": "#ecebe6",
    "grid.linewidth": 0.8,
    "xtick.color": "#4f4e4a",
    "ytick.color": "#4f4e4a",
    "legend.frameon": False,
    "figure.dpi": 150,
    "savefig.dpi": 200,
    "savefig.bbox": "tight",
    "figure.facecolor": "#ffffff",
})
BLUE, ORANGE, AQUA, YELLOW = "#2a78d6", "#eb6834", "#1baf7a", "#eda100"
INK2, INK3 = "#4f4e4a", "#7a7974"
SEQ = LinearSegmentedColormap.from_list("seq", ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"])

DEF, OPT = D["cases"]
BEST = D["best"]
VAL = D["valves"]
LOADS = D["LOADS"]


def sgn(v):
    return f"+{v}" if v > 0 else f"{v}"


def color_for(pi):
    if pi == 0:
        return BLUE
    if pi == BEST["phin"]:
        return ORANGE
    return AQUA if pi < 0 else YELLOW


def save(fig, name):
    p = os.path.join(OUT, name)
    fig.savefig(p)
    plt.close(fig)
    print(p)


# ---- 図 1：圧縮の反力 R(θ) ----
fig, ax = plt.subplots(figsize=(8, 4))
for r in D["react"]:
    pi = r["phin"]
    lab = f"φin = {sgn(pi)}°" + ("（既定）" if pi == 0 else "（最適）" if pi == BEST["phin"] else "") + f"　最大 {r['max']:.1f} N·m"
    ax.plot(range(len(r["R"])), r["R"], color=color_for(pi), lw=1.8, label=lab)
    ax.axvline(VAL["ivc"] + pi, color=color_for(pi), lw=1, ls=(0, (3, 3)))
ax.axhline(0, color=INK3, lw=0.8)
ax.set_xlim(0, 720)
ax.set_xticks([0, 180, 360, 540, 720], ["0\n吸気上死点", "180", "360\n圧縮上死点", "540", "720"])
ax.set_xlabel("クランク角 θ [°]")
ax.set_ylabel("抵抗トルク R [N·m]")
ax.set_title(f"圧縮の反力 R(θ) = −(T_ind − T_f − T_aux)：燃料 OFF，60 rpm，開度 {D['S']['aff']}°，φex = {BEST['phex']}°")
ax.legend(loc="upper left", fontsize=9)
ax.text(0.99, 0.02, "点線：各位相の IVC", transform=ax.transAxes, ha="right", va="bottom", color=INK3, fontsize=8.5)
save(fig, "fig1_reaction.png")

# ---- 図 2：位相の格子（必要な拘束トルク，整定の時間） ----
cells = [q for q in D["grid"] if q["phin"] % 10 == 0 and q["phex"] % 10 == 0]
xs = sorted({q["phin"] for q in cells})
ys = sorted({q["phex"] for q in cells})


def heat(ax, val, title, unit, fmt):
    ok = [q for q in cells if q.get("ok")]
    vmin = min(val(q) for q in ok)
    vmax = max(val(q) for q in ok)
    for q in cells:
        x, y = q["phin"] - 5, q["phex"] - 5
        if q.get("vhit"):
            ax.add_patch(Rectangle((x + .4, y + .4), 9.2, 9.2, fc="#efeee9", ec="none"))
            ax.text(q["phin"], q["phex"], "VH", ha="center", va="center", fontsize=7, color=INK3)
        elif not q["ok"]:
            ax.add_patch(Rectangle((x + .4, y + .4), 9.2, 9.2, fc="#efeee9", ec="#c9c8c2", hatch="////", lw=0))
        else:
            v = val(q)
            c = SEQ((v - vmin) / ((vmax - vmin) or 1))
            ax.add_patch(Rectangle((x + .4, y + .4), 9.2, 9.2, fc=c, ec="none"))
            lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
            ax.text(q["phin"], q["phex"], fmt(v), ha="center", va="center", fontsize=6.5, color="#ffffff" if lum < 0.5 else "#141413")
    ax.plot(0, 0, "o", ms=13, mfc="none", mec="#141413", mew=1.8)
    ax.plot(BEST["phin"], BEST["phex"], "*", ms=17, mfc=ORANGE, mec="#ffffff", mew=1.2)
    ax.set_xlim(xs[0] - 5, xs[-1] + 5)
    ax.set_ylim(ys[0] - 5, ys[-1] + 5)
    ax.set_aspect("equal")
    ax.set_xticks(xs[::2])
    ax.set_yticks(ys[::2])
    ax.grid(False)
    ax.set_xlabel("吸気の位相 φin [°]（正が遅角）")
    ax.set_ylabel("排気の位相 φex [°]")
    ax.set_title(title)
    sm = plt.cm.ScalarMappable(cmap=SEQ, norm=plt.Normalize(vmin, vmax))
    cb = plt.colorbar(sm, ax=ax, fraction=0.046, pad=0.03)
    cb.set_label(unit)
    cb.outline.set_visible(False)


fig, axs = plt.subplots(1, 2, figsize=(12.5, 5))
fig.subplots_adjust(wspace=0.55)
heat(axs[0], lambda q: q["Tst"], "必要な拘束トルク T_stall = 1.3 (R_max + 6)", "N·m", lambda v: f"{v:.0f}")
heat(axs[1], lambda q: max(q["tSettle"]), "整定までの時間（負荷 0，3，6 N·m の最悪）", "s", lambda v: f"{v:.1f}")
fig.text(0.01, -0.02, "○ 既定（0, 0）　★ 最適　斜線：条件（3 サイクル以内に完爆，エンストしない，12 s 以内に整定）を満たさない　VH：弁とピストンが当たる",
         color=INK2, fontsize=9)
save(fig, "fig2_search.png")

# ---- 図 3：回転数の時間変化 ----
fig, axs = plt.subplots(1, 3, figsize=(13, 3.9), sharey=True)
TEND = max(q[0] for cs in (DEF, OPT) for r in cs["runs"] for q in r["tr"])
nmax = math.ceil(max(q[1] for cs in (DEF, OPT) for r in cs["runs"] for q in r["tr"]) / 200) * 200
for i, Tl in enumerate(LOADS):
    ax = axs[i]
    ax.axhspan(775, 825, color=BLUE, alpha=0.10, lw=0)
    for cs, col in ((DEF, BLUE), (OPT, ORANGE)):
        r = cs["runs"][i]
        ax.plot([q[0] for q in r["tr"]], [q[1] for q in r["tr"]], color=col, lw=1.1,
                label=f"{cs['name']}（φin {sgn(cs['phin'])}°，φex {sgn(cs['phex'])}°，T_stall {cs['Tst']:.0f} N·m）")
        ax.axvline(r["tFire"], color=col, lw=1, ls=(0, (3, 3)))
    ax.set_xlim(0, TEND)
    ax.set_ylim(0, nmax)
    ax.set_title(f"負荷 {Tl} N·m")
    ax.set_xlabel("時間 t [s]")
axs[0].set_ylabel("瞬時の回転数 N [rpm]")
axs[0].legend(loc="upper center", bbox_to_anchor=(1.65, -0.2), ncol=2, fontsize=9)
fig.text(0.01, 1.0, "瞬時の回転数（帯は 800 ± 25 rpm，点線は完爆の時刻）", fontsize=11, fontweight="bold")
save(fig, "fig3_speed.png")

# ---- 図 4：スターターのトルクと IMEP（負荷 3 N·m） ----
k3 = LOADS.index(3)
fig, axs = plt.subplots(1, 2, figsize=(11, 4))
ax = axs[0]
for cs, col in ((DEF, BLUE), (OPT, ORANGE)):
    tr = [q for q in cs["runs"][k3]["tr"] if q[0] <= 1.2]
    ax.plot([q[0] for q in tr], [q[3] for q in tr], color=col, lw=1.5, label=f"{cs['name']}（T_stall {cs['Tst']:.0f} N·m）")
ax.set_xlim(0, 1.2)
ax.set_ylim(0, math.ceil(DEF["Tst"] / 50) * 50)
ax.set_xlabel("時間 t [s]")
ax.set_ylabel("スターターのトルク T_st [N·m]")
ax.set_title("スターターのトルク（負荷 3 N·m）")
ax.legend(fontsize=9)
ax = axs[1]
for cs, col in ((DEF, BLUE), (OPT, ORANGE)):
    cy = [q for q in cs["runs"][k3]["cyc"] if q["k"] <= 15]
    ax.plot([q["k"] for q in cy], [q["imep"] for q in cy], "-o", color=col, lw=1.5, ms=4.5, mec="#ffffff", mew=1, label=cs["name"])
ax.axhline(0, color=INK3, lw=0.8)
ax.set_xticks(range(1, 16, 2))
ax.set_xlabel("サイクルの番号 k")
ax.set_ylabel("IMEP [kPa]")
ax.set_title("サイクルごとの IMEP（負荷 3 N·m）")
ax.legend(fontsize=9)
save(fig, "fig4_starter_imep.png")
