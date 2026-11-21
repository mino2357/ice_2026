### TEST-03：カムプロファイルと弁の有効開口面積（REQ-03，SPEC-03）

1. [A] 3 種とも $L_v(0) = L_v(1) = 0$，$L_v(0.5) = L_{\max}$（相対誤差 $10^{-12}$），閉弁域で $A_{\text{eff}} = 0$．
2. [A] $\xi = 0.25$ のリフト比が Aggressive $0.8123$（$= \sin^{0.6}(\pi/4)$），Polynomial $0.5625$，Standard $0.5$（相対誤差 $10^{-4}$，$10^{-12}$，$10^{-12}$）．
3. [A]（滑らかさ）Standard と Polynomial は $L_v(10^{-4})/L_{\max} \le 10^{-6}$（端の傾きが $0$），Aggressive は $L_v(10^{-4})/L_{\max} \ge 10^{-3}$．
4. [A]（弁径）$d_v = 31\ \text{mm}$，$d_{ve} = 26\ \text{mm}$，$B = 86\ \text{mm}$ で $d_{v,\text{in}} = 31\ \text{mm}$，$d_{v,\text{ex}} = 26\ \text{mm}$．$d_v = d_{ve} = 50\ \text{mm}$ で $d_{v,\text{in}} = d_{v,\text{ex}} = (\sqrt2 - 1)B = 35.62\ \text{mm}$．既定の設定で $d_{v,\text{ex}} < d_{v,\text{in}}$．内部の値 `nv = 1` では上限が $0.45B = 38.7\ \text{mm}$．
5. [A]（VVT）$\varphi \in \{-40, -15, 0, 15, 40\}^\circ$ で $L_v(\theta; \varphi) = L_v(\theta - \varphi; 0)$ が全周 $1^\circ$ 刻みで成り立ち（相対誤差 $10^{-12}$），作用角と $\int L_v\,d\theta$ が $\varphi$ によらない．
6. [A]（干渉）既定設定では `VALVE HIT` が出ない．$\varepsilon = 40$，$L_{\max} = 14\ \text{mm}$，$\varphi_{\text{in}} = -40^\circ$ では出る．判定が定義式の直接の評価と一致する．
7. [S] S8（S4 の定常から $\varphi_{\text{in}} = 30^\circ$，$5\ \text{s}$）：状態量が有限で，$\eta_v$ が $1\%$ 以上変わる．
8. [A][U]（4 弁）既定の設定で，最大リフトの角度の有効開口面積が，吸気 $2 C_d \frac{\pi}{4} d_{v,\text{in}}^2$，排気 $2 C_d \frac{\pi}{4} d_{v,\text{ex}}^2$ に一致する（相対 $10^{-12}$．リフト $9\ \text{mm} > d/4$）．最大リフトを $1\ \text{mm}$ にすると（$< d/4$）$2 C_d \pi d L_v$ に一致する．内部の値 `nv = 1` ではその半分になる．設定の項目の名前が「吸気弁径（2 個）」「排気弁径（2 個）」で，ページ「VVT・カム」と「弁タイミング」の上の文字が「4 弁」で始まり，系統図の吸気弁と排気弁の枠に「2 ×」がある．

