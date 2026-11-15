
---

### REQ-05：スロットルと吸気マニホールド
スロットル開度 $\alpha$ から，スロットルの質量流量 $\dot m_{\text{th}}$ と吸気マニホールド圧 $p_{\text{in}}$ の変化を求めること．大気圧を設定で変えられること．吸気側へ吹き返した筒内ガスの**既燃分**と**熱**を追跡し，次の吸気で筒内へ戻すこと．

#### 定義と式
1. **環境**：大気圧 $p_{\text{atm}}$（既定 $101.3\ \text{kPa}$，$60$〜$110\ \text{kPa}$），大気温 $T_{\text{amb}} = 298.15\ \text{K}$．エアクリーナと吸気ダクトの圧力損失は無視する．$p_{\text{atm}}$ は，スロットルの上流圧，テールパイプの出口圧（REQ-27），クランクケースの背圧（REQ-10），体積効率の基準密度（REQ-14），初期値（§2.2）に共通に使う．層流燃焼速度の基準圧（REQ-07）は物性式の定数で，$p_{\text{atm}}$ とは無関係である．
2. **吸気は予混合気とする**：スロットルを通るガスは，当量比 $\phi$ の空気と燃料蒸気の混合気（REQ-02 の未燃ガス）とみなす．したがって $\dot m_{\text{th}}$ は混合気の流量で，その $\frac{1}{1 + \phi/\text{AF}_{st}}$ が空気である（REQ-07）．
3. **スロットルの有効開口面積**（理想スロットル．全閉で流量 $0$）：開度 $\alpha \in [0, \pi/2]$ に対し
   $$A_{\text{th}}(\alpha) = C_{d,\text{th}}\,\frac{\pi}{4}D_{\text{th}}^2\,(1 - \cos\alpha), \qquad C_{d,\text{th}} = 0.8$$
   円板の流れ方向への投影面積が $\cos\alpha$ 倍になることによる近似（板厚と軸は無視）．$D_{\text{th}}$：スロットル径（既定 $40\ \text{mm}$，$20$〜$80$）．$\alpha = 90^\circ$ は板が流れと平行な全開である．
4. **スロットルの流量**：REQ-04 の式で $p_1 = p_{\text{atm}}$，$p_2 = p_{\text{in}}$，$A = A_{\text{th}}(\alpha)$．
5. **マニホールド圧**：容積 $V_{\text{in}}$（既定 $1.5\ \text{L}$，$0.3$〜$5$）のガスを一様・等温（$T_{\text{in}} = 298.15\ \text{K}$）とする．質量 $m_{\text{in}} = \frac{p_{\text{in}}V_{\text{in}}}{RT_{\text{in}}}$ の保存 $\frac{dm_{\text{in}}}{dt} = \dot m_{\text{th}} - \dot m_{\text{dn}}$ から
   $$\frac{dp_{\text{in}}}{dt} = \frac{RT_{\text{in}}}{V_{\text{in}}}\left(\dot m_{\text{th}} - \dot m_{\text{dn}}\right)$$
   $\dot m_{\text{dn}}$ は下流へ出る流量で，ランナ ON では $\dot m_r$（REQ-25），OFF では吸気弁の流量 $\dot m_{\text{in}}$．
6. **既燃ガスの追跡**：マニホールドの既燃ガス分率を $Y_{b,\text{in}} = \text{clamp}\left(\frac{m_{b,\text{in}}}{m_{\text{in}}}, 0, 1\right)$ とする．流れが運ぶ既燃分は上流側の組成で決める．スロットルから入るガスは既燃分 $0$．ランナ OFF では
   $$\frac{dm_{b,\text{in}}}{dt} = -\dot m_{\text{in}}\,Y_{\text{src}} + \min(0, \dot m_{\text{th}})\,Y_{b,\text{in}}, \qquad Y_{\text{src}} = \begin{cases} Y_{b,\text{in}} & (\dot m_{\text{in}} \ge 0) \\ 1 - Y_u & (\dot m_{\text{in}} < 0) \end{cases}$$
   第 2 項はスロットルの逆流で出ていく分．ランナ ON の式は REQ-25．
7. **余剰エンタルピーの追跡**：吸気側の容積の温度は圧力の式では $T_{\text{in}}$ 一定とするが，筒内から吹き返した高温ガスが持ち込む熱は，既燃ガスと同じく「流れに乗って運ばれる量」として追跡する．
   * 吸気弁の逆流（$\dot m_{\text{in}} < 0$）が吸気側へ持ち込む**余剰エンタルピー**の流束を，筒内ガスの顕熱エンタルピーと，同じ組成のガスが $T_{\text{in}}$ で持つ顕熱エンタルピーの差とする：
     $$\dot X_o = \dot m_{\text{in}}^-\left[h(T, Y_u) - h(T_{\text{in}}, Y_u)\right]$$
   * 容積 $k$（マニホールド，ポート）にたまった余剰エンタルピーを $E_k$ $[\text{J}]$，単位質量あたりを $\varepsilon_k = E_k/m_k$ とする．順流はこれを上流側の $\varepsilon$ で運ぶ．ランナ OFF では
     $$\frac{dE_{\text{in}}}{dt} = \dot X_o - \dot m_{\text{in}}^+\,\varepsilon_{\text{in}} + \min(0, \dot m_{\text{th}})\,\varepsilon_{\text{in}}$$
     ランナ ON の式は REQ-25．
   * **吸気弁の順流の状態**：吸気弁のすぐ上流の容積（ランナ ON ではポート，OFF ではマニホールド）の既燃分率を $Y_{b,\text{src}}$，余剰を $\varepsilon_{\text{src}}$ とすると，筒内へ入るガスの未燃分率は $Y_j = 1 - Y_{b,\text{src}}$，顕熱エンタルピーは
     $$h_j = h(T_{\text{in}}, Y_j) + \varepsilon_{\text{src}}$$
     オリフィスの式（REQ-04）の上流温度は $T_{\text{up}} = T_{\text{in}} + \frac{\varepsilon_{\text{src}}}{c_p(T_{\text{in}}, Y_j)}$，比熱比は $\gamma(T_{\text{up}}, Y_j)$ とする．スロットルの逆流の上流温度も同様に $T_{\text{in}} + \varepsilon_{\text{in}}/c_p(T_{\text{in}}, 1 - Y_{b,\text{in}})$．
   * 壁との熱のやりとりは無い（断熱）とする．周期定常では，吹き返した余剰エンタルピーは，混ざる容積の大きさによらず全量が筒内へ戻る．

#### 仮定と限界
* 吸気側の容積は圧力の式では等温で，温度上昇による密度の低下（$m_k$ の減少）は扱わない．余剰エンタルピーは吸気弁の流れの上流温度と筒内へのエンタルピーにだけ効く．
* 断熱なので，吹き返しによる吸気の加熱は**上限**の見積もりである．実機ではポート壁への放熱で一部が失われ，逆に高温の壁が吸気を温める効果もあるが，どちらも扱わない．
* 既定の IVC（$264^\circ$）は遅く，低回転では吸った新気の押し戻しが多い．アイドルでは吸気弁の逆流が順流の約 $1/4$ ある．

* **出典**：[L. Guzzella and C. H. Onder, *Introduction to Modeling and Control of Internal Combustion Engine Systems*, 2nd ed., Springer (2010), Ch. 2](https://doi.org/10.1007/978-3-642-10775-7)；[E. Hendricks and S. C. Sorenson, SAE Technical Paper 900616 (1990)](https://doi.org/10.4271/900616)
* **対応テスト `TEST-05`**：
  1. [A] $A_{\text{th}}(0) = 0$（厳密），$A_{\text{th}}(\pi/2) = C_{d,\text{th}}\frac{\pi}{4}D_{\text{th}}^2$（相対誤差 $10^{-12}$），$\alpha$ について単調増加．
  2. [A] 吸気弁を閉じ $p_{\text{in}}(0) = 0.3\,p_{\text{atm}}$ から積分すると，$p_{\text{in}}$ が単調に増えて $p_{\text{atm}}$ に収束し，$\int\dot m_{\text{th}}\,dt = \frac{V_{\text{in}}}{RT_{\text{in}}}\left(p_{\text{in}}(t) - p_{\text{in}}(0)\right)$（相対誤差 $10^{-6}$）．
  3. [A] チョーク域で $\dot m_{\text{th}}$ が $p_{\text{in}}$ によらず $\frac{A_{\text{th}}p_{\text{atm}}}{\sqrt{RT_{\text{amb}}}}\Psi_{\max}$（$\gamma_0 = \gamma_u(T_{\text{amb}})$）に一致し，$p_{\text{atm}}$ を $101.325 \to 80\ \text{kPa}$ にすると $\frac{80000}{101325}$ 倍になる（相対誤差 $10^{-12}$）．
  4. [S]（質量の収支）S4 の定常の直近 5 サイクルで，$M_{\text{th}}$ と $M_{\text{in}}$ の増分が相対誤差 $0.2\%$ 以内．
  5. [A] $p_{\text{atm}}$ を変えてコールドリセットすると $p = p_{\text{in}} = p_{\text{atm}}$，図示トルク $T_{\text{ind}} = 0$．
  6. [S] S2 から 6 サイクルの全時刻で $0 \le Y_{b,\text{in}} \le 1$，$0 \le Y_{b,p} \le 1$，$E_{\text{in}} \ge 0$，$E_p \ge 0$．コールドリセット直後は $m_{b,\text{in}} = m_{b,p} = E_{\text{in}} = E_p = 0$．
  7. [S]（既燃ガスの収支）S2 の直近 5 サイクルで，$B_o$ と $B_i$ の増分の差が両者の平均の $2\%$ 以内（定常では既燃ガスがたまり続けない）．かつ $m_{b,\text{in}} + m_{b,p}$ の増分と $\Delta B_o - \Delta B_i$ の差が $10^{-3}\,\Delta B_o$ 以内．
  8. [S]（余剰エンタルピーの収支）同じ 5 サイクルで，$E_{\text{in}} + E_p$ の増分と $\Delta X_o - \Delta X_i - \Delta X_t$ の差が $10^{-6}\,\Delta X_o$ 以内（$X_i$：順流で筒内へ戻った分 $\int\dot m_{\text{in}}^+\varepsilon_{\text{src}}\,dt$，$X_t$：スロットルの逆流で出た分）．かつ $\Delta X_o$ と $\Delta X_i$ の差が両者の平均の $2\%$ 以内（定常では全量が戻る）．
  9. [S]（吹き返しによる加熱）S2 の 1 サイクルで，吸気弁の順流の上流温度 $T_{\text{up}}$ の流量加重平均が $T_{\text{in}}$ より $15\ \text{K}$ 以上高い（実測 $+37\ \text{K}$）．全時刻で $T_{\text{up}} \ge T_{\text{in}}$．
  10. [A] 余剰が $0$ のとき $T_{\text{up}} = T_{\text{in}}$，$h_j = h(T_{\text{in}}, Y_j)$．$\varepsilon = c_p(T_{\text{in}}, Y_j) \cdot 30\ \text{K}$ のとき $T_{\text{up}} = T_{\text{in}} + 30\ \text{K}$（相対誤差 $10^{-12}$）．

---

### REQ-06：筒内の組成（未燃ガスと既燃ガス）
筒内の全質量 $m$ と未燃ガスの質量 $m_u$ の保存則を解き，吹き返し，内部 EGR，吹き抜けを追跡すること．

#### 定義と式
$$\frac{dm}{dt} = \dot m_{\text{in}} - \dot m_{\text{ex}}, \qquad \frac{dm_u}{dt} = \dot m_{u,\text{in}} - \dot m_{u,\text{ex}} - r$$
* 吸気弁：順流は上流の容積の組成（既燃分率 $Y_{b,\text{src}}$，REQ-05），逆流は筒内の組成で出る．
  $$\dot m_{u,\text{in}} = \begin{cases} (1 - Y_{b,\text{src}})\,\dot m_{\text{in}} & (\dot m_{\text{in}} \ge 0) \\ Y_u\,\dot m_{\text{in}} & (\dot m_{\text{in}} < 0) \end{cases}$$
* 排気弁：流出は筒内の組成，逆流は既燃ガスだけとする（排気側へ吹き抜けた新気は既燃ガスとして扱う）．
  $$\dot m_{u,\text{ex}} = \begin{cases} Y_u\,\dot m_{\text{ex}} & (\dot m_{\text{ex}} \ge 0) \\ 0 & (\dot m_{\text{ex}} < 0) \end{cases}$$
* 燃焼：吸気弁が閉じた時点（IVC）の未燃ガスの質量を $m_{u,\text{trapped}}$ とし，Wiebe 関数の燃焼割合 $x_b$（REQ-07）に従って既燃ガスに変わる．
  $$r = m_{u,\text{trapped}}\,\frac{dx_b}{d\theta}\,\omega$$

* **出典**：[C. R. Ferguson and A. T. Kirkpatrick, *Internal Combustion Engines: Applied Thermosciences*, 3rd ed., Wiley (2015)](https://www.wiley.com/en-us/Internal+Combustion+Engines%3A+Applied+Thermosciences%2C+3rd+Edition-p-9781118533314)
* **対応テスト `TEST-06`**：
  1. [S] S2 と S4 の全時刻で $0 \le m_u \le m$．燃焼の終了後，排気弁が開く時点で $Y_u < 0.01$（Wiebe の燃焼割合 $99.3\%$ に対応）．
  2. [S]（質量の収支）S4 の定常の 5 サイクルで，$M_{\text{in}} - M_{\text{ex}}$ の増分と筒内質量 $m$ の増分の差が，1 サイクルに吸気弁を通る質量の $10^{-6}$ 以下．

---

### REQ-07：燃焼（乱流火炎伝播に連動する単一 Wiebe モデル）
点火時期，当量比 $\phi$，残留ガス率 $x_r$，回転数に応じて，着火遅れと燃焼期間が変わること．着火遅れと熱発生の速さを利用者が係数で調整できること．リッチ側の不完全燃焼を扱うこと．燃焼をサイクルごとにばらつかせられること．

#### 定義と式
1. **層流燃焼速度**（Metghalchi と Keck の相関．定数は Turns の教科書の gasoline の組）：基準 $T_{\text{ref}} = 298\ \text{K}$，$p_{\text{ref}} = 101.325\ \text{kPa}$ で
   $$S_{L,0}(\phi) = \max\left(0.05,\ B_m + B_2(\phi - \phi_m)^2\right), \qquad B_m = 0.2758\ \text{m/s},\ B_2 = -0.7834\ \text{m/s},\ \phi_m = 1.13$$
   点火時の筒内の状態 $(T_s, p_s)$ と残留ガス率 $x_r$（質量分率）に対し
   $$S_L = S_{L,0}(\phi)\left(\frac{T_s}{T_{\text{ref}}}\right)^{2.18 - 0.8(\phi - 1)}\left(\frac{p_s}{p_{\text{ref}}}\right)^{-0.16 + 0.22(\phi - 1)}\max\left(0.15,\ 1 - 2.1\,x_r\right)$$
   $T_s$ には筒内の平均温度を使う（単一ゾーン）．
2. **着火遅れと燃焼期間**：平均ピストン速度 $c_m = \frac{S\omega}{\pi}$，乱れの強さ $u' = 0.5\,c_m$，乱流燃焼速度 $S_T = S_L + C_{\text{turb}}\,u'$（$C_{\text{turb}} = 6$）とする．点火進角を $s$ [°BTDC] とし，上死点後の点火（$s < 0$）では膨張による乱れの減衰と温度低下を係数 $f_{\text{ret}} = 1 + 0.025\max(0, -s)$ で表す．
   $$\Delta\theta_d = c_d\,\frac{\ell_k\,\omega}{S_L + C_k u'}, \qquad \Delta\theta_b = \frac{f_{\text{ret}}}{c_b}\,\frac{\ell_c\,\omega}{S_T}$$
   $\ell_k = 0.025B$（火炎核の形成距離），$C_k = 0.4$，$\ell_c = 0.65B$（燃焼室の代表距離）．$c_d$（着火遅れ係数）と $c_b$（燃焼速度係数）は設定「燃焼速度」の調整係数（$0.1$〜$10$，既定 $1$）．
3. **Wiebe 関数**：燃焼の開始角 $\theta_0 = 2\pi - s + \Delta\theta_d$，$\zeta = \frac{\theta - \theta_0}{\Delta\theta_b}$，$a = 5$，形状係数 $m_w$（設定，$0$〜$6$，既定 $2$．点火時の値をそのサイクルに固定）に対し
   $$x_b = 1 - \exp\left(-a\,\zeta^{m_w + 1}\right), \qquad \frac{dx_b}{d\theta} = \frac{a\,(m_w + 1)}{\Delta\theta_b}\,\zeta^{m_w}\exp\left(-a\,\zeta^{m_w + 1}\right) \qquad (0 < \zeta \le 1)$$
   $\zeta \le 0$ と $\zeta > 1$ では $\frac{dx_b}{d\theta} = 0$．燃焼割合は $1 - e^{-a} = 99.3\%$ で打ち切る．
4. **発熱量**：$m_{u,\text{trapped}}$ のうち空気は $m_{\text{air}} = \frac{m_{u,\text{trapped}}}{1 + \phi/\text{AF}_{st}}$，燃料は $m_f = \frac{\phi}{\text{AF}_{st}}m_{\text{air}}$（$\text{AF}_{st} = 14.7$）．低位発熱量 $H_u = 44.0\ \text{MJ/kg}$，燃焼効率 $\eta_c = 0.97$ として
   $$Q_{\text{in}} = m_f\,H_u\,\eta_c\,\epsilon(\phi), \qquad \dot Q_{\text{comb}} = Q_{\text{in}}\,\frac{dx_b}{d\theta}\,\omega$$
   $\eta_c$ と Wiebe の打ち切りが重なるので，供給した燃料の発熱量のうち実際に発熱するのは，$\phi \le 1$ で $0.97 \times 0.993 = 96.3\%$ である．
5. **リッチ側の不完全燃焼** $\epsilon(\phi)$：燃料を $\text{CH}_y$（$y = 1.87$）とし，酸素が足りないときの生成物 $a'\,\text{CO}_2 + b'\,\text{CO} + c'\,\text{H}_2\text{O} + d'\,\text{H}_2$ を，元素の保存と水性ガスシフト平衡で決める．
   $$a' + b' = 1, \quad 2c' + 2d' = y, \quad 2a' + b' + c' = \frac{2(1 + y/4)}{\phi}, \quad \frac{b'c'}{a'd'} = K_w = 3.5$$
   はじめの 3 式から $b' + d' = S_r \equiv \left(2 + \frac{y}{2}\right)\left(1 - \frac{1}{\phi}\right)$．これと第 4 式から $b'$ の 2 次方程式 $(K_w - 1)b'^2 - \left[\frac{y}{2} - S_r + K_w(1 + S_r)\right]b' + K_w S_r = 0$ を得て，$[0, \min(1, S_r)]$ の根を取る．燃え残る CO と H₂ が持ち去る発熱量を差し引く：
   $$\epsilon(\phi) = 1 - \frac{b'\,\Delta h_{\text{CO}} + d'\,\Delta h_{\text{H}_2}}{M_f\,H_u} \quad (\phi > 1), \qquad \epsilon = 1 \quad (\phi \le 1)$$
   $\Delta h_{\text{CO}} = 283.0\ \text{kJ/mol}$，$\Delta h_{\text{H}_2} = 241.8\ \text{kJ/mol}$，$M_f = 13.896\ \text{g/mol}$．空気量あたりの発熱 $\phi\,\epsilon(\phi)$ は $\phi = 1$ で最大．
6. **サイクル変動**（設定「燃焼」の `[サイクル変動 OFF／ON]`，既定 ON）：点火のたびに，平均 $0$・分散 $1$ の一様乱数 $z_1, z_2 \in [-\sqrt 3, \sqrt 3]$ を引き，
   $$\theta_0 \leftarrow \theta_0 + \sigma_\theta z_1, \qquad \Delta\theta_b \leftarrow \Delta\theta_b\max(0.5,\ 1 + \sigma_b z_2), \qquad \sigma_\theta = 3^\circ,\ \sigma_b = 0.12$$
   乱数は `EngineCore` ごとに種を固定した擬似乱数（mulberry32）で，状態の複製で乱数の状態も複製される（結果は決定的）．

#### 仮定と限界
* 着火遅れの定数 $\ell_k$，$C_k$ は，全開の MBT 点火時期が回転とともに $20^\circ$ 台で進角するよう校正した値である（文献値ではない）．
* 希釈の項 $1 - 2.1\,x_r$ の $x_r$ は，原式の希釈ガスの質量分率に対応させている．
* 生成物のモル数の増加（実機で出力最大が $\phi \approx 1.1$ になる要因）は扱わないので，出力最大は $\phi = 1$ にある．
* $S_L$ の圧力指数が負なので，部分負荷で MBT が全開より大きく進む実機の傾向は十分には出ない．

* **出典**：[M. Metghalchi and J. C. Keck, *Combustion and Flame* 48, 191–210 (1982)](https://doi.org/10.1016/0010-2180(82)90127-4)；定数の組と希釈の項は S. R. Turns, *An Introduction to Combustion* の式 8.33（[BYU の講義ノートで確認](https://ignite.byu.edu/cbe522/lectures/SL_correlation)）；I. I. Wiebe, *Brennverlauf und Kreisprozess von Verbrennungsmotoren* (1970)；リッチ側は Heywood (1988) Sec. 4.9．
* **対応テスト `TEST-07`**：
  1. [A] $\int_0^1\frac{dx_b}{d\zeta}\,d\zeta = 1 - e^{-a}$（台形則 2000 分割，相対誤差 $10^{-5}$．$m_w = 0.5, 2, 4$）．$x_b(\zeta_{50}) = 0.5$（$\zeta_{50} = (\ln 2/a)^{1/(m_w + 1)}$）．
  2. [A]（層流燃焼速度）$S_{L,0}(1.13) = 0.2758$，$S_{L,0}(1.0) = 0.2758 - 0.7834 \times 0.13^2 = 0.26256$（相対誤差 $10^{-12}$），$S_{L,0}$ は $\phi = 1.13$ で最大．基準状態で $x_r = 0.2$ の $S_L$ は $x_r = 0$ の $0.58$ 倍，$x_r = 0.5$ では下限の $0.15$ 倍．
  3. [A] $x_r = 0.05 \to 0.25$ で $S_L$ が減る．点火を $20^\circ$ BTDC から $10^\circ$ ATDC にすると燃焼期間が延びる．
  4. [A]（調整係数）$c_d = 2$ で着火遅れが 2 倍，$c_b = 2$ で燃焼期間が半分．
  5. [A]（リッチ）$\epsilon(1) = 1$．$\phi = 1.1, 1.2, 1.4$ で $a', b', c', d'$ が元素保存の 3 式と $K_w = 3.5$ を満たし（相対誤差 $10^{-12}$），すべて $\ge 0$．$\phi\,\epsilon(\phi)$ は $\phi \ge 1$ で単調減少し，$\phi = 1.1$ で $0.969 \pm 0.002$，$1.2$ で $0.938 \pm 0.002$．
  6. [S]（当量比）S4 の定常から当量比だけを変えて各 $3\ \text{s}$：IMEP が $\phi = 0.8 < 0.9 < 1.0$ で増え，$1.0 > 1.1 > 1.2$ で減る．スロットル制御（S2 から）では $\phi = 1.2$ の燃料流量が $\phi = 1.0$ より $15\%$ 以上多く，回転数は目標 $\pm 25\ \text{rpm}$．
  7. [S]（調整係数の効果）S4 の定常から点火を固定して $c_b = 2$ にすると $p_{\max}$ が $5\%$ 以上上がる．自動最適化 ON では CA50 が上死点後 $10 \pm 0.5^\circ$ に戻る．
  8. [S]（サイクル変動）S4V（S4 の定常からサイクル変動 ON で $10\ \text{s}$）：直近 60 サイクルの IMEP の変動係数が $0.5$〜$5\%$，平均 IMEP が OFF と $2\%$ 以内，$z_1, z_2$ の標本平均の絶対値が $0.3$ 未満・標準偏差が $1 \pm 0.25$・$|z| \le \sqrt 3$，平均 CA50 が上死点後 $10 \pm 1^\circ$．
  9. [S]（決定性）S4 の終端を複製してサイクル変動 ON で $10\ \text{s}$ 積分した状態が S4V の終端と完全に一致する．OFF では $z_1 = z_2 = 0$．

---

### REQ-08：壁面熱伝達と壁温
筒内ガスからシリンダ壁への熱流量を Woschni の式で求め，壁温の変化を連立して解くこと．

#### 定義と式
IVC の時点の筒内の状態を $(p_r, V_r, T_r)$ とし，燃焼が無いとしたときの圧力を**ポリトロープ指数 $1.33$** の圧縮膨張 $p_{\text{mot}}(\theta) = p_r\left(\frac{V_r}{V(\theta)}\right)^{1.33}$ で見積もる．代表ガス速度は
$$w = C_1 c_m + C_2\,\frac{V_d T_r}{p_r V_r}\max\left(0,\ p - p_{\text{mot}}\right)$$
* 圧縮・燃焼・膨張（IVC〜EVO）：$C_1 = 2.28$，$C_2 = 3.24 \times 10^{-3}\ \text{m/(s·K)}$
* ガス交換（EVO〜IVC）：$C_1 = 6.18$，$C_2 = 0$

熱伝達率（圧力を kPa で入れる形）と熱流量は，係数 $C_w$（設定「燃焼」の Woschni 係数，$0$〜$2$，既定 $1$）を掛けて
$$h_c = C_w \cdot 3.26\,B^{-0.2}\left(\frac{p}{1000}\right)^{0.8}T^{-0.55}\max(w, 0.5)^{0.8}, \qquad \dot Q_{\text{wall}} = h_c\,A_w(\theta)\,(T - T_w)$$
壁は 1 つの熱容量 $C_{w,\text{th}} = 1500\ \text{J/K}$ とし，冷却水（$T_{\text{cool}} = 360\ \text{K}$ 一定）へ熱コンダクタンス $G_{\text{cool}} = 15\ \text{W/K}$ で放熱する．
$$C_{w,\text{th}}\frac{dT_w}{dt} = \dot Q_{\text{wall}} - G_{\text{cool}}\,(T_w - T_{\text{cool}})$$

#### 仮定と限界
* 冷却水温は一定なので，コールドリセット後（壁温 $298.15\ \text{K}$）は，燃焼が無くても壁が冷却水で温められる（時定数 $C_{w,\text{th}}/G_{\text{cool}} = 100\ \text{s}$）．この文書の「冷間」は壁温の初期値だけを指す．
* 吸気ポートと排気ポートの壁への熱伝達は扱わない．

* **出典**：[G. Woschni, SAE Technical Paper 670931 (1967)](https://doi.org/10.4271/670931)
* **対応テスト `TEST-08`**：
  1. [A] $C_w = 0$ で $h_c = 0$．ソルバの右辺でも $\dot Q_{\text{wall}} = 0$．
  2. [A] $p > p_{\text{mot}}$ のとき，$p = p_{\text{mot}}$ のときより $w$ と $h_c$ が大きい．
  3. [A] 壁温の式：$\dot Q_{\text{wall}} = 0$，$T_w = 300\ \text{K}$ で $\frac{dT_w}{dt} = \frac{15 \times 60}{1500} = 0.6\ \text{K/s}$（相対誤差 $10^{-12}$）．

---

### REQ-09：筒内圧の式（開いた系の熱力学第一法則）
質量の出入りと燃焼を伴う筒内ガスのエネルギー保存と状態方程式から，筒内圧の時間微分を導いて解くこと．比熱が温度と組成で変わっても，第一法則が閉じること．

#### 導出
顕熱の内部エネルギー（REQ-02）を使う．未燃ガスは，燃えて既燃ガスになるときに単位質量あたり $q_u = \frac{Q_{\text{in}}}{m_{u,\text{trapped}}}$ の熱を出すとする．筒内の全エネルギーは
$$E = m_u\left(e_u(T) + q_u\right) + m_b\,e_b(T)$$
流れ $j$（質量流量 $\dot m_j$，流入が正，未燃分率 $Y_j$，顕熱エンタルピー $h_j$）が運ぶエネルギーは $\dot m_j\left(h_j + Y_j q_u\right)$ なので，第一法則は
$$\frac{dE}{dt} = -p\frac{dV}{dt} - \dot Q_{\text{wall}} + \sum_j\dot m_j\left(h_j + Y_j q_u\right)$$
左辺は，$\frac{dm_u}{dt} = \sum_j\dot m_j Y_j - r$，$\frac{dm_b}{dt} = \sum_j\dot m_j(1 - Y_j) + r$（REQ-06）と $m c_v = m_u c_{v,u} + m_b c_{v,b}$ を使って
$$\frac{dE}{dt} = \sum_j\dot m_j\left[Y_j\left(e_u + q_u\right) + (1 - Y_j)e_b\right] - r\left(q_u + e_u - e_b\right) + m c_v\frac{dT}{dt}$$
と書ける（$e_u$，$e_b$，$c_v$ は筒内の温度 $T$ での値）．両者から $q_u$ を含む流れの項が消えて
$$m c_v\frac{dT}{dt} = -p\frac{dV}{dt} - \dot Q_{\text{wall}} + r\,q_u + r\left(e_u - e_b\right) + \sum_j\dot m_j\left[h_j - Y_j e_u - (1 - Y_j)e_b\right]$$
$r\,q_u = \dot Q_{\text{comb}}$ である．$r(e_u - e_b)$ は，未燃ガスと既燃ガスが同じ温度で持つ顕熱の差で，組成が変わることによる項である．

状態方程式 $pV = mRT$ を時間で微分すると $V\frac{dp}{dt} = RT\frac{dm}{dt} + mR\frac{dT}{dt} - p\frac{dV}{dt}$．これに上の式を代入し，$\frac{R}{c_v} = \gamma - 1$，$RT = (\gamma - 1)c_v T$，$\frac{dm}{dt} = \sum_j\dot m_j$ を使うと

$$\frac{dp}{dt} = -\gamma\,\frac{p}{V}\frac{dV}{d\theta}\,\omega + \frac{\gamma - 1}{V}\left[\dot Q_{\text{comb}} + r\left(e_u - e_b\right) - \dot Q_{\text{wall}} + \sum_j\dot m_j\left(h_j - Y_j e_u - (1 - Y_j)e_b + c_v T\right)\right]$$

ここで $\gamma = \gamma(T, Y_u)$，$c_v = c_v(T, Y_u)$．流れごとの括弧の中は次のとおり．

| 流れ | $Y_j$ | $h_j$ | 括弧の中 |
| :--- | :--- | :--- | :--- |
| 筒内から出る流れ（吸気弁の逆流，排気弁の流出） | $Y_u$ | $h(T, Y_u)$ | $c_p(T, Y_u)\,T$ |
| 吸気弁の順流 | $1 - Y_{b,\text{src}}$ | $h(T_{\text{in}}, Y_j) + \varepsilon_{\text{src}}$（REQ-05） | $h_j - Y_j e_u(T) - (1 - Y_j)e_b(T) + c_v T$ |
| 排気弁の逆流 | $0$ | $h_b(T_X)$ | $h_b(T_X) - e_b(T) + c_v T$ |

筒内から出る流れでは $h(T, Y_u) - e(T, Y_u) = RT$ なので括弧の中は $(R + c_v)T = c_p T$ となる．定比熱比モデルでは $h_j = c_p T_j + \text{const}$ なので，流入の括弧の中も $c_p T_j$ に帰着する．

#### 第一法則の検査
顕熱エネルギー $U_s = m_u e_u(T) + m_b e_b(T)$ について，上の式から
$$\frac{dU_s}{dt} = -p\frac{dV}{dt} - \dot Q_{\text{wall}} + \dot Q_{\text{comb}} + \dot H_{\text{in}}^s - \dot H_{\text{out}}^s$$
が成り立つ（$\dot H_{\text{in}}^s = \sum_{\text{流入}}\dot m_j h_j$，$\dot H_{\text{out}}^s = \sum_{\text{流出}}|\dot m_j|\,h(T, Y_u)$）．両辺を補助積分（§2.3）で積分し，
$$\Delta U_s = -\Delta W - \Delta Q_w + \Delta Q_c + \Delta H_i - \Delta H_o$$
の残差で検査する．

* **出典**：Heywood (1988) Ch. 14；比熱の扱いは Klein and Eriksson (2004)．
* **対応テスト `TEST-09`**：
  1. [A]（断熱圧縮）弁を閉じ，燃焼と熱損失を無くし，定比熱比 $\gamma_0 = 1.35$ で下死点（$100\ \text{kPa}$）から上死点まで積分すると，$p(2\pi) = p(\pi)\,\varepsilon^{\gamma_0}$（相対誤差 $10^{-5}$）．さらに膨張下死点まで積分すると $p(3\pi) = p(\pi)$（$10^{-5}$）で，1 往復の図示仕事が $0$．
  2. [A]（温度依存比熱の閉じた系）`EngineCore` の右辺で，弁を閉じ，燃焼と熱損失を無くし，回転数を固定し，比熱を $\gamma(T)$ として，未燃ガスだけ（$Y_u = 1$）と既燃ガスだけ（$Y_u = 0$）のそれぞれを，両方の弁が閉じている $270^\circ$（$100\ \text{kPa}$，$350\ \text{K}$）から上死点（$360^\circ$）まで積分すると，$m\left[e_k(T_{\text{end}}) - e_k(T_{\text{start}})\right] = -\Delta W$（相対誤差 $10^{-6}$）．終端の温度が $700\ \text{K}$ 以上（比熱の温度依存が効く範囲）．
  3. [S]（第一法則の収支）S2（アイドル），S3（部分負荷），W3000（全開）のそれぞれで，直近 5 サイクルの $\left|\Delta U_s + \Delta W + \Delta Q_w - \Delta Q_c - \Delta H_i + \Delta H_o\right| \le 10^{-4}\,\Delta Q_c$（試作の実測は $10^{-6}$ 程度）．
  4. [S]（熱の行き先が妥当）W3000 の直近 5 サイクルで，$\Delta Q_w/\Delta Q_c$ が $0.10$〜$0.30$，$T_{\max}$ が $2200$〜$2700\ \text{K}$（試作の実測：$0.17$，$2495\ \text{K}$）．
