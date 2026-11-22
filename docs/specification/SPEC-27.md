### SPEC-27：排気系（排気管の脈動と背圧）（REQ-27）

#### 定義と式
1. **寸法**：排気管の寸法は音響の設定（SPEC-21）の排気管長 $L_e$（既定 $1.0\ \text{m}$）と内径 $d_e$（既定 $40\ \text{mm}$）を共用する．断面積 $A_e = \frac{\pi}{4}d_e^2$．管の弁側の半分を排気ポート容積 $V_{pe} = \frac12 A_e L_e$ とする（出口側の半分は，大気圧に保たれる開放端に付くので，容積として働かない）．排気系のガスは温度 $T_X = 800\ \text{K}$ 一定の既燃ガスとする．消音器と触媒は無く，排気管の出口は大気に開いている．
2. **排気管の運動量の式**（SPEC-25 の 2 と同じ導出．出口の圧力は大気圧）：
   $$\frac{d\dot m_e}{dt} = \frac{A_e}{L_e}(p_{pe} - p_{\text{atm}}) - \frac{(\zeta_x + 1)\,\dot m_e|\dot m_e|}{2\rho_e A_e L_e}, \qquad \zeta_x = f_r\frac{L_e}{d_e} + \zeta_e, \qquad \rho_e = \frac{p_{pe}}{R_X T_X}$$
   $T_X$ と $R_X$ は排気ポートのガスの温度と気体定数（化学平衡のモデルでは 9 の状態 $T_X$ と $R_X = R_b(T_X, p^\circ, \zeta^*)$．$\gamma$ のモデルと排気系 OFF では $T_X = 800\ \text{K}$，$R_X = R$．以下も同じ）．
   損失係数の $1$ は**出口の動圧**である：管を出た噴流は大気の中で運動エネルギーを失い，圧力に戻らない．定常の流れでは，流速を $v = \frac{\dot m_e}{\rho_e A_e}$ として
   $$p_{pe} - p_{\text{atm}} = (\zeta_x + 1)\frac{\rho_e v^2}{2}$$
   になる（$\zeta_x$ の分が管の摩擦と入口の損失，$1$ の分が出口の動圧）．大気から管へ戻る向きでも同じ係数を使う．
3. **排気ポートの圧力**：熱物性が $\gamma(T)$，$\gamma$ 一定のときは断熱の剛性 $\frac{dp_{pe}}{dt} = \frac{\gamma_p RT_X}{V_{pe}}\left(\dot m_{\text{ex}} - \dot m_e\right)$，$\gamma_p = 1.4$．化学平衡のモデルでは 9 の質量とエネルギーの式．排気弁の流量（SPEC-04）は下流圧を $p_{pe}$ として求める．
4. **出口**：出口の流量は $\dot m_t = \dot m_e$．出口側の圧力 $p_{te}$ は使わず，$\frac{dp_{te}}{dt} = 0$ とする（状態ベクトルの並びを変えないために残している．8）．
5. **背圧**：1 サイクル平均の排気ポート圧（排気弁の下流圧）と大気圧の差 $\Delta\bar p_{\text{ex}}$（SPEC-14）．目標の値は持たず，管の損失と出口の動圧から決まる．周期定常では $\dot m_e$ が 1 サイクルで元に戻るので，2 の式を 1 サイクルで平均すると左辺が $0$ になり，
   $$\Delta\bar p_{\text{ex}} = \overline{p_{pe}} - p_{\text{atm}} = \overline{\left(\frac{(\zeta_x + 1)\,\dot m_e|\dot m_e|}{2\rho_e A_e^2}\right)}$$
   が成り立つ（上線は 1 サイクルの時間平均．TEST-27 項目 5）．右辺は流速の 2 乗の平均で決まり，流量は排気の吹き出しの間に集中するので，平均の流量から求めた動圧よりずっと大きい．
6. **共鳴の目安**：排気弁が閉じているとき，損失を無視すると，$\dot m_e$ は $\omega_E = \sqrt{\frac{A_e}{L_e}\frac{\gamma_X R_X T_X}{V_{pe}}} = \frac{\sqrt{2\gamma_X R_X T_X}}{L_e}$ で振動する（$\gamma$ のモデルでは $\gamma_X = \gamma_p$．化学平衡のモデルでは，9 の式で熱伝達を $0$ にし，組成が凍結している（$T_X < T_{fr}$，$R_T = 0$）とすると，$\frac{dp_{pe}}{dt} = \frac{\gamma_X R_X T_X}{V_{pe}}(\dot m_{\text{ex}} - \dot m_e)$，$\gamma_X = 1 + \frac{R_X}{c_{v,X}}$ になる）．$R = 287\ \text{J/(kg·K)}$ とすると既定の $L_e = 1\ \text{m}$ で $802\ \text{rad/s}$（$128\ \text{Hz}$）で，弁側が閉端・出口が開放端の管の最も低い共鳴 $\frac{c}{4L_e} = 142\ \text{Hz}$（$c = \sqrt{\gamma_p RT_X} = 567\ \text{m/s}$）より $10\%$ 低い（集中定数で表したための差）．
7. **設定**（ページ「排気系」）：排気系モデル ON／OFF（既定 ON），OFF のときの排気圧損 $\Delta p_{\text{ex}}$（$0$〜$30\ \text{kPa}$，既定 $0$：排気弁の下流が大気圧）．OFF では $\dot m_e$，$p_{pe}$，$p_{te}$ の時間微分を $0$ とし，排気弁の下流圧を $p_{\text{atm}} + \Delta p_{\text{ex}}$ とする．運転中に ON にしたときは $\dot m_e = 0$，$p_{pe} = p_{te} = p_{\text{atm}} + \Delta p_{\text{ex}}$ から始める．
8. **内部の値**（設定の項目ではない）：`Vm`（容積 [m³]）と `At`（開口の幾何面積 [m²]）を与えると，排気管の出口に容積 $V_m$ と開口を置く（第25版の排気系：消音器 $3\ \text{L}$ と出口 $300\ \text{mm}^2$）．このとき，2 の式の $p_{\text{atm}}$ を $p_{te}$ に，損失係数を $\zeta_x$ に替え，$\frac{dp_{te}}{dt} = \frac{RT_X}{V_m}(\dot m_e - \dot m_t)$（消音器の中の温度は $800\ \text{K}$ 一定），$\dot m_t$ は SPEC-04 の式で $p_1 = p_{te}$，$p_2 = p_{\text{atm}}$，有効面積 $C_{d,x}A_t$（$C_{d,x} = 0.8$）とする．第25版との比較の検査（TEST-29 項目 8，`tools/dev/bitcheck.js`）だけが使う．
9. **排気ポートのガスの温度**（熱物性が「化学平衡」のとき．状態 $T_X$．2.2 の 22）：ポートのガスは組成 $\zeta^*$ の既燃ガスとし（SPEC-29 C），質量 $m_X = \frac{p_{pe}V_{pe}}{R_X T_X}$，内部エネルギー $e_X = e_b(T_X, p^\circ, \zeta^*)$，$R_X = R_b(T_X, p^\circ, \zeta^*)$（SPEC-29 A の表の $p^\circ = 100\ \text{kPa}$ の値．温度だけの関数として扱う．ポートの圧力は大気圧の近くで，平衡組成の圧力による違いは凍結温度 $T_{fr}$ より上でだけ現れる．$\zeta^*$ が変わるたびに温度 $50\ \text{K}$ 刻みの 1 次元の表を作り，3 次 Hermite で補間する．はじめは圧力にもよる 3 次元の表をそのまま引いたが，全開の計算が $36\%$ 遅くなったので改めた）とする．顕熱の基準温度を $T_{\text{ref}} = T_{\text{amb}} = 298.15\ \text{K}$，ポートのガスの顕熱（単位質量）を $h_X^s = e_X + R_X T_X - h_b^{\text{ref}}$，$h_b^{\text{ref}} = h_b(T_{\text{ref}}, p^\circ, \zeta^*)$ とする．質量とエネルギーの式は
   $$\frac{dm_X}{dt} = \dot m_{\text{ex}} - \dot m_e, \qquad \frac{d}{dt}\left[m_X\left(e_X - h_b^{\text{ref}}\right)\right] = \dot H_{xs} - \dot H_x - \dot Q_{pw}$$
   $$\dot H_{xs} = \begin{cases}\dot m_{\text{ex}}\,h_c^s & (\dot m_{\text{ex}} \ge 0) \\ \dot m_{\text{ex}}\,h_X^s & (\dot m_{\text{ex}} < 0)\end{cases}, \qquad \dot H_x = \dot m_e\,h_X^s$$
   * $h_c^s$ は筒内のガスの顕熱：筒内の成分 $c = a, f, b$（質量分率 $Y_c$，既燃ガスの組成 $\zeta$）について $h_c^s = \sum_c Y_c\left[h_c(T) - h_c(T_{\text{ref}})\right]$（既燃ガスは $h_b(T, p, \zeta) - h_b(T_{\text{ref}}, p^\circ, \zeta)$．低温では組成が凍結しているので，平衡の再結合の熱も顕熱に入る）．筒内から出た空気と燃料蒸気は，顕熱だけをポートへ運び，ポートでは組成 $\zeta^*$ の既燃ガスとして扱う．
   * 管からポートへ戻る流れ（$\dot m_e < 0$）は，管の出口側の半分にある直前に出たガスで，ポートのガスと同じ状態とみなす（顕熱 $h_X^s$）．脈動の 1 往復で管の中のガスが動く距離は管の長さより短いので，出口から大気の空気が入ることは扱わない．（はじめは大気の空気（$T_{\text{amb}}$）が戻るとしたが，全開・$3000\ \text{rpm}$ で $\bar T_X$ が約 $690\ \text{K}$ と，排気弁が開く時点の筒内の温度（約 $1620\ \text{K}$）の半分以下になった．脈動で同じガスが出入りするたびに冷たい空気と入れ替わる計算になっていたため，改めた．）
   * $pV = mRT$ を微分した式と，エネルギーの式を $\dot p_{pe}$，$\dot T_X$ について解く（$R_T = dR_X/dT$，$c_{v,X} = de_X/dT$）：
   $$m_X c_{v,X}\,\dot T_X = \dot H_{xs} - \dot H_x - \dot Q_{pw} - \left(\dot m_{\text{ex}} - \dot m_e\right)\left(e_X - h_b^{\text{ref}}\right), \qquad V_{pe}\,\dot p_{pe} = \left(\dot m_{\text{ex}} - \dot m_e\right)R_X T_X + m_X\left(R_X + T_X R_T\right)\dot T_X$$
   * 排気弁の逆流（$\dot m_{\text{ex}} < 0$）の上流は温度 $T_X$，気体定数 $R_X$，比熱比 $\gamma_X$ のポートのガスで，筒内へ絶対値のエンタルピー $e_X + R_X T_X$ を運ぶ（SPEC-29 B の表の「排気弁の逆流」）．
   * 初期値：コールドリセットで $T_X = T_{\text{amb}}$．運転中に排気系を ON にしたときは $T_X = 800\ \text{K}$（7 の初期化と同時）．
10. **ポートの壁への熱伝達**（化学平衡のモデル）：ポートのうちシリンダヘッドの中の部分（長さ $L_{px} = B$，内径 $d_e$．内面積 $A_{px} = \pi d_e L_{px}$）から壁（温度 $T_w$．SPEC-08 の B）へ，管内乱流の熱伝達の式（Dittus–Boelter．冷やされる流体の指数 $0.3$）で
   $$\dot Q_{pw} = h_p A_{px}\left(T_X - T_w\right), \qquad h_p = \frac{\text{Nu}\,k_X}{d_e}, \qquad \text{Nu} = 0.023\,\text{Re}^{0.8}\,\text{Pr}^{0.3}, \qquad \text{Re} = \max\left(\frac{\dot m_p\,d_e}{A_e\,\mu_X},\ 2300\right)$$
   $\dot m_p = \frac{\lvert\dot m_{\text{ex}}\rvert + \lvert\dot m_e\rvert}{2}$（ポートを通る流量の代表），$\text{Pr} = 0.7$，粘性係数は空気の Sutherland の式 $\mu_X = \frac{1.458 \times 10^{-6}\,T_X^{1.5}}{T_X + 110.4}\ \text{Pa·s}$，熱伝導率は $k_X = \frac{c_{p,X}\mu_X}{\text{Pr}}$（$c_{p,X} = c_{v,X} + R_X$）．
   * $\text{Re}$ の下限 $2300$（層流との境）は，流量が $0$ を横切るときに $\text{Re}^{0.8}$ の傾きが無限大になって右辺が Lipschitz 連続でなくなるのを避けるためと，流れの止まった間の熱伝達を $0$ にしないためである．
11. **排気温度**（表示と検査）：1 サイクルに排気管へ出たガスの質量で重みをつけた平均 $\bar T_X = \frac{\Delta\Theta_x}{\Delta M_x^+}$（補助積分．2.3）．
12. **排気系 OFF と $\gamma$ のモデル**：$T_X$ の時間微分を $0$ とし，排気弁の逆流の温度に $800\ \text{K}$ を使う．$\dot Q_{pw} = 0$．化学平衡のモデルで排気系 OFF のときは，$\dot H_x = \dot H_{xs}$（排気弁から出た顕熱がそのまま外へ出る），$\Theta_x$，$M_x^+$ の被積分関数を $\dot m_{\text{ex}}^+ T$，$\dot m_{\text{ex}}^+$（筒内の温度の質量平均）とする．

#### 仮定と限界
* 圧力波の往復は解かない（集中定数）．
* 排気の温度は，化学平衡のモデルでは 9 の式で求める．$\gamma$ のモデルと排気系 OFF では $800\ \text{K}$ 一定とする（排気弁が開く時点の筒内の温度は，全開（W3000）で約 $1650\ \text{K}$，アイドルで約 $1180\ \text{K}$ で，これより高い）．
* 排気ポートの容積の中の温度は一様とする（排気弁からの噴流と，ポートの中の温度の分布は扱わない）．排気管の出口側の半分（容積として働かない部分．1）から外気への放熱は扱わない．
* ポートの熱伝達は定常の管内乱流の式で求める．Caton と Heywood は，排気の吹き出しの間の熱伝達が排気弁からの噴流で大きくなることを実験で示した（SAE 800290）．このモデルはポートの壁への熱と排気温度の下がり方を小さく見積もる（要件定義書 7.2 の 20）．
* 排気側へ吹き抜けた新気は既燃ガスとして扱う．
* 背圧は脈動する流量の 2 乗の平均で決まるので，平均流量だけの関数ではなく，回転数とともに単調には増えない（排気管の脈動の同調で上下する）．
* 開放端での圧力波の反射（負の圧力波が排気弁へ戻って掃気を助ける効果）は，1 つの容積と 1 つの慣性で表せる範囲（1 つの共鳴）だけが入る．
* 出口の損失（動圧 1 つ分）は，流れの向きによらず同じ係数で表す．管から戻るガスは，化学平衡のモデルではポートのガスと同じ状態，$\gamma$ のモデルでは温度 $T_X = 800\ \text{K}$ の既燃ガスとして扱う．
* エンジン音（SPEC-21）は排気弁の流量から作り，排気管の流れの計算結果は音に使わない．

* **出典**：Heywood (2018) Ch. 6，7；Winterbone and Pearson (1999)；管内乱流の熱伝達の式は F. W. Dittus and L. M. K. Boelter (1930)（経緯は [R. H. S. Winterton, *Int. J. Heat Mass Transfer* 41, 809–810 (1998)](https://doi.org/10.1016/S0017-9310(97)00177-4)）；排気ポートの熱伝達の実験は [J. A. Caton and J. B. Heywood, SAE Technical Paper 800290 (1980)](https://doi.org/10.4271/800290)；粘性係数は Sutherland の式（W. Sutherland, *Phil. Mag.* 36, 507 (1893)．空気の定数 $1.458 \times 10^{-6}\ \text{Pa·s·K}^{-1/2}$，$110.4\ \text{K}$）．

---

