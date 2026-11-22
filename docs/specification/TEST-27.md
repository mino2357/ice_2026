### TEST-27：排気系（排気管の脈動と背圧）（REQ-27，SPEC-27）

1. [A]（共鳴）排気弁が閉じた角度で回転を止め，$f_r = \zeta_e = 0$ として $\dot m_e(0) = 10^{-4}\ \text{kg/s}$ から積分すると，振動の周期が $2\pi/\omega_E$ と相対誤差 $1\%$ 以内．化学平衡のモデル（既定）では，壁温を排気ポートのガスの温度にそろえて（ポートの壁への熱がほぼ $0$），$\omega_E = \sqrt{\frac{A_e}{L_e}\frac{\gamma_X R_X T_X}{V_{pe}}}$（$\gamma_X = 1 + R_X/c_{v,X}$．始めの $T_X$，$p_{pe}$ での値）．
2. [A]（損失と出口の動圧）$p_{pe} - p_{\text{atm}} = \frac{(\zeta_x + 1)\dot m_e^2}{2\rho_e A_e^2}$ のとき $\frac{d\dot m_e}{dt} = 0$（相対誤差 $10^{-9}$．$\rho_e$ の気体定数は，化学平衡のモデルでは $R_b(T_X, 100\ \text{kPa}, \zeta^*)$）．
3. [S]（OFF）排気系 OFF で $\dot m_e$，$p_{pe}$，$p_{te}$ の時間微分が $0$ で，排気弁の下流圧が $p_{\text{atm}} + \Delta p_{\text{ex}}$．
4. [S]（質量の収支）S3 の定常の直近 5 サイクルで，$M_{\text{ex}}$，$M_e$，$M_t$ の増分が相互に相対誤差 $1\%$ 以内．
5. [A][S]（大気開放と背圧）既定の設定に `Vm`，`At` が無く，右辺で $\frac{dp_{te}}{dt} = 0$，出口の流量が $\dot m_e$ に等しい．全開・回転数 $3000\ \text{rpm}$ 固定の定常（G3000D）の 1 サイクルで，ステップごとの台形則で求めた損失の項 $\frac{(\zeta_x + 1)\dot m_e|\dot m_e|}{2\rho_e A_e^2}$ の平均が，同じ方法で求めた $\overline{p_{pe}} - p_{\text{atm}}$ と相対 $1\%$ 以内（SPEC-27 の 5 の式）．全開・回転数固定の計測の $1000$〜$7000\ \text{rpm}$ の各点で背圧が $10\ \text{kPa}$ 以下，S2（アイドル）の背圧が $0.5\ \text{kPa}$ 以下（上限は実測に余裕を見た値で，文献の値ではない）．（実測：管の損失 $1.005$ ＋ 出口の動圧 $1.435$ ＝ $2.440\ \text{kPa}$，背圧 $2.440\ \text{kPa}$．全開の最大 $6.28\ \text{kPa}$（$5000\ \text{rpm}$），アイドル $0.014\ \text{kPa}$）
6. [S]（脈動）全開・$3000\ \text{rpm}$ で，1 サイクルの排気ポート圧の最大と最小の差が $20\ \text{kPa}$ 以上（実測 $138\ \text{kPa}$）．
7. [U] 設定ページ「排気系」に 2 項目（排気系モデル，排気圧損）があり，項目の操作で値が変わり，画面がスクロールしない．
8. [A]（運転中に ON）排気系 OFF で運転中の状態から ON にすると，$\dot m_e = 0$，$p_{pe} = p_{te} = p_{\text{atm}} + \Delta p_{\text{ex}}$（厳密）になる．
9. [S]（排気ポートの収支．化学平衡）S4 の定常の 5 サイクルで，ポートのガスの質量 $m_X$ の増分と $\Delta M_{\text{ex}} - \Delta M_e$ の差が $\Delta M_{\text{ex}} + \Delta M_e$ の $10^{-6}$ 以下，$m_X(e_X - h_b^{\text{ref}})$ の増分と $\Delta H_{xs} - \Delta H_x - \Delta Q_{pw}$ の差が $\lvert\Delta H_{xs}\rvert + \lvert\Delta H_x\rvert + \lvert\Delta Q_{pw}\rvert$ の $10^{-6}$ 以下．
10. [A]（ポートの式）S4 の定常の状態を，排気弁が閉じた角度にし，$\dot m_e = 0$，$T_w = T_X$ にした右辺で，$\lvert\dot T_X\rvert \le 10^{-9}\ \text{K/s}$，$\lvert\dot p_{pe}\rvert \le 10^{-6}\ \text{Pa/s}$．同じ状態で $T_w = T_X - 300\ \text{K}$，$\dot m_e = 0.02\ \text{kg/s}$ にした右辺の $\dot Q_{pw}$ が，SPEC-27 の 10 の式（$\text{Re}$ の下限が効かない）を別に計算した値と相対誤差 $10^{-12}$ で一致し，$\dot m_e = 10^{-5}\ \text{kg/s}$ では $\text{Re} = 2300$ の値に一致する．
11. [S]（排気温度の妥当性）G3000D（全開，$3000\ \text{rpm}$ 固定）の 1 サイクルの $\bar T_X$ が $900$〜$1400\ \text{K}$ で，そのサイクルの排気弁が開く時点の筒内の温度より低い．S2 の直近 1 サイクルの $\bar T_X$ が G3000D より低い．

