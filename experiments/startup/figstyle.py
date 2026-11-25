"""始動の実験の図の共通の見た目（plot_report.py，plot_rmin.py が読む）."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

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
