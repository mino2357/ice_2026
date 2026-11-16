#!/usr/bin/env python3
"""燃料空気サイクル（定容燃焼の Otto サイクル）の試算：図示平均有効圧 IMEP を当量比 φ に対して求める．

目的：リッチでの出力増を表すのに，モデルのどの要素が必要かを確かめる（要件定義書 7.3 節の検討用．成果物には含めない）．

比べるモデル
  M0  今のシミュレータ相当：R = 287 一定，γ_u(T)・γ_b(T) の直線，発熱 q = f·H_u·ε(φ)（ε は水性ガス反応 K = 3.5）
  M1  化学種の熱力学（NASA 多項式），解離なし：既燃は CO2,H2O,(O2 か CO,H2),N2．リッチは水性ガス反応 K = 3.5 で固定
  M2  6 種（CO2,CO,H2O,H2,O2,N2）の化学平衡．膨張中は移動平衡，T_fr 以下で組成を凍結
  M3  10 種（M2 + OH,O,H,NO）の化学平衡．同上
燃料の入れ方
  PFI  予混合（燃料は蒸気で，空気を押しのける．潜熱は上流でまかなわれるとして T1 は固定）
  DI   直噴：空気だけを T1, p1 で吸い，液体燃料（T_l）が吸気弁の開いている間に定圧・断熱で気化（冷却の上限）

熱力学データ：thermo.json（Cantera nasa_gas.yaml，原典は NASA TM-4513）．
燃料は擬似種 CH_y（y = 1.87，モル質量 110 g/mol）：比熱は質量あたりでイソオクタンと同じ，
生成エンタルピーは液体の低位発熱量 H_u = 44.0 MJ/kg と気化潜熱 h_fg = 350 kJ/kg に合うように決める．
"""
import json, math, os, sys
import numpy as np
from scipy.optimize import brentq

RU = 8.314462618          # J/(mol K)
P0 = 1.0e5                # 標準圧 [Pa]（NASA TM-4513 の標準状態は 100 kPa）
HERE = os.path.dirname(os.path.abspath(__file__))
TH = json.load(open(os.path.join(HERE, 'thermo.json')))['species']
MW = dict(C=12.011e-3, H=1.008e-3, O=15.999e-3, N=14.007e-3)

# ---------- 化学種の熱力学（NASA 7 係数） ----------
class Sp:
    def __init__(s, name, comp, Tr, lo, hi):
        s.name, s.comp, s.Tm, s.lo, s.hi = name, comp, Tr[1], np.array(lo, float), np.array(hi, float)
        s.M = sum(MW[e] * n for e, n in comp.items())
    def _a(s, T): return s.lo if T < s.Tm else s.hi
    def cp(s, T):            # J/(mol K)
        a = s._a(T); return RU * (a[0] + T * (a[1] + T * (a[2] + T * (a[3] + T * a[4]))))
    def h(s, T):             # J/mol（生成エンタルピーを含む絶対値）
        a = s._a(T); return RU * T * (a[0] + T * (a[1] / 2 + T * (a[2] / 3 + T * (a[3] / 4 + T * a[4] / 5))) + a[5] / T)
    def s0(s, T):            # J/(mol K)，標準圧
        a = s._a(T); return RU * (a[0] * math.log(T) + T * (a[1] + T * (a[2] / 2 + T * (a[3] / 3 + T * a[4] / 4))) + a[6])
    def u(s, T): return s.h(T) - RU * T

SP = {n: Sp(n, d['comp'], d['Tr'], d['lo'], d['hi']) for n, d in TH.items()}

Y_H = 1.87; M_FUEL = 0.110; HU_LIQ = 44.0e6; HFG = 350e3; T_LIQ = 300.0; T0 = 298.15
def make_fuel(y=Y_H, M=M_FUEL, Hu_liq=HU_LIQ, hfg=HFG):
    """擬似燃料 C_n H_{y n}：比熱はイソオクタンの質量あたりの値，生成エンタルピーは発熱量から決める"""
    iso = SP['C8H18,isooctane']; n = M / (MW['C'] + y * MW['H']); k = M / iso.M
    f = Sp('FUEL', dict(C=n, H=y * n), [200, iso.Tm, 6000], iso.lo * k, iso.hi * k)
    # 蒸気の低位発熱量（298.15 K）= Hu_liq + hfg ＝ [h_F − n h_CO2 − (y n/2) h_H2O(g)] / M
    target = (Hu_liq + hfg) * M + n * SP['CO2'].h(T0) + y * n / 2 * SP['H2O'].h(T0)
    d = (target - f.h(T0)) / RU
    f.lo = f.lo.copy(); f.hi = f.hi.copy(); f.lo[5] += d; f.hi[5] += d
    return f
SP['FUEL'] = make_fuel()

class Mix:
    """質量 1 kg あたりの物質量 n_j [mol/kg] で表した理想気体混合物"""
    def __init__(m, n): m.n = {k: v for k, v in n.items() if v > 0}; m.N = sum(m.n.values())
    def R(m): return RU * m.N
    def h(m, T): return sum(v * SP[k].h(T) for k, v in m.n.items())
    def u(m, T): return m.h(T) - m.N * RU * T
    def cv(m, T): return sum(v * SP[k].cp(T) for k, v in m.n.items()) - m.N * RU
    def s(m, T, p): return sum(v * (SP[k].s0(T) - RU * math.log(v / m.N * p / P0)) for k, v in m.n.items())
    def p(m, T, v): return m.N * RU * T / v

O2_N2 = 3.76                 # 空気：O2 + 3.76 N2（Ar は N2 に含めない近似）
def reactants(phi, y=Y_H):
    """燃料の炭素 1 mol あたりで作り，1 kg あたりに直す．戻り値：(混合気, 空気, 燃料の質量分率 f, 元素組成 b[mol/kg])"""
    F = SP['FUEL']; nC = F.comp['C']; o2 = nC * (1 + y / 4) / phi
    mass = F.M + o2 * (SP['O2'].M + O2_N2 * SP['N2'].M)
    mix = Mix({'FUEL': 1 / mass, 'O2': o2 / mass, 'N2': O2_N2 * o2 / mass})
    ma = o2 * (SP['O2'].M + O2_N2 * SP['N2'].M); air = Mix({'O2': o2 / ma, 'N2': O2_N2 * o2 / ma})
    b = dict(C=nC / mass, H=y * nC / mass, O=2 * o2 / mass, N=2 * O2_N2 * o2 / mass)
    return mix, air, F.M / mass, b

def complete_products(phi, b, K=3.5):
    """解離なしの既燃ガス（M1）：φ ≤ 1 は完全燃焼，φ > 1 は水性ガス反応 K で CO と H2 に分ける（今のモデルと同じ）"""
    C, H, O, N = b['C'], b['H'], b['O'], b['N']
    if phi <= 1: return Mix({'CO2': C, 'H2O': H / 2, 'O2': (O - 2 * C - H / 2) / 2, 'N2': N / 2})
    S = 2 * C + H / 2 - O                      # 酸素の不足 = n_CO + n_H2
    A = K - 1; B = H / 2 - S + K * (C + S); Cc = K * S * C
    nco = (B - math.sqrt(B * B - 4 * A * Cc)) / (2 * A); nh2 = S - nco
    return Mix({'CO2': C - nco, 'CO': nco, 'H2O': H / 2 - nh2, 'H2': nh2, 'N2': N / 2})

# ---------- 化学平衡（Gibbs エネルギー最小．Gordon–McBride の反復） ----------
def equil(T, p, b, names, n0=None):
    el = [e for e in ('C', 'H', 'O', 'N') if b.get(e, 0) > 0]; ne = len(el); ns = len(names)
    a = np.array([[SP[s].comp.get(e, 0) for s in names] for e in el], float)
    bb = np.array([b[e] for e in el]); g = np.array([(SP[s].h(T) - T * SP[s].s0(T)) / (RU * T) for s in names])
    n = np.full(ns, bb.sum() / ns * 0.1) if n0 is None else np.maximum(np.array([n0.get(s, 0.0) for s in names]), 1e-12)
    N = n.sum(); lp = math.log(p / P0)
    for it in range(400):
        mu = g + np.log(n / N) + lp
        A = np.zeros((ne + 1, ne + 1)); r = np.zeros(ne + 1)
        an = a * n
        A[:ne, :ne] = an @ a.T; A[:ne, ne] = an.sum(1); A[ne, :ne] = an.sum(1); A[ne, ne] = n.sum() - N
        r[:ne] = bb - an.sum(1) + an @ mu; r[ne] = N - n.sum() + n @ mu
        x = np.linalg.solve(A, r); pi, dN = x[:ne], x[ne]
        dn = dN + a.T @ pi - mu
        big = (n / N > 1e-8) | (dn > 0)
        lam = min(1.0, 2.0 / max(5 * abs(dN), np.abs(dn[big]).max(), 1e-30))
        n = np.maximum(n * np.exp(lam * dn), 1e-40); N *= math.exp(lam * dN)
        if lam == 1.0 and np.abs(n * dn).max() / N < 1e-11 and abs(dN) < 1e-11: break
    else: raise RuntimeError('平衡が収束しない T=%g p=%g' % (T, p))
    return Mix(dict(zip(names, n)))

S6 = ['CO2', 'CO', 'H2O', 'H2', 'O2', 'N2']; S10 = S6 + ['OH', 'O', 'H', 'NO']

def eq_Tv(T, v, b, names, guess=None):
    """T, v を与えて平衡（p は組成に依存するので反復）"""
    p = (guess.N if guess else sum(b.values()) / 2.2) * RU * T / v; m = guess
    for _ in range(30):
        m = equil(T, p, b, names, m.n if m else None); pn = m.p(T, v)
        if abs(pn / p - 1) < 1e-10: break
        p = pn
    return m

# ---------- サイクル ----------
def cycle_species(phi, kind, inj, eps=10.0, T1=330.0, p1=100e3, Tfr=1700.0, hfg=HFG):
    mix, air, f, b = reactants(phi)
    if inj == 'DI':      # 定圧・断熱の気化：(1−f) h_air(T1) + f [h_F(T_l) − h_fg] = h_mix(T_m)．エンタルピーは 1 kg あたり
        F = SP['FUEL']; hin = (1 - f) * air.h(T1) + f * (F.h(T_LIQ) / F.M - hfg)
        T1 = brentq(lambda T: mix.h(T) - hin, 200.0, 400.0)
    v1 = mix.R() * T1 / p1; v2 = v1 / eps
    s1 = mix.s(T1, p1); T2 = brentq(lambda T: mix.s(T, mix.p(T, v2)) - s1, T1, 1500.0)
    u1, u2 = mix.u(T1), mix.u(T2)
    if kind == 'M1':
        prod = complete_products(phi, b); T3 = brentq(lambda T: prod.u(T) - u2, 1000.0, 4500.0)
        s3 = prod.s(T3, prod.p(T3, v2)); T4 = brentq(lambda T: prod.s(T, prod.p(T, v1)) - s3, 500.0, T3); m4 = prod; m3 = prod
    else:
        names = S6 if kind == 'M2' else S10
        st = {}
        def fu(T): st['m'] = eq_Tv(T, v2, b, names, st.get('m')); return st['m'].u(T) - u2
        T3 = brentq(fu, 1200.0, 4500.0, xtol=1e-6); m3 = eq_Tv(T3, v2, b, names, st['m']); s3 = m3.s(T3, m3.p(T3, v2))
        def s_eq(T, v):
            st['m'] = eq_Tv(T, v, b, names, st.get('m')); return st['m'].s(T, st['m'].p(T, v)) - s3
        if Tfr <= 0:     # 最後まで移動平衡
            T4 = brentq(lambda T: s_eq(T, v1), 400.0, T3, xtol=1e-6); m4 = eq_Tv(T4, v1, b, names, st['m'])
        else:
            # 等エントロピー線上で T = Tfr になる比体積 v_f を求め，そこから先は組成を固定
            def g(lv): return s_eq(Tfr, math.exp(lv))
            lo, hi = math.log(v2), math.log(v1)
            if T3 <= Tfr: vf = v2; mf = m3; Tf = T3
            elif g(hi) > 0:  # v1 まで膨張しても Tfr まで冷えない（s(Tfr, v1) > s3 なら，実際の T(v1) < Tfr）
                lvf = brentq(g, lo, hi, xtol=1e-9); vf = math.exp(lvf); mf = eq_Tv(Tfr, vf, b, names, st['m']); Tf = Tfr
            else: vf = None
            if vf is None: T4 = brentq(lambda T: s_eq(T, v1), 400.0, T3, xtol=1e-6); m4 = eq_Tv(T4, v1, b, names, st['m'])
            else:
                sf = mf.s(Tf, mf.p(Tf, vf)); T4 = brentq(lambda T: mf.s(T, mf.p(T, v1)) - sf, 300.0, Tf + 1); m4 = mf
    u4 = m4.u(T4); w = u1 - u4
    xs = lambda m, k: m.n.get(k, 0) / m.N
    return dict(phi=phi, T1=T1, T2=T2, T3=T3, T4=T4, p3=m3.p(T3, v2), imep=w / (v1 - v2), w=w, f=f, mair=(1 - f) / v1,
                eta=w / (f * HU_LIQ), xCO3=xs(m3, 'CO'), xO23=xs(m3, 'O2'), xCO4=xs(m4, 'CO'), xH24=xs(m4, 'H2'), Rb=m4.R(), Ru=mix.R())

# 今のシミュレータ相当（src/core.js の定数）
R0 = 287.0; AF0 = 14.7
GU = (0.3488, 13.0e-5, 1000.0); GB = (0.3678, 9.4e-5, 2700.0)
def gm1(T, c): return c[0] - c[1] * (min(T, c[2]) - 300.0)           # γ − 1
def e_fit(T, c):
    g, bk, Tc = c; e = lambda x: R0 / bk * math.log((g - bk * (T0 - 300)) / (g - bk * (x - 300)))
    return e(T) if T <= Tc else e(Tc) + R0 / gm1(Tc, c) * (T - Tc)
def isen_fit(Ta, va, vb, c, n=2000):
    """d ln T = −(γ(T) − 1) d ln v を RK4 で積分"""
    h = (math.log(vb) - math.log(va)) / n; x = math.log(Ta); F = lambda x: -gm1(math.exp(x), c)
    for _ in range(n):
        k1 = F(x); k2 = F(x + h * k1 / 2); k3 = F(x + h * k2 / 2); k4 = F(x + h * k3); x += h * (k1 + 2 * k2 + 2 * k3 + k4) / 6
    return math.exp(x)
def rich_eps(phi, y=1.87, K=3.5, hCO=283.0e3, hH2=241.8e3, Hu=HU_LIQ):
    if phi <= 1: return 1.0
    S = (2 + y / 2) * (1 - 1 / phi); A = K - 1; B = y / 2 - S + K * (1 + S); C = K * S
    bq = min((B - math.sqrt(B * B - 4 * A * C)) / (2 * A), 1, S); d = S - bq
    return 1 - (bq * hCO + d * hH2) / ((12.011 + 1.87 * 1.008) * 1e-3 * Hu)
def cycle_M0(phi, eps=10.0, T1=330.0, p1=100e3):
    f = phi / (AF0 + phi); v1 = R0 * T1 / p1; v2 = v1 / eps
    T2 = isen_fit(T1, v1, v2, GU); q = f * HU_LIQ * rich_eps(phi)
    T3 = brentq(lambda T: e_fit(T, GB) - e_fit(T2, GU) - q, 500.0, 6000.0); T4 = isen_fit(T3, v2, v1, GB)
    w = q - (e_fit(T4, GB) - e_fit(T1, GU))
    return dict(phi=phi, T1=T1, T2=T2, T3=T3, T4=T4, p3=R0 * T3 / v2, imep=w / (v1 - v2), w=w, f=f, mair=(1 - f) / v1, eta=w / (f * HU_LIQ))

def checks():
    out = []
    # (1) 平衡定数：CO2 ⇌ CO + ½O2 の log10 Kp．JANAF の値（2500 K で −1.440，3000 K で −0.485）と比べる
    for T, ref in ((2000.0, -2.884), (2500.0, -1.440), (3000.0, -0.485)):
        lnK = -((SP['CO'].h(T) - T * SP['CO'].s0(T)) + 0.5 * (SP['O2'].h(T) - T * SP['O2'].s0(T)) - (SP['CO2'].h(T) - T * SP['CO2'].s0(T))) / (RU * T)
        out.append(('log10 Kp(CO2 ⇌ CO + ½O2), %g K' % T, lnK / math.log(10), ref))
    # (2) 水性ガス反応 CO2 + H2 ⇌ CO + H2O の K（今のモデルは 3.5 固定．Heywood は 1740 K 付近で 3.5）
    T = 1740.0; G = lambda s: SP[s].h(T) - T * SP[s].s0(T)
    out.append(('K_w(1740 K) = [CO][H2O]/([CO2][H2])', math.exp(-(G('CO') + G('H2O') - G('CO2') - G('H2')) / (RU * T)), 3.5))
    # (3) イソオクタン／空気の定圧断熱火炎温度（φ = 1，298.15 K，101.325 kPa）．文献値は約 2275 K
    iso = SP['C8H18,isooctane']; o2 = 12.5; mass = iso.M + o2 * (SP['O2'].M + O2_N2 * SP['N2'].M)
    b = dict(C=8 / mass, H=18 / mass, O=2 * o2 / mass, N=2 * O2_N2 * o2 / mass)
    h0 = (iso.h(T0) + o2 * (SP['O2'].h(T0) + O2_N2 * SP['N2'].h(T0))) / mass
    for names, lab in ((S10, '10 種'), (S6, '6 種')):
        st = {}
        def fh(T): st['m'] = equil(T, 101325.0, b, names, st['m'].n if 'm' in st else None); return st['m'].h(T) - h0
        out.append(('断熱火炎温度 イソオクタン/空気 φ=1（%s）[K]' % lab, brentq(fh, 1500.0, 3000.0), 2275.0))
    cp = complete_products(1.0, b); out.append(('同，解離なし [K]', brentq(lambda T: cp.h(T) - h0, 1500.0, 3500.0), float('nan')))
    # (4) イソオクタンの低位発熱量（蒸気，298.15 K）．文献値 44.65 MJ/kg（液体 44.3 + 潜熱 0.31）
    out.append(('イソオクタン蒸気の低位発熱量 [MJ/kg]', (iso.h(T0) - 8 * SP['CO2'].h(T0) - 9 * SP['H2O'].h(T0)) / iso.M / 1e6, 44.65))
    # (5) 擬似燃料の量論空燃比
    mix, air, f, b = reactants(1.0); out.append(('擬似燃料 CH1.87 の量論空燃比', (1 - f) / f, 14.7))
    return out

if __name__ == '__main__':
    print('== 検算 =='); [print('  %-52s 計算 %9.4f   参照 %9.4f' % c) for c in checks()]
    phis = [round(0.80 + 0.05 * i, 2) for i in range(13)]
    cases = [('M0', 'PFI')] + [(k, i) for k in ('M1', 'M2', 'M3') for i in ('PFI', 'DI')]
    res = {}
    for k, i in cases:
        res[k + '/' + i] = [cycle_M0(p) if k == 'M0' else cycle_species(p, k, i) for p in phis]
    extra = {'M3/DI 凍結なし': [cycle_species(p, 'M3', 'DI', Tfr=0) for p in phis], 'M3/DI 凍結 2000 K': [cycle_species(p, 'M3', 'DI', Tfr=2000.0) for p in phis]}
    res.update(extra)
    print('\n== IMEP [kPa]（圧縮比 10，p1 = 100 kPa，T1 = 330 K，残留ガスなし，熱損失なし，燃焼効率 1） ==')
    keys = list(res); print('  φ    ' + ''.join('%-19s' % k for k in keys))
    for j, p in enumerate(phis): print('  %.2f ' % p + ''.join('%-19s' % ('%7.1f (%+5.1f%%)' % (res[k][j]['imep'] / 1e3, 100 * (res[k][j]['imep'] / res[k][phis.index(1.0)]['imep'] - 1))) for k in keys))
    print('\n== 最大の位置（φ = 1 比） ==');
    for k in keys:
        j = max(range(len(phis)), key=lambda j: res[k][j]['imep']); print('  %-20s φ = %.2f で最大，φ = 1 比 %+.2f%%' % (k, phis[j], 100 * (res[k][j]['imep'] / res[k][phis.index(1.0)]['imep'] - 1)))
    print('\n== φ = 1.0 と 1.1 の内訳 ==')
    for k in keys:
        for p in (1.0, 1.1):
            r = res[k][phis.index(p)]; print('  %-20s φ=%.1f  T1 %6.1f  T3 %6.0f K  p3 %6.2f MPa  T4 %6.0f K  空気 %.4f kg/m3  熱効率 %.4f' % (k, p, r['T1'], r['T3'], r['p3'] / 1e6, r['T4'], r['mair'], r['eta'])
                  + ('  x_CO(3) %.4f x_O2(3) %.4f x_CO(4) %.4f' % (r['xCO3'], r['xO23'], r['xCO4']) if 'xCO3' in r else ''))
    json.dump(dict(phis=phis, res=res), open(os.path.join(HERE, 'faircycle_result.json'), 'w'), indent=1, ensure_ascii=False)
