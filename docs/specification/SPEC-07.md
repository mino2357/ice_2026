### SPEC-07：燃焼（乱流火炎伝播に連動する単一 Wiebe モデル）（REQ-07）

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
6. **サイクル変動**（設定「燃焼」の `[サイクル変動 OFF／ON]`，既定 OFF）：点火のたびに，平均 $0$・分散 $1$ の一様乱数 $z_1, z_2 \in [-\sqrt 3, \sqrt 3]$ を引き，
   $$\theta_0 \leftarrow \theta_0 + \sigma_\theta z_1, \qquad \Delta\theta_b \leftarrow \Delta\theta_b\max(0.5,\ 1 + \sigma_b z_2), \qquad \sigma_\theta = 3^\circ,\ \sigma_b = 0.12$$
   乱数は `EngineCore` ごとに種を固定した擬似乱数（mulberry32）で，状態の複製で乱数の状態も複製される（結果は決定的）．

#### 仮定と限界
* 着火遅れの定数 $\ell_k$，$C_k$ は，全開の MBT 点火時期が回転とともに $20^\circ$ 台で進角するよう校正した値である（文献値ではない）．
* 希釈の項 $1 - 2.1\,x_r$ の $x_r$ は，原式の希釈ガスの質量分率に対応させている．
* 生成物のモル数の増加（実機で出力最大が $\phi \approx 1.1$ になる要因）は扱わないので，出力最大は $\phi = 1$ にある．
* $S_L$ の圧力指数が負なので，部分負荷で MBT が全開より大きく進む実機の傾向は十分には出ない．

* **出典**：[M. Metghalchi and J. C. Keck, *Combustion and Flame* 48, 191–210 (1982)](https://doi.org/10.1016/0010-2180(82)90127-4)；定数の組と希釈の項は S. R. Turns, *An Introduction to Combustion* の式 8.33（[BYU の講義ノートで確認](https://ignite.byu.edu/cbe522/lectures/SL_correlation)）；I. I. Wiebe, *Brennverlauf und Kreisprozess von Verbrennungsmotoren* (1970)；リッチ側は Heywood (1988) Sec. 4.9．

---

