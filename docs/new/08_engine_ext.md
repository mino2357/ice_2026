
---

### REQ-24：内部 EGR と点火時期の妥当性
バルブオーバーラップによる内部 EGR（残留ガス）と MBT 点火時期が，物理的にもっともらしい大きさと傾向を示すこと．この REQ はモデルを追加せず，REQ-05〜07 の結果を判定する．

1. **オーバーラップの変え方**：オーバーラップ角 $\theta_{\text{OL}} = \text{EVC} - (\text{IVO} + 720^\circ)$ を，IVO と EVC だけで変える（$\text{IVO} = -10, -25, -40^\circ$，$\text{EVC} = 730, 745, 760^\circ$ の組で $\theta_{\text{OL}} = 20, 50, 80^\circ$）．カムの位相で変えると EVO と IVC も動き，効果が混ざるため．
2. **期待する傾向**：残留ガスの相関（Fox–Cheng–Heywood）は，オーバーラップによる項が $\frac{OF}{N}\sqrt{p_{\text{em}} - p_{\text{im}}}$ に比例する（$OF$：オーバーラップ係数，$N$：回転数，$p_{\text{em}}$，$p_{\text{im}}$：排気・吸気マニホールド圧）．したがって，
   * 吸気管の負圧が大きい軽負荷ほど，オーバーラップで $x_r$ が大きく増える．
   * 部分負荷では，$x_r$ の増加に伴って吸気管圧が上がってポンプ損失が減り，$T_{\max}$ が下がり，正味熱効率は下がらない．
   * 全開では吸排気の差圧が小さく，内部 EGR は小さい．
   * MBT 点火時期は回転とともに進角し，希釈（$x_r$ の増加）でも進角する．
3. **判定値**：試作の結果に余裕を持たせて決めた．実機の典型値との比較は推定で，文献値で確かめたものではない．

* **出典**：[J. W. Fox, W. K. Cheng, J. B. Heywood, SAE Technical Paper 931025 (1993)](https://doi.org/10.4271/931025)；[P. Öberg and L. Eriksson, SAE (2006)](https://www.fs.isy.liu.se/Publications/Articles/SAE_06_POLE.pdf)
* **対応テスト `TEST-24`**：サイクル変動 OFF，点火の自動最適化 ON，既定の諸元から各条件で $12\ \text{s}$ 積分し，直近のサイクルで判定する．
  1. [S]（軽負荷）スロットル制御，目標 $1500\ \text{rpm}$，$f_{\text{manual}} = 0.1$：$\theta_{\text{OL}} = 20, 50, 80^\circ$ で $x_r$ と $\bar Y_{b,\text{in}}$ がともに単調に増え，$x_r(80^\circ) - x_r(20^\circ) \ge 0.10$．（試作：$x_r = 0.120, 0.174, 0.314$）
  2. [S]（部分負荷）スロットル制御，目標 $2000\ \text{rpm}$，$f_{\text{manual}} = 0.3$：$\theta_{\text{OL}} = 20 \to 80^\circ$ で，$x_r$ が $0.04$ 以上増え，PMEP が $4\ \text{kPa}$ 以上 $0$ に近づき，$T_{\max}$ が $40\ \text{K}$ 以上下がり，$\eta_b$ が下がらない．（試作：$x_r$ $+0.060$，PMEP $-47.9 \to -36.6\ \text{kPa}$，$T_{\max}$ $-67\ \text{K}$，$\eta_b$ $0.259 \to 0.265$）
  3. [S]（全開）W3000（動力計制御，全開，目標 $3000\ \text{rpm}$，定格トルク $200\ \text{N·m}$）：$x_r \le 0.08$，$\bar Y_{b,\text{in}} \le 0.02$．（試作：$0.050$，$0.003$）
  4. [S]（アイドル）S2：$0.15 \le x_r \le 0.35$．（試作：$0.21$）
  5. [S]（MBT 点火時期）動力計制御，全開，定格トルク $200\ \text{N·m}$，目標 $1500, 3000, 5000\ \text{rpm}$：MBT 点火時期がいずれも $15$〜$35^\circ$ BTDC で，実際の回転数 $\bar N$ とともに単調に進角する．全開では動力計の整定が遅く $\bar N$ は目標に届かないので，目標との一致は判定しない．（試作：$1485, 2555, 4255\ \text{rpm}$ で $20.8, 23.9, 26.1^\circ$）
  6. [S]（火炎発達角）W3000 で，点火から $x_b = 0.1$ までが $15$〜$35^\circ\text{CA}$．（試作：$24.8^\circ$）
  7. [S]（希釈による進角）1 の条件で，MBT 点火時期が $\theta_{\text{OL}} = 80^\circ$ のほうが $20^\circ$ より $2^\circ$ 以上進む．（試作：$20.7 \to 23.8^\circ$）
  8. [S] TEST-24 全体の所要時間が $25\ \text{s}$ 以下（TEST-20 の総所要の上限を守るため）．

---

### REQ-25：吸気ランナの慣性（慣性過給）
吸気マニホールドと吸気弁の間に，長さ $L_r$，内径 $d_r$ の吸気ランナを 1 本置き，管内のガス柱の慣性を扱うこと．回転数によって吸気弁が閉じる直前のポート圧が上下し，体積効率とトルクに回転数の山ができること．ランナを長くすると山が低回転へ動くこと．

#### 定義と式
1. **寸法**：断面積 $A_r = \frac{\pi}{4}d_r^2$．ランナの弁側の半分の容積をポート容積 $V_p = \frac12 A_r L_r$ とし，ポートの圧力を $p_p$ とする（集中定数の近似．マニホールド側の半分は $V_{\text{in}}$ に含める）．
2. **運動量の式**：ランナのガスを密度 $\rho_r = \frac{p_{\text{in}}}{RT_{\text{in}}}$，速度 $u$ が一様な柱とみなす．Newton の第 2 法則 $\rho_r A_r L_r\frac{du}{dt} = A_r(p_{\text{in}} - p_p) - A_r\,\zeta\frac{\rho_r u|u|}{2}$ に $\dot m_r = \rho_r A_r u$ を代入して（$\rho_r$ の時間変化は無視）
   $$\frac{d\dot m_r}{dt} = \frac{A_r}{L_r}(p_{\text{in}} - p_p) - \frac{\zeta\,\dot m_r|\dot m_r|}{2\rho_r A_r L_r}, \qquad \zeta = f_r\frac{L_r}{d_r} + \zeta_e$$
   $f_r = 0.02$（管摩擦係数），$\zeta_e = 0.2$（入口損失係数）．
3. **ポートの圧力**：ポートのガスは断熱的に圧縮・膨張するとする（音響的な剛性）．$\frac{dp_p}{dt} = \gamma_0\frac{p_p}{\rho_p}\frac{d\rho_p}{dt}$ と $\frac{dm_p}{dt} = \dot m_r - \dot m_{\text{in}}$ から
   $$\frac{dp_p}{dt} = \frac{\gamma_0 RT_{\text{in}}}{V_p}\left(\dot m_r - \dot m_{\text{in}}\right), \qquad \gamma_0 = 1.4$$
   吸気弁の流量（REQ-04）は上流圧を $p_p$ として求める．マニホールドの式（REQ-05）の下流の流量は $\dot m_r$．
4. **既燃ガスと余剰エンタルピーの輸送**：ポートのガス質量を $m_p = \frac{p_p V_p}{RT_{\text{in}}}$，既燃分率を $Y_{b,p} = \text{clamp}\left(\frac{m_{b,p}}{m_p}, 0, 1\right)$，単位質量あたりの余剰を $\varepsilon_p = \frac{E_p}{m_p}$ とする．ランナの流れは上流側の値を運ぶ：
   $$Y_r = \begin{cases} Y_{b,\text{in}} & (\dot m_r \ge 0) \\ Y_{b,p} & (\dot m_r < 0) \end{cases}, \qquad \varepsilon_r = \begin{cases} \varepsilon_{\text{in}} & (\dot m_r \ge 0) \\ \varepsilon_p & (\dot m_r < 0) \end{cases}$$
   $$\frac{dm_{b,\text{in}}}{dt} = -\dot m_r Y_r + \min(0, \dot m_{\text{th}})\,Y_{b,\text{in}}, \qquad \frac{dm_{b,p}}{dt} = \dot m_r Y_r - \dot m_{\text{in}}Y_v, \qquad Y_v = \begin{cases} Y_{b,p} & (\dot m_{\text{in}} \ge 0) \\ 1 - Y_u & (\dot m_{\text{in}} < 0) \end{cases}$$
   $$\frac{dE_{\text{in}}}{dt} = -\dot m_r\varepsilon_r + \min(0, \dot m_{\text{th}})\,\varepsilon_{\text{in}}, \qquad \frac{dE_p}{dt} = \dot m_r\varepsilon_r - \dot m_{\text{in}}^+\varepsilon_p + \dot X_o$$
   $\dot X_o$ は吸気弁の逆流が持ち込む余剰（REQ-05）．吸気弁の順流の上流は $Y_{b,\text{src}} = Y_{b,p}$，$\varepsilon_{\text{src}} = \varepsilon_p$．
5. **共鳴の目安**：弁が閉じているとき，摩擦を無視して線形化すると $\frac{d^2\dot m_r}{dt^2} = \frac{A_r}{L_r}\left(\frac{dp_{\text{in}}}{dt} - \frac{dp_p}{dt}\right) = -\frac{A_r}{L_r}\left(\frac{RT_{\text{in}}}{V_{\text{in}}} + \frac{\gamma_0 RT_{\text{in}}}{V_p}\right)\dot m_r$ なので，$\dot m_r$ は角振動数
   $$\omega_H = \sqrt{\frac{A_r}{L_r}\left(\frac{\gamma_0 RT_{\text{in}}}{V_p} + \frac{RT_{\text{in}}}{V_{\text{in}}}\right)}$$
   で振動する．弁が開くと筒内の容積が加わって振動数が下がり，その周期が吸気行程と合う回転数で充填が増える．
6. **設定**（ページ「吸気ランナ」）：ランナ ON／OFF（既定 ON），$L_r$（$100$〜$1000\ \text{mm}$，既定 $450$），$d_r$（$20$〜$60\ \text{mm}$，既定 $40$）．運転中に OFF から ON にしたときは $\dot m_r = 0$，$p_p = p_{\text{in}}$，$m_{b,p} = Y_{b,\text{in}}m_p$，$E_p = \varepsilon_{\text{in}}m_p$ から始める．OFF では $\dot m_r$，$p_p$，$m_{b,p}$，$E_p$ の時間微分を $0$ とし，吸気弁はマニホールドに直接つながる．

#### 仮定と限界
* 管内の圧力波の往復は解かず，質量とばねで近似する．2 次以上の同調と，排気側の脈動との干渉は表せない．
* ポートの質量は $T_{\text{in}}$ で評価し，断熱の剛性 $\gamma_0$ とは厳密には整合しない．$\gamma_0 = 1.4$ は集中定数の剛性の定数で，REQ-02 の物性とは独立である．

* **出典**：Heywood, *Internal Combustion Engine Fundamentals*, 2nd ed. (2018) Ch. 7；[D. E. Winterbone and R. J. Pearson, *Design Techniques for Engine Manifolds* (1999)](https://www.wiley.com/en-us/Design+Techniques+for+Engine+Manifolds%3A+Wave+Action+Methods+for+IC+Engines-p-9781860581793)
* **対応テスト `TEST-25`**：
  1. [A]（共鳴）吸気弁が閉じた角度で回転を止め，$\zeta = 0$，$\dot m_{\text{th}} = 0$ として $\dot m_r(0) = 10^{-4}\ \text{kg/s}$ から積分すると，$\dot m_r$ の振動の周期が $2\pi/\omega_H$ と相対誤差 $1\%$ 以内．
  2. [A]（摩擦）$p_{\text{in}} - p_p = \frac{\zeta\dot m_r^2}{2\rho_r A_r^2}$ のとき $\frac{d\dot m_r}{dt} = 0$（$p_{\text{in}} - p_p$ を基準に相対誤差 $10^{-9}$）．
  3. [S]（OFF）ランナ OFF で $\dot m_r$，$p_p$，$m_{b,p}$，$E_p$ の時間微分が $0$ で，吸気弁の流量が上流圧 $p_{\text{in}}$ で計算される（S2 の定常から 1 サイクルの全ステップ）．
  4. [S]（質量の収支）S3 の定常の直近 5 サイクルで，$M_{\text{th}}$，$M_r$，$M_{\text{in}}$ の増分が相互に相対誤差 $1\%$ 以内．全時刻で $0 \le Y_{b,p} \le 1$．
  5. [S]（慣性過給）全開・回転数固定の計測（REQ-26）で，既定のランナ（$L_r = 450\ \text{mm}$）の $\Delta\eta_v(N) = \eta_{v,\text{ON}}(N) - \eta_{v,\text{OFF}}(N)$ の最大が $0.02$ 以上．その最大を与える回転数が，$L_r = 900\ \text{mm}$ では $450\ \text{mm}$ より低い．（試作：$4000 \to 2500\ \text{rpm}$，最大 $0.107$，$0.147$）
  6. [U] 設定ページ「吸気ランナ」があり，全項目の操作で値が変わる．

---

### REQ-27：排気系（排気管の脈動と背圧）
排気弁の下流に，排気管（長さ $L_e$，内径 $d_e$），消音器（容積 $V_m$），テールパイプの出口（有効面積 $A_t$）を置き，排気の脈動と，流量に応じて変わる背圧を扱うこと．

#### 定義と式
1. **寸法**：排気管の寸法は音響の設定（REQ-21）の排気管長 $L_e$（既定 $1.0\ \text{m}$）と内径 $d_e$（既定 $40\ \text{mm}$）を共用する．断面積 $A_e = \frac{\pi}{4}d_e^2$．弁側の半分を排気ポート容積 $V_{pe} = \frac12 A_e L_e$ とし，下流側の半分は $V_m$ に含める．排気系のガスは温度 $T_X = 800\ \text{K}$ 一定の既燃ガスとする．
2. **排気管の運動量の式**（REQ-25 の 2 と同じ導出）：
   $$\frac{d\dot m_e}{dt} = \frac{A_e}{L_e}(p_{pe} - p_m) - \frac{\zeta_x\,\dot m_e|\dot m_e|}{2\rho_e A_e L_e}, \qquad \zeta_x = f_r\frac{L_e}{d_e} + \zeta_e, \qquad \rho_e = \frac{p_{pe}}{RT_X}$$
3. **排気ポートの圧力**（断熱の剛性）：$\frac{dp_{pe}}{dt} = \frac{\gamma_0 RT_X}{V_{pe}}\left(\dot m_{\text{ex}} - \dot m_e\right)$，$\gamma_0 = 1.4$．排気弁の流量（REQ-04）は下流圧を $p_{pe}$ として求める．
4. **消音器の圧力**（等温）：$\frac{dp_m}{dt} = \frac{RT_X}{V_m}\left(\dot m_e - \dot m_t\right)$．テールパイプの出口の流量 $\dot m_t$ は REQ-04 の式で $p_1 = p_m$，$p_2 = p_{\text{atm}}$，有効面積 $C_{d,t}A_t$（$C_{d,t} = 0.8$）．
5. **背圧**：1 サイクル平均の消音器圧と大気圧の差 $\Delta\bar p_{\text{ex}}$（REQ-14）．出口の流量はおおむね $\dot m_t \approx C_{d,t}A_t\sqrt{2\rho\,\Delta p}$ なので，背圧は流量のほぼ 2 乗に比例する．$A_t$ の既定値 $300\ \text{mm}^2$ は，全開・$5000\ \text{rpm}$ の背圧が $10$〜$20\ \text{kPa}$（量産の排気系の典型として推定）になるよう選んだ（試作：$A_t = 200, 250, 300, 400\ \text{mm}^2$ で $23.3, 16.9, 13.8, 10.5\ \text{kPa}$）．
6. **共鳴の目安**：排気弁が閉じ，$\dot m_t$ を一定とみなすと，$\dot m_e$ は $\omega_E = \sqrt{\frac{A_e}{L_e}\left(\frac{\gamma_0 RT_X}{V_{pe}} + \frac{RT_X}{V_m}\right)}$ で振動する．
7. **設定**（ページ「排気系」）：排気系モデル ON／OFF（既定 ON），$V_m$（$0.5$〜$10\ \text{L}$，既定 $3$），$A_t$（$20$〜$3000\ \text{mm}^2$，既定 $300$），OFF のときの排気圧損 $\Delta p_{\text{ex}}$（$0$〜$30\ \text{kPa}$，既定 $4$）．OFF では $\dot m_e$，$p_{pe}$，$p_m$ の時間微分を $0$ とし，排気弁の下流圧を $p_{\text{atm}} + \Delta p_{\text{ex}}$ とする．運転中に ON にしたときは $\dot m_e = 0$，$p_{pe} = p_m = p_{\text{atm}} + \Delta p_{\text{ex}}$ から始める．

#### 仮定と限界
* 圧力波の往復は解かない（集中定数）．
* 排気の温度は $800\ \text{K}$ 一定とする．排気弁が開く時点の筒内の温度は，全開で約 $1670\ \text{K}$，アイドルで約 $1190\ \text{K}$（試作）で，これより高い．排気の密度（背圧）と，排気弁の逆流の温度に影響する．
* 排気側へ吹き抜けた新気は既燃ガスとして扱う．
* $5000\ \text{rpm}$ を超えると体積効率の低下で排気流量が頭打ちになり，背圧は下がる．背圧は脈動する流量の 2 乗の平均で決まるので，平均流量だけの関数ではない．
* エンジン音（REQ-21）は排気弁の流量から作り，排気管の流れの計算結果は音に使わない．

* **出典**：Heywood (2018) Ch. 6，7；Winterbone and Pearson (1999)．
* **対応テスト `TEST-27`**：
  1. [A]（共鳴）排気弁が閉じた角度で回転を止め，$\zeta_x = 0$，出口を閉じて $\dot m_e(0) = 10^{-4}\ \text{kg/s}$ から積分すると，振動の周期が $2\pi/\omega_E$ と相対誤差 $1\%$ 以内．
  2. [A]（摩擦）$p_{pe} - p_m = \frac{\zeta_x\dot m_e^2}{2\rho_e A_e^2}$ のとき $\frac{d\dot m_e}{dt} = 0$（相対誤差 $10^{-9}$）．
  3. [S]（OFF）排気系 OFF で $\dot m_e$，$p_{pe}$，$p_m$ の時間微分が $0$ で，排気弁の下流圧が $p_{\text{atm}} + \Delta p_{\text{ex}}$．
  4. [S]（質量の収支）S3 の定常の直近 5 サイクルで，$M_{\text{ex}}$，$M_e$，$M_t$ の増分が相互に相対誤差 $1\%$ 以内．
  5. [S]（背圧）全開・回転数固定の計測で，$5000\ \text{rpm}$ の背圧が $10$〜$20\ \text{kPa}$，$1000$〜$5000\ \text{rpm}$（$500\ \text{rpm}$ 刻み）で回転数とともに単調に増える．S2（アイドル）の背圧が $2\ \text{kPa}$ 以下．（試作：$13.8\ \text{kPa}$，アイドル $0.1\ \text{kPa}$）
  6. [S]（脈動）全開・$3000\ \text{rpm}$ で，1 サイクルの排気ポート圧の最大と最小の差が $20\ \text{kPa}$ 以上．
  7. [U] 設定ページ「排気系」があり，全項目の操作で値が変わる．

---

### REQ-28：アイドルの妥当性
既定設定の無負荷アイドルが，実機と比べて妥当な範囲にあることを，判定できる指標で確かめること．モデルの係数を実機の値に合わせ込むことはしない（物性値や式の誤りは直すが，結果を合わせるための調整はしない．ずれは理由とともに記録する）．

1. **対象**：既定設定，無負荷，目標 $800\ \text{rpm}$ の定常（S2），サイクル変動 OFF，直近 10 サイクル平均．
2. **単気筒であることの注意**：本機は $0.5\ \text{L}$ の単気筒で，比べる実機の値は多気筒機関からの 1 気筒あたりの換算である．単気筒は排気量あたりの摩擦や熱損失が多気筒と同じとは限らず，回転変動も大きい．以下の範囲はこの差を見込んだ目安である．
3. **判定する指標**：
   * 燃料流量 $\dot m_f$：$0.030$〜$0.050\ \text{g/s}$．根拠（推定）：排気量 $2.0\ \text{L}$・4 気筒の乗用車の暖機後アイドルの燃料消費を $0.6$〜$0.8\ \text{L/h}$ とすると，1 気筒あたり $0.7 \times 0.745/4/3600 \approx 0.036\ \text{g/s}$（ガソリンの密度 $0.745\ \text{kg/L}$）．
   * $\text{FMEP} + \text{AMEP}$：$90$〜$130\ \text{kPa}$．根拠：火花点火機関の全摩擦平均有効圧の相関 $97 + 15\,(N/1000) + 5\,(N/1000)^2\ \text{kPa}$（Heywood の教科書に載る Barnes–Moss の相関と記憶しているが，**係数は原典で確認できていない**）が $800\ \text{rpm}$ で約 $112\ \text{kPa}$．
   * 部分負荷（$2000\ \text{rpm}$，$f_{\text{manual}} = 0.3$）の膨張のポリトロープ指数（$400^\circ$ と $480^\circ$ の $p$，$V$ から）：$1.20$〜$1.35$．根拠：圧縮・膨張とも $1.3 \pm 0.05$ が目安（Heywood）．本モデルの既燃ガスの $\gamma$ は平衡組成の値（解離を含む）なので，目安の下側に出る．
4. **記録する量**（判定は「有限」だけ．値を検証タブの実測欄に出す）：吸気管圧，$x_r$，排気弁が開く時点の筒内圧，アイドルの膨張の指数，排気弁が開いた直後の排気の逆流量．

* **対応テスト `TEST-28`**：
  1. [S] S2 の直近 10 サイクル平均で $0.030 \le \dot m_f \le 0.050\ \text{g/s}$．（試作：$0.040$）
  2. [S] 同じく $90 \le \text{FMEP} + \text{AMEP} \le 130\ \text{kPa}$．（試作：$56 + 50 = 106$）
  3. [S] スロットル制御，目標 $2000\ \text{rpm}$，$f_{\text{manual}} = 0.3$ の定常で，膨張の指数が $1.20$〜$1.35$．（試作：$1.26$）
  4. [S] 4 の「記録する量」が有限の値として実測欄に出る．
