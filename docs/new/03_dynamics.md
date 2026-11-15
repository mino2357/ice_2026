
---

### REQ-10：回転運動，摩擦，スターター
クランク軸とフライホイールの回転の運動方程式を解き，スターターによる始動から完爆，自力運転，エンストまでの角速度の変化を再現すること．検証と性能曲線の計測のために，回転数を固定するモードを持つこと．

#### 定義と式
$$\frac{d\theta}{dt} = \omega, \qquad I_{\text{tot}}\frac{d\omega}{dt} = T_{\text{ind}} + T_{\text{st}} - T_f - T_{\text{aux}} - T_{\text{dyno}}$$
1. **慣性**：$I_{\text{tot}} = I + I_{\text{dyno}}$，$I = 0.12\ \text{kg·m}^2$（クランク軸とフライホイール），$I_{\text{dyno}}$ は動力計（REQ-11，既定 $0.05\ \text{kg·m}^2$）．
2. **図示トルク**：クランクケースの圧力を $p_{\text{atm}}$ とし，仮想仕事 $T_{\text{ind}}\,d\theta = (p - p_{\text{atm}})\,dV$ から
   $$T_{\text{ind}}(\theta) = (p - p_{\text{atm}})\frac{dV}{d\theta}$$
3. **摩擦**（Chen–Flynn 型の摩擦平均有効圧）：直前に完了したサイクルの筒内最高圧を $p_{\max}$（初期値 $p_{\text{atm}}$．サイクルの終端で更新），平均ピストン速度を $c_m = \frac{S\omega}{\pi}$ として
   $$\text{FMEP} = F_0 + F_1\,p_{\max} + F_2\,c_m, \qquad T_f = \frac{\text{FMEP}\cdot V_d}{4\pi} \quad (\omega > 0)$$
   $F_0 = 13.7\ \text{kPa}$，$F_1 = 0.005$，$F_2 = 16.2\ \text{kPa·s/m}$．
4. **補機の負荷**：オルタネータ，ウォーターポンプ，オイルポンプなどが吸収するトルクを，回転数によらない一定値 $T_{\text{aux}}$（設定「運転」の補機負荷トルク，$0$〜$20\ \text{N·m}$，既定 $2.0$）で与える（$\omega > 0$ のとき）．平均有効圧に直すと $\text{AMEP} = \frac{4\pi T_{\text{aux}}}{V_d}$（既定で約 $50\ \text{kPa}$）．
5. **スターター**：ワンウェイクラッチを介して駆動する直流モータとし，スターターが ON かつ完爆前のとき
   $$T_{\text{st}} = T_{\text{stall}}\max\left(0,\ 1 - \frac{\omega}{\omega_{nl}}\right), \qquad T_{\text{stall}} = 60\ \text{N·m},\ \omega_{nl} = 209\ \text{rad/s}$$
   それ以外は $T_{\text{st}} = 0$．
6. **完爆とエンスト**：燃料が ON で，平均回転数 $\bar N$（REQ-12）が $N_{\text{fire}} = 550\ \text{rpm}$ を超え，直前に完了したサイクルの圧縮膨張の図示仕事 $W_g$ が $20\ \text{J}$ を超えているとき，完爆と判定してスターターを切る．完爆後に $\bar N < 150\ \text{rpm}$ になると，エンストとして完爆の状態と燃料を OFF にする．
7. **逆転の防止**：$\omega \le 0$ かつ右辺が負のとき，$\frac{d\theta}{dt} = \frac{d\omega}{dt} = 0$ とする．
8. **回転数の固定**：`EngineCore` は $\frac{d\omega}{dt} = 0$ とするモードを持つ（性能曲線の計測と一部のテストで使う．画面の設定には出さない）．

#### 仮定と限界
* ピストンと連桿の往復質量による慣性トルクは扱わない．サイクル平均には影響しないが，サイクル内の回転変動は実機と異なる．
* 補機の負荷は実機では回転数とともに増える．
* スターターの無負荷回転数は実機より高く，クランキングは約 $1750\ \text{rpm}$ に達する．始動直後の吹け上がり（約 $1400\ \text{rpm}$）とアイドルへの整定の遅さ（約 $12\ \text{s}$）の一因である．

* **出典**：[U. Kiencke and L. Nielsen, *Automotive Control Systems*, 2nd ed., Springer (2005), Ch. 6](https://doi.org/10.1007/b137654)；[S. K. Chen and P. F. Flynn, SAE Technical Paper 650733 (1965)](https://doi.org/10.4271/650733)
* **対応テスト `TEST-10`**：
  1. [A] $\text{FMEP}(p_{\max} = 5000\ \text{kPa},\ 3000\ \text{rpm}) = 13.7 + 25 + 16.2 \times 8.6 = 178.02\ \text{kPa}$（相対誤差 $10^{-12}$）．
  2. [S] CRANK（燃料 OFF でスターターだけ，$5\ \text{s}$）：サイクル平均の角速度が，$T_f = a + b\,\omega$（$a = (F_0 + F_1 p_{\max})\frac{V_d}{4\pi} + T_{\text{aux}}$，$b = F_2\frac{S}{\pi}\frac{V_d}{4\pi}$）としたつり合いの値 $\omega_{\text{eq}} = \frac{T_{\text{stall}} - a}{T_{\text{stall}}/\omega_{nl} + b}$ の $\pm 15\%$ 以内（差はポンプ損失）．完爆と判定されない．
  3. [S] S1（コールドリセットから START，$5\ \text{s}$）：$3\ \text{s}$ 以内に完爆と判定し，その後は $T_{\text{st}} = 0$，全状態量が有限．
  4. [S] S3 の定常サイクルで $W_f = \text{FMEP}\cdot V_d$（相対誤差 $10^{-9}$）．
  5. [A] 図示トルク：$p = p_{\text{atm}}$ で $T_{\text{ind}} = 0$．回転数固定のモードで $\frac{d\omega}{dt} = 0$．$\omega = 0$ で右辺が負なら $\frac{d\theta}{dt} = \frac{d\omega}{dt} = 0$．

---

### REQ-11：水ブレーキ式動力計と運転モード
機関に負荷を与え，軸トルク・軸出力・BMEP を評価するための水ブレーキ式動力計を持つこと．動力計は吸収専用とする．回転数を制御する方法を 2 つのモードから選べること．

* **スロットル制御**（モード A）：ECU がスロットル開度 $\alpha$ を PI 制御して目標回転数 $N_{\text{target}}$ に合わせる（REQ-12）．動力計の充水率の指令は設定の一定値 $f_{\text{manual}}$（既定 $0$）．
* **動力計制御**（モード B）：スロットル開度は設定の一定値 $\alpha_{\text{manual}}$（既定 $15^\circ$）とし，動力計の充水率を PI 制御して $N_{\text{target}}$ に保つ．定常点のトルク・出力・燃費の取得に使う．

2 つの制御が同時に回転数を操作しないよう，モードは排他とする．完爆前はどちらのモードも $f_{\text{cmd}} = 0$，$\alpha = \alpha_{\text{crank}}$．画面では「スロットル制御」「動力計制御」と呼び，設定の項目名は「回転数の制御」，選択肢は「スロットル」「動力計」とする．

#### 定義と式
1. **吸収トルク**：回転数の 2 乗と実効充水率 $f_{\text{eff}} \in [0, 1]$ に比例する．
   $$T_{\text{dyno}} = f_{\text{eff}}\,k_w\,\omega^2, \qquad k_w = \frac{T_{\text{rated}}}{\omega_{\text{rated}}^2},\ \omega_{\text{rated}} = \frac{\pi N_{\text{rated}}}{30}$$
   定格 $T_{\text{rated}} = 35\ \text{N·m}$，$N_{\text{rated}} = 1500\ \text{rpm}$（設定で変更可）．最大吸収トルク $k_w\omega^2$ は低回転ほど小さい（既定で $800\ \text{rpm}$：$9.96\ \text{N·m}$）．
2. **充水の応答**：$\tau_d\frac{df_{\text{eff}}}{dt} = f_{\text{cmd}} - f_{\text{eff}}$（$\tau_d$ 既定 $0.3\ \text{s}$）．$f_{\text{eff}}$ は状態ベクトルに入れず，積分のステップの終わりに $f_{\text{eff}} \leftarrow f_{\text{cmd}} + (f_{\text{eff}} - f_{\text{cmd}})\,e^{-\Delta t/\tau_d}$ で更新する（ステップの間は一定）．
3. **動力計制御の PI**：偏差 $e_d = \bar N - N_{\text{target}}$（回転が目標を超えると正）に対し
   $$f_{\text{cmd}} = \text{clamp}\left(f_{\text{base}} + K_{p,d}\,e_d + I_f,\ 0,\ 1\right), \qquad \frac{dI_f}{dt} = \begin{cases} 0 & (\text{上下限に張り付き，} e_d \text{ がそれを深める向き}) \\ K_{i,d}\,e_d & (\text{それ以外}) \end{cases}$$
   既定 $K_{p,d} = 0.001\ /\text{rpm}$，$K_{i,d} = 0.002\ /(\text{rpm·s})$，$f_{\text{base}} = 0$．完爆の時点で $I_f = 0$．
4. **モードの切替**（完爆後）：指令が連続になるよう初期化する．A → B：$\alpha_{\text{manual}} \leftarrow \alpha$，$I_f = f_{\text{cmd}} - f_{\text{base}} - K_{p,d}\,e_d$．B → A：$f_{\text{manual}} \leftarrow f_{\text{cmd}}$，$I_\alpha = \alpha - \alpha_{\text{ff}} - K_p\,e_N$（REQ-12）．
5. **容量の判定**：$f_{\text{cmd}} = 1$ のまま $\bar N > N_{\text{target}} + 100\ \text{rpm}$ が $2\ \text{s}$ 続くと `OVERLOAD`（動力計の容量不足），$f_{\text{cmd}} = 0$ のまま $\bar N < N_{\text{target}} - 100\ \text{rpm}$ が $2\ \text{s}$ 続くと `UNDERPOWER`（機関の出力不足）を表示する．
6. **軸トルクとのつり合い**：瞬時の軸トルクを $T_b^{\text{inst}} = T_{\text{ind}} - T_f - T_{\text{aux}}$ とすると，完爆後の運動方程式は $I_{\text{tot}}\frac{d\omega}{dt} = T_b^{\text{inst}} - T_{\text{dyno}}$．定常ではサイクル平均で $\overline{T_b} = \overline{T_{\text{dyno}}}$．

#### 仮定と限界
* 軸のねじり剛性は無視する（剛体）．
* $T_{\text{dyno}} \propto \omega^2$ による低回転での感度の低下に対するゲインの切替は行わない．全開では整定が遅い．
* 全開の軸トルク $T_b$ を保てる最低の回転数は $\frac{30}{\pi}\sqrt{T_b/k_w}$ で，既定の定格では全開（約 $35\ \text{N·m}$）で約 $1500\ \text{rpm}$ である．

* **出典**：Heywood (1988) Ch. 2（軸トルク，BMEP）；水ブレーキの特性は A. J. Martyr and M. A. Plint, *Engine Testing*（版とページは未確認）．
* **対応テスト `TEST-11`**：
  1. [A] $T_{\text{dyno}}(1, \omega_{\text{rated}}) = T_{\text{rated}}$，$T(2\omega)/T(\omega) = 4$，$T_{\text{dyno}}(1,\ 800\ \text{rpm}) = 9.9\ \text{N·m}$（$1\%$）．ソルバの右辺で $T_{\text{dyno}} = f_{\text{eff}}k_w\omega^2$（$f_{\text{eff}} = 0.5$，相対誤差 $10^{-12}$）．
  2. [A] $f_{\text{cmd}}$ を $0 \to 1$ にすると $t = \tau_d$ で $f_{\text{eff}} = 1 - e^{-1}$（相対誤差 $10^{-9}$．刻み $10^{-4}\ \text{s}$ と $3 \times 10^{-3}\ \text{s}$ の両方）．
  3. [S] S3（スロットル制御，$f_{\text{manual}} = 0.3$）：直近 10 サイクル平均で $T_b$ と $T_{\text{dyno}}$ の相対差が $2\%$ 以内．$f_{\text{cmd}} = f_{\text{manual}}$ で一定．
  4. [S] S4（動力計制御，$1500\ \text{rpm}$，開度 $15^\circ$）：最後の $5\ \text{s}$ で $\bar N$ の平均が $1500 \pm 10\ \text{rpm}$，瞬時値が $\pm 25\ \text{rpm}$，$0 < f_{\text{cmd}} < 1$，$\alpha = \alpha_{\text{manual}}$ で一定．
  5. [S] S6（動力計制御，$3000\ \text{rpm}$，開度 $7^\circ$）：$f_{\text{cmd}} = 0$ に張り付いて `UNDERPOWER` になり，その間 $|I_f|$ が増えない．目標を $1400\ \text{rpm}$ に下げると $5\ \text{s}$ 以内に $f_{\text{cmd}} > 0$，$8\ \text{s}$ 後に $1400 \pm 50\ \text{rpm}$．
  6. [S] S4b（S4 から $p_{\text{atm}} = 80\ \text{kPa}$）：定常の軸トルクが S4 より小さい．
  7. [S] S5（動力計制御，$800\ \text{rpm}$，全開）：$f_{\text{cmd}} = 1$ に張り付いて `OVERLOAD` になる．

---

### REQ-12：ECU（スロットル開度の PI 制御と点火時期の自動最適化）
完爆後，スロットル開度を操作して回転数を目標に合わせること（スロットル制御）．補機の負荷が大きくても冷間始動できること．点火時期を，図示仕事が最大になる時期（MBT）へ自動で合わせられること．

#### 定義と式
1. **平均回転数**：$\frac{d\bar N}{dt} = \frac{N - \bar N}{\tau_N}$（$N = \frac{30}{\pi}\omega$，$\tau_N$ 既定 $0.15\ \text{s}$）．$\bar N$ と積分の状態 $I_\alpha$ は ECU の内部状態で，積分のステップの終わりに更新する（REQ-13）．
2. **補機負荷の feedforward と開度の下限**：
   $$\alpha_{\text{ff}} = \alpha_{\text{base}} + k_T\,T_{\text{aux}}, \qquad \alpha_{\min} = \min\left(\alpha_{\max},\ \max\left(0,\ \alpha_{\text{ff}} - \delta_\alpha\right)\right)$$
   $\alpha_{\text{base}}$：基準開度（既定 $3^\circ$），$k_T = 0.26\ ^\circ/(\text{N·m})$，$\delta_\alpha = 1^\circ$（$k_T$ と $\delta_\alpha$ は定数）．既定（$T_{\text{aux}} = 2\ \text{N·m}$）で $\alpha_{\text{ff}} = 3.52^\circ$，$\alpha_{\min} = 2.52^\circ$．ECU は $T_{\text{aux}}$ を正確に知っているとする（理想化）．
3. **PI 制御**（アンチワインドアップ付き）：偏差 $e_N = N_{\text{target}} - \bar N$ に対し
   $$\alpha = \text{clamp}\left(\alpha_{\text{ff}} + K_p\,e_N + I_\alpha,\ \alpha_{\min},\ \alpha_{\max}\right), \qquad \frac{dI_\alpha}{dt} = \begin{cases} 0 & (\text{上下限に張り付き，} e_N \text{ がそれを深める向き}) \\ K_i\,e_N & (\text{それ以外}) \end{cases}$$
   既定 $K_p = 0.008\ ^\circ/\text{rpm}$，$K_i = 0.004\ ^\circ/(\text{rpm·s})$，$\alpha_{\max} = 90^\circ$．スロットルは指令に即時に追従するとする．
4. **状態ごとの開度**：完爆前は $\alpha = \alpha_{\text{crank}}$（始動開度，既定 $6^\circ$）．完爆の時点で $I_\alpha = 0$ とし，スロットル制御では 3 の式，動力計制御では $\alpha = \alpha_{\text{manual}}$（$I_\alpha$ は更新しない）．
5. **下限の役割**：完爆直後は回転が約 $1400\ \text{rpm}$ まで吹け上がり，比例項が開度を大きく閉じる．理想スロットル（全閉で流量 $0$）では，開度が $0$ になると吸気管圧が枯渇して図示仕事が負になり，回転が落ちてからの回復が間に合わずに止まる（$T_{\text{aux}} \ge 5\ \text{N·m}$）．下限 $\alpha_{\min}$ はこれを防ぎ，feedforward は下限を負荷に連動させる．$k_T$ は，$800\ \text{rpm}$ の定常開度の実測（$T_{\text{aux}} = 0, 2, 6\ \text{N·m}$ で $3.59^\circ, 4.17^\circ, 5.15^\circ$）の傾き $0.26$ による．
6. **点火時期の自動最適化**（設定「燃焼」の `[点火の自動最適化 OFF／ON]`，既定 ON）：サイクルごとに，燃焼割合 $50\%$ の時期
   $$\theta_{50} = \theta_0 + \Delta\theta_b\left(\frac{\ln 2}{a}\right)^{1/(m_w + 1)}$$
   （Wiebe 関数で $x_b = 0.5$ となる角度．REQ-07）から $\text{CA50} = \theta_{50} - 360^\circ$ を求め，サイクルの終端で点火進角 $s$ [°BTDC] を
   $$s \leftarrow s + k_s\left(\text{CA50} - \text{CA50}^*\right), \qquad k_s = 0.6,\ \text{CA50}^* = 10^\circ$$
   と更新する（完爆後のみ）．OFF または完爆前は $s =$ 設定値（既定 $18^\circ$ BTDC）．点火時期には上下限を設けない．ノッキングは扱わない．

#### 仮定と限界
* 目標回転数を下げたときも開度は $\alpha_{\min}$ までしか閉じない．
* $T_{\text{aux}} \ge 10\ \text{N·m}$ ではアイドルへの整定が遅い（PI のゲインは軽負荷に合わせてある）．低い目標回転数（$600\ \text{rpm}$）では回転が数十 rpm の幅で振れ続ける．
* CA50 の目標 $10^\circ$ は，本モデルで点火時期を振ったときの図示仕事の最大付近にある（TEST-12 項目 7 で判定）．

* **出典**：Guzzella and Onder (2010) Ch. 4；MBT と CA50 の関係は Heywood (1988) Sec. 9.2．
* **対応テスト `TEST-12`**：
  1. [S] S2（S1 に続けて $15\ \text{s}$）：最後の $3\ \text{s}$ で $|\bar N - 800| \le 25\ \text{rpm}$，かつ $\alpha > \alpha_{\min}$．
  2. [S] N1200（S2 から目標 $1200\ \text{rpm}$，$8\ \text{s}$）：最後の $2\ \text{s}$ で $\pm 25\ \text{rpm}$．
  3. [S] S7（S2 から $p_{\text{atm}} = 80\ \text{kPa}$，$10\ \text{s}$）：$800 \pm 25\ \text{rpm}$ を保ち，定常の開度が S2 より大きい．
  4. [S] AMAX（S2 から目標 $2000\ \text{rpm}$，$\alpha_{\max} = 5^\circ$，$8\ \text{s}$）：$\alpha = \alpha_{\max}$ に張り付き，$4\ \text{s} \to 8\ \text{s}$ で $I_\alpha$ が増えない．
  5. [S] S4（動力計制御）：最後の $10\ \text{s}$ で $I_\alpha$ が変わらない．
  6. [S]（MBT）S4 の定常で，最後の 25 サイクルの CA50 が上死点後 $10 \pm 0.5^\circ$．
  7. [S]（MBT）S4 の定常から，自動最適化を OFF にして点火時期を自動の値の $\pm 4^\circ$，$\pm 8^\circ$ に固定した各 $2\ \text{s}$ の IMEP の最大に対し，自動の値での IMEP が $99\%$ 以上．
  8. [A]（MBT）$\theta_{50}$ の式が $x_b(\theta_{50}) = 0.5$ を満たす（相対誤差 $10^{-12}$）．自動最適化 OFF では点火時期が設定値に一致する．
  9. [A]（下限）$T_{\text{aux}} = 0, 2, 20\ \text{N·m}$ で $\alpha_{\min} = 2^\circ, 2.52^\circ, 7.2^\circ$（相対誤差 $10^{-12}$）．$\alpha_{\text{base}} = 0$，$T_{\text{aux}} = 0$ で $0$．$\alpha_{\max} = 5^\circ$，$T_{\text{aux}} = 20\ \text{N·m}$ で $5^\circ$．
  10. [S]（冷間始動）CS0，CS6，CS10（コールドリセットから START，$T_{\text{aux}} = 0, 6, 10\ \text{N·m}$，各 $12\ \text{s}$）：$3\ \text{s}$ 以内に完爆して終了まで止まらない．完爆後の $\bar N$ の最小が $450\ \text{rpm}$ 以上．完爆後は常に $\alpha \ge \alpha_{\min}$．完爆後の吸気管圧の最小が $6\ \text{kPa}$ 以上．
  11. [S]（下限が制御を妨げない）N600（S2 から $T_{\text{aux}} = 0$，目標 $600\ \text{rpm}$，$15\ \text{s}$）：最後の $3\ \text{s}$ の $\bar N$ の平均が $600 \pm 25\ \text{rpm}$ で，常に $\alpha > \alpha_{\min}$．

---

### REQ-13：数値積分
状態 $\mathbf{y}$ と補助積分 $\mathbf{z}$ を，4 次の古典的 Runge–Kutta 法（RK4，固定刻み）または 5(4) 次の Dormand–Prince 法（DOPRI5，刻みの自動調整）で積分すること．既定は DOPRI5．弁の開閉・点火・サイクルの終端でステップを切ること．

#### 定義と式
1. **RK4**：クランク角の刻み $\Delta\theta_{\text{step}}$（設定，$0.25$〜$2^\circ$，既定 $0.25^\circ$）から
   $$\Delta t = \min\left(\frac{\Delta\theta_{\text{step}}}{\max(\omega, \omega_{\min})},\ \Delta t_{\max}\right), \qquad \omega_{\min} = 20\ \text{rad/s},\ \Delta t_{\max} = 3 \times 10^{-5}\ \text{s}$$
   $$\mathbf{k}_1 = \mathbf{f}(\mathbf{y}_n),\ \mathbf{k}_2 = \mathbf{f}\left(\mathbf{y}_n + \tfrac{\Delta t}{2}\mathbf{k}_1\right),\ \mathbf{k}_3 = \mathbf{f}\left(\mathbf{y}_n + \tfrac{\Delta t}{2}\mathbf{k}_2\right),\ \mathbf{k}_4 = \mathbf{f}(\mathbf{y}_n + \Delta t\,\mathbf{k}_3), \qquad \mathbf{y}_{n+1} = \mathbf{y}_n + \tfrac{\Delta t}{6}(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4)$$
2. **DOPRI5**：節点 $c = \left(0, \frac15, \frac{3}{10}, \frac45, \frac89, 1, 1\right)$，5 次の重み $b = \left(\frac{35}{384}, 0, \frac{500}{1113}, \frac{125}{192}, -\frac{2187}{6784}, \frac{11}{84}, 0\right)$，4 次の重み $\hat b = \left(\frac{5179}{57600}, 0, \frac{7571}{16695}, \frac{393}{640}, -\frac{92097}{339200}, \frac{187}{2100}, \frac{1}{40}\right)$．5 次の解 $\mathbf{y}_5$ で進め，4 次の解 $\mathbf{y}_4$ との差で誤差を見積もる：
   $$E = \max_i\frac{|y_{5,i} - y_{4,i}|}{\text{atol}_i + \text{rtol}\cdot\max(|y_{n,i}|, |y_{5,i}|)}$$
   $E \le 1$ なら受理し，次の刻みを $\Delta t\cdot\min\left(2.5, \max\left(0.2,\ 0.9E^{-1/5}\right)\right)$ とする．$E > 1$ なら同じ係数で縮めてやり直す．刻みの上限は $\min\left(\frac{0.5^\circ}{\max(\omega, \omega_{\min})},\ 10^{-3}\ \text{s}\right)$．rtol は設定（$10^{-4}$，$10^{-5}$，$10^{-6}$，既定 $10^{-5}$）．やり直しが 13 回続くか，刻みが $10^{-8}\ \text{s}$ を下回ったときは，誤差が許容を超えていても受理し，その回数を数える（**強制受理**）．
   * 絶対許容誤差 $\text{atol}_i$（SI）：$\theta$：$10^{-6}$，$\omega$：$10^{-3}$，$p$，$p_{\text{in}}$，$p_p$，$p_{pe}$，$p_m$：$1$，$m$，$m_u$，$m_{b,\text{in}}$，$m_{b,p}$：$10^{-9}$，$T_w$：$10^{-4}$，$\dot m_r$，$\dot m_e$：$10^{-6}$，$E_{\text{in}}$，$E_p$：$10^{-6}$．
3. **補助積分**：$\mathbf{z}$（§2.3）は，$\mathbf{y}$ と同じ段の値と重みで積分する（RK4 は $\frac16(1, 2, 2, 1)$，DOPRI5 は $b$）．$\mathbf{z}$ は誤差の見積もりに含めない．これにより，サイクルの集計は $\mathbf{y}$ と同じ次数になり，保存則（質量，既燃ガス，余剰エンタルピー，エネルギー）の検査式は Runge–Kutta の各ステップで丸め誤差の範囲で成り立つ．
4. **イベント**：次の角度では右辺が折れるか，状態の記録や切替が起きる．ステップは，これらの角度を**またがず，ちょうどその角度で終わる**ようにする．
   * サイクルの終端 $\theta = 4\pi$，吸気弁の開閉（IVO，IVC），排気弁の開閉（EVO，EVC），点火（$\theta = 2\pi - s$）
   * 手順：次のイベントまでの角度 $d$ が，予定の刻みで進む角度以下なら，刻みを $\Delta t = d/\omega$ とする．ステップ後の角度の残差 $\delta = \theta_e - \theta_{n+1}$ が $|\delta| > 10^{-9}\ \text{rad}$ なら $\Delta t \leftarrow \Delta t + \delta/\omega_{n+1}$ として同じ始点からやり直す（最大 4 回）．
   * イベントでの処理は，**そのステップの終端の状態**（同じ時刻の $p$，$V$，$T$，$m_u$）で行う：IVC では基準状態 $(p_r, V_r, T_r)$（REQ-08）と $m_{u,\text{trapped}}$ と $x_r$ を記録，点火では REQ-07 の $\theta_0$，$\Delta\theta_b$，$Q_{\text{in}}$ を計算，サイクルの終端では集計（REQ-14）・点火時期の更新（REQ-12）・$p_{\max}$ の更新（REQ-10）を行い，$\theta \leftarrow \theta - 4\pi$ とする．
   * $\omega = 0$ ではイベントの処理をしない．設定の変更で角度が動いたイベントは，次にその角度に達したときに処理する．
5. **筒内最高圧**：ステップ点の圧力が極大になった点と前後の点（角度 $\theta_{-}, \theta_0, \theta_{+}$，圧力 $p_{-}, p_0, p_{+}$）を通る放物線の頂点の値を，そのサイクルの $p_{\max}$ の候補とし，候補の最大を取る．
6. **制御入力の保持**：ECU と動力計の状態（$\bar N$，$I_\alpha$，$I_f$，$f_{\text{eff}}$，$\alpha$，$f_{\text{cmd}}$）は，ステップの終わりにそのステップの刻み $\Delta t$ で更新し，ステップの間は一定とする（積分は陽的 Euler，一次遅れは指数形）．制御の離散化の周期はソルバの刻みである．
7. **射影**：ステップの後で，丸めによる非物理的な値を防ぐために次の下限・上限を適用し，適用した回数を数える：$m \ge 10^{-7}\ \text{kg}$，$0 \le m_u \le m$，$p, p_p, p_{pe}, p_m \ge 1\ \text{kPa}$，$m_{b,\text{in}}, m_{b,p}, E_{\text{in}}, E_p \ge 0$，$\omega \ge 0$．**通常の運転では一度も適用されないこと**を要件とする．

#### 系の硬さと刻みの上限
最も硬いのは，弁が開いていて弁の前後の圧力がほぼ等しいときの，筒内とポートの間のやりとりである（REQ-04 の直線部の傾きによる）．周期定常のサイクルに沿ったヤコビアン $\frac{\partial\mathbf f}{\partial\mathbf y}$ の固有値の絶対値の最大は，試作で次のとおりだった．

| 条件 | $\max|\lambda|$ [1/s] | 場所 |
| :--- | ---: | :--- |
| アイドル | $6.5 \times 10^4$ | $599^\circ$（排気行程） |
| 全開 $1000\ \text{rpm}$ | $7.5 \times 10^4$ | $638^\circ$ |
| 全開 $3000\ \text{rpm}$ | $3.8 \times 10^4$ | $185^\circ$（吸気下死点付近） |
| $2000\ \text{rpm}$ 部分負荷 | $2.8 \times 10^4$ | $633^\circ$ |

RK4 の実軸上の安定限界は $|\lambda|\Delta t \le 2.79$ なので，$\Delta t_{\max} = 3 \times 10^{-5}\ \text{s}$（$|\lambda|\Delta t \le 2.3$）とした．DOPRI5 は誤差制御が刻みを安定限界の内側に保つ．

#### 仮定と限界
* DOPRI5 の刻みは，ほとんどのステップで上限 $0.5^\circ$ に張り付く．rtol を変えても刻みの数と結果はほとんど変わらない（精度を決めているのは上限とイベントの扱いである）．
* 燃焼の開始と終了（Wiebe 関数の端）はイベントにしていない．$m_w = 0$ では熱発生率がそこで不連続になる．

* **出典**：[J. R. Dormand and P. J. Prince, *J. Comput. Appl. Math.* 6, 19–26 (1980)](https://doi.org/10.1016/0771-050X(80)90013-3)
* **対応テスト `TEST-13`**：
  1. [A] 調和振動子を $t = 1$ まで RK4 で積分すると，刻みを半分にしたとき大域誤差が $1/16$（比 $14$〜$18$）になる．
  2. [A] DOPRI5 の 1 ステップの誤差が刻み半分で $1/64$（比 $50$〜$80$），誤差の見積もり $|\mathbf{y}_5 - \mathbf{y}_4|$ が $1/32$（比 $26$〜$38$）になる．
  3. [S]（参照解との一致）S3 の定常から 1 サイクルを，RK4（既定），DOPRI5（既定），参照解（RK4，$\Delta\theta = 0.05^\circ$）で積分し，$p_{\max}$ と $W$ が参照解と相対差 $0.1\%$ 以内．
  4. [S]（アイドルでの RK4）S2 の定常から 3 サイクルを RK4（既定）と参照解（RK4，$\Delta\theta = 0.02^\circ$）で積分し，3 サイクル目の IMEP の相対差が $0.5\%$ 以内，$M_{\text{in}}$ と $M_{\text{ex}}$ の増分の相対差が $0.2\%$ 以内．
  5. [S]（イベント）S4 の定常の 3 サイクルで，サイクルの終端・IVO・IVC・EVO・EVC・点火のそれぞれについて，ステップの終端の角度とイベントの角度の差の最大が $10^{-8}\ \text{rad}$ 以下．各イベントが 1 サイクルに 1 回ずつ処理される．全時刻で $-10^{-8} \le \theta \le 4\pi + 10^{-8}$．
  6. [S]（サイクルの時間）回転数を $3000\ \text{rpm}$ に固定した全開の定常で，サイクルの所要時間が $\frac{4\pi}{\omega}$ と相対誤差 $10^{-9}$ で一致する．
  7. [S]（射影と強制受理）S1，S2，S3，S4，S5，S6，W3000，CS0，CS6，CS10 の全ステップで，射影の適用回数と強制受理の回数がともに $0$．
  8. [A]（最高圧の補間）$p = 5 - 2(\theta - 1.3)^2$ の 3 点（$\theta = 1.0, 1.2, 1.5$）から頂点の値 $5$ を返す（相対誤差 $10^{-12}$）．[S] S4 の定常の $p_{\max}$ が，ステップ点の最大以上で，その $1.001$ 倍以下．
  9. [S]（集計の整合）回転数を $3000\ \text{rpm}$ に固定した全開の定常の 5 サイクルで，$M_{\text{th}}$，$M_r$，$M_{\text{in}}$，$M_{\text{ex}}$，$M_e$，$M_t$ の増分が相互に相対誤差 $0.1\%$ 以内．S2（アイドル）の 5 サイクルで $M_{\text{in}}$ と $M_{\text{ex}}$ の増分が $0.5\%$ 以内．
  10. [S]（硬さ）S2 の 1 サイクルに沿って $10^\circ$ ごとにヤコビアンを差分で作り，べき乗法で求めた $\max|\lambda|$ が $2.79/\Delta t_{\max}$ 以下．
  11. [S]（高速化の等価性）速い計算経路が元の式の経路と浮動小数点数として同じ値を返す：右辺の出力先を指定した呼び出しとしない呼び出し，`EngineCore` 専用の DOPRI5 と汎用の DOPRI5，作用角を前計算した弁リフトとしない弁リフト，$\Psi$ の表引きと直接の式．

---

### REQ-14：性能の指標と基準サイクル
サイクルの終端ごとに，そのサイクルの性能の指標を補助積分（§2.3）の増分から求めること．1 サイクルの波形を基準サイクルとして保存し，重ね描きで比べられること（保存の規則は REQ-18）．

#### 定義と式
1 サイクルの間の補助積分の増分を $\Delta$ で表し，サイクルの所要時間を $t_c$ とする．

| 指標 | 定義 |
| :--- | :--- |
| 正味の図示仕事，圧縮膨張の図示仕事 | $W_{i,\text{net}} = \Delta W = \oint p\,dV$，$W_{i,\text{gross}} = \Delta W_g$（$\pi \le \theta < 3\pi$） |
| 図示平均有効圧，ポンプ損失平均有効圧 | $\text{IMEP} = \frac{W_{i,\text{net}}}{V_d}$，$\text{PMEP} = \frac{W_{i,\text{net}} - W_{i,\text{gross}}}{V_d}$ |
| 摩擦・補機の平均有効圧 | $\text{FMEP} = \frac{\Delta W_f}{V_d}$，$\text{AMEP} = \frac{\Delta W_a}{V_d}$ |
| 正味平均有効圧，軸トルク，軸出力 | $\text{BMEP} = \text{IMEP} - \text{FMEP} - \text{AMEP}$，$T_b = \frac{\text{BMEP}\cdot V_d}{4\pi}$，$P_b = \frac{\text{BMEP}\cdot V_d}{t_c}$ |
| 図示出力，機械効率 | $P_i = \frac{W_{i,\text{net}}}{t_c}$，$\eta_m = \frac{\text{BMEP}}{\text{IMEP}}$ |
| 動力計の平均トルク | $\overline{T_{\text{dyno}}} = \frac{\Delta W_d}{4\pi}$ |
| 空気量，燃料量 | $m_{\text{air}} = \frac{m_{u,\text{trapped}}}{1 + \phi/\text{AF}_{st}}$，$m_f = \frac{\phi\,m_{\text{air}}}{\text{AF}_{st}}$，$\dot m_f = \frac{m_f}{t_c}$ |
| 体積効率 | $\eta_v = \frac{m_{\text{air}}}{\rho_{\text{atm}}V_d}$，$\rho_{\text{atm}} = \frac{p_{\text{atm}}}{RT_{\text{amb}}}$ |
| 図示熱効率，正味熱効率，正味燃料消費率 | $\eta_i = \frac{W_{i,\text{net}}}{m_f H_u}$，$\eta_b = \frac{P_b}{\dot m_f H_u}$，$\text{bsfc} = \frac{\dot m_f}{P_b}$ [g/kWh] |
| 残留ガス率 | $x_r = 1 - Y_u$（IVC の時点） |
| 最高圧，最高温度 | $p_{\max}$（REQ-13 の補間），$T_{\max}$（ステップ点の最大） |
| 各断面の平均流量 | $\frac{\Delta M_k}{t_c}$（$k$：th，r，in，ex，e，t） |
| 排気背圧，排気ポート圧の脈動幅 | $\Delta\bar p_{\text{ex}} = \frac{\Delta P_m}{t_c} - p_{\text{atm}}$，1 サイクルの排気弁の下流圧の最大と最小の差 |
| 吸気管の既燃率 | $\bar Y_{b,\text{in}} = \frac{\Delta\Upsilon}{t_c}$ |
| CA50，点火時期 | REQ-12 |

* 発熱の分母は供給した燃料の発熱量 $m_f H_u$ とする（燃え残りと燃焼効率の損失が効率に現れる）．
* ポンプ損失は IMEP に含まれ，FMEP には含めない．
* **表示の規則**：指標は，完爆後に完了したサイクルの値だけを表示する．始動中・停止中・最初のサイクルの完了前と，定義の分母が $0$ 以下のときは「–」を表示する．$\eta_v$，$\eta_i$，$\eta_m$，$\eta_b$ は $[0, 1.5]$ の外の値を表示しない．$P_b \le 0$ では bsfc と $\eta_b$ を「–」とする．
* **10 サイクル平均**：サイクルごとの指標は，完爆後の直近 10 サイクル（満たないときは完爆後の全サイクル）の算術平均を表示する．瞬時値である $\bar N$，$T_w$，$\alpha$，$p_{\text{in}}$，瞬時の $T_{\text{dyno}}$，$f_{\text{eff}}$，点火時期は現在の値を表示する．コールドリセット，停止，エンストで平均をやり直す．
* **表示する項目と名称**（運転タブ．配置は REQ-15）：
  * 1 ページ目：平均回転数 $\bar N$，図示平均有効圧 IMEP，ポンプ損失平均有効圧 PMEP，図示熱効率 $\eta_i$，図示出力 $P_i$，体積効率 $\eta_v$，残留ガス率 $x_r$，最高筒内圧 $p_{\max}$，最高ガス温度 $T_{\max}$，壁温 $T_w$，スロットル開度 $\alpha$，吸気管圧 $p_{\text{in}}$
  * 2 ページ目：燃料流量 $\dot m_f$，軸トルク $T_b$，軸出力 $P_b$，正味平均有効圧 BMEP，摩擦平均有効圧 FMEP，機械効率 $\eta_m$，正味燃料消費率 bsfc，正味熱効率 $\eta_b$，動力計トルク $T_{\text{dyno}}$，実効充水率 $f_{\text{eff}}$，吸気管既燃率 $Y_{b,\text{in}}$，点火時期（°BTDC）
  * 各項目は既定で記号を示し，その項目をタップすると日本語名に切り替わり，もう一度タップすると記号に戻る（項目ごと．何度でも）．値は描画フレームごとに更新するが，項目の要素は作り直さず文字だけを書き換える（押している間に要素が DOM から外れるとタップが届かないため）．

* **出典**：Heywood (1988) Ch. 2．
* **対応テスト `TEST-14`**：S3（スロットル制御，$f_{\text{manual}} = 0.3$）と S4（動力計制御）の定常について，
  1. [S] $\text{IMEP}\cdot V_d = W_{i,\text{net}}$，$\text{PMEP}\cdot V_d = W_{i,\text{net}} - W_{i,\text{gross}}$（相対誤差 $10^{-12}$）．$W_{i,\text{net}}$ が，ステップ点の $p$-$V$ の台形則による値と相対差 $0.1\%$ 以内．
  2. [S] $\text{BMEP} = \text{IMEP} - \text{FMEP} - \text{AMEP}$，$P_b = \text{BMEP}\cdot V_d/t_c$（相対誤差 $10^{-9}$）．$0 < \eta_m < 1$，$\text{bsfc} > 0$ で有限．
  3. [S]（理論の上限）直近 5 サイクルで $P_i \le \eta_{\text{Otto}}\,\dot m_f H_u$，$\eta_{\text{Otto}} = 1 - \varepsilon^{1 - 1.40}$．
  4. [S]（動力の収支）直近 5 サイクル平均で $|W_{i,\text{net}} - \Delta W_f - \Delta W_a - \Delta W_d|/W_{i,\text{net}} \le 2\%$．
  5. [S] 基準サイクルを保存した後，点火時期と開度を変えて $1\ \text{s}$ 積分しても，保存した配列が書き換わらない．
  6. [S]（表示の規則）S1 の全期間（$0.05\ \text{s}$ ごと）で，完爆前の IMEP・効率の表示が「–」，効率の表示が $[0, 1.5]$ の外に出ず，`NaN`・`Infinity` を表示しない．
  7. [S] $\eta_i = W_{i,\text{net}}/(m_f H_u)$（相対誤差 $10^{-12}$）．動力計制御・開度固定で，$\phi = 1.2$ の $\eta_i$ が $\phi = 1.0$ より $10\%$ 以上低い．
  8. [S]（10 サイクル平均）S3 の定常で，表示用の各指標が直近 10 サイクルの値の算術平均と一致する（相対誤差 $10^{-12}$）．コールドリセットの直後は「–」に戻り，完爆後 3 サイクルの時点では 3 サイクルの平均である．
  9. [S]（体積効率）$\eta_v = \frac{m_{u,\text{trapped}}}{(1 + \phi/\text{AF}_{st})\,\rho_{\text{atm}}V_d}$（相対誤差 $10^{-12}$）．S4 の定常で，1 サイクルに吸気弁から正味で入った質量 $\Delta M_{\text{in}}$ のうちの未燃分と $m_{u,\text{trapped}}$ の関係が，$0.5 \le \frac{m_{u,\text{trapped}}}{\Delta M_{\text{in}}} \le 1.05$ にある．
