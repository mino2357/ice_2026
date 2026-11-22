### SPEC-12：ECU（スロットル開度の PI 制御と点火時期の自動最適化）（REQ-12）

#### 定義と式
1. **平均回転数**：$\frac{d\bar N}{dt} = \frac{N - \bar N}{\tau_N}$（$N = \frac{30}{\pi}\omega$，$\tau_N$ 既定 $0.15\ \text{s}$）．$\bar N$ と積分の状態 $I_\alpha$ は ECU の内部状態で，積分のステップ（刻み $\Delta t$）の終わりに，終端の $N$ を使って $\bar N \leftarrow N + (\bar N - N)\,e^{-\Delta t/\tau_N}$，$I_\alpha \leftarrow I_\alpha + K_i\,e_N\,\Delta t$ と更新する（SPEC-13 の 6）．
2. **補機負荷の feedforward と開度の下限**：
   $$\alpha_{\text{ff}} = \alpha_{\text{base}} + k_T\,T_{\text{aux}}, \qquad \alpha_{\min} = \min\left(\alpha_{\max},\ \max\left(0,\ \alpha_{\text{ff}} - \delta_\alpha\right)\right)$$
   $\alpha_{\text{base}}$：基準開度（既定 $3^\circ$），$k_T = 0.26\ ^\circ/(\text{N·m})$，$\delta_\alpha = 1^\circ$（$k_T$ と $\delta_\alpha$ は定数）．既定（$T_{\text{aux}} = 2\ \text{N·m}$）で $\alpha_{\text{ff}} = 3.52^\circ$，$\alpha_{\min} = 2.52^\circ$．ECU は $T_{\text{aux}}$ を正確に知っているとする（理想化）．
3. **PI 制御**（アンチワインドアップ付き）：偏差 $e_N = N_{\text{target}} - \bar N$ に対し
   $$\alpha = \text{clamp}\left(\alpha_{\text{ff}} + K_p\,e_N + I_\alpha,\ \alpha_{\min},\ \alpha_{\max}\right), \qquad \frac{dI_\alpha}{dt} = \begin{cases} 0 & (\text{上下限に張り付き，} e_N \text{ がそれを深める向き}) \\ K_i\,e_N & (\text{それ以外}) \end{cases}$$
   既定 $K_p = 0.008\ ^\circ/\text{rpm}$，$K_i = 0.004\ ^\circ/(\text{rpm·s})$，$\alpha_{\max} = 90^\circ$．スロットルは指令に即時に追従するとする．
4. **状態ごとの開度**：完爆前は $\alpha = \alpha_{\text{crank}}$（始動開度，既定 $6^\circ$）．完爆の時点で $I_\alpha = 0$ とし，スロットル制御では 3 の式，動力計制御では $\alpha = \alpha_{\text{manual}}$（$I_\alpha$ は更新しない）．
5. **下限の役割**：完爆直後は回転が約 $1400\ \text{rpm}$ まで吹け上がり，比例項が開度を大きく閉じる．理想スロットル（全閉で流量 $0$）では，開度が $0$ になると吸気管圧が枯渇して図示仕事が負になり，回転が落ちてからの回復が間に合わずに止まる（$T_{\text{aux}} \ge 5\ \text{N·m}$）．下限 $\alpha_{\min}$ はこれを防ぎ，feedforward は下限を負荷に連動させる．$k_T$ は，$800\ \text{rpm}$ の定常開度の実測（$T_{\text{aux}} = 0, 2, 6\ \text{N·m}$ で $3.59^\circ, 4.18^\circ, 5.16^\circ$．始動から $42$〜$45\ \text{s}$ の平均）の傾き $0.26$ による．
6. **点火時期の自動最適化**（設定「燃焼」の `[点火の自動最適化 OFF／ON]`，既定 ON）：サイクルごとに，燃焼割合 $50\%$ の時期
   $$\theta_{50} = \theta_0 + \Delta\theta_b\left(\frac{\ln 2}{a}\right)^{1/(m_w + 1)}$$
   （Wiebe 関数で $x_b = 0.5$ となる角度．SPEC-07）から $\text{CA50} = \theta_{50} - 360^\circ$ を求め，サイクルの終端で点火進角 $s$ [°BTDC] を
   $$s \leftarrow s + k_s\left(\text{CA50} - \text{CA50}^*\right), \qquad k_s = 0.6,\ \text{CA50}^* = 10^\circ$$
   と更新する（完爆後のみ）．OFF または完爆前は $s =$ 設定値（既定 $18^\circ$ BTDC）．点火時期には上下限を設けない．ノッキングは扱わない．

#### 仮定と限界
* 目標回転数を下げたときも開度は $\alpha_{\min}$ までしか閉じない．
* $T_{\text{aux}} \ge 10\ \text{N·m}$ ではアイドルへの整定が遅い（PI のゲインは軽負荷に合わせてある）．低い目標回転数（$600\ \text{rpm}$）では回転が数十 rpm の幅で振れ続ける．
* CA50 の目標 $10^\circ$ は，本モデルで点火時期を振ったときの図示仕事の最大付近にある（TEST-12 項目 7 で判定）．

* **出典**：Guzzella and Onder (2010) Ch. 4；MBT と CA50 の関係は Heywood (1988) Sec. 9.2．

---

