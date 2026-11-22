### TEST-10：回転運動，摩擦，スターター（REQ-10，SPEC-10）

1. [A] $\text{FMEP}(p_{\max} = 5000\ \text{kPa},\ 3000\ \text{rpm}) = 13.7 + 25 + 16.2 \times 8.6 = 178.02\ \text{kPa}$（相対誤差 $10^{-12}$）．
2. [S] CRANK（燃料 OFF でスターターだけ，$5\ \text{s}$）：サイクル平均の角速度が，$T_f = a + b\,\omega$（$a = (F_0 + F_1 p_{\max})\frac{V_d}{4\pi} + T_{\text{aux}}$，$b = F_2\frac{S}{\pi}\frac{V_d}{4\pi}$）としたつり合いの値 $\omega_{\text{eq}} = \frac{T_{\text{stall}} - a}{T_{\text{stall}}/\omega_{nl} + b}$ の $\pm 15\%$ 以内（差はポンプ損失）．完爆と判定されない．
3. [S] S1（コールドリセットから START，$5\ \text{s}$）：$3\ \text{s}$ 以内に完爆と判定し，その後は $T_{\text{st}} = 0$，全状態量が有限．
4. [S] S3 の定常サイクルで $W_f = \text{FMEP}\cdot V_d$（相対誤差 $10^{-9}$）．
5. [A] 図示トルク：$p = p_{\text{atm}}$ で $T_{\text{ind}} = 0$．回転数固定のモードで $\frac{d\omega}{dt} = 0$．$\omega = 0$ で右辺が負なら $\frac{d\theta}{dt} = \frac{d\omega}{dt} = 0$．

