### SPEC-10：回転運動，摩擦，スターター（REQ-10）

#### 定義と式
$$\frac{d\theta}{dt} = \omega, \qquad I_{\text{tot}}\frac{d\omega}{dt} = T_{\text{ind}} + T_{\text{st}} - T_f - T_{\text{aux}} - T_{\text{dyno}}$$
1. **慣性**：$I_{\text{tot}} = I + I_{\text{dyno}}$，$I = 0.12\ \text{kg·m}^2$（クランク軸とフライホイール），$I_{\text{dyno}}$ は動力計（SPEC-11，既定 $0.05\ \text{kg·m}^2$）．
2. **図示トルク**：クランクケースの圧力を $p_{\text{atm}}$ とし，仮想仕事 $T_{\text{ind}}\,d\theta = (p - p_{\text{atm}})\,dV$ から
   $$T_{\text{ind}}(\theta) = (p - p_{\text{atm}})\frac{dV}{d\theta}$$
3. **摩擦**（Chen–Flynn 型の摩擦平均有効圧）：直前に完了したサイクルの筒内最高圧を $p_{\max}$（初期値 $p_{\text{atm}}$．サイクルの終端で更新），平均ピストン速度を $c_m = \frac{S\omega}{\pi}$ として
   $$\text{FMEP} = F_0 + F_1\,p_{\max} + F_2\,c_m, \qquad T_f = \frac{\text{FMEP}\cdot V_d}{4\pi} \quad (\omega > 0)$$
   $F_0 = 13.7\ \text{kPa}$，$F_1 = 0.005$，$F_2 = 16.2\ \text{kPa·s/m}$．
4. **補機の負荷**：オルタネータ，ウォーターポンプ，オイルポンプなどが吸収するトルクを，回転数によらない一定値 $T_{\text{aux}}$（設定「運転」の補機負荷トルク，$0$〜$20\ \text{N·m}$，既定 $2.0$）で与える（$\omega > 0$ のとき）．平均有効圧に直すと $\text{AMEP} = \frac{4\pi T_{\text{aux}}}{V_d}$（既定で約 $50\ \text{kPa}$）．
5. **スターター**：ワンウェイクラッチを介して駆動する直流モータとし，スターターが ON かつ完爆前のとき
   $$T_{\text{st}} = T_{\text{stall}}\max\left(0,\ 1 - \frac{\omega}{\omega_{nl}}\right), \qquad T_{\text{stall}} = 60\ \text{N·m},\ \omega_{nl} = 209\ \text{rad/s}$$
   それ以外は $T_{\text{st}} = 0$．
6. **完爆とエンスト**：燃料が ON で，平均回転数 $\bar N$（SPEC-12）が $N_{\text{fire}} = 550\ \text{rpm}$ を超え，直前に完了したサイクルの圧縮膨張の図示仕事 $W_g$ が $20\ \text{J}$ を超えているとき，完爆と判定してスターターを切る．完爆後に $\bar N < 150\ \text{rpm}$ になると，エンストとして完爆の状態と燃料を OFF にする．
7. **逆転の防止**：$\omega \le 0$ かつ右辺が負のとき，$\frac{d\theta}{dt} = \frac{d\omega}{dt} = 0$ とする．
8. **回転数の固定**：`EngineCore` は $\frac{d\omega}{dt} = 0$ とするモードを持つ（性能曲線の計測と一部のテストで使う．画面の設定には出さない）．

#### 仮定と限界
* ピストンと連桿の往復質量による慣性トルクは扱わない．サイクル平均には影響しないが，サイクル内の回転変動は実機と異なる．
* 補機の負荷は実機では回転数とともに増える．
* スターターの無負荷回転数は実機より高く，燃料 OFF のクランキングは約 $1700\ \text{rpm}$ に達する．始動直後の吹け上がり（約 $1400\ \text{rpm}$．実測 $1428\ \text{rpm}$）とアイドルへの整定の遅さ（$\pm 25\ \text{rpm}$ に収まるまで約 $12\ \text{s}$．実測 $12.5\ \text{s}$）の一因である．

* **出典**：[U. Kiencke and L. Nielsen, *Automotive Control Systems*, 2nd ed., Springer (2005), Ch. 6](https://doi.org/10.1007/b137654)；[S. K. Chen and P. F. Flynn, SAE Technical Paper 650733 (1965)](https://doi.org/10.4271/650733)

---

